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
        setStatus("Exchanging code for session...");
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(`Auth error: ${error.message}`);
          setTimeout(() => router.replace("/login"), 3000);
          return;
        }
        if (data.session) {
          setStatus("Session established! Redirecting...");
          router.replace("/dashboard");
          return;
        }
      }

      // No code in URL — check if session already exists (e.g. implicit flow)
      setStatus("Checking existing session...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("Session found! Redirecting...");
        router.replace("/dashboard");
        return;
      }

      // Last resort: listen for auth state change
      setStatus("Waiting for authentication...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          router.replace("/dashboard");
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        setStatus("Timed out. No session found.");
        setTimeout(() => router.replace("/login"), 2000);
      }, 10000);
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="h-10 w-10 rounded-full border-4 border-violet-600 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">{status}</p>
      </div>
    </div>
  );
}
