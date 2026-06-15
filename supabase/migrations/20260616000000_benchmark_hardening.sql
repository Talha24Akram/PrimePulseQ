-- ============================================================
-- 20260616000000_benchmark_hardening
-- Follow-ups to the benchmark feature:
--  1. count_completed_cycles() — single-query distinct survey count (replaces
--     the route's two-step "fetch all surveys + all responses" scan).
--  2. profiles.industry check constraint so cohorts can't fragment on typos
--     ("Tech" vs "Technology") — values must match the settings UI options.
-- ============================================================

-- 1. Efficient "completed survey cycles" count: distinct surveys that have at
-- least one response, for a workspace. SECURITY DEFINER so the authed route can
-- call it without exposing cross-tenant data (it filters by the passed id).
create or replace function count_completed_cycles(p_workspace uuid)
returns int language sql security definer stable as $$
  select count(distinct r.survey_id)::int
  from responses r
  join surveys s on s.id = r.survey_id
  where s.workspace_id = p_workspace;
$$;

-- 2. Constrain industry to the fixed set the UI offers (idempotent).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_industry_chk') then
    alter table profiles add constraint profiles_industry_chk
      check (industry is null or industry in (
        'Technology','Healthcare','Finance','Retail','Manufacturing',
        'Education','Hospitality','Professional Services','Non-profit','Other'
      ));
  end if;
end $$;
