import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Tier } from "@/lib/tiers";
import { blockCrossSite } from "@/lib/csrf";

const VALID_TIERS: Tier[] = ["free", "starter", "growth", "enterprise"];

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  try {
    const { tier } = await request.json();

    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify is_owner — only owners can use this endpoint
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_owner")
      .eq("id", user.id)
      .single();

    if (!profile?.is_owner) {
      return NextResponse.json({ error: "Forbidden — owner only" }, { status: 403 });
    }

    // Use service role to update tier directly
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin
      .from("profiles")
      .update({ subscription_tier: tier, subscription_status: "active" })
      .eq("id", user.id);

    return NextResponse.json({ ok: true, tier });
  } catch (err) {
    Sentry.captureException(err);
    console.error("set-tier error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
