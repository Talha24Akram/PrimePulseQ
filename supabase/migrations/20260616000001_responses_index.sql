-- ============================================================
-- 20260616000001_responses_index
-- responses is queried by survey_id in several hot paths (RLS reads,
-- count_completed_cycles join, analytics). Add the supporting index.
-- ============================================================

create index if not exists responses_survey_id on responses (survey_id);
