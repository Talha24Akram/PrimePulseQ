-- ============================================================
-- 20260615000003_purge_expired_tokens
-- Housekeeping: survey_tokens accumulates one row per employee per send and is
-- never cleaned up. Used/expired tokens have no further purpose (responses are
-- already stored anonymously), so they can be deleted to keep the table small.
--
-- Called from the daily cron route. If you prefer DB-side scheduling, you can
-- instead register it with pg_cron:
--   select cron.schedule('purge-tokens', '0 3 * * *', 'select purge_expired_tokens()');
--
-- Returns the number of rows deleted.
-- ============================================================

create or replace function purge_expired_tokens()
returns integer language plpgsql security definer as $$
declare
  v_deleted integer;
begin
  delete from survey_tokens
   where used = true
      or (expires_at is not null and expires_at < now());
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
