import Link from "next/link";
import { CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const tiers = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small teams and indie startups getting started.",
    employees: "Up to 100 employees",
    highlight: false,
    badge: null,
    features: [
      "Weekly pulse surveys",
      "Anonymous responses",
      "Basic engagement score",
      "Email survey distribution",
      "Mobile-friendly surveys",
      "30-day analytics history",
      "2 survey templates",
      "Email support",
    ],
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "The complete toolkit for growing remote and hybrid teams.",
    employees: "Up to 500 employees",
    highlight: true,
    badge: "Most popular",
    trial: "1 week free trial",
    features: [
      "Everything in Starter",
      "Slack & Teams integration",
      "Advanced analytics & trends",
      "Burnout risk detection",
      "Manager dashboards",
      "Sentiment analysis",
      "Custom survey scheduling",
      "CSV/PDF exports",
      "Unlimited templates",
      "12-month history",
      "Priority support",
    ],
    cta: "Start free trial",
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "$499",
    period: "/month",
    description: "Workforce intelligence for large organizations.",
    employees: "Unlimited employees",
    highlight: false,
    badge: null,
    features: [
      "Everything in Growth",
      "Unlimited employees",
      "SSO / SAML",
      "Audit logs",
      "Custom branding",
      "API access",
      "HRIS integrations",
      "Multi-company support",
      "Executive reports",
      "Dedicated onboarding",
      "Compliance tools",
      "SLA & dedicated support",
    ],
    cta: "Get started",
    href: "/signup",
  },
];

const faqs = [
  {
    q: "Is the anonymity actually guaranteed?",
    a: "Yes. Responses are never linked to employee accounts or emails. No admin can see who submitted what — not even us.",
  },
  {
    q: "What happens when my team grows past the limit?",
    a: "You can upgrade anytime. We'll prorate the charge so you only pay for what you use.",
  },
  {
    q: "Can employees take the survey without creating an account?",
    a: "Absolutely. Employees receive a unique link and respond without logging in — by design.",
  },
  {
    q: "What does the Growth free trial include?",
    a: "Your first week on Growth is completely free — full access to every feature. Your subscription starts automatically at the end of the trial unless you cancel.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no penalties. Cancel any time from your settings page.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted at rest and in transit. We use Supabase (PostgreSQL) hosted on AWS with SOC2-compliant infrastructure.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-white/8 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="PrimePulseQ" className="h-8 w-8 object-contain" />
            <span className="font-bold text-gray-900 dark:text-white text-lg">PrimePulseQ</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-12 sm:pt-20 pb-10 sm:pb-16 px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">Simple, honest pricing</h1>
        <p className="text-base sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          No per-seat traps. No surprise enterprise add-ons. Pay for what you actually use.
        </p>
      </section>

      {/* Pricing tiers */}
      <section className="pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 sm:p-8 relative ${
                tier.highlight
                  ? "border-violet-500 bg-violet-600/10 shadow-2xl shadow-violet-900/40 sm:scale-105"
                  : "border-gray-200 bg-white dark:border-white/10 dark:bg-gray-900"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-4 py-1 text-xs">Most popular</Badge>
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{tier.description}</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">{tier.price}</span>
                <span className="text-gray-400 text-sm">{tier.period}</span>
              </div>
              <p className="text-sm text-violet-600 dark:text-violet-400 font-medium mb-1">{tier.employees}</p>
              {"trial" in tier && (
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-5">
                  ✦ {(tier as typeof tier & { trial: string }).trial}
                </p>
              )}
              {!("trial" in tier) && <div className="mb-6" />}
              <Link href={tier.href}>
                <Button
                  className="w-full mb-8"
                  variant={tier.highlight ? "default" : "outline"}
                >
                  {tier.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-500 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-gray-100 dark:bg-white/3">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/8 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-violet-600 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to hear from your team?</h2>
        <p className="text-violet-200 mb-8">Try Growth free for one week. Cancel anytime.</p>
        <Link href="/signup">
          <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50">
            Start free trial <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-white/8 py-8 px-6 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">© 2026 PrimePulseQ. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
