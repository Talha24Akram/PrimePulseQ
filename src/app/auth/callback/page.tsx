"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing sign-in...");

  useEffect(() => {
    const supabase = createClient();

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      // Handle OAuth error returned in URL
      if (errorParam) {
        setStatus(`Error: ${errorDescription ?? errorParam}`);
        setTimeout(() => router.replace("/login"), 3000);
        return;
      }

      if (code) {
        setStatus("Signing you in...");
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        if (data.session) {
          router.replace("/dashboard");
          return;
        }
        // Exchange may fail if Supabase already handled it — fall through to getSession()
      }

      // Check if session already exists
      setStatus("Signing you in...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
        return;
      }

      // Last resort: listen for auth state change
      setStatus("Signing you in...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.replace("/dashboard");
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        router.replace("/login");
      }, 10000);
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">{status}</p>
      </div>
    </div>
  );
}
