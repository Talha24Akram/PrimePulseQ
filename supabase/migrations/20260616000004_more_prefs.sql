-- ============================================================
-- 20260616000004_more_prefs
-- Additional workspace preferences:
--   response_rate_alert_pct — flag surveys that close below this rate (used by
--     the survey-close notification).
--   min_cohort_display      — minimum responses before results/open-text are
--     shown (anonymity floor; replaces the hardcoded 5).
--   digest_emails_enabled   — opt out of digest emails.
-- ============================================================

alter table profiles add column if not exists response_rate_alert_pct int default 50
  check (response_rate_alert_pct is null or response_rate_alert_pct between 0 and 100);

alter table profiles add column if not exists min_cohort_display int default 5
  check (min_cohort_display is null or min_cohort_display between 3 and 20);

alter table profiles add column if not exists digest_emails_enabled boolean default true;
