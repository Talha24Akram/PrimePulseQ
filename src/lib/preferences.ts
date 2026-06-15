// ============================================================
// Workspace preference helpers — pure, dependency-free, shared by the
// settings UI and the server routes that consume the preferences.
// ============================================================

// ── Survey link expiry ───────────────────────────────────────
export const DEFAULT_SURVEY_EXPIRY_DAYS = 7;
export const SURVEY_EXPIRY_OPTIONS = [3, 7, 14, 30] as const;

/** Clamp a stored expiry value into the allowed 1–30 range, defaulting to 7. */
export function clampExpiryDays(value: unknown): number {
  if (value === null || value === undefined) return DEFAULT_SURVEY_EXPIRY_DAYS;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_SURVEY_EXPIRY_DAYS;
  return Math.min(30, Math.max(1, Math.round(n)));
}

/** Expiry as an ISO timestamp `days` from now. */
export function expiryFromNow(days: number): string {
  return new Date(Date.now() + clampExpiryDays(days) * 24 * 60 * 60 * 1000).toISOString();
}
