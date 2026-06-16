-- ============================================================
-- 20260616000009_rate_limit_cleanup
-- The sliding-window limiter already prunes opportunistically, but add a
-- created_at index and a weekly pg_cron sweep as a safety net. The window is at
-- most 10 minutes, so anything older than 1 hour is guaranteed stale.
--
-- pg_cron is optional (Supabase: enable it under Database → Extensions). The
-- DO block no-ops cleanly where pg_cron isn't available, so this migration
-- always applies.
-- ============================================================

create index if not exists rate_limit_events_created on rate_limit_events (created_at);

do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'rate-limit-cleanup',
      '0 3 * * 0',
      $cron$delete from rate_limit_events where created_at < now() - interval '1 hour'$cron$
    );
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end
$do$;
