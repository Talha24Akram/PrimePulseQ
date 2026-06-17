-- ============================================================
-- 20260616000017_security_definer_search_path
-- Pin SECURITY DEFINER functions to a trusted search_path.
-- ============================================================

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in (
         'handle_new_user',
         'increment_rate_limit',
         'submit_survey_response',
         'check_rate_limit_sliding',
         'claim_owner',
         'purge_expired_tokens',
         'get_benchmark',
         'count_completed_cycles',
         'purge_old_responses',
         'check_employee_limit',
         'check_survey_limit',
         'write_audit_log',
         'purge_deleted_surveys',
         'check_survey_plan_features',
         'check_template_limit'
       )
  loop
    execute format('alter function %s set search_path = public, pg_temp', fn);
  end loop;
end $$;
