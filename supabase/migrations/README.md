# Database migrations

Migrations are plain SQL files named `<timestamp>_<description>.sql`. The
timestamp (`YYYYMMDDHHMMSS`) defines apply order — **always run them in
ascending filename order.**

## Applying

**Supabase CLI (recommended):**

```bash
supabase db push
```

This tracks which migrations have been applied in `supabase_migrations.schema_migrations`,
so re-running only applies pending files.

**Manual (Dashboard → SQL Editor):** paste and run each file in order, oldest
first. Every file is idempotent (`create table if not exists`,
`create or replace function`, `if not exists` guards) so re-running a file is
safe, but the CLI is preferred because it tracks state.

## Adding a change

Never edit a migration that has already been applied to a shared/production
database. Instead, add a **new** timestamped file with just the delta
(`alter table …`, `create or replace function …`, etc.). One change → one file.

## Current migrations

| File | Purpose |
|---|---|
| `20260101000000_initial_schema.sql` | All tables, the `handle_new_user` trigger, and RLS policies |
| `20260101000001_rate_limiting.sql` | `rate_limits` table + fixed-window `increment_rate_limit()` |
| `20260615000000_atomic_submit_response.sql` | `submit_survey_response()` — atomic validate + insert + mark-used |
| `20260615000001_sliding_window_rate_limit.sql` | Replaces rate limiting with a sliding-window counter |
| `20260615000002_claim_owner.sql` | `claim_owner()` — race-free first-owner bootstrap |
| `20260615000003_purge_expired_tokens.sql` | `purge_expired_tokens()` — housekeeping for used/expired tokens |
| `20260615000004_actions.sql` | `actions` table — in-app action tracking + RLS |
| `20260615000005_question_library_and_templates.sql` | question library + survey templates (+ 6 starters) + RLS |
| `20260615000006_survey_i18n.sql` | `employees.locale` + `surveys.translations` for multi-language surveys |
| `20260615000007_benchmarks.sql` | `benchmark_snapshots` + `profiles.industry`/`headcount_band` + `get_benchmark()` |

## One-time setup after first deploy

Mark your account as the workspace owner (grants Enterprise-tier access for
internal/admin use). **Preferred:** sign up, then call the owner-bootstrap route
while authenticated:

```
POST /api/setup/owner
# Body: { "secret": "<SETUP_SECRET>" }   (the route is disabled unless SETUP_SECRET is set)
```

It promotes only the first caller (via the `claim_owner()` RPC) and refuses once
an owner exists, so it's safe to call and can't be used twice to hijack
ownership. The required `SETUP_SECRET` is the first line of defense; the DB-level
one-time guard is the second.

Manual fallback (equivalent, replace the email):

```sql
update profiles
set is_owner = true, subscription_tier = 'enterprise'
where email = 'your@email.com';
```
