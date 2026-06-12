import { describe, it, expect, vi, beforeEach } from "vitest";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Simulate the DB-backed rate limit logic in isolation
// (mirrors the increment_rate_limit PostgreSQL function behaviour)
class FakeRateLimitStore {
  private map = new Map<string, { count: number; resetAt: number }>();

  increment(ipHash: string, max: number): number {
    const now = Date.now();
    const entry = this.map.get(ipHash);
    if (!entry || now >= entry.resetAt) {
      this.map.set(ipHash, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return 1;
    }
    const next = Math.min(entry.count + 1, max + 1);
    entry.count = next;
    return next;
  }
}

function makeChecker(store: FakeRateLimitStore) {
  return (ipHash: string): boolean => store.increment(ipHash, RATE_LIMIT_MAX) <= RATE_LIMIT_MAX;
}

describe("DB-backed rate limiter logic", () => {
  let store: FakeRateLimitStore;
  let check: (ip: string) => boolean;

  beforeEach(() => {
    store = new FakeRateLimitStore();
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

  it("resets after the window expires", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    for (let i = 0; i < RATE_LIMIT_MAX; i++) check("ip-f");
    expect(check("ip-f")).toBe(false);

    vi.setSystemTime(now + RATE_LIMIT_WINDOW_MS + 1);
    expect(check("ip-f")).toBe(true);

    vi.useRealTimers();
  });
});
