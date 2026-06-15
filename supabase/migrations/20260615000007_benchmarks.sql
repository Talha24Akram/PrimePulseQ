-- ============================================================
-- 20260615000007_benchmarks
-- Industry benchmark comparisons. Each workspace contributes an anonymized
-- weekly aggregate score for its (industry, headcount_band) cohort; the
-- dashboard compares the org's score against cohort percentiles.
--
-- k-anonymity: percentiles are only returned when a cohort has >= 3 distinct
-- orgs, and only aggregates (never per-org rows) cross the tenant boundary.
-- ============================================================

alter table profiles add column if not exists industry text;
alter table profiles add column if not exists headcount_band text
  check (headcount_band is null or headcount_band in ('1-50','51-200','201-1000','1000+'));

create table if not exists benchmark_snapshots (
  id             uuid default gen_random_uuid() primary key,
  workspace_id   uuid references profiles(id) on delete cascade not null,
  week_start     date not null,
  industry       text not null,
  headcount_band text not null,
  avg_score      numeric not null,     -- 0-100
  created_at     timestamptz default now(),
  unique(workspace_id, week_start)
);

create index if not exists benchmark_cohort on benchmark_snapshots (industry, headcount_band, week_start);

alter table benchmark_snapshots enable row level security;

-- A workspace can only see/write its OWN snapshot rows. Cohort aggregates are
-- exposed solely through the SECURITY DEFINER function below.
create policy "benchmark_own" on benchmark_snapshots for all
  using (workspace_id = auth.uid())
  with check (workspace_id = auth.uid());

-- Returns cohort percentiles for an (industry, band), using each org's most
-- recent snapshot in the last 90 days. Returns NULL percentiles (with the real
-- cohort_size) when fewer than 3 distinct orgs — preserving anonymity.
create or replace function get_benchmark(p_industry text, p_band text)
returns table(p25 numeric, p50 numeric, p75 numeric, cohort_size int)
language plpgsql security definer as $$
declare
  v_size int;
begin
  select count(distinct workspace_id) into v_size
  from benchmark_snapshots
  where industry = p_industry and headcount_band = p_band
    and week_start >= (current_date - interval '90 days');

  if v_size < 3 then
    return query select null::numeric, null::numeric, null::numeric, v_size;
    return;
  end if;

  return query
  select
    percentile_cont(0.25) within group (order by avg_score)::numeric,
    percentile_cont(0.50) within group (order by avg_score)::numeric,
    percentile_cont(0.75) within group (order by avg_score)::numeric,
    v_size
  from (
    select distinct on (workspace_id) workspace_id, avg_score
    from benchmark_snapshots
    where industry = p_industry and headcount_band = p_band
      and week_start >= (current_date - interval '90 days')
    order by workspace_id, week_start desc
  ) latest;
end;
$$;
