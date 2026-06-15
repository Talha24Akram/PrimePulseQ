-- ============================================================
-- 20260615000000_atomic_submit_response
-- Atomic anonymous survey submission.
--
-- Replaces the previous 3-call sequence (validate -> insert -> mark used) in
-- the API route, which had a crash window between insert and mark-used that
-- could leave a token reusable. This function does all three in ONE
-- transaction, and `select ... for update` locks the token row so two
-- concurrent submissions for the same token cannot both pass the `used` check.
--
-- Returns a status string the API route maps to an HTTP response:
--   'ok' | 'not_found' | 'already_used' | 'expired' | 'closed' | 'error'
-- ============================================================

create or replace function submit_survey_response(
  p_token uuid,
  p_answers jsonb
) returns text language plpgsql security definer as $$
declare
  v_token   survey_tokens%rowtype;
  v_status  text;
begin
  -- Lock the token row for the duration of the transaction. Concurrent calls
  -- for the same token block here and re-read `used` after the first commits.
  select * into v_token
  from survey_tokens
  where token = p_token
  for update;

  if not found then
    return 'not_found';
  end if;

  if v_token.used then
    return 'already_used';
  end if;

  if v_token.expires_at is not null and v_token.expires_at < now() then
    return 'expired';
  end if;

  select status into v_status from surveys where id = v_token.survey_id;
  if v_status is null or v_status <> 'active' then
    return 'closed';
  end if;

  -- Anonymous response — only survey_id + answers, never the employee.
  insert into responses (survey_id, answers)
  values (v_token.survey_id, p_answers);

  update survey_tokens set used = true where token = p_token;

  return 'ok';
end;
$$;
