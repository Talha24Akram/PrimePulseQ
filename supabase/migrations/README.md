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

## One-time setup after first deploy

Mark your own account as the workspace owner (grants Enterprise-tier access for
internal/admin use). Replace the email:

```sql
update profiles
set is_owner = true, subscription_tier = 'enterprise'
where email = 'your@email.com';
```

> A safer automated alternative is the owner-bootstrap API route (see the app's
> deployment docs) which only promotes the very first signup and refuses to run
> twice.
