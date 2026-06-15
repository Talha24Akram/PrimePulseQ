-- ============================================================
-- 20260615000004_actions
-- In-app action tracking. Managers turn survey insights into tracked tasks.
--
-- Note: the spec calls the tenant column `org_id`; this codebase's tenant is the
-- profiles row, so we use `workspace_id` to match every other table.
-- ============================================================

create table if not exists actions (
  id           uuid default gen_random_uuid() primary key,
  workspace_id uuid references profiles(id) on delete cascade not null,
  survey_id    uuid references surveys(id) on delete set null,
  title        text not null,
  description  text,
  assigned_to  uuid references profiles(id) on delete set null,
  status       text default 'planned'
    check (status in ('planned','in-progress','done')),
  due_date     date,
  created_at   timestamptz default now(),
  completed_at timestamptz
);

create index if not exists actions_workspace on actions (workspace_id, status);
create index if not exists actions_survey on actions (survey_id);

alter table actions enable row level security;

-- Tenant isolation: a workspace can only see/modify its own actions.
-- (FOR ALL with USING also gates INSERT/UPDATE row values when WITH CHECK is omitted.)
create policy "actions_own" on actions for all using (workspace_id = auth.uid());
