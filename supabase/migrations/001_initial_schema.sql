-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- COMPANIES
-- ============================================================
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  tier text not null default 'starter' check (tier in ('starter', 'growth', 'enterprise')),
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Company owners can manage their company"
  on public.companies for all
  using (owner_id = auth.uid());

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  company_id uuid references public.companies(id) on delete set null,
  role text not null default 'admin' check (role in ('admin', 'manager', 'viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read and update own profile"
  on public.profiles for all
  using (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- EMPLOYEES
-- ============================================================
create table public.employees (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  name text not null,
  department text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

alter table public.employees enable row level security;

create policy "Company admins can manage employees"
  on public.employees for all
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

-- ============================================================
-- SURVEYS
-- ============================================================
create table public.surveys (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  frequency text not null default 'one_time' check (frequency in ('one_time', 'weekly', 'biweekly', 'monthly')),
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  sent_count integer not null default 0,
  created_at timestamptz not null default now(),
  closes_at timestamptz
);

alter table public.surveys enable row level security;

create policy "Company members can manage surveys"
  on public.surveys for all
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
  );

-- Anonymous token-based read access for response collection
create policy "Anyone with token can read active survey"
  on public.surveys for select
  using (status = 'active');

-- ============================================================
-- QUESTIONS
-- ============================================================
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  text text not null,
  type text not null check (type in ('scale', 'multiple_choice', 'text', 'yes_no')),
  options jsonb default '[]',
  required boolean not null default true,
  "order" integer not null default 0
);

alter table public.questions enable row level security;

create policy "Company members can manage questions"
  on public.questions for all
  using (
    survey_id in (
      select id from public.surveys
      where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "Anyone can read questions for active surveys"
  on public.questions for select
  using (
    survey_id in (select id from public.surveys where status = 'active')
  );

-- ============================================================
-- SURVEY RESPONSES (anonymous)
-- ============================================================
create table public.survey_responses (
  id uuid primary key default uuid_generate_v4(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  submitted_at timestamptz not null default now()
  -- Intentionally no user_id — responses are anonymous
);

alter table public.survey_responses enable row level security;

-- Anyone can insert a response (anonymous)
create policy "Anyone can submit a survey response"
  on public.survey_responses for insert
  with check (
    survey_id in (select id from public.surveys where status = 'active')
  );

-- Only company members can read responses
create policy "Company members can read responses"
  on public.survey_responses for select
  using (
    survey_id in (
      select id from public.surveys
      where company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

-- ============================================================
-- RESPONSE ANSWERS
-- ============================================================
create table public.response_answers (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  value text not null
);

alter table public.response_answers enable row level security;

create policy "Anyone can insert answer for a valid response"
  on public.response_answers for insert
  with check (true);

create policy "Company members can read answers"
  on public.response_answers for select
  using (
    question_id in (
      select q.id from public.questions q
      join public.surveys s on s.id = q.survey_id
      where s.company_id in (
        select company_id from public.profiles where id = auth.uid()
      )
    )
  );

-- ============================================================
-- VIEWS & FUNCTIONS
-- ============================================================

-- Engagement score per survey (avg of scale responses, normalized to 0-100)
create or replace view public.survey_engagement as
select
  sr.survey_id,
  count(distinct sr.id) as response_count,
  round(
    avg(
      case when q.type = 'scale' then (ra.value::numeric / 10.0) * 100
           when q.type = 'yes_no' and ra.value = 'Yes' then 100
           when q.type = 'yes_no' and ra.value = 'No' then 0
           else null
      end
    )
  , 1) as engagement_score
from public.survey_responses sr
join public.response_answers ra on ra.response_id = sr.id
join public.questions q on q.id = ra.question_id
group by sr.survey_id;

-- Increment sent_count when survey is sent
create or replace function public.increment_sent_count(survey_id uuid, increment_by integer default 1)
returns void language sql security definer as $$
  update public.surveys
  set sent_count = sent_count + increment_by
  where id = survey_id;
$$;
