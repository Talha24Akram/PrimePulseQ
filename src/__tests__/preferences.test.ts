import { describe, it, expect } from "vitest";
import { clampExpiryDays, expiryFromNow, DEFAULT_SURVEY_EXPIRY_DAYS } from "@/lib/preferences";

describe("clampExpiryDays", () => {
  it("passes through valid values", () => {
    expect(clampExpiryDays(3)).toBe(3);
    expect(clampExpiryDays(7)).toBe(7);
    expect(clampExpiryDays(30)).toBe(30);
  });

  it("clamps below 1 and above 30", () => {
    expect(clampExpiryDays(0)).toBe(1);
    expect(clampExpiryDays(-5)).toBe(1);
    expect(clampExpiryDays(90)).toBe(30);
  });

  it("rounds fractional values", () => {
    expect(clampExpiryDays(7.4)).toBe(7);
    expect(clampExpiryDays(7.6)).toBe(8);
  });

  it("defaults on null / non-numeric", () => {
    expect(clampExpiryDays(null)).toBe(DEFAULT_SURVEY_EXPIRY_DAYS);
    expect(clampExpiryDays(undefined)).toBe(DEFAULT_SURVEY_EXPIRY_DAYS);
    expect(clampExpiryDays("abc")).toBe(DEFAULT_SURVEY_EXPIRY_DAYS);
    expect(clampExpiryDays(NaN)).toBe(DEFAULT_SURVEY_EXPIRY_DAYS);
  });
});

describe("expiryFromNow", () => {
  it("returns an ISO timestamp the requested number of days ahead", () => {
    const days = 7;
    const expiry = new Date(expiryFromNow(days)).getTime();
    const expected = Date.now() + days * 24 * 60 * 60 * 1000;
    expect(Math.abs(expiry - expected)).toBeLessThan(5000); // within 5s
  });

  it("clamps out-of-range inputs", () => {
    const expiry = new Date(expiryFromNow(999)).getTime();
    const expected = Date.now() + 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(expiry - expected)).toBeLessThan(5000);
  });
});
