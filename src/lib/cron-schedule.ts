// ============================================================
// Per-tenant survey scheduling. The cron runs hourly; for each active recurring
// survey we check whether "now", in the workspace's timezone, matches its
// configured send day + hour and the frequency cadence.
//
// Pure + injectable `now` so the decision logic is unit-testable.
// ============================================================

export interface SendPrefs {
  sendDayOfWeek: number; // 0=Sun … 6=Sat
  sendHour: number; // 0–23, local to `timezone`
  timezone: string; // IANA tz, e.g. "America/New_York"
}

const WEEKDAY: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Resolve stored (nullable) prefs into concrete values. Defaults preserve the
 *  historical behaviour: Monday 08:00 UTC. */
export function resolveSendPrefs(p: {
  send_day_of_week?: number | null;
  send_hour?: number | null;
  timezone?: string | null;
}): SendPrefs {
  const day = p.send_day_of_week;
  const hour = p.send_hour;
  return {
    sendDayOfWeek: typeof day === "number" && day >= 0 && day <= 6 ? day : 1,
    sendHour: typeof hour === "number" && hour >= 0 && hour <= 23 ? hour : 8,
    timezone: p.timezone || "UTC",
  };
}

/** Local hour / weekday / day-of-month for an instant in a timezone. */
export function localParts(now: Date, timezone: string): { hour: number; dow: number; dayOfMonth: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour12: false,
      hour: "2-digit",
      weekday: "short",
      day: "2-digit",
    }).formatToParts(now);
  } catch {
    // Unknown timezone — fall back to UTC.
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour12: false,
      hour: "2-digit",
      weekday: "short",
      day: "2-digit",
    }).formatToParts(now);
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = parseInt(get("hour"), 10) % 24; // "24" (midnight) → 0
  const dow = WEEKDAY[get("weekday")] ?? 0;
  const dayOfMonth = parseInt(get("day"), 10);
  return { hour, dow, dayOfMonth };
}

/** Whether a recurring survey should be sent at `now` for the given prefs.
 *
 *  `enforceHour` (default true) gates on the tenant's configured local hour —
 *  correct when the cron runs hourly (Vercel Pro). On Hobby the cron can only
 *  run once per day, so the route passes `enforceHour: false` and we send on the
 *  configured day regardless of hour (the per-tenant send-hour preference then
 *  has no effect until you upgrade to an hourly schedule). */
export function shouldSendNow(
  frequency: string,
  prefs: SendPrefs,
  now: Date,
  opts: { enforceHour?: boolean } = {}
): boolean {
  if (frequency !== "weekly" && frequency !== "biweekly" && frequency !== "monthly") return false;

  const enforceHour = opts.enforceHour ?? true;
  const { hour, dow, dayOfMonth } = localParts(now, prefs.timezone);
  if (dow !== prefs.sendDayOfWeek) return false;
  if (enforceHour && hour !== prefs.sendHour) return false;

  if (frequency === "weekly") return true;

  const weekOfMonth = Math.ceil(dayOfMonth / 7);
  if (frequency === "biweekly") return weekOfMonth % 2 === 0;
  if (frequency === "monthly") return weekOfMonth === 1; // first occurrence of the weekday
  return false;
}
