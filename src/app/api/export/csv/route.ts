import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { canAccess } from "@/lib/tiers";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Server-side tier check — prevents UI-bypass of the TierGate component
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, is_owner")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";
  const isOwner = profile?.is_owner ?? false;

  if (!canAccess("csv_export", tier, isOwner)) {
    return NextResponse.json({ error: "CSV export requires Growth or Enterprise plan" }, { status: 403 });
  }

  // Fetch all surveys for this workspace
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, title")
    .eq("workspace_id", user.id);

  const surveyIds = (surveys ?? []).map((s) => s.id);
  if (surveyIds.length === 0) {
    return new NextResponse("response_id,survey_id,survey_title,submitted_at\n", {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="responses-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const [responsesRes, questionsRes] = await Promise.all([
    supabase.from("responses").select("id, survey_id, answers, submitted_at").in("survey_id", surveyIds),
    supabase.from("questions").select("id, survey_id, text, type").in("survey_id", surveyIds).order("order_index"),
  ]);

  const responses = responsesRes.data ?? [];
  const questions = questionsRes.data ?? [];
  const surveyMap = Object.fromEntries((surveys ?? []).map((s) => [s.id, s.title]));

  // Build CSV rows
  const headers = ["response_id", "survey_id", "survey_title", "submitted_at", ...questions.map((q) => q.text)];
  const rows = responses.map((r) => [
    r.id,
    r.survey_id,
    surveyMap[r.survey_id] ?? "",
    r.submitted_at,
    ...questions.map((q) => String(r.answers?.[q.id] ?? "")),
  ]);

  const csvEscape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="responses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
