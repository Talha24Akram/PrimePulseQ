"use client";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccess, UPGRADE_MESSAGE } from "@/lib/tiers";
import type { Feature, Tier } from "@/lib/tiers";
import Link from "next/link";

interface TierGateProps {
  feature: Feature;
  tier: Tier;
  isOwner: boolean;
  children: React.ReactNode;
  /** If true, renders children but visually disabled. If false (default), hides children entirely. */
  overlay?: boolean;
}

export function TierGate({ feature, tier, isOwner, children, overlay = false }: TierGateProps) {
  const allowed = canAccess(feature, tier, isOwner);
  if (allowed) return <>{children}</>;

  const message = UPGRADE_MESSAGE[feature];

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-40 blur-[2px]">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-xl text-center max-w-xs">
            <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Feature locked</p>
            <p className="text-xs text-gray-500 mb-4">{message}</p>
            <Link href="/settings?tab=billing">
              <Button size="sm" className="w-full">Upgrade plan</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/3">
      <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center flex-shrink-0">
        <Lock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <Link href="/settings?tab=billing">
        <Button size="sm" variant="outline">Upgrade</Button>
      </Link>
    </div>
  );
}
