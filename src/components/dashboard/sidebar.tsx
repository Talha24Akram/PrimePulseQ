"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
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
  { href: "/settings", icon: Settings, label: "Settings" },
];

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
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-white border-gray-200 dark:bg-gray-900/60 dark:border-white/5 flex-shrink-0">
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-2.5 px-6 border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
        >
          <img src="/logo.png" alt="PrimePulseQ" className="h-8 w-8 object-contain" />
          <span className="font-bold text-gray-900 dark:text-white tracking-tight">PrimePulseQ</span>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-gradient-to-r from-violet-50 to-violet-100/50 text-violet-700 shadow-sm dark:from-violet-600/20 dark:to-violet-600/5 dark:text-violet-300"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-gradient-to-b from-violet-500 to-violet-700" />
                )}
                <item.icon className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
                )} />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User block + sign out */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-2">
          {profile && (
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-violet-600/25 flex-shrink-0">
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{displayName || profile.email}</p>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">{tierLabel} plan</p>
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-200 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 dark:bg-gray-900/90 glass border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="PrimePulseQ" className="h-7 w-7 object-contain" />
          <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">PrimePulseQ</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/20 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      {/* Mobile bottom nav — 5 items only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 glass border-t border-gray-200 dark:border-white/5 flex items-center justify-around px-1 h-16 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all flex-1 min-w-0",
                isActive
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-gray-400 dark:text-gray-500"
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gradient-to-r from-violet-500 to-violet-700" />
              )}
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
