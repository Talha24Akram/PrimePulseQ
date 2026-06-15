import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimitOk, getClientIp } from "@/lib/rate-limit";

// TODO(rate-limit): DB-backed sliding-window counter (works across serverless
// instances). For very high scale, move to Redis / Upstash with a native
// sliding-window or token-bucket algorithm.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

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
  if (!(await rateLimitOk(supabase, ip, { max: RATE_LIMIT_MAX, windowSeconds: RATE_LIMIT_WINDOW_SECONDS }))) {
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
