-- ============================================================
-- 20260616000015_plan_feature_enforcement
-- Enforce paid feature gates in the database, not only in the UI.
-- ============================================================

create or replace function check_survey_plan_features()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tier text;
  v_owner boolean;
begin
  select subscription_tier, is_owner
    into v_tier, v_owner
    from profiles
   where id = NEW.workspace_id;

  if v_owner then
    return NEW;
  end if;

  if coalesce(NEW.frequency, 'one-time') in ('weekly', 'biweekly', 'monthly')
     and coalesce(v_tier, 'free') = 'free' then
    raise exception 'Recurring surveys require Starter or higher.';
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_survey_plan_features on surveys;
create trigger enforce_survey_plan_features
  before insert or update of workspace_id, frequency on surveys
  for each row execute function check_survey_plan_features();

create or replace function check_template_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tier text;
  v_owner boolean;
  v_limit int;
  v_count int;
begin
  -- Global starter templates are platform-owned and not counted against tenants.
  if NEW.workspace_id is null then
    return NEW;
  end if;

  select subscription_tier, is_owner
    into v_tier, v_owner
    from profiles
   where id = NEW.workspace_id;

  if v_owner then
    return NEW;
  end if;

  v_limit := case coalesce(v_tier, 'free')
    when 'free' then 1
    when 'starter' then 2
    else null
  end;

  if v_limit is null then
    return NEW;
  end if;

  select count(*)
    into v_count
    from survey_templates
   where workspace_id = NEW.workspace_id
     and id <> NEW.id;

  if v_count >= v_limit then
    raise exception '% plan allows % saved template(s). Upgrade for more.',
      initcap(coalesce(v_tier, 'free')), v_limit;
  end if;

  return NEW;
end;
$$;

drop trigger if exists enforce_template_limit on survey_templates;
create trigger enforce_template_limit
  before insert or update of workspace_id on survey_templates
  for each row execute function check_template_limit();
