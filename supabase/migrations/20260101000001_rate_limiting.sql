-- ============================================================
-- 20260101000001_rate_limiting
-- Serverless-safe rate limiting for the public survey-submit endpoint.
-- Keyed by a hashed IP so raw addresses are never stored.
--
-- NOTE: This is the original FIXED-WINDOW counter. It is superseded by
-- 20260615000001_sliding_window_rate_limit.sql, which replaces the function
-- with a sliding-window implementation. Both files are kept so the migration
-- history replays correctly on a fresh database.
-- ============================================================

create table if not exists rate_limits (
  ip_hash  text primary key,
  count    int not null default 1,
  reset_at timestamptz not null
);

-- Atomic upsert: increments counter or resets if the window has expired.
-- Returns the NEW count so the caller can decide to allow/block.
create or replace function increment_rate_limit(
  p_ip_hash text,
  p_reset_at timestamptz,
  p_max int
) returns int language plpgsql security definer as $$
declare
  v_count int;
begin
  insert into rate_limits (ip_hash, count, reset_at)
  values (p_ip_hash, 1, p_reset_at)
  on conflict (ip_hash) do update
    set count    = case
                     when rate_limits.reset_at <= now() then 1
                     else least(rate_limits.count + 1, p_max + 1)
                   end,
        reset_at = case
                     when rate_limits.reset_at <= now() then p_reset_at
                     else rate_limits.reset_at
                   end
  returning count into v_count;
  return v_count;
end;
$$;

-- No RLS policies for rate_limits — service role only access.
alter table rate_limits enable row level security;
