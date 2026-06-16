import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { blockCrossSite, requireJson } from "@/lib/csrf";

const VALID_LOCALES = ["en", "ar", "fr", "de", "es", "pt"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RowSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  email: z.string().max(320).optional().nullable(),
  department: z.string().max(120).optional().nullable(),
  role: z.string().max(120).optional().nullable(),
  locale: z.string().max(8).optional().nullable(),
});
const BodySchema = z.object({ rows: z.array(RowSchema).max(5000) });

type RowResult = { row: number; email: string; status: "imported" | "skipped" | "error"; reason?: string };

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  const ct = requireJson(request);
  if (ct) return ct;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Invalid rows" }, { status: 400 });

    // Existing emails for this workspace (lower-cased) to detect duplicates.
    const { data: existing } = await supabase.from("employees").select("email").eq("workspace_id", user.id);
    const existingEmails = new Set((existing ?? []).map((e) => String(e.email).toLowerCase()));
    const seenInFile = new Set<string>();

    const results: RowResult[] = [];
    for (let i = 0; i < parsed.data.rows.length; i++) {
      const r = parsed.data.rows[i];
      const rowNum = i + 1;
      const email = (r.email ?? "").trim().toLowerCase();

      if (!email) { results.push({ row: rowNum, email: "", status: "error", reason: "Missing email" }); continue; }
      if (!EMAIL_RE.test(email)) { results.push({ row: rowNum, email, status: "error", reason: "Invalid email format" }); continue; }
      if (seenInFile.has(email)) { results.push({ row: rowNum, email, status: "skipped", reason: "Duplicate in file" }); continue; }
      if (existingEmails.has(email)) { results.push({ row: rowNum, email, status: "skipped", reason: "Already exists" }); continue; }
      seenInFile.add(email);

      const locale = VALID_LOCALES.includes((r.locale ?? "").toLowerCase()) ? r.locale!.toLowerCase() : "en";
      const { error } = await supabase.from("employees").insert({
        workspace_id: user.id,
        email,
        name: r.name?.trim() || null,
        department: r.department?.trim() || null,
        role: r.role?.trim() || null,
        locale,
      });

      if (error) {
        // Surface plan-limit / other DB errors per-row, then stop adding more.
        results.push({ row: rowNum, email, status: "error", reason: error.message });
        // If it's a plan limit, the rest will also fail — mark them and stop.
        if (/plan limit/i.test(error.message)) {
          for (let j = i + 1; j < parsed.data.rows.length; j++) {
            results.push({ row: j + 1, email: (parsed.data.rows[j].email ?? "").trim().toLowerCase(), status: "skipped", reason: "Plan limit reached" });
          }
          break;
        }
        continue;
      }
      existingEmails.add(email);
      results.push({ row: rowNum, email, status: "imported" });
    }

    const summary = {
      imported: results.filter((r) => r.status === "imported").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      errored: results.filter((r) => r.status === "error").length,
    };
    return NextResponse.json({ results, summary });
  } catch (err) {
    Sentry.captureException(err);
    console.error("employee import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
