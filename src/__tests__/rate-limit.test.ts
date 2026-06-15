import { describe, it, expect, vi, beforeEach } from "vitest";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Mirror of the sliding-window logic in check_rate_limit_sliding() — one record
// per request, count only those within the trailing window from *now*.
// (See migration 20260615000001_sliding_window_rate_limit.sql.)
class SlidingWindowStore {
  private events = new Map<string, number[]>(); // ip -> request timestamps

  check(ipHash: string, max: number, windowMs: number): number {
    const now = Date.now();
    const cutoff = now - windowMs;
    const kept = (this.events.get(ipHash) ?? []).filter((t) => t >= cutoff);

    if (kept.length >= max) {
      this.events.set(ipHash, kept); // rejected — do not record
      return kept.length + 1;
    }
    kept.push(now);
    this.events.set(ipHash, kept);
    return kept.length;
  }
}

function makeChecker(store: SlidingWindowStore) {
  return (ipHash: string): boolean =>
    store.check(ipHash, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS) <= RATE_LIMIT_MAX;
}

describe("sliding-window rate limiter logic", () => {
  let store: SlidingWindowStore;
  let check: (ip: string) => boolean;

  beforeEach(() => {
    store = new SlidingWindowStore();
    check = makeChecker(store);
  });

  it("allows the first request", () => {
    expect(check("ip-a")).toBe(true);
  });

  it("allows up to the max", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(check("ip-b")).toBe(true);
    }
  });

  it("blocks the request exceeding the max", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) check("ip-c");
    expect(check("ip-c")).toBe(false);
  });

  it("does not affect other IPs", () => {
    for (let i = 0; i < RATE_LIMIT_MAX + 1; i++) check("ip-d");
    expect(check("ip-e")).toBe(true);
  });

  it("restores capacity once requests age out of the window", () => {
    vi.useFakeTimers();
    const t0 = Date.now();
    vi.setSystemTime(t0);

    // Exhaust the window with 5 requests (all at t0), then the 6th is blocked.
    for (let i = 0; i < RATE_LIMIT_MAX; i++) expect(check("ip-f")).toBe(true);
    expect(check("ip-f")).toBe(false);

    // After the full window passes, all 5 (made at t0) have aged out → allowed again.
    vi.setSystemTime(t0 + RATE_LIMIT_WINDOW_MS + 1);
    expect(check("ip-f")).toBe(true);

    vi.useRealTimers();
  });

  it("does not reset the whole window at once (boundary burst is bounded)", () => {
    vi.useFakeTimers();
    const t0 = Date.now();
    vi.setSystemTime(t0);

    // 5 requests spread across the window
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      vi.setSystemTime(t0 + i * 1000);
      expect(check("ip-g")).toBe(true);
    }
    // Just after the window from t0: only the first request has aged out,
    // so at most one new request is allowed — NOT a fresh batch of 5.
    vi.setSystemTime(t0 + RATE_LIMIT_WINDOW_MS + 500);
    expect(check("ip-g")).toBe(true);
    expect(check("ip-g")).toBe(false);

    vi.useRealTimers();
  });
});
