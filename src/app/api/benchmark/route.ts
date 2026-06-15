import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";

const BodySchema = z.object({ currentScore: z.number().min(0).max(100) });

function mondayOf(d: Date): string {
  const x = new Date(d);
  const day = x.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid score" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("industry, headcount_band")
    .eq("id", user.id)
    .single();

  if (!profile?.industry || !profile?.headcount_band) {
    return NextResponse.json({ configured: false });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // "3 completed survey cycles" = at least 3 of this workspace's surveys have
  // received responses. Only then does the org contribute to the pool.
  const { data: surveyRows } = await admin
    .from("surveys")
    .select("id")
    .eq("workspace_id", user.id);
  const surveyIds = (surveyRows ?? []).map((s) => s.id);
  let completedCycles = 0;
  if (surveyIds.length) {
    const { data: respSurveys } = await admin
      .from("responses")
      .select("survey_id")
      .in("survey_id", surveyIds);
    completedCycles = new Set((respSurveys ?? []).map((r) => r.survey_id)).size;
  }
  const eligible = completedCycles >= 3;

  // Contribute this week's snapshot if eligible.
  if (eligible) {
    await admin.from("benchmark_snapshots").upsert(
      {
        workspace_id: user.id,
        week_start: mondayOf(new Date()),
        industry: profile.industry,
        headcount_band: profile.headcount_band,
        avg_score: parsed.data.currentScore,
      },
      { onConflict: "workspace_id,week_start" }
    );
  }

  // Read cohort percentiles (gated at >= 3 distinct orgs inside the function).
  const { data: bench } = await admin.rpc("get_benchmark", {
    p_industry: profile.industry,
    p_band: profile.headcount_band,
  });
  const row = Array.isArray(bench) ? bench[0] : bench;

  return NextResponse.json({
    configured: true,
    eligible,
    completedCycles,
    industry: profile.industry,
    headcountBand: profile.headcount_band,
    cohortSize: row?.cohort_size ?? 0,
    p25: row?.p25 ?? null,
    p50: row?.p50 ?? null,
    p75: row?.p75 ?? null,
  });
}
