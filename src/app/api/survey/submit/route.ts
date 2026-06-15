import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimitOk, getClientIp } from "@/lib/rate-limit";
import { requireJson } from "@/lib/csrf";

// TODO(rate-limit): DB-backed sliding-window counter (works across serverless
// instances). For very high scale, move to Redis / Upstash with a native
// sliding-window or token-bucket algorithm.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

// Caps on untrusted public input so a single submission can't store a huge
// payload (max 200 answers; keys ≤ 64 chars; text answers ≤ 5000 chars).
const SubmitSchema = z.object({
  token: z.string().regex(/^[0-9a-f-]{36}$/i, "Invalid token"),
  answers: z
    .record(z.string().max(64), z.union([z.string().max(5000), z.number()]))
    .refine((a) => Object.keys(a).length <= 200, "Too many answers"),
});

export async function POST(request: NextRequest) {
  const ct = requireJson(request);
  if (ct) return ct;

  const ip = getClientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { token, answers } = parsed.data;

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
