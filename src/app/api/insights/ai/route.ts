import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { generateAIInsights } from "@/lib/ai-insights";

// Validates the aggregate (anonymous) metrics the client computed from its own
// RLS-scoped data. The route does not read any tenant data itself — it only
// forwards numbers to the model — but still requires an authenticated session.
const InsightInputSchema = z.object({
  currentScore: z.number().min(0).max(100),
  previousScore: z.number().min(0).max(100),
  avgResponseRate: z.number().min(0).max(100),
  burnoutPct: z.number().min(0).max(100),
  pulseIndex: z.number().min(-100).max(100),
  totalResponses: z.number().int().min(0),
  totalEmployees: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  // Auth check — must be a signed-in workspace user.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = InsightInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid metrics" }, { status: 400 });
  }

  // Never throws — falls back to rule-based insights on any model error.
  const insight = await generateAIInsights(parsed.data);
  return NextResponse.json(insight);
}
