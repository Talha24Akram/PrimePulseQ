-- ============================================================
-- 20260616000012_survey_closed_at
-- Track when a survey was auto-closed (all its tokens expired/used). Used by the
-- cron to close completed one-time surveys and notify the owner.
-- ============================================================

alter table surveys add column if not exists closed_at timestamptz;
