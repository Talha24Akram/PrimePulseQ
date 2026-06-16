import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { blockCrossSite } from "@/lib/csrf";

// Restore a soft-deleted survey (within the 30-day window before purge).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;

  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS (surveys_update) restricts this to the caller's own workspace; the
    // soft-deleted row is updatable because the UPDATE policy doesn't filter on
    // deleted_at. Returns the row only if it was actually restored.
    const { data, error } = await supabase
      .from("surveys")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("workspace_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      Sentry.captureException(error);
      return NextResponse.json({ error: "Restore failed" }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

    await supabase.rpc("write_audit_log", {
      p_org_id: user.id, p_actor_id: user.id, p_action: "survey.restored",
      p_resource_type: "survey", p_resource_id: id, p_meta: {},
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
