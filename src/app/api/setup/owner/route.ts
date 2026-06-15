import { NextRequest, NextResponse } from "next/server";
import { blockCrossSite } from "@/lib/csrf";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// One-time owner bootstrap. Promotes the authenticated caller to workspace
// owner, but only if no owner exists yet (enforced atomically by the
// claim_owner() RPC). Replaces the manual "run this SQL" step.
//
// Fail-closed: SETUP_SECRET MUST be configured and the request MUST include a
// matching `secret`. Without this, a random first signup on a public deploy
// could claim ownership. The DB-level one-time guard in claim_owner() is the
// second layer; this secret is the first.
export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  try {
    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret) {
      console.error("SETUP_SECRET is not set — owner bootstrap route is disabled");
      return NextResponse.json(
        { error: "Owner setup is not enabled. Set SETUP_SECRET to use this route." },
        { status: 403 }
      );
    }

    let body: { secret?: string } = {};
    try {
      body = await request.json();
    } catch {
      // fall through — missing/empty body fails the secret check below
    }

    if (body.secret !== setupSecret) {
      return NextResponse.json({ error: "Invalid setup secret" }, { status: 403 });
    }

    // Auth check — caller must be a signed-in user.
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

    // Atomic, race-free promotion via the service role.
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: result, error } = await admin.rpc("claim_owner", { p_user: user.id });
    if (error) {
      console.error("claim_owner error:", error.message);
      return NextResponse.json({ error: "Setup failed" }, { status: 500 });
    }

    switch (result) {
      case "ok":
        return NextResponse.json({ ok: true, owner: true });
      case "already_owner":
        return NextResponse.json({ ok: true, owner: true, alreadyOwner: true });
      case "already_configured":
        return NextResponse.json({ error: "An owner is already configured" }, { status: 409 });
      case "no_profile":
        return NextResponse.json({ error: "No profile found for user" }, { status: 400 });
      default:
        return NextResponse.json({ error: "Setup failed" }, { status: 500 });
    }
  } catch (err) {
    console.error("setup/owner error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
