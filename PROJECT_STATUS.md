# PrimePulseQ — Project Status

_Last updated: 2026-06-29_

A living status doc: what's built, what's left, known issues, and the
pre-ship checklist. For the product pitch and setup steps see
[README.md](README.md); for QA see
[USER_ACCEPTANCE_TEST_PLAN.md](USER_ACCEPTANCE_TEST_PLAN.md) and
[TESTING_GUIDE.md](TESTING_GUIDE.md).

---

## At a glance

| | |
|---|---|
| **Stage** | Feature-complete; pre-launch hardening / QA |
| **Build** | ✅ `next build` passes |
| **Typecheck** | ✅ `tsc --noEmit` passes |
| **Tests** | ✅ 153 passing (17 files, Vitest + PGlite) |
| **Lint** | ⚠️ 10 errors + 16 warnings — all React Compiler diagnostics on the data-loading pattern (non-blocking; see Known issues) |
| **Deploy target** | Vercel + Supabase + Resend + Paddle |

---

## Feature status

Legend: ✅ done · 🟡 partial / needs polish · ⛔ not started (deferred)

### Core surveys & responses
- ✅ Survey builder — scale (1–10), yes/no, multiple choice, text; required/optional; reorder
- ✅ Frequencies — one-time, weekly, biweekly, monthly (recurring gated to paid tiers)
- ✅ Anonymous token flow — single-use UUID links (`/s/{token}`), no `employee_id` on responses
- ✅ Atomic submit RPC (`submit_survey_response`) with `SELECT … FOR UPDATE` row lock
- ✅ Survey lifecycle — draft / active / closed; soft-delete + 30-day restore + purge
- ✅ Multi-language surveys — en / ar / fr / de / es / pt, RTL for Arabic
- ✅ Survey templates — 6 starters + saveable private templates (plan-limited)
- ✅ Question library

### Employees
- ✅ Roster CRUD, search, department filter, activate/deactivate, soft-delete
- ✅ CSV import (≤5,000 rows, per-row results, plan-limit aware)
- ✅ Email normalization + duplicate prevention
- ✅ Welcome email on add

### Distribution & email
- ✅ Manual send (per-survey recipient selection)
- ✅ Scheduled sends via Vercel Cron (daily mode; optional hourly gating)
- ✅ Resend delivery + per-token sent/failed status + one retry
- ✅ Unsubscribe — HMAC-signed links, confirm-on-POST, RFC 8058 one-click
- ✅ Slack & Teams webhook notifications (SSRF-allowlisted, admin URL only)

### Analytics & insights
- ✅ Engagement trend, response rate, burnout %, score distribution, Pulse Index
- ✅ Rule-based insights + action plan (deterministic)
- ✅ AI insights (Anthropic `claude-sonnet-4-6`) with rule-based fallback — only numeric aggregates sent
- ✅ Sentiment / burnout tabs (plan-gated)
- ✅ Industry benchmarks — cohort percentiles (p25/p50/p75), k-anonymity ≥3 orgs
- ✅ Department tab — headcount only (anonymity prevents department scores, by design)

### Action tracking
- ✅ Planned / In progress / Done; `completed_at`; create from AI recommendations

### Billing & plans
- ✅ 4 tiers (Free / Starter / Growth / Enterprise), Paddle checkout + portal
- ✅ Signed webhook → tier/status sync; owner tier simulation
- ✅ Server-side feature gates (`canAccess`) + DB triggers for recurring/template limits

### Exports
- ✅ CSV export (Growth+), formula-injection–safe
- 🟡 PDF export — text/tables only via jsPDF; **does not embed charts** (would need server-side render)

### Platform & security
- ✅ Supabase Auth (email + Google + Microsoft OAuth), route protection middleware
- ✅ Row Level Security + cross-tenant isolation tests
- ✅ Security headers (CSP w/ per-request nonce, HSTS, frame, referrer, permissions, nosniff)
- ✅ CSRF (Fetch-Metadata + Origin/Host) + JSON content-type guards on authed mutating routes
- ✅ DB-backed sliding-window rate limiting (hashed IPs)
- ✅ Audit log (owner/enterprise), Sentry (no-op without DSN), owner-only cron history
- ✅ Workspace deletion (Danger Zone) + account delete
- ✅ Per-workspace preferences (link expiry, retention, cohort threshold, alerts, send time/tz)
- ✅ Public `/trust`, `/privacy`, `/terms`, `robots.txt`

