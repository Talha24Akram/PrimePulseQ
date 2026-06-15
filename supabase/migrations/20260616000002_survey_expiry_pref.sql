-- ============================================================
-- 20260616000002_survey_expiry_pref
-- Per-workspace survey link expiry. Tokens previously expired after a
-- hardcoded 7 days; this lets fast teams use 3 days and async/remote teams 14+.
-- ============================================================

alter table profiles add column if not exists survey_expiry_days int default 7
  check (survey_expiry_days is null or (survey_expiry_days between 1 and 30));
