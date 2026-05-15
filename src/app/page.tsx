import Link from "next/link";
import { ArrowRight, Shield, Zap, BarChart3, CheckCircle2, MessageSquare, Users, TrendingUp, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">PulseSurvey</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6 text-sm px-4 py-1.5">
            Simple. Anonymous. Honest.
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
            Employee feedback
            <span className="text-violet-600"> without</span>
            <br />enterprise complexity
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Weekly pulse surveys that give your team a genuinely anonymous voice.
            Know what your employees actually think in 60 seconds — before they leave.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2 px-8">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="px-8">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required · Free for up to 10 employees</p>
        </div>

        {/* Hero visual */}
        <div className="mx-auto max-w-5xl mt-20">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-2 shadow-xl shadow-gray-100">
            <div className="rounded-xl bg-white overflow-hidden">
              {/* Fake dashboard screenshot */}
              <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded bg-gray-700 flex items-center px-3">
                  <span className="text-gray-400 text-xs">app.pulsesurvey.io/dashboard</span>
                </div>
              </div>
              <div className="p-8 bg-gray-50">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Engagement Score", value: "82%", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Response Rate", value: "74%", color: "text-violet-600", bg: "bg-violet-50" },
                    { label: "Active Surveys", value: "3", color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Burnout Risk", value: "Low", color: "text-emerald-600", bg: "bg-emerald-50" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Weekly Engagement Trend</h3>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">↑ +6% this month</span>
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    {[60, 65, 58, 72, 68, 75, 82].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 6 ? "#7c3aed" : "#ede9fe" }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <span key={d} className="text-xs text-gray-400 flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-sm text-gray-400 mb-8 font-medium uppercase tracking-wider">Trusted by growing teams</p>
          <div className="flex flex-wrap justify-center gap-12 items-center opacity-50">
            {["Stripe", "Linear", "Vercel", "Notion", "Figma", "Loom"].map((company) => (
              <span key={company} className="text-xl font-bold text-gray-600">{company}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Employees only tell the truth when they feel safe
          </h2>
          <p className="text-lg text-gray-500 mb-12">
            Most feedback tools are a checkbox for HR — not a real channel for honesty.
            Employees don&apos;t trust them. Managers don&apos;t act on them. Nothing changes.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "😩", title: "Bloated HR suites", desc: "Enterprise tools with 200 features you'll never use — and a $500/mo price tag." },
              { icon: "🤐", title: "Fear, not honesty", desc: "Employees don't believe 'anonymous' surveys are actually anonymous." },
              { icon: "📊", title: "Vanity dashboards", desc: "Pretty charts with no actionable insight. You still don't know why people are leaving." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-100 bg-gray-50 text-left">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-lg text-gray-500">Built for teams that want signal, not noise.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="h-5 w-5 text-violet-600" />,
                title: "Genuinely anonymous",
                desc: "Responses are never linked to employee identity. Not even admins can see who said what.",
              },
              {
                icon: <Zap className="h-5 w-5 text-violet-600" />,
                title: "60-second surveys",
                desc: "Short, focused pulse questions employees actually complete. No survey fatigue.",
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-violet-600" />,
                title: "Actionable insights",
                desc: "Engagement scores, burnout signals, and trend analysis — not just raw data.",
              },
              {
                icon: <TrendingUp className="h-5 w-5 text-violet-600" />,
                title: "Burnout detection",
                desc: "Spot burnout risk before it becomes turnover. Early warnings save teams.",
              },
              {
                icon: <Users className="h-5 w-5 text-violet-600" />,
                title: "Team segmentation",
                desc: "Understand differences across departments, roles, and tenure without exposing identities.",
              },
              {
                icon: <Shield className="h-5 w-5 text-violet-600" />,
                title: "Slack & Teams ready",
                desc: "Send surveys directly in Slack or Microsoft Teams. Meet employees where they work.",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-lg text-gray-500">No lengthy onboarding. No dedicated HR consultant needed.</p>
          </div>
          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Create your workspace",
                desc: "Sign up and add your team. Import from a CSV or invite by email — takes about 2 minutes.",
              },
              {
                step: "02",
                title: "Build your first survey",
                desc: "Choose from proven pulse templates or write your own questions. Schedule weekly, biweekly, or one-time.",
              },
              {
                step: "03",
                title: "Employees respond anonymously",
                desc: "Employees get a unique link via email or Slack. Responses are 100% anonymous — no login required.",
              },
              {
                step: "04",
                title: "Act on real insights",
                desc: "Your dashboard surfaces engagement scores, burnout risk, trending topics, and what matters most.",
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{item.step}</span>
                </div>
                <div className="pt-3">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-16">What teams are saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "We tried Culture Amp. It took 3 months to set up and we never got the data we actually needed. PulseSurvey told us what was wrong in week one.",
                name: "Sarah K.",
                role: "Head of People, 40-person startup",
              },
              {
                quote: "Our employees finally believe the surveys are anonymous. Response rates went from 35% to 78% in the first month.",
                name: "Marcus T.",
                role: "Engineering Manager, Remote team",
              },
              {
                quote: "The burnout detection feature alone saved us from losing two senior engineers. We caught it early and actually fixed the problem.",
                name: "Priya N.",
                role: "CEO, Series A SaaS company",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex mb-4">
                  {[1,2,3,4,5].map((s) => <Star key={s} className="h-4 w-4 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, honest pricing</h2>
          <p className="text-lg text-gray-500 mb-10">No per-seat gotchas. No feature gates that kill momentum.</p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { name: "Starter", price: "$19", period: "/mo", employees: "Up to 10 employees", highlight: false, cta: "Start free" },
              { name: "Growth", price: "$149", period: "/mo", employees: "Up to 100 employees", highlight: true, cta: "Get started" },
              { name: "Enterprise", price: "$999", period: "/mo", employees: "Unlimited employees", highlight: false, cta: "Contact us" },
            ].map((tier) => (
              <div key={tier.name} className={`p-6 rounded-xl border ${tier.highlight ? "border-violet-600 bg-violet-600 text-white shadow-xl shadow-violet-200" : "border-gray-200 bg-white"}`}>
                <p className={`text-sm font-medium mb-1 ${tier.highlight ? "text-violet-200" : "text-gray-500"}`}>{tier.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-bold ${tier.highlight ? "text-white" : "text-gray-900"}`}>{tier.price}</span>
                  <span className={`text-sm mb-1 ${tier.highlight ? "text-violet-200" : "text-gray-500"}`}>{tier.period}</span>
                </div>
                <p className={`text-sm mb-4 ${tier.highlight ? "text-violet-200" : "text-gray-500"}`}>{tier.employees}</p>
                <Link href={tier.cta === "Contact us" ? "/pricing" : "/signup"}>
                  <Button className={`w-full ${tier.highlight ? "bg-white text-violet-700 hover:bg-violet-50" : ""}`} variant={tier.highlight ? "outline" : "default"}>
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-block mt-6 text-sm text-violet-600 hover:underline">See full pricing →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-violet-600">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Start listening to your team today</h2>
          <p className="text-violet-200 text-lg mb-10">Join hundreds of companies that actually know what their employees think.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 gap-2 px-10">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-8 mt-10">
            {["No credit card required", "Free for 10 employees", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-violet-200 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-violet-600 flex items-center justify-center">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold text-gray-900">PulseSurvey</span>
          </div>
          <div className="flex gap-8">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">Pricing</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">Sign in</Link>
            <Link href="/signup" className="text-sm text-gray-500 hover:text-gray-900">Sign up</Link>
          </div>
          <p className="text-sm text-gray-400">© 2025 PulseSurvey. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
