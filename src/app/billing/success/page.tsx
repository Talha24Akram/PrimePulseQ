"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { TIER_LABELS } from "@/lib/tiers";
import type { Tier } from "@/lib/tiers";

export default function BillingSuccessPage() {
  const [tier, setTier] = useState<Tier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Poll profile a couple of times to pick up the webhook update
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { clearInterval(interval); setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      const t = data?.subscription_tier as Tier | undefined;
      if ((t && t !== "free") || attempts >= 6) {
        setTier(t ?? null);
        setLoading(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {loading ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-violet-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirming your subscription…</h1>
            <p className="text-gray-500 text-sm">This takes a moment. Please don&apos;t close this page.</p>
          </>
        ) : (
          <>
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You&apos;re all set! 🎉
            </h1>
            {tier && tier !== "free" ? (
              <p className="text-gray-500 mb-2">
                Welcome to the <strong className="text-gray-800 dark:text-gray-100">{TIER_LABELS[tier]}</strong> plan. All features are now unlocked.
              </p>
            ) : (
              <p className="text-gray-500 mb-2">
                Your subscription is being processed. Your plan will update within a minute.
              </p>
            )}
            <p className="text-xs text-gray-400 mb-8">
              A receipt has been sent to your email by Paddle.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 w-full sm:w-auto px-10">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <div className="mt-4">
              <Link href="/settings?tab=billing" className="text-sm text-violet-500 hover:underline">
                View billing details →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
