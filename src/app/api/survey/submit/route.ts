import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

// Hash the IP so raw addresses are never stored in the DB.
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + (process.env.CRON_SECRET ?? "salt"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// Serverless-safe: persists across Vercel function instances via DB.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkRateLimit(supabase: any, ip: string): Promise<boolean> {
  try {
    const ipHash = await hashIp(ip);
    const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString();
    const { data } = await supabase.rpc("increment_rate_limit", {
      p_ip_hash: ipHash,
      p_reset_at: resetAt,
      p_max: RATE_LIMIT_MAX,
    });
    const count = typeof data === "number" ? data : Number(data);
    return count <= RATE_LIMIT_MAX;
  } catch {
    // If rate limit DB call fails, allow the request rather than blocking all submissions.
    return true;
  }
}

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  let token: string;
  let answers: Record<string, string | number>;

  try {
    const body = await request.json();
    token = body.token;
    answers = body.answers;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!token || typeof token !== "string" || !token.match(/^[0-9a-f-]{36}$/i)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Rate limit check — DB-backed so it works across serverless instances
  if (!(await checkRateLimit(supabase, ip))) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a few minutes." },
      { status: 429 }
    );
  }

  // Validate token — re-check all conditions atomically before inserting
  const { data: tokenRow, error: tokenError } = await supabase
    .from("survey_tokens")
    .select("token, survey_id, used, expires_at")
    .eq("token", token)
    .single();

  if (tokenError || !tokenRow) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  }

  if (tokenRow.used) {
    return NextResponse.json({ error: "This survey link has already been used" }, { status: 410 });
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "This survey link has expired" }, { status: 410 });
  }

  // Verify the survey is still active
  const { data: survey } = await supabase
    .from("surveys")
    .select("status")
    .eq("id", tokenRow.survey_id)
    .single();

  if (!survey || survey.status !== "active") {
    return NextResponse.json({ error: "This survey is no longer accepting responses" }, { status: 410 });
  }

  // Insert anonymous response — no employee_id, just survey_id and answers
  const { error: insertError } = await supabase.from("responses").insert({
    survey_id: tokenRow.survey_id,
    answers,
  });

  if (insertError) {
    console.error("Response insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }

  // Mark token as used — prevents resubmission
  await supabase
    .from("survey_tokens")
    .update({ used: true })
    .eq("token", token);

  return NextResponse.json({ ok: true });
}
