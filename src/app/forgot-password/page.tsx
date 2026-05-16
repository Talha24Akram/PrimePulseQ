"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
          <p className="text-gray-500 mb-6">
            We sent a password reset link to <strong className="text-gray-900 dark:text-gray-200">{email}</strong>.
          </p>
          <Link href="/login">
            <Button variant="outline">Back to sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-xl">PrimePulseQ</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
          <p className="text-gray-500 mt-1 text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-2xl dark:shadow-black/40 p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-violet-600 dark:text-violet-400 hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
