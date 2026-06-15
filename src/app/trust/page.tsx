"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Lock, EyeOff, Users, BarChart3, Mail, Copy, Check } from "lucide-react";
import { PublicNav } from "@/components/public-nav";

const BADGE_SNIPPET = `<a href="https://primepulseq.vercel.app/trust" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;background:#f4f1ff;color:#6b21d6;font:600 13px -apple-system,Segoe UI,sans-serif;text-decoration:none;border:1px solid #d9cfff;">
  🔒 Surveys are 100% anonymous — how your privacy is protected
</a>`;

function Section({ icon: Icon, title, children }: { icon: typeof Lock; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-gray-200 dark:border-white/8 py-8 last:border-0">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed space-y-3 sm:pl-12">
        {children}
      </div>
    </section>
  );
}

export default function TrustPage() {
  const [copied, setCopied] = useState(false);

  function copyBadge() {
    navigator.clipboard.writeText(BADGE_SNIPPET).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNav />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="text-center mb-10">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-600/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Your privacy, protected
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            How we make sure your survey answers can never be traced back to you — explained in plain English.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-white dark:bg-gray-900 px-6 sm:px-8">
          <Section icon={Lock} title="How your answers stay anonymous">
            <p>
              When your HR team sends a survey, you get your own private, single-use link. That link
              proves the survey is for you — but here&apos;s the important part: <strong>your answers are
              saved completely separately from your link.</strong>
            </p>
            <p>
              We store your response with only the <em>survey</em> it belongs to and your answers. We do
              <strong> not</strong> store who you are, your name, your email, or anything that connects the
              two. Once you submit, your link is marked &ldquo;used&rdquo; and can&apos;t be opened again —
              and there is no record linking that link to the answers you gave.
            </p>
          </Section>

          <Section icon={EyeOff} title="What we store (and what we don't)">
            <p>We keep:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The survey questions and your answers to them</li>
              <li>The date the response was submitted</li>
            </ul>
            <p>We never store, alongside your answers:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name or email address</li>
              <li>Which employee submitted which response</li>
              <li>Your IP address or device with your response</li>
            </ul>
            <p>
              By design, the database table that holds responses has no column for an employee — so even
              someone with full access to the data could not map an answer back to a person.
            </p>
          </Section>

          <Section icon={Users} title="Who can see the results">
            <p>
              Your managers and HR team see <strong>aggregated</strong> results only — overall scores,
              trends, and themes across the whole group. They cannot see individual responses, and they
              cannot filter results down to a single person.
            </p>
          </Section>

          <Section icon={BarChart3} title="The 5-response rule">
            <p>
              To protect small teams, results are <strong>hidden until at least 5 people have responded.</strong>
              If only one or two people answer, showing the results could make it obvious who said what — so
              we withhold them entirely until there are enough responses for the group to stay anonymous.
            </p>
          </Section>

          <Section icon={Mail} title="Why you got an email or message">
            <p>
              Survey invitations are sent by your own employer through this platform. You can opt out of
              future survey emails at any time using the unsubscribe link at the bottom of any invitation —
              and opting out never affects the anonymity of responses you&apos;ve already given.
            </p>
          </Section>
        </div>

        {/* Embeddable badge for HR wikis */}
        <div className="mt-10 rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/5 p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">For HR teams: embed this badge</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Paste this into your intranet or wiki to reassure employees and link them here.
          </p>
          <div className="mb-3">
            <a
              href="/trust"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[13px] font-semibold border border-violet-200 no-underline"
            >
              🔒 Surveys are 100% anonymous — how your privacy is protected
            </a>
          </div>
          <div className="relative">
            <pre className="text-[11px] leading-relaxed bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg p-3 overflow-x-auto text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-all">{BADGE_SNIPPET}</pre>
            <button
              onClick={copyBadge}
              className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
            >
              {copied ? <><Check className="h-3 w-3" />Copied</> : <><Copy className="h-3 w-3" />Copy</>}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/privacy" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
            Read the full Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
