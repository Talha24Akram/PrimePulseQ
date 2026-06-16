-- ============================================================
-- 20260616000010_plan_limits
-- Enforce plan limits at the database level so they hold even if someone calls
-- the Supabase API directly, bypassing the frontend tier gates.
--   employees: free 25, starter 100, growth 500, enterprise unlimited
--   active surveys: free 1, starter 5, growth+ unlimited
-- Owners (is_owner) are always unlimited.
-- ============================================================

create or replace function check_employee_limit()
returns trigger language plpgsql security definer as $$
declare
  v_tier text; v_owner boolean; v_limit int; v_count int;
begin
  if NEW.is_active is not true then return NEW; end if;
  select subscription_tier, is_owner into v_tier, v_owner from profiles where id = NEW.workspace_id;
  if v_owner then return NEW; end if;
  v_limit := case coalesce(v_tier, 'free')
               when 'free' then 25 when 'starter' then 100 when 'growth' then 500 else null end;
  if v_limit is null then return NEW; end if; -- enterprise = unlimited

  select count(*) into v_count from employees
   where workspace_id = NEW.workspace_id and is_active = true and id <> NEW.id;
  if v_count >= v_limit then
    raise exception '% plan limit: % employees. Upgrade for a higher limit.',
      initcap(coalesce(v_tier, 'free')), v_limit;
  end if;
  return NEW;
end;
$$;

drop trigger if exists employees_limit on employees;
create trigger employees_limit before insert or update on employees
  for each row execute function check_employee_limit();

create or replace function check_survey_limit()
returns trigger language plpgsql security definer as $$
declare
  v_tier text; v_owner boolean; v_limit int; v_count int;
begin
  if NEW.status <> 'active' then return NEW; end if;
  select subscription_tier, is_owner into v_tier, v_owner from profiles where id = NEW.workspace_id;
  if v_owner then return NEW; end if;
  v_limit := case coalesce(v_tier, 'free')
               when 'free' then 1 when 'starter' then 5 else null end;
  if v_limit is null then return NEW; end if; -- growth/enterprise = unlimited

  select count(*) into v_count from surveys
   where workspace_id = NEW.workspace_id and status = 'active' and id <> NEW.id;
  if v_count >= v_limit then
    raise exception '% plan allows % active survey(s). Upgrade for more.',
      initcap(coalesce(v_tier, 'free')), v_limit;
  end if;
  return NEW;
end;
$$;

drop trigger if exists surveys_limit on surveys;
create trigger surveys_limit before insert or update on surveys
  for each row execute function check_survey_limit();
