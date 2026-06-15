-- ============================================================
-- 20260616000003_data_retention
-- Per-workspace response retention. NULL = keep forever (default — we never
-- auto-delete customer data without an explicit opt-in). When set to one of
-- 30/90/180/365, responses older than the window are purged by the daily cron.
-- A GDPR / data-minimization control enterprise buyers ask for.
-- ============================================================

alter table profiles add column if not exists data_retention_days int
  check (data_retention_days is null or data_retention_days in (30, 90, 180, 365));

-- Deletes responses older than each workspace's retention window. Returns the
-- number of rows deleted. SECURITY DEFINER — called by the service-role cron.
create or replace function purge_old_responses()
returns integer language plpgsql security definer as $$
declare
  v_deleted integer;
begin
  delete from responses r
  using surveys s, profiles p
  where r.survey_id = s.id
    and s.workspace_id = p.id
    and p.data_retention_days is not null
    and r.submitted_at < now() - make_interval(days => p.data_retention_days);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
