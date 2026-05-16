"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white border-gray-200 dark:bg-gray-900 dark:border-white/5">
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-gray-200 dark:border-white/5">
        <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
          <MessageSquare className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white tracking-tight">PrimePulseQ</span>
      </div>

      <nav className="flex-1 p-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all group border",
                isActive
                  ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-600/15 dark:text-violet-300 dark:border-violet-500/20"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-800 border-transparent dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100"
              )}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-violet-600 dark:text-violet-400" : "text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300"
              )} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-violet-400/60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-white/5">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-200 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 dark:hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
