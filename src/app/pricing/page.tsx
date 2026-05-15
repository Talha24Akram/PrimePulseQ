import Link from "next/link";
import { CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "Perfect for small teams and indie startups getting started.",
    employees: "Up to 10 employees",
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
    cta: "Start free",
    href: "/signup",
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "The complete toolkit for growing remote and hybrid teams.",
    employees: "Up to 100 employees",
    highlight: true,
    badge: "Most popular",
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
    cta: "Get started",
    href: "/signup",
  },
  {
    name: "Enterprise",
    price: "$999",
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
    cta: "Contact sales",
    href: "mailto:sales@pulsesurvey.io",
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
    q: "Do you offer a free trial?",
    a: "The Starter plan is free forever for up to 10 employees. No credit card required.",
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
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">PulseSurvey</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/signup"><Button size="sm">Get started free</Button></Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-20 pb-16 px-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Simple, honest pricing</h1>
        <p className="text-xl text-gray-500 max-w-xl mx-auto">
          No per-seat traps. No surprise enterprise add-ons. Pay for what you actually use.
        </p>
      </section>

      {/* Pricing tiers */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-8 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-8 relative ${
                tier.highlight
                  ? "border-violet-600 shadow-2xl shadow-violet-100 scale-105"
                  : "border-gray-200"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-4 py-1 text-xs">Most popular</Badge>
                </div>
              )}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{tier.description}</p>
              </div>
              <div className="mb-2">
                <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                <span className="text-gray-500 text-sm">{tier.period}</span>
              </div>
              <p className="text-sm text-violet-600 font-medium mb-6">{tier.employees}</p>
              <Link href={tier.href}>
                <Button
                  className={`w-full mb-8 ${tier.highlight ? "" : ""}`}
                  variant={tier.highlight ? "default" : "outline"}
                >
                  {tier.cta} {tier.highlight && <ArrowRight className="h-4 w-4" />}
                </Button>
              </Link>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-violet-600 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to hear from your team?</h2>
        <p className="text-violet-200 mb-8">Free for up to 10 employees. No credit card required.</p>
        <Link href="/signup">
          <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50">
            Start for free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center">
        <p className="text-sm text-gray-400">© 2025 PulseSurvey. All rights reserved.</p>
      </footer>
    </div>
  );
}
