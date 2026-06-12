-- ============================================================
-- PrimePulseQ — Full Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- ── PROFILES ────────────────────────────────────────────────
create table if not exists profiles (
  id                  uuid references auth.users on delete cascade primary key,
  email               text,
  full_name           text,
  company_name        text,
  company_slug        text unique,
  company_website     text,
  avatar_url          text,
  is_owner            boolean default false,
  subscription_tier   text default 'free'
    check (subscription_tier in ('free','starter','growth','enterprise')),
  subscription_status text default 'active'
    check (subscription_status in ('active','trialing','past_due','cancelled')),
  trial_ends_at       timestamptz,
  paddle_customer_id  text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Auto-create profile when a user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── EMPLOYEES ───────────────────────────────────────────────
create table if not exists employees (
  id                uuid default gen_random_uuid() primary key,
  workspace_id      uuid references profiles(id) on delete cascade not null,
  email             text not null,
  name              text,
  department        text,
  role              text,
  is_active         boolean default true,
  email_opted_out   boolean default false,  -- employee unsubscribed from survey emails
  created_at        timestamptz default now(),
  unique(workspace_id, email)
);

-- Run this separately if table already exists:
-- alter table employees add column if not exists email_opted_out boolean default false;

-- ── SURVEYS ─────────────────────────────────────────────────
create table if not exists surveys (
  id           uuid default gen_random_uuid() primary key,
  workspace_id uuid references profiles(id) on delete cascade not null,
  title        text not null,
  description  text,
  status       text default 'draft'
    check (status in ('draft','active','closed')),
  frequency    text default 'one-time'
    check (frequency in ('one-time','weekly','biweekly','monthly')),
  closes_at    timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── QUESTIONS ───────────────────────────────────────────────
create table if not exists questions (
  id          uuid default gen_random_uuid() primary key,
  survey_id   uuid references surveys(id) on delete cascade not null,
  text        text not null,
  type        text not null
    check (type in ('scale','yes_no','multiple_choice','text')),
  options     jsonb,
  order_index integer default 0,
  created_at  timestamptz default now()
);

-- ── SURVEY TOKENS (one per employee per survey) ──────────────
-- Token is used to open the survey; employee identity is NOT stored in responses
create table if not exists survey_tokens (
  token        uuid default gen_random_uuid() primary key,
  survey_id    uuid references surveys(id) on delete cascade not null,
  employee_id  uuid references employees(id) on delete cascade not null,
  used         boolean default false,
  expires_at   timestamptz default (now() + interval '7 days'),
  created_at   timestamptz default now(),
  unique(survey_id, employee_id)
);

-- ── RESPONSES (anonymous — zero employee linkage) ────────────
create table if not exists responses (
  id           uuid default gen_random_uuid() primary key,
  survey_id    uuid references surveys(id) on delete cascade not null,
  answers      jsonb not null,
  submitted_at timestamptz default now()
  -- NO employee_id column — by design
);

-- ── AUDIT LOGS ───────────────────────────────────────────────
create table if not exists audit_logs (
  id            uuid default gen_random_uuid() primary key,
  workspace_id  uuid references profiles(id) on delete cascade not null,
  actor_email   text,
  action        text not null,
  resource_type text,
  resource_id   text,
  metadata      jsonb,
  created_at    timestamptz default now()
);

-- ── SLACK INTEGRATIONS ───────────────────────────────────────
create table if not exists slack_integrations (
  id              uuid default gen_random_uuid() primary key,
  workspace_id    uuid references profiles(id) on delete cascade not null unique,
  slack_team_id   text not null,
  slack_team_name text,
  bot_token       text not null,
  created_at      timestamptz default now()
);

-- ── API KEYS (Enterprise) ────────────────────────────────────
create table if not exists api_keys (
  id           uuid default gen_random_uuid() primary key,
  workspace_id uuid references profiles(id) on delete cascade not null,
  name         text not null,
  key_hash     text not null unique,
  last_used_at timestamptz,
  created_at   timestamptz default now(),
  revoked_at   timestamptz
);

-- ============================================================
-- ROW LEVEL SECURITY — users can only access their own data
-- ============================================================

alter table profiles           enable row level security;
alter table employees          enable row level security;
alter table surveys            enable row level security;
alter table questions          enable row level security;
alter table survey_tokens      enable row level security;
alter table responses          enable row level security;
alter table audit_logs         enable row level security;
alter table slack_integrations enable row level security;
alter table api_keys           enable row level security;

create policy "profiles_own"    on profiles           for all using (auth.uid() = id);
create policy "employees_own"   on employees          for all using (workspace_id = auth.uid());
create policy "surveys_own"     on surveys            for all using (workspace_id = auth.uid());
create policy "questions_own"   on questions          for all using (survey_id in (select id from surveys where workspace_id = auth.uid()));
create policy "tokens_read"     on survey_tokens      for select using (survey_id in (select id from surveys where workspace_id = auth.uid()) or auth.uid() is null);
create policy "responses_read"  on responses          for select using (survey_id in (select id from surveys where workspace_id = auth.uid()));
create policy "responses_insert" on responses         for insert with check (true);
create policy "audit_own"       on audit_logs         for all using (workspace_id = auth.uid());
create policy "slack_own"       on slack_integrations for all using (workspace_id = auth.uid());
create policy "apikeys_own"     on api_keys           for all using (workspace_id = auth.uid());

-- ============================================================
-- MARK YOURSELF AS OWNER (run this separately after signing up)
-- Replace with your actual email address:
-- ============================================================
-- update profiles
-- set is_owner = true, subscription_tier = 'enterprise'
-- where email = 'your@email.com';
