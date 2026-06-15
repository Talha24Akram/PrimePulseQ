import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { escapeHtml } from "@/lib/utils";
import { resolveFromEmail } from "@/lib/email";
import { blockCrossSite } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  try {
    const { employeeEmail, employeeName, companyName, adminEmail } = await request.json();

    if (!employeeEmail) {
      return NextResponse.json({ error: "employeeEmail is required" }, { status: 400 });
    }

    // Auth check
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

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = resolveFromEmail();
    const displayName = escapeHtml(employeeName ?? employeeEmail.split("@")[0]);
    const company = escapeHtml(companyName ?? "Your employer");
    const contactEmail = escapeHtml(adminEmail ?? user.email ?? "");

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#111827;">${company}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;">
          <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">Hi ${displayName},</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">You've been added to a pulse survey programme</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
            <strong>${company}</strong> has added you to <strong>PrimePulseQ</strong>, an anonymous employee pulse survey platform.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            You will occasionally receive short survey links (usually 2–3 questions). All responses are completely <strong>anonymous</strong> — your identity is never stored or linked to your answers.
          </p>
          <div style="background:#f3f4f6;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111827;">✅ Don't recognise this?</p>
            <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
              If you don't work for ${company} or believe this was sent in error, please contact your HR team or reply to this email at
              <a href="mailto:${contactEmail}" style="color:#7c3aed;">${contactEmail}</a>.
            </p>
          </div>
          <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
            All survey responses are 100% anonymous.
          </p>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">100% anonymous. Your identity is never stored or linked to your responses.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await resend.emails.send({
      from: `${company} <${fromEmail}>`,
      to: employeeEmail,
      subject: `You've been added to ${company}'s pulse survey programme`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    console.error("employee invite error:", err);
    return NextResponse.json({ ok: false, error: "Failed to send invite email" }, { status: 500 });
  }
}
