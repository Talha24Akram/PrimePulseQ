import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { blockCrossSite } from "@/lib/csrf";

// Permanently deletes the user's workspace: all surveys, questions,
// responses, employees, audit logs, profile, and the auth user itself.
export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  try {
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

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete dependent data first (responses/questions reference surveys)
    const { data: surveys } = await admin
      .from("surveys")
      .select("id")
      .eq("workspace_id", user.id);

    const surveyIds = (surveys ?? []).map((s) => s.id);
    if (surveyIds.length > 0) {
      await admin.from("responses").delete().in("survey_id", surveyIds);
      await admin.from("questions").delete().in("survey_id", surveyIds);
    }
    await admin.from("surveys").delete().eq("workspace_id", user.id);
    await admin.from("employees").delete().eq("workspace_id", user.id);
    await admin.from("audit_logs").delete().eq("workspace_id", user.id);
    await admin.from("profiles").delete().eq("id", user.id);

    // Finally delete the auth user
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    console.error("account delete error:", err);
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
