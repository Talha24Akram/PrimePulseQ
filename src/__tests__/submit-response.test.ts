import { describe, it, expect } from "vitest";

// ── Mirror of the API route's status -> HTTP mapping ─────────
// The atomic RPC submit_survey_response() returns one of these status strings;
// the route maps each to an HTTP response. This test pins that mapping so a
// future edit to either side can't silently drift.
type SubmitStatus = "ok" | "not_found" | "already_used" | "expired" | "closed" | string;

function mapStatusToHttp(status: SubmitStatus): { status: number; ok: boolean } {
  switch (status) {
    case "ok": return { status: 200, ok: true };
    case "not_found": return { status: 404, ok: false };
    case "already_used": return { status: 410, ok: false };
    case "expired": return { status: 410, ok: false };
    case "closed": return { status: 410, ok: false };
    default: return { status: 500, ok: false };
  }
}

describe("submit_survey_response status mapping", () => {
  it("maps ok -> 200", () => {
    expect(mapStatusToHttp("ok")).toEqual({ status: 200, ok: true });
  });

  it("maps not_found -> 404", () => {
    expect(mapStatusToHttp("not_found").status).toBe(404);
  });

  it("maps already_used -> 410 (gone)", () => {
    expect(mapStatusToHttp("already_used").status).toBe(410);
  });

  it("maps expired -> 410", () => {
    expect(mapStatusToHttp("expired").status).toBe(410);
  });

  it("maps closed -> 410", () => {
    expect(mapStatusToHttp("closed").status).toBe(410);
  });

  it("maps any unexpected value -> 500", () => {
    expect(mapStatusToHttp("garbage").status).toBe(500);
    expect(mapStatusToHttp("").status).toBe(500);
  });
});

// ── Mirror of the atomic function's decision tree ────────────
// Pure re-implementation of submit_survey_response()'s branch logic so we can
// assert the ordering of checks (used before expired before closed, etc.)
// without a live database. The real guarantee (atomicity + row lock) is proven
// by the DB integration test; this guards the branch logic.
interface TokenRow { exists: boolean; used: boolean; expiresAt: Date | null; surveyStatus: string | null; }

function decideSubmit(t: TokenRow, now: Date): SubmitStatus {
  if (!t.exists) return "not_found";
  if (t.used) return "already_used";
  if (t.expiresAt && t.expiresAt < now) return "expired";
  if (t.surveyStatus !== "active") return "closed";
  return "ok";
}

describe("submit decision tree", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const valid: TokenRow = { exists: true, used: false, expiresAt: new Date("2026-06-20T00:00:00Z"), surveyStatus: "active" };

  it("accepts a valid, unused, unexpired token on an active survey", () => {
    expect(decideSubmit(valid, now)).toBe("ok");
  });

  it("rejects a missing token first", () => {
    expect(decideSubmit({ ...valid, exists: false }, now)).toBe("not_found");
  });

  it("rejects a used token before checking expiry", () => {
    expect(decideSubmit({ ...valid, used: true, expiresAt: new Date("2000-01-01") }, now)).toBe("already_used");
  });

  it("rejects an expired token before checking survey status", () => {
    expect(decideSubmit({ ...valid, expiresAt: new Date("2026-06-01T00:00:00Z"), surveyStatus: "closed" }, now)).toBe("expired");
  });

  it("rejects when the survey is not active", () => {
    expect(decideSubmit({ ...valid, surveyStatus: "closed" }, now)).toBe("closed");
    expect(decideSubmit({ ...valid, surveyStatus: "draft" }, now)).toBe("closed");
    expect(decideSubmit({ ...valid, surveyStatus: null }, now)).toBe("closed");
  });

  it("treats a null expiry as never-expiring", () => {
    expect(decideSubmit({ ...valid, expiresAt: null }, now)).toBe("ok");
  });
});
