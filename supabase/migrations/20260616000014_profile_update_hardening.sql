-- ============================================================
-- 20260616000014_profile_update_hardening
-- Prevent browser/authenticated users from editing sensitive profile columns.
--
-- `profiles` stores both self-service workspace fields and server-controlled
-- billing/owner fields. RLS keeps users on their own row, but column privileges
-- are still needed so a browser session cannot set `is_owner` or upgrade its
-- own `subscription_tier`. Service-role/server contexts are unaffected.
-- ============================================================

do $do$
declare
  v_safe_columns text;
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke update on table profiles from authenticated;

    select string_agg(quote_ident(c.column_name), ', ')
      into v_safe_columns
    from unnest(array[
      'full_name',
      'company_name',
      'company_slug',
      'company_website',
      'avatar_url',
      'slack_webhook_url',
      'teams_webhook_url',
      'industry',
      'headcount_band',
      'survey_expiry_days',
      'data_retention_days',
      'response_rate_alert_pct',
      'min_cohort_display',
      'digest_emails_enabled',
      'send_day_of_week',
      'send_hour',
      'timezone',
      'updated_at'
    ]) as safe(column_name)
    join information_schema.columns c
      on c.table_schema = 'public'
     and c.table_name = 'profiles'
     and c.column_name = safe.column_name;

    if v_safe_columns is not null then
      execute format('grant update (%s) on table profiles to authenticated', v_safe_columns);
    end if;
  end if;
end
$do$;
