-- ============================================================
-- 20260615000002_claim_owner
-- Race-free owner bootstrap. Promotes a user to workspace owner ONLY if no
-- owner exists yet, so the manual "run this SQL by hand" step is no longer
-- required and can't be run twice to hijack ownership.
--
-- An advisory lock serializes concurrent first-claims so exactly one wins.
-- Returns: 'ok' | 'already_owner' | 'already_configured' | 'no_profile'
-- ============================================================

create or replace function claim_owner(p_user uuid)
returns text language plpgsql security definer as $$
declare
  v_existing int;
begin
  -- Serialize concurrent claims for the duration of the transaction.
  perform pg_advisory_xact_lock(hashtext('claim_owner'));

  select count(*) into v_existing from profiles where is_owner = true;

  if v_existing > 0 then
    if exists (select 1 from profiles where id = p_user and is_owner = true) then
      return 'already_owner';      -- idempotent for the same caller
    end if;
    return 'already_configured';   -- someone else already owns it
  end if;

  update profiles
    set is_owner = true,
        subscription_tier = 'enterprise',
        subscription_status = 'active'
  where id = p_user;

  if not found then
    return 'no_profile';
  end if;

  return 'ok';
end;
$$;
