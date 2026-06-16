import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { unstable_cache } from "next/cache";
import { rateLimitOk, getClientIp } from "@/lib/rate-limit";
import { blockCrossSite, requireJson } from "@/lib/csrf";

const BodySchema = z.object({ currentScore: z.number().min(0).max(100) });

interface BenchmarkRow { p25: number | null; p50: number | null; p75: number | null; cohort_size: number }

// Cohort-level percentile read, cached 1h keyed by (industry, band) only.
function readCohortBenchmark(
  admin: { rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown }> },
  industry: string,
  band: string
): Promise<BenchmarkRow | null> {
  return unstable_cache(
    async () => {
      const { data } = await admin.rpc("get_benchmark", { p_industry: industry, p_band: band });
      const r = Array.isArray(data) ? data[0] : data;
      return (r ?? null) as BenchmarkRow | null;
    },
    ["benchmark", industry, band],
    { revalidate: 3600, tags: ["benchmark"] }
  )();
}

function mondayOf(d: Date): string {
  const x = new Date(d);
  const day = x.getUTCDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  const ct = requireJson(request);
  if (ct) return ct;

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

  // Rate limit — this route runs on every analytics load and does a write.
  if (!(await rateLimitOk(admin, getClientIp(request), { max: 20, windowSeconds: 60 }))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // "3 completed survey cycles" = at least 3 of this workspace's surveys have
  // received responses (single distinct-count query).
  const { data: cycles } = await admin.rpc("count_completed_cycles", { p_workspace: user.id });
  const completedCycles = typeof cycles === "number" ? cycles : Number(cycles ?? 0);
  const eligible = completedCycles >= 3;

  // Contribute this week's snapshot only when eligible AND there's real data
  // (currentScore 0 is the "no responses yet" sentinel — never store it).
  if (eligible && parsed.data.currentScore > 0) {
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
  // Cached per cohort (industry + size band) for 1h — percentiles only change
  // weekly, and the key intentionally excludes the workspace id (cohort-level).
  const row = await readCohortBenchmark(admin, profile.industry, profile.headcount_band);

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
