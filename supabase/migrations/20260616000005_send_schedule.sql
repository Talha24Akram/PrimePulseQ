-- ============================================================
-- 20260616000005_send_schedule
-- Per-workspace recurring-survey send time. The cron now runs hourly and only
-- sends a workspace's surveys at its configured local day + hour. NULLs default
-- to the historical behaviour: Monday 08:00 UTC.
-- ============================================================

alter table profiles add column if not exists send_day_of_week int
  check (send_day_of_week is null or send_day_of_week between 0 and 6); -- 0=Sun
alter table profiles add column if not exists send_hour int
  check (send_hour is null or send_hour between 0 and 23);              -- local hour
alter table profiles add column if not exists timezone text;            -- IANA tz
