-- ============================================================
-- 20260616000013_soft_deletes
-- Soft deletes for surveys, employees, questions. RLS hides soft-deleted rows
-- on SELECT but allows the soft-delete UPDATE. Plan-limit triggers are made
-- deleted-aware so a soft-deleted row frees its slot. A pg_cron job (optional)
-- purges surveys soft-deleted more than 30 days ago.
-- ============================================================

alter table surveys   add column if not exists deleted_at timestamptz;
alter table employees add column if not exists deleted_at timestamptz;
alter table questions add column if not exists deleted_at timestamptz;

-- Partial indexes for the common "live rows" queries.
create index if not exists surveys_live   on surveys   (workspace_id) where deleted_at is null;
create index if not exists employees_live on employees (workspace_id) where deleted_at is null;
create index if not exists questions_live on questions (survey_id)    where deleted_at is null;

-- ── RLS: per-command so SELECT hides deleted, UPDATE can set deleted_at ──
drop policy if exists employees_own on employees;
create policy employees_select on employees for select using (workspace_id = auth.uid() and deleted_at is null);
create policy employees_insert on employees for insert with check (workspace_id = auth.uid());
create policy employees_update on employees for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy employees_delete on employees for delete using (workspace_id = auth.uid());

drop policy if exists surveys_own on surveys;
create policy surveys_select on surveys for select using (workspace_id = auth.uid() and deleted_at is null);
create policy surveys_insert on surveys for insert with check (workspace_id = auth.uid());
create policy surveys_update on surveys for update using (workspace_id = auth.uid()) with check (workspace_id = auth.uid());
create policy surveys_delete on surveys for delete using (workspace_id = auth.uid());

drop policy if exists questions_own on questions;
create policy questions_select on questions for select using (survey_id in (select id from surveys where workspace_id = auth.uid()) and deleted_at is null);
create policy questions_insert on questions for insert with check (survey_id in (select id from surveys where workspace_id = auth.uid()));
create policy questions_update on questions for update using (survey_id in (select id from surveys where workspace_id = auth.uid())) with check (survey_id in (select id from surveys where workspace_id = auth.uid()));
create policy questions_delete on questions for delete using (survey_id in (select id from surveys where workspace_id = auth.uid()));

-- ── Make plan-limit triggers deleted-aware ──────────────────
create or replace function check_employee_limit()
returns trigger language plpgsql security definer as $$
declare v_tier text; v_owner boolean; v_limit int; v_count int;
begin
  if NEW.is_active is not true or NEW.deleted_at is not null then return NEW; end if;
  select subscription_tier, is_owner into v_tier, v_owner from profiles where id = NEW.workspace_id;
  if v_owner then return NEW; end if;
  v_limit := case coalesce(v_tier, 'free') when 'free' then 25 when 'starter' then 100 when 'growth' then 500 else null end;
  if v_limit is null then return NEW; end if;
  select count(*) into v_count from employees
   where workspace_id = NEW.workspace_id and is_active = true and deleted_at is null and id <> NEW.id;
  if v_count >= v_limit then
    raise exception '% plan limit: % employees. Upgrade for a higher limit.', initcap(coalesce(v_tier, 'free')), v_limit;
  end if;
  return NEW;
end;
$$;

create or replace function check_survey_limit()
returns trigger language plpgsql security definer as $$
declare v_tier text; v_owner boolean; v_limit int; v_count int;
begin
  if NEW.status <> 'active' or NEW.deleted_at is not null then return NEW; end if;
  select subscription_tier, is_owner into v_tier, v_owner from profiles where id = NEW.workspace_id;
  if v_owner then return NEW; end if;
  v_limit := case coalesce(v_tier, 'free') when 'free' then 1 when 'starter' then 5 else null end;
  if v_limit is null then return NEW; end if;
  select count(*) into v_count from surveys
   where workspace_id = NEW.workspace_id and status = 'active' and deleted_at is null and id <> NEW.id;
  if v_count >= v_limit then
    raise exception '% plan allows % active survey(s). Upgrade for more.', initcap(coalesce(v_tier, 'free')), v_limit;
  end if;
  return NEW;
end;
$$;

-- ── Purge surveys soft-deleted > 30 days ago ────────────────
create or replace function purge_deleted_surveys()
returns integer language plpgsql security definer as $$
declare v_deleted integer;
begin
  delete from surveys where deleted_at is not null and deleted_at < now() - interval '30 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- Optional weekly pg_cron sweep (no-ops where pg_cron isn't available).
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('purge-deleted-surveys', '30 3 * * 0', $cron$select purge_deleted_surveys()$cron$);
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end
$do$;
