"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { TIER_LABELS } from "@/lib/tiers";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/surveys", icon: FileText, label: "Surveys" },
  { href: "/employees", icon: Users, label: "Employees" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/actions", icon: CheckSquare, label: "Actions" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const mobileItems = navItems.slice(0, 4);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useProfile();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName = profile?.full_name ?? profile?.company_name ?? "";
  const initial = (displayName || profile?.email || "?").charAt(0).toUpperCase();
  const tierLabel = profile?.is_owner ? "Owner" : profile ? TIER_LABELS[profile.subscription_tier] : "";

  return (
    <>
      <div className="relative z-40 hidden h-screen w-[72px] flex-shrink-0 md:block">
        <aside className="group/sidebar absolute inset-y-0 left-0 flex w-[72px] flex-col overflow-hidden border-r border-gray-200/80 bg-white/95 shadow-[12px_0_32px_-24px_rgba(16,24,40,0.25)] backdrop-blur-xl transition-[width,box-shadow] duration-200 ease-out hover:w-56 hover:shadow-[18px_0_44px_-28px_rgba(16,24,40,0.4)] has-[:focus-visible]:w-56 dark:border-white/8 dark:bg-[#0d1018]/95 dark:shadow-[14px_0_36px_-24px_rgba(0,0,0,0.9)]">
          <Link
            href="/dashboard"
            className="flex h-[72px] items-center gap-3 border-b border-gray-200/70 px-5 dark:border-white/8"
            aria-label="PrimePulseQ dashboard"
          >
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8 flex-shrink-0 object-contain" />
            <span className="whitespace-nowrap text-sm font-semibold text-gray-950 opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-has-[:focus-visible]/sidebar:opacity-100 dark:text-white">
              PrimePulseQ
            </span>
          </Link>

          <nav className="flex-1 space-y-1.5 px-3 py-5" aria-label="Workspace navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-500/14 dark:text-violet-300"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/6 dark:hover:text-gray-100"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500")} />
                  <span className="min-w-0 flex-1 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-has-[:focus-visible]/sidebar:opacity-100">
                    {item.label}
                  </span>
                  {isActive ? (
                    <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover/sidebar:opacity-60 group-has-[:focus-visible]/sidebar:opacity-60" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-gray-200/70 p-3 dark:border-white/8">
            {profile ? (
              <Link
                href="/settings"
                title={displayName || profile.email || undefined}
                className="flex h-12 items-center gap-3 overflow-hidden rounded-xl px-2.5 hover:bg-gray-100 dark:hover:bg-white/6"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                  {initial}
                </div>
                <div className="min-w-0 flex-1 whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-has-[:focus-visible]/sidebar:opacity-100">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{displayName || profile.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{tierLabel} plan</p>
                </div>
              </Link>
            ) : null}
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex h-10 w-full items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100 group-has-[:focus-visible]/sidebar:opacity-100">
                Sign out
              </span>
            </button>
          </div>
        </aside>
      </div>

      <header className="glass fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200/80 bg-white/92 px-4 md:hidden dark:border-white/8 dark:bg-[#0d1018]/92">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          <span className="text-sm font-semibold text-gray-950 dark:text-white">PrimePulseQ</span>
        </Link>
        {profile ? (
          <Link href="/settings" aria-label="Open settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
            {initial}
          </Link>
        ) : null}
      </header>

      <nav className="glass fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-gray-200/80 bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] md:hidden dark:border-white/8 dark:bg-[#0d1018]/95" aria-label="Mobile navigation">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <details className="group/more relative min-w-0 flex-1">
          <summary className="flex cursor-pointer list-none flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium text-gray-400 marker:content-none dark:text-gray-500">
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </summary>
          <div className="absolute bottom-14 right-2 w-48 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#151923]">
            {navItems.slice(4).map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/6">
                <item.icon className="h-4 w-4 text-gray-400" />
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </details>
      </nav>
    </>
  );
}
