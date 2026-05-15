# PulseSurvey

Employee pulse survey SaaS — simple, anonymous, actionable.

Built with Next.js 14, Supabase, Tailwind CSS, and Recharts.

## Features

- Weekly pulse surveys with anonymous responses
- Engagement score, burnout detection, trend analytics
- Survey builder with scale, multiple choice, yes/no, and text questions
- Anonymous public survey response pages (no login required for employees)
- Employee roster management
- Slack & Teams integration ready (Growth plan)
- 3-tier pricing: Starter / Growth / Enterprise

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | Radix UI primitives |
| Charts | Recharts |
| Auth + Database | Supabase (PostgreSQL + Row Level Security) |
| Email | Resend |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── pricing/              # Pricing page
│   ├── login/                # Auth pages
│   ├── signup/
│   ├── forgot-password/
│   ├── (app)/                # Protected app (sidebar layout)
│   │   ├── dashboard/        # Main dashboard
│   │   ├── surveys/          # Survey list, create, detail
│   │   ├── employees/        # Employee management
│   │   ├── analytics/        # Analytics & charts
│   │   └── settings/         # Settings
│   └── s/[token]/            # Anonymous survey response page
├── components/
│   ├── ui/                   # Base UI components
│   └── dashboard/            # Sidebar navigation
└── lib/
    ├── supabase/             # Client + server Supabase instances
    ├── types/                # TypeScript types
    └── utils.ts
supabase/
└── migrations/
    └── 001_initial_schema.sql
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/pulse-survey.git
cd pulse-survey
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and anon key from **Project Settings → API**

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
RESEND_API_KEY=re_your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add env vars in Vercel project settings
4. Deploy

In Supabase → Authentication → URL Configuration, add your Vercel domain:
- `https://your-app.vercel.app/**`

## Pricing

| Tier | Price | Employees |
|---|---|---|
| Starter | $19/mo | Up to 10 |
| Growth | $149/mo | Up to 100 |
| Enterprise | $999/mo | Unlimited |

## Roadmap

- [ ] Wire Supabase queries (replace demo data with live data)
- [ ] Email survey distribution via Resend
- [ ] Slack integration
- [ ] Stripe billing
- [ ] CSV employee import
- [ ] Scheduled survey sending (cron)
- [ ] SSO / SAML (Enterprise)
- [ ] Public API (Enterprise)
