import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public endpoint — no auth required (employees are not app users).
// Uses service role to validate the token server-side, keeping token logic off the client.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!token || !token.match(/^[0-9a-f-]{36}$/i)) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up token
  const { data: tokenRow, error: tokenError } = await supabase
    .from("survey_tokens")
    .select("token, survey_id, used, expires_at")
    .eq("token", token)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (tokenRow.used) {
    return NextResponse.json({ error: "already_used" }, { status: 410 });
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 410 });
  }

  // Load survey
  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select("id, title, description, status, workspace_id")
    .eq("id", tokenRow.survey_id)
    .single();

  if (surveyError || !survey) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (survey.status !== "active") {
    return NextResponse.json({ error: "closed" }, { status: 410 });
  }

  // Load questions
  const { data: questions } = await supabase
    .from("questions")
    .select("id, text, type, required, options, order_index")
    .eq("survey_id", survey.id)
    .order("order_index");

  // Load company name
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_name")
    .eq("id", survey.workspace_id)
    .single();

  return NextResponse.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    company_name: profile?.company_name ?? "Your Company",
    questions: questions ?? [],
  });
}
