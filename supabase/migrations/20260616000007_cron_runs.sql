-- ============================================================
-- 20260616000007_cron_runs
-- Observability for the scheduled-survey cron. One row per run, written by the
-- service-role cron. Owner-only read (the cron is instance-global, not
-- workspace-scoped). No client inserts.
-- ============================================================

create table if not exists cron_runs (
  id               uuid default gen_random_uuid() primary key,
  started_at       timestamptz not null,
  completed_at     timestamptz,
  surveys_sent     int default 0,
  emails_attempted int default 0,
  emails_failed    int default 0,
  errors           jsonb,
  created_at       timestamptz default now()
);

create index if not exists cron_runs_started on cron_runs (started_at desc);

alter table cron_runs enable row level security;

-- Instance owners can read run history; inserts/updates only via service role.
create policy "cron_runs_owner_read" on cron_runs for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_owner = true));
