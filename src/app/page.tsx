import Link from "next/link";
import { ArrowRight, Shield, Zap, BarChart3, CheckCircle2, Users, TrendingUp, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/8 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PrimePulseQ" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white text-lg">PrimePulseQ</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">How it works</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-14 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-5 text-sm px-4 py-1.5">
            Simple. Anonymous. Honest.
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight mb-5">
            Employee feedback
            <span className="text-violet-500 dark:text-violet-400"> without</span>
            <br />enterprise complexity
          </h1>
          <p className="text-base sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Weekly pulse surveys that give your team a genuinely anonymous voice.
            Know what your employees actually think in 60 seconds — before they leave.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 px-8 w-full sm:w-auto">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="px-8 w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">1 week free trial on Growth · Cancel anytime</p>
        </div>

        {/* Hero visual */}
        <div className="mx-auto max-w-5xl mt-12 sm:mt-20 overflow-hidden">
          <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-200/50 dark:bg-gray-900/50 p-1.5 sm:p-2 shadow-2xl shadow-gray-300/60 dark:shadow-black/40">
            <div className="rounded-xl bg-gray-900 overflow-hidden">
              <div className="bg-gray-950 px-3 sm:px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500/60" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-2 sm:mx-4 h-5 sm:h-6 rounded bg-gray-800 flex items-center px-2 sm:px-3">
                  <span className="text-gray-500 text-xs truncate">app.primepulseq.com/dashboard</span>
                </div>
              </div>
              <div className="p-4 sm:p-8 bg-gray-900">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  {[
                    { label: "Engagement", value: "82%", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "Response Rate", value: "74%", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                    { label: "Surveys", value: "3", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "Burnout Risk", value: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                  ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl p-3 sm:p-4 border ${stat.bg}`}>
                      <p className="text-xs text-gray-500 mb-1 truncate">{stat.label}</p>
                      <p className={`text-xl sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 sm:p-5 border border-white/8">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                    <h3 className="font-semibold text-gray-100 text-sm sm:text-base">Weekly Engagement Trend</h3>
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full whitespace-nowrap">↑ +6%</span>
                  </div>
                  <div className="flex items-end gap-1 sm:gap-2 h-16 sm:h-24">
                    {[60, 65, 58, 72, 68, 75, 82].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i === 6 ? "#7c3aed" : "rgba(124,58,237,0.25)" }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <span key={d} className="text-xs text-gray-500 flex-1 text-center">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Employees only tell the truth when they feel safe
          </h2>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-10 sm:mb-12">
            Most feedback tools are a checkbox for HR — not a real channel for honesty.
            Employees don&apos;t trust them. Managers don&apos;t act on them. Nothing changes.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { title: "Bloated HR suites", desc: "Enterprise tools with 200 features you'll never use — and a price tag to match." },
              { title: "Fear, not honesty", desc: "Employees don't trust that 'anonymous' surveys are actually anonymous. So they say nothing." },
              { title: "Vanity dashboards", desc: "Pretty charts with no actionable signal. You still don't know why people are leaving." },
            ].map((item, i) => (
              <div key={item.title} className="p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/5 text-left">
                <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
                  <span className="text-xs font-bold text-red-500 dark:text-red-400">{i + 1}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-100 dark:bg-white/3">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">Built for teams that want signal, not noise.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
            {[
              { icon: <Lock className="h-5 w-5 text-violet-500 dark:text-violet-400" />, title: "Genuinely anonymous", desc: "Responses are never linked to employee identity. Not even admins can see who said what." },
              { icon: <Zap className="h-5 w-5 text-violet-500 dark:text-violet-400" />, title: "60-second surveys", desc: "Short, focused pulse questions employees actually complete. No survey fatigue." },
              { icon: <BarChart3 className="h-5 w-5 text-violet-500 dark:text-violet-400" />, title: "Actionable insights", desc: "Engagement scores, burnout signals, and trend analysis — not just raw data." },
              { icon: <TrendingUp className="h-5 w-5 text-violet-500 dark:text-violet-400" />, title: "Burnout detection", desc: "Spot burnout risk before it becomes turnover. Early warnings save teams." },
              { icon: <Users className="h-5 w-5 text-violet-500 dark:text-violet-400" />, title: "Team segmentation", desc: "Understand differences across departments, roles, and tenure without exposing identities." },
              { icon: <Shield className="h-5 w-5 text-violet-500 dark:text-violet-400" />, title: "Slack & Teams ready", desc: "Send surveys directly in Slack or Microsoft Teams. Meet employees where they work." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-white/8">
                <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Up and running in minutes</h2>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">No lengthy onboarding. No dedicated HR consultant needed.</p>
          </div>
          <div className="space-y-8 sm:space-y-12">
            {[
              { step: "01", title: "Create your workspace", desc: "Sign up and add your team. Import from a CSV or invite by email — takes about 2 minutes." },
              { step: "02", title: "Build your first survey", desc: "Choose from proven pulse templates or write your own questions. Schedule weekly, biweekly, or one-time." },
              { step: "03", title: "Employees respond anonymously", desc: "Employees get a unique link via email or Slack. Responses are 100% anonymous — no login required." },
              { step: "04", title: "Act on real insights", desc: "Your dashboard surfaces engagement scores, burnout risk, trending topics, and what matters most." },
            ].map((item) => (
              <div key={item.step} className="flex gap-5 sm:gap-8 items-start">
                <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 dark:shadow-violet-900/40">
                  <span className="text-white font-bold text-sm">{item.step}</span>
                </div>
                <div className="pt-1 sm:pt-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-100 dark:bg-white/3">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">Simple, honest pricing</h2>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 sm:mb-10">No per-seat gotchas. No feature gates that kill momentum.</p>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 text-left">
            {[
              { name: "Starter", price: "$49", period: "/mo", employees: "Up to 100 employees", highlight: false, cta: "Get started" },
              { name: "Growth", price: "$149", period: "/mo", employees: "Up to 500 employees", highlight: true, cta: "Start free trial", trial: true },
              { name: "Enterprise", price: "$499", period: "/mo", employees: "Unlimited employees", highlight: false, cta: "Get started" },
            ].map((tier) => (
              <div key={tier.name} className={`p-5 sm:p-6 rounded-xl border ${tier.highlight ? "border-violet-500 bg-violet-600 shadow-[0_0_40px_rgba(124,58,237,0.5)] sm:shadow-[0_0_60px_rgba(124,58,237,0.5)]" : "border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900"}`}>
                <p className={`text-sm font-medium mb-1 ${tier.highlight ? "text-violet-200" : "text-gray-500 dark:text-gray-400"}`}>{tier.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-3xl sm:text-4xl font-bold ${tier.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>{tier.price}</span>
                  <span className={`text-sm mb-1 ${tier.highlight ? "text-violet-200" : "text-gray-400"}`}>{tier.period}</span>
                </div>
                <p className={`text-sm mb-1 ${tier.highlight ? "text-violet-200" : "text-gray-500 dark:text-gray-400"}`}>{tier.employees}</p>
                {"trial" in tier && <p className="text-xs font-semibold text-emerald-400 mb-4">✦ 1 week free trial</p>}
                {!("trial" in tier) && <div className="mb-5" />}
                <Link href="/signup">
                  <Button className={`w-full ${tier.highlight ? "bg-violet-900 text-white hover:bg-violet-950 border-violet-800" : ""}`} variant={tier.highlight ? "outline" : "default"}>
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-block mt-6 text-sm text-violet-600 dark:text-violet-400 hover:underline">See full pricing →</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-violet-600">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">Start listening to your team today</h2>
          <p className="text-violet-200 text-base sm:text-lg mb-8 sm:mb-10">Try Growth free for one week. Cancel anytime.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 gap-2 px-10">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-8 sm:mt-10">
            {["1 week free on Growth", "Up to 500 employees", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-violet-200 text-sm">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/8 py-10 px-4 sm:px-6 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="PrimePulseQ" className="h-6 w-6 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white">PrimePulseQ</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 sm:gap-8">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Pricing</Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Terms</Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Sign in</Link>
            <Link href="/signup" className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Sign up</Link>
          </div>
          <p className="text-sm text-gray-400">© 2026 PrimePulseQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
