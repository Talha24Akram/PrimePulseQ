import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// TODO(rate-limit): DB-backed sliding-window counter (works across serverless
// instances). For very high scale, move to Redis / Upstash with a native
// sliding-window or token-bucket algorithm.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

// Hash the IP so raw addresses are never stored in the DB.
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + (process.env.CRON_SECRET ?? "salt"));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

// Serverless-safe sliding window: persists across Vercel function instances via
// the DB (see migration 20260615000001_sliding_window_rate_limit.sql).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkRateLimit(supabase: any, ip: string): Promise<boolean> {
  try {
    const ipHash = await hashIp(ip);
    const { data } = await supabase.rpc("check_rate_limit_sliding", {
      p_ip_hash: ipHash,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_max: RATE_LIMIT_MAX,
    });
    const count = typeof data === "number" ? data : Number(data);
    return count <= RATE_LIMIT_MAX;
  } catch {
    // If the rate-limit call fails, allow the request rather than blocking all submissions.
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

  // Atomic submit: validate token + insert response + mark used in one
  // transaction (see migration 20260615000000_atomic_submit_response.sql).
  // A SELECT ... FOR UPDATE row lock inside the function serializes concurrent
  // submissions for the same token, so a token can never be used twice.
  const { data: result, error: rpcError } = await supabase.rpc("submit_survey_response", {
    p_token: token,
    p_answers: answers,
  });

  if (rpcError) {
    console.error("submit_survey_response error:", rpcError.message);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }

  switch (result) {
    case "ok":
      return NextResponse.json({ ok: true });
    case "not_found":
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    case "already_used":
      return NextResponse.json({ error: "This survey link has already been used" }, { status: 410 });
    case "expired":
      return NextResponse.json({ error: "This survey link has expired" }, { status: 410 });
    case "closed":
      return NextResponse.json({ error: "This survey is no longer accepting responses" }, { status: 410 });
    default:
      console.error("submit_survey_response unexpected result:", result);
      return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
