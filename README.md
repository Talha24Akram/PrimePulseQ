# PrimePulseQ

Employee pulse survey SaaS — simple, anonymous, actionable.

Run short recurring surveys, collect **fully anonymous** responses, and turn the
results into engagement trends, burnout signals, and a rule-based action plan.

## Features

- Recurring pulse surveys (weekly / biweekly / monthly) with anonymous responses
- Per-employee single-use survey links (token-based) — no employee login required
- Engagement score, burnout signals, sentiment, and trend analytics
- Auto-generated **Insights** + **Suggested Action Plan** (rule-based today, AI-ready)
- Survey builder: scale, multiple choice, yes/no, and text questions
- Employee roster management with CSV import
- Slack & Teams webhook notifications
- Email delivery + unsubscribe handling (CAN-SPAM / GDPR friendly)
- 4-tier plans: Free / Starter / Growth / Enterprise (Paddle billing)
- Light & dark mode

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 (`@variant dark` + `data-theme`), Radix UI primitives |
| Charts | Recharts |
| Auth + Database | Supabase (PostgreSQL + Row Level Security) |
| Email | Resend |
| Billing | Paddle |
| Tests | Vitest |
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
2. Open **SQL Editor** and run the full contents of
   `supabase/migrations/001_initial_schema.sql`. This creates all tables, the
   `increment_rate_limit()` function, and Row Level Security policies.
3. **If you ran an older version of the schema**, apply the incremental
   `alter table ... add column if not exists ...` statements that are commented
   at the top of each table block in the same file (e.g. `email_opted_out`,
   `slack_webhook_url`, `teams_webhook_url`, `questions.required`).
4. After signing up in the app, mark yourself owner (see the commented block at
   the bottom of the migration file).
5. Copy your project URL, anon key, and **service role key** from
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

# Cron auth (any random string; also used to salt rate-limit IP hashing)
CRON_SECRET=your-random-secret
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

- [ ] Schema applied in Supabase (tables, `increment_rate_limit`, RLS policies)
- [ ] Owner account marked via the SQL snippet in the migration
- [ ] All env vars set in Vercel (Supabase, Resend, Paddle, `CRON_SECRET`)
- [ ] `NEXT_PUBLIC_APP_URL` set to the production domain
- [ ] Resend sending domain verified (or using the test sender for staging)
- [ ] Paddle products/prices created and price IDs wired to env vars
- [ ] Paddle webhook configured and signature secret set
- [ ] Supabase Auth redirect URLs include the production domain
- [ ] `npm run build`, `npm run lint`, and `npm run test` all pass
- [ ] Sent a test survey and confirmed a token link submits one anonymous response

## Known limitations

- **Rate limiting** is database-backed (`increment_rate_limit`) and works across
  serverless instances, but is not a full distributed limiter (no sliding window
  / Redis). Adequate for current scale. See `TODO` in `src/app/api/survey/submit/route.ts`.
- **Token submission is not a single atomic transaction** — validation, response
  insert, and marking the token `used` are sequential service-role calls. A crash
  between insert and mark could in theory allow a duplicate; acceptable for now.
  See `TODO` in the submit route.
- **Insights & Action Plan are rule-based**, not AI-generated. The logic lives in
  `src/lib/insights.ts` with a stable `InsightInput` contract designed to be the
  future LLM payload. See `TODO(ai-insights)` there.
- **No automated E2E tests** yet — Vitest covers utils, token validation, and
  rate-limit logic only.
- **Department scores are intentionally not computed** — anonymity means responses
  can't be linked to a department; only headcount distribution is shown.

## License

Proprietary — all rights reserved.
