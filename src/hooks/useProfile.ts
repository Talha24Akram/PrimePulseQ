"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tier } from "@/lib/tiers";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  company_slug: string | null;
  company_website: string | null;
  avatar_url: string | null;
  is_owner: boolean;
  subscription_tier: Tier;
  subscription_status: string;
  trial_ends_at: string | null;
  paddle_customer_id: string | null;
  slack_webhook_url: string | null;
  teams_webhook_url: string | null;
  industry: string | null;
  headcount_band: string | null;
  created_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (isMounted) { setLoading(false); } return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (isMounted) {
        if (error) setError(error.message);
        else setProfile(data as Profile);
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  async function updateProfile(updates: Partial<Profile>) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }
    return { error: error?.message ?? null };
  }

  return { profile, loading, error, updateProfile, setProfile };
}