### Deferred (not started — need external accounts/config)
- ⛔ Manager weekly digest email
- ⛔ SMS / WhatsApp delivery (Twilio)
- ⛔ HRIS sync (BambooHR / Rippling / Workday)
- ⛔ Full browser E2E (Playwright) — currently covered by the manual UAT plan
- ⛔ Charts embedded in PDF export
- ⛔ Per-tenant cron send-hour (daily cron honors weekday only; documented limitation)

---

## Known issues / polish backlog

Severity: 🔴 fix before ship · 🟠 should fix · 🟡 nice to have

| Sev | Item | Location | Status |
|---|---|---|---|
| 🟠 | **10 React Compiler lint errors** — `setState synchronously within an effect`, `impure function during render`, etc. Fire on the standard "effect calls a loader that setStates" pattern; `next build` does **not** run them so they're non-blocking and not runtime bugs (e.g. `analytics:92` is function hoisting). Idiomatic `useCallback` doesn't silence them — needs a dedicated refactor (or a lint-config decision), not a rushed pre-push fix. | `(app)/**/page.tsx` | deferred |
| 🟡 | Public survey page uses `<img>` instead of `next/image` (minor LCP / lint warning). | `src/app/s/[token]/page.tsx:238` | open |
| ✅ | Empty-interface lint errors | `ui/input.tsx`, `ui/textarea.tsx` | fixed |
| ✅ | Unescaped-quote lint errors | `analytics/page.tsx` | fixed |
| ✅ | AI insights route missing `requireJson`/`blockCrossSite` | `api/insights/ai` | fixed |
| ✅ | `.gitignore` missing bare `.env` / `.env*.local` rules | `.gitignore` | fixed |
| ✅ | CSV formula injection | `api/export/csv` | fixed |
| ✅ | Unsubscribe mutated state on GET | `api/unsubscribe` | fixed |
| ✅ | Non-constant-time setup-secret compare | `api/setup/owner` | fixed |
| ✅ | Mobile "More" menu didn't close on nav/outside-tap | `dashboard/sidebar.tsx` | fixed |
| ✅ | Tab bars clipped on narrow phones (last tab unreachable) | `ui/tabs.tsx` | fixed |
| ✅ | `/actions` missing from middleware auth-redirect list | `src/proxy.ts` | fixed |

_See git history / review notes for fix details._

---

## Pre-ship checklist (owner actions)

### Code / repo
- [ ] Decide on the 10 remaining React Compiler lint errors (dedicated refactor, or relax the rule in eslint config) — non-blocking for build
- [x] Add `.env` and `.env*.local` to `.gitignore`
- [ ] Decide repo visibility; if public, enable GitHub Secret Scanning + Push Protection
- [ ] Commit the pending working-tree fixes

### Infrastructure
- [ ] Apply **all** Supabase migrations in filename order (tables, RPCs, RLS)
- [ ] Claim owner via `POST /api/setup/owner` (needs `SETUP_SECRET`) or SQL snippet
- [ ] Set **all** env vars in Vercel (Supabase incl. service role, Resend, Paddle, `CRON_SECRET`; optionally `ANTHROPIC_API_KEY`, `RATE_LIMIT_SALT`, `UNSUBSCRIBE_SECRET`, `SETUP_SECRET`, Sentry)
- [ ] `NEXT_PUBLIC_APP_URL` = production domain
- [ ] Verify Vercel Cron is enabled and `CRON_SECRET` matches

### Third-party
- [ ] Verify Resend sending domain (sandbox sender is staging-only, ~100/day cap)
- [ ] Create Paddle products/prices; wire price IDs to env vars
- [ ] Configure Paddle webhook → `/api/billing/webhook` + signing secret
- [ ] Add production domain to Supabase Auth → URL Configuration (`/**`)
- [ ] (Optional) Sentry org/project/auth token for source maps

### Verification
- [ ] `npm run build`, `npm run typecheck`, `npm test` green
- [ ] Send a test survey; confirm a token link submits exactly one anonymous response
- [ ] Confirm response row has **no** employee identity
- [ ] Run the high-value sections of [USER_ACCEPTANCE_TEST_PLAN.md](USER_ACCEPTANCE_TEST_PLAN.md) on staging
- [ ] Spot-check tenant isolation with two workspaces

---

## How to update this doc
Keep the **At a glance** checks and the **Known issues** table current as you
work. When a deferred item ships, move it from ⛔ to ✅ and add any new tests.
