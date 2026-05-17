"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

interface PublicNavProps {
  /** Hide auth buttons (e.g. on login/signup pages themselves) */
  hideAuth?: boolean;
}

export function PublicNav({ hideAuth = false }: PublicNavProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo / Home */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="PrimePulseQ" className="h-8 w-8 object-contain" />
          <span className="font-bold text-gray-900 dark:text-white text-base">PrimePulseQ</span>
        </Link>

        {/* Centre links */}
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link href="/#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/privacy" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Privacy
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!hideAuth && (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
