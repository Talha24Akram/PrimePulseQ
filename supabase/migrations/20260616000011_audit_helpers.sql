-- ============================================================
-- 20260616000011_audit_helpers
-- Reuse the existing audit_logs table (already populated client-side by
-- logAudit for survey/employee actions). Add an actor_id column and a
-- SECURITY DEFINER write_audit_log() so server contexts without an auth cookie
-- (Paddle webhook plan changes, owner transfer) can append audit entries.
-- ============================================================

alter table audit_logs add column if not exists actor_id uuid;

create or replace function write_audit_log(
  p_org_id        uuid,
  p_actor_id      uuid,
  p_action        text,
  p_resource_type text,
  p_resource_id   uuid,
  p_meta          jsonb
) returns void language plpgsql security definer as $$
begin
  insert into audit_logs (workspace_id, actor_id, action, resource_type, resource_id, metadata)
  values (p_org_id, p_actor_id, p_action, p_resource_type, p_resource_id::text, p_meta);
end;
$$;
