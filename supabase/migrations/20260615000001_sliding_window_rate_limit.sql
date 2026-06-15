-- ============================================================
-- 20260615000001_sliding_window_rate_limit
-- Replaces the fixed-window rate limiter (20260101000001) with a true
-- sliding-window limiter.
--
-- Fixed windows let a burst at the window boundary get up to 2x the quota.
-- A sliding window counts only the requests in the trailing N seconds from
-- *now*, so the limit holds at every instant.
--
-- Implementation: one row per request in rate_limit_events. On each call we
-- prune that IP's expired rows, count what remains in the window, and only
-- record + allow if under the max.
-- ============================================================

-- Old fixed-window objects are no longer used by the app.
drop function if exists increment_rate_limit(text, timestamptz, int);
drop table if exists rate_limits;

create table if not exists rate_limit_events (
  id         bigint generated always as identity primary key,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_ip_time
  on rate_limit_events (ip_hash, created_at);

-- Returns the request count within the window INCLUDING the current request.
-- Caller allows the request when the returned value <= p_max.
create or replace function check_rate_limit_sliding(
  p_ip_hash text,
  p_window_seconds int,
  p_max int
) returns int language plpgsql security definer as $$
declare
  v_count int;
begin
  -- Prune this IP's events that have aged out of the window (correctness).
  delete from rate_limit_events
   where ip_hash = p_ip_hash
     and created_at < now() - make_interval(secs => p_window_seconds);

  -- Occasionally sweep globally so rows from one-off IPs don't accumulate.
  if random() < 0.01 then
    delete from rate_limit_events
     where created_at < now() - make_interval(secs => p_window_seconds);
  end if;

  select count(*) into v_count
  from rate_limit_events
  where ip_hash = p_ip_hash;

  -- Already at/over the limit — reject without recording another event.
  if v_count >= p_max then
    return v_count + 1;
  end if;

  insert into rate_limit_events (ip_hash) values (p_ip_hash);
  return v_count + 1;
end;
$$;

alter table rate_limit_events enable row level security;
-- No policies — service role only access.
