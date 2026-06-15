import { describe, it, expect } from "vitest";
import { resolveSendPrefs, localParts, shouldSendNow } from "@/lib/cron-schedule";

// 2026-06-15 is a Monday. 08:00Z.
const mon0800Z = new Date("2026-06-15T08:00:00Z");

describe("resolveSendPrefs", () => {
  it("defaults to Monday 08:00 UTC", () => {
    expect(resolveSendPrefs({})).toEqual({ sendDayOfWeek: 1, sendHour: 8, timezone: "UTC" });
  });
  it("uses provided values", () => {
    expect(resolveSendPrefs({ send_day_of_week: 3, send_hour: 14, timezone: "America/New_York" }))
      .toEqual({ sendDayOfWeek: 3, sendHour: 14, timezone: "America/New_York" });
  });
  it("ignores out-of-range stored values", () => {
    expect(resolveSendPrefs({ send_day_of_week: 9, send_hour: 30 }))
      .toEqual({ sendDayOfWeek: 1, sendHour: 8, timezone: "UTC" });
  });
});

describe("localParts", () => {
  it("reads UTC parts", () => {
    expect(localParts(mon0800Z, "UTC")).toEqual({ hour: 8, dow: 1, dayOfMonth: 15 });
  });
  it("shifts into a western timezone", () => {
    // New York is UTC-4 in June → 04:00, still Monday the 15th.
    expect(localParts(mon0800Z, "America/New_York")).toEqual({ hour: 4, dow: 1, dayOfMonth: 15 });
  });
  it("falls back to UTC for an unknown timezone", () => {
    expect(localParts(mon0800Z, "Not/AZone")).toEqual({ hour: 8, dow: 1, dayOfMonth: 15 });
  });
});

describe("shouldSendNow", () => {
  it("weekly fires on the matching day + hour (UTC)", () => {
    expect(shouldSendNow("weekly", { sendDayOfWeek: 1, sendHour: 8, timezone: "UTC" }, mon0800Z)).toBe(true);
  });
  it("weekly does not fire on a wrong hour", () => {
    expect(shouldSendNow("weekly", { sendDayOfWeek: 1, sendHour: 9, timezone: "UTC" }, mon0800Z)).toBe(false);
  });
  it("weekly does not fire on a wrong day", () => {
    expect(shouldSendNow("weekly", { sendDayOfWeek: 2, sendHour: 8, timezone: "UTC" }, mon0800Z)).toBe(false);
  });
  it("respects timezone — fires at the local hour, not UTC", () => {
    const prefs = { sendDayOfWeek: 1, sendHour: 4, timezone: "America/New_York" };
    expect(shouldSendNow("weekly", prefs, mon0800Z)).toBe(true); // 08:00Z == 04:00 NY
    expect(shouldSendNow("weekly", { ...prefs, sendHour: 8 }, mon0800Z)).toBe(false);
  });
  it("monthly fires only in the first week's occurrence of the weekday", () => {
    // The 15th is week 3 → monthly should NOT fire.
    expect(shouldSendNow("monthly", { sendDayOfWeek: 1, sendHour: 8, timezone: "UTC" }, mon0800Z)).toBe(false);
    // 2026-06-01 is a Monday, week 1 → monthly fires.
    const firstMon = new Date("2026-06-01T08:00:00Z");
    expect(shouldSendNow("monthly", { sendDayOfWeek: 1, sendHour: 8, timezone: "UTC" }, firstMon)).toBe(true);
  });
  it("one-time never fires", () => {
    expect(shouldSendNow("one-time", { sendDayOfWeek: 1, sendHour: 8, timezone: "UTC" }, mon0800Z)).toBe(false);
  });
});
