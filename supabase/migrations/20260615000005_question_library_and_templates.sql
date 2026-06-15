-- ============================================================
-- 20260615000005_question_library_and_templates
-- Pre-built question library + survey templates (global starters + private
-- per-tenant templates).
-- ============================================================

-- ── QUESTION LIBRARY (global, read-only starter content) ─────
create table if not exists question_library (
  id         uuid default gen_random_uuid() primary key,
  category   text not null
    check (category in ('engagement','burnout','culture','communication','manager-effectiveness')),
  text       text not null,
  type       text not null
    check (type in ('scale','yes_no','multiple_choice','text')),
  options    jsonb,
  created_at timestamptz default now()
);

-- ── SURVEY TEMPLATES ─────────────────────────────────────────
-- workspace_id NULL = global starter template (read-only to tenants).
-- workspace_id set = a tenant's private saved template.
create table if not exists survey_templates (
  id           uuid default gen_random_uuid() primary key,
  workspace_id uuid references profiles(id) on delete cascade,
  name         text not null,
  description  text,
  category     text,
  is_starter   boolean default false,
  questions    jsonb not null,          -- [{text, type, options, required}]
  created_at   timestamptz default now()
);

create index if not exists survey_templates_workspace on survey_templates (workspace_id);

alter table question_library  enable row level security;
alter table survey_templates  enable row level security;

-- Question library: any authenticated user can read; no tenant writes.
create policy "qlib_read" on question_library for select using (auth.uid() is not null);

-- Templates: read global starters + your own; write only your own.
create policy "templates_read"   on survey_templates for select
  using (workspace_id is null or workspace_id = auth.uid());
create policy "templates_modify" on survey_templates for all
  using (workspace_id = auth.uid())
  with check (workspace_id = auth.uid());

-- ── Seed question library ────────────────────────────────────
insert into question_library (category, text, type, options) values
  ('engagement', 'On a scale of 1-10, how energized did you feel this week?', 'scale', null),
  ('engagement', 'Would you recommend this company as a place to work?', 'yes_no', null),
  ('engagement', 'What is one thing that would make your work more rewarding?', 'text', null),
  ('burnout', 'How often do you feel exhausted at the end of the workday?', 'multiple_choice', '["Rarely","Sometimes","Often","Always"]'),
  ('burnout', 'Rate your current work-life balance (1 = poor, 10 = excellent)', 'scale', null),
  ('burnout', 'Do you feel your workload is manageable?', 'yes_no', null),
  ('culture', 'I feel a sense of belonging on my team.', 'scale', null),
  ('culture', 'Our team lives up to the company values day to day.', 'yes_no', null),
  ('communication', 'How clear are the priorities for your work right now?', 'scale', null),
  ('communication', 'Do you get the information you need to do your job well?', 'yes_no', null),
  ('manager-effectiveness', 'My manager gives me useful, regular feedback.', 'scale', null),
  ('manager-effectiveness', 'Do you feel supported by your manager?', 'yes_no', null)
on conflict do nothing;

-- ── Seed 6 starter templates ─────────────────────────────────
insert into survey_templates (workspace_id, name, description, category, is_starter, questions) values
  (null, 'Weekly Pulse', 'Quick 3-question weekly check-in', 'engagement', true, '[
    {"text":"On a scale of 1-10, how energized did you feel this week?","type":"scale","options":[],"required":true},
    {"text":"What is one thing that went well this week?","type":"text","options":[],"required":false},
    {"text":"Do you feel supported by your manager?","type":"yes_no","options":[],"required":true}
  ]'),
  (null, 'New Hire Check-in (30/60/90)', 'Onboarding pulse for new joiners', 'engagement', true, '[
    {"text":"How would you rate your onboarding experience so far (1-10)?","type":"scale","options":[],"required":true},
    {"text":"Do you have the tools and access you need to do your job?","type":"yes_no","options":[],"required":true},
    {"text":"Is your role matching what you expected when you joined?","type":"multiple_choice","options":["Better than expected","As expected","Somewhat different","Very different"],"required":true},
    {"text":"What would make your first months here easier?","type":"text","options":[],"required":false}
  ]'),
  (null, 'Post-Reorg Pulse', 'Gauge sentiment after an organizational change', 'communication', true, '[
    {"text":"How clear are your responsibilities after the change (1-10)?","type":"scale","options":[],"required":true},
    {"text":"Do you understand why this change was made?","type":"yes_no","options":[],"required":true},
    {"text":"How supported did you feel through the transition?","type":"scale","options":[],"required":true},
    {"text":"What questions about the change are still unanswered for you?","type":"text","options":[],"required":false}
  ]'),
  (null, 'Quarterly Engagement', 'Deeper quarterly engagement survey', 'engagement', true, '[
    {"text":"How engaged do you feel in your work right now (1-10)?","type":"scale","options":[],"required":true},
    {"text":"Would you recommend this company as a place to work?","type":"yes_no","options":[],"required":true},
    {"text":"I see a path to grow my career here.","type":"scale","options":[],"required":true},
    {"text":"How manageable is your workload?","type":"multiple_choice","options":["Very manageable","Manageable","Heavy","Unsustainable"],"required":true},
    {"text":"What is one change that would most improve your experience?","type":"text","options":[],"required":false}
  ]'),
  (null, 'Manager Effectiveness', 'Feedback on management and support', 'manager-effectiveness', true, '[
    {"text":"My manager gives me useful, regular feedback (1-10).","type":"scale","options":[],"required":true},
    {"text":"Do you feel supported by your manager?","type":"yes_no","options":[],"required":true},
    {"text":"My manager removes blockers and helps me succeed.","type":"scale","options":[],"required":true},
    {"text":"What could your manager do differently to support you?","type":"text","options":[],"required":false}
  ]'),
  (null, 'Exit Survey', 'Understand why employees leave', 'culture', true, '[
    {"text":"What is the primary reason you are leaving?","type":"multiple_choice","options":["Compensation","Career growth","Management","Work-life balance","Role fit","Other"],"required":true},
    {"text":"How would you rate your overall experience here (1-10)?","type":"scale","options":[],"required":true},
    {"text":"Would you consider returning in the future?","type":"yes_no","options":[],"required":false},
    {"text":"What could we have done to keep you?","type":"text","options":[],"required":false}
  ]')
on conflict do nothing;
