import { describe, it, expect } from "vitest";

// The same regex used in both API routes
const UUID_RE = /^[0-9a-f-]{36}$/i;

function isValidTokenFormat(token: unknown): boolean {
  return typeof token === "string" && UUID_RE.test(token);
}

describe("token UUID format validation", () => {
  it("accepts a well-formed UUID v4", () => {
    expect(isValidTokenFormat("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("accepts uppercase UUIDs", () => {
    expect(isValidTokenFormat("550E8400-E29B-41D4-A716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidTokenFormat("")).toBe(false);
  });

  it("rejects a plain survey ID that looks like a number", () => {
    expect(isValidTokenFormat("123")).toBe(false);
  });

  it("rejects a path traversal attempt", () => {
    expect(isValidTokenFormat("../../etc/passwd")).toBe(false);
  });

  it("rejects SQL injection payload", () => {
    expect(isValidTokenFormat("' OR 1=1 --")).toBe(false);
  });

  it("rejects a UUID with extra characters", () => {
    expect(isValidTokenFormat("550e8400-e29b-41d4-a716-446655440000extra")).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidTokenFormat(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isValidTokenFormat(undefined)).toBe(false);
  });

  it("rejects object", () => {
    expect(isValidTokenFormat({ token: "abc" })).toBe(false);
  });
});
