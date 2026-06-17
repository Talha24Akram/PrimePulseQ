# PrimePulseQ

Employee pulse survey SaaS — simple, anonymous, actionable.

Run short recurring surveys, collect **fully anonymous** responses, and turn the
results into engagement trends, burnout signals, AI insights, and a tracked
action plan.

## Features

- Recurring pulse surveys (weekly / biweekly / monthly) with anonymous responses
- Per-employee single-use survey links (token-based) — no employee login required
- Engagement score, burnout signals, sentiment, and trend analytics
- **AI Insights** (Anthropic `claude-sonnet-4-6`) — narrative, burnout risk, and
  manager recommendations, with automatic fallback to a rule-based engine
- **In-app action tracking** — turn recommendations into tracked tasks
- **Industry benchmarks** — compare against anonymized cohort percentiles (p25/p50/p75)
- **Question library + survey templates** (6 starters) and saveable private templates
- **Multi-language surveys** — en / ar / fr / de / es / pt, with RTL for Arabic
- Survey builder: scale, multiple choice, yes/no, and text questions
- Employee roster management with CSV import
- Slack & Teams webhook notifications
- Email delivery + unsubscribe handling (CAN-SPAM / GDPR friendly)
- Public [`/trust`](src/app/trust/page.tsx) page explaining anonymity to employees
- **Per-workspace preferences** — survey link expiry, data retention, results
  cohort threshold, response-rate alerts, and per-tenant send day/hour/timezone
- 4-tier plans: Free / Starter / Growth / Enterprise (Paddle billing)
- Error tracking via Sentry; cron run observability (owner-only history)
- Polished dark-mode UI

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@variant dark` + `data-theme`), Radix UI primitives |
| Charts | Recharts |
| Auth + Database | Supabase (PostgreSQL + Row Level Security) |
| AI | Anthropic (`@anthropic-ai/sdk`, `claude-sonnet-4-6`) |
| Error tracking | Sentry (`@sentry/nextjs`) — no-op without a DSN |
| Email | Resend |
| Billing | Paddle |
| Tests | Vitest + PGlite (in-process Postgres) |
| Deployment | Vercel (with Vercel Cron for scheduled surveys) |

## Anonymous survey flow (token-based)

Responses are **never** linked to an employee. The flow:

1. When a survey is sent (`/api/send-survey` or the cron job), a single-use
   `survey_tokens` row is created per employee (UUID, 7-day expiry).
2. Each employee is emailed their unique link: `/s/{token_uuid}` — never the raw survey ID.
3. The public page loads survey data via `GET /api/survey/[token]` (server-side
   validation using the service role; token logic never reaches the client).
4. Submission goes through `POST /api/survey/submit`, which re-validates the token
   (exists, not used, not expired, survey active), inserts an anonymous response
   containing only `survey_id` + `answers`, then marks the token `used`.

The `responses` table has **no `employee_id` column by design**, so there is no way
to map an answer back to a person — even with full database access.

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Talha24Akram/PrimePulseQ.git
cd PrimePulseQ
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` in ascending filename order.
   Either run `supabase db push` (tracks applied migrations), or paste each
   `.sql` file into the **SQL Editor** oldest-first. This creates all tables, the
   `handle_new_user` trigger, rate limiting, the atomic submit RPC, and Row Level
   Security policies. See `supabase/migrations/README.md` for the full convention.
3. After signing up in the app, mark yourself owner (see the one-time setup
   snippet in `supabase/migrations/README.md`).
4. Copy your project URL, anon key, and **service role key** from
   **Project Settings → API**.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Required:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-side only — never expose

# Resend (survey emails)
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# App URL (used to build email + survey links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron auth (any random string)
CRON_SECRET=your-random-secret
```

Optional:

```env
# Anthropic — powers AI Insights on Analytics. If unset, the app falls back to
# the built-in rule-based insights (no hard failure).
ANTHROPIC_API_KEY=sk-ant-your-key

# Dedicated salt for hashing IPs in rate limiting. Falls back to CRON_SECRET if unset.
RATE_LIMIT_SALT=your-random-rate-limit-salt

# Dedicated secret for signing unsubscribe links. Falls back to CRON_SECRET if unset.
UNSUBSCRIBE_SECRET=your-random-unsubscribe-secret

# Required only to use the one-time POST /api/setup/owner route (disabled unless set).
SETUP_SECRET=your-random-setup-secret
```

Paddle billing (get from [vendors.paddle.com](https://vendors.paddle.com)):

```env
PADDLE_API_KEY=your-paddle-api-key
PADDLE_ENVIRONMENT=sandbox            # "sandbox" or "production"
PADDLE_WEBHOOK_SECRET=your-webhook-signing-secret
PADDLE_PRICE_STARTER=pri_xxx
PADDLE_PRICE_GROWTH=pri_xxx
PADDLE_PRICE_ENTERPRISE=pri_xxx
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest run
npm run format     # prettier --write .
```

## Deploying to Vercel

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
2. Add **all** env vars from `.env.example` in the Vercel project settings
   (including `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and the Paddle keys).
3. Set `NEXT_PUBLIC_APP_URL` to your production domain.
4. Deploy.
5. In **Supabase → Authentication → URL Configuration**, add your domain:
   `https://your-app.vercel.app/**`.
6. Point your Paddle webhook at `https://your-app.vercel.app/api/billing/webhook`.
7. Scheduled surveys run via Vercel Cron (`vercel.json`); confirm the cron is
   enabled and that `CRON_SECRET` matches between Vercel and the cron config.

## Pre-deployment checklist

- [ ] All migrations applied in Supabase (tables, RPCs, RLS policies) in filename order
- [ ] Owner account claimed via `POST /api/setup/owner` (needs `SETUP_SECRET`) or the manual SQL snippet
- [ ] All env vars set in Vercel (Supabase, Resend, Paddle, `CRON_SECRET`; optionally `ANTHROPIC_API_KEY`, `RATE_LIMIT_SALT`, `SETUP_SECRET`)
- [ ] `NEXT_PUBLIC_APP_URL` set to the production domain
- [ ] Resend sending domain verified (or using the test sender for staging)
- [ ] Paddle products/prices created and price IDs wired to env vars
- [ ] Paddle webhook configured and signature secret set
- [ ] Supabase Auth redirect URLs include the production domain
- [ ] `npm run build`, `npm run lint`, and `npm run test` all pass
- [ ] Sent a test survey and confirmed a token link submits one anonymous response

## Known limitations

- **Rate limiting** is a database-backed **sliding window**
  (`check_rate_limit_sliding`), so it works across serverless instances and is
  not vulnerable to fixed-window boundary bursts. For very high scale, a
  dedicated Redis/Upstash limiter would still be lower-latency. See the `TODO`
  in `src/app/api/survey/submit/route.ts`.
- **Token submission is atomic** — validation, response insert, and marking the
  token `used` run in one Postgres function (`submit_survey_response`) with a
  `SELECT … FOR UPDATE` row lock, so a token can't be used twice even under
  concurrent requests. (True multi-connection concurrency is covered by the row
  lock; the integration test verifies the sequential reuse guarantee.)
- **AI Insights** use Anthropic `claude-sonnet-4-6` (`src/lib/ai-insights.ts`)
  and fall back to the deterministic rule-based engine (`src/lib/insights.ts`)
  when `ANTHROPIC_API_KEY` is unset or the call fails. Only anonymous aggregate
  metrics are sent — never individual responses.
- **PDF export is text/table only** — `src/lib/export-pdf.ts` builds the PDF with
  jsPDF's native vector/text API (crisp, selectable text). It does **not** embed
  the Recharts charts; a server-side render (Puppeteer / `@react-pdf/renderer`)
  would be needed for charts in the PDF.
- **Test coverage**: Vitest suites in `src/__tests__/` cover `utils`,
  `token-validation`, `rate-limit`, `insights`, the submit status mapping, locale
  helpers, a **real Postgres integration test** (`db-integration`, via PGlite),
  and **cross-tenant RLS isolation tests** (`rls-isolation`) that drive a
  non-superuser role to prove tenant data is hidden. Run `npm test`. Full browser
  E2E (Playwright) is still outstanding.
- **Department scores are intentionally not computed** — anonymity means responses
  can't be linked to a department; only headcount distribution is shown. Industry
  benchmarks (`get_benchmark`) compare a workspace against cohort percentiles and
  are k-anonymity gated to ≥ 3 distinct orgs.
- **Not yet implemented** (deferred): manager weekly digest email, SMS/WhatsApp
  delivery (Twilio), HRIS sync (BambooHR / Rippling / Workday), and per-tenant
  cron send-time/timezone — these require external accounts/config.

## License

Proprietary — all rights reserved.
