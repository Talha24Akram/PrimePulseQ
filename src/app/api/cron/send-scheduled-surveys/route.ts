import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { notifyWebhooks } from "@/lib/webhooks";

// This route is called by Vercel Cron daily.
// It finds all active surveys whose frequency matches today's schedule
// and sends email reminders to all active employees.

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel Cron call
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://primepulseq.vercel.app";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const dayOfMonth = today.getDate();

  // Determine which frequencies should fire today
  // weekly: every Monday (1)
  // biweekly: every other Monday — use ISO week number parity
  // monthly: 1st of the month
  const weekNumber = Math.ceil(dayOfMonth / 7);
  const isMonday = dayOfWeek === 1;
  const isFirstOfMonth = dayOfMonth === 1;
  const isEvenWeek = weekNumber % 2 === 0;

  const activeFrequencies: string[] = [];
  if (isMonday) activeFrequencies.push("weekly");
  if (isMonday && isEvenWeek) activeFrequencies.push("biweekly");
  if (isFirstOfMonth) activeFrequencies.push("monthly");

  if (activeFrequencies.length === 0) {
    return NextResponse.json({ message: "No surveys scheduled for today", sent: 0 });
  }

  // Fetch all active surveys matching today's frequencies
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, title, description, workspace_id, frequency")
    .eq("status", "active")
    .in("frequency", activeFrequencies);

  if (!surveys?.length) {
    return NextResponse.json({ message: "No matching active surveys", sent: 0 });
  }

  let totalSent = 0;

  for (const survey of surveys) {
    // Fetch workspace profile (including webhook URLs)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, slack_webhook_url, teams_webhook_url")
      .eq("id", survey.workspace_id)
      .single();

    // Fetch active employees for this workspace
    const { data: employees } = await supabase
      .from("employees")
      .select("id, name, email")
      .eq("workspace_id", survey.workspace_id)
      .eq("is_active", true);

    if (!employees?.length) continue;

    const companyName = profile?.company_name ?? profile?.full_name ?? "Your Team";
    const surveyUrl = `${appUrl}/s/${survey.id}`;

    const results = await Promise.allSettled(
      employees.map((emp) =>
        resend.emails.send({
          from: `${companyName} <${fromEmail}>`,
          to: emp.email,
          subject: `[Pulse] ${survey.title}`,
          html: buildEmailHtml({
            employeeName: emp.name ?? emp.email.split("@")[0],
            surveyTitle: survey.title,
            surveyDescription: survey.description ?? "",
            surveyUrl,
            companyName,
          }),
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    totalSent += sent;

    // Post to Slack / Teams
    await notifyWebhooks(
      (profile as { slack_webhook_url?: string })?.slack_webhook_url,
      (profile as { teams_webhook_url?: string })?.teams_webhook_url,
      {
        title: `📋 Pulse survey: ${survey.title}`,
        text: `Your ${survey.frequency} pulse survey is now live. ${sent} team member${sent !== 1 ? "s" : ""} have been invited.`,
        surveyUrl: `${appUrl}/s/${survey.id}`,
        companyName,
      }
    );

    // Log in audit_logs
    await supabase.from("audit_logs").insert({
      workspace_id: survey.workspace_id,
      actor_email: "cron@system",
      action: "survey.emails_sent",
      resource_type: "survey",
      resource_id: survey.id,
      metadata: { sent, scheduled: true, frequency: survey.frequency },
    });
  }

  return NextResponse.json({ message: "Done", sent: totalSent, surveys: surveys.length });
}

function buildEmailHtml({
  employeeName,
  surveyTitle,
  surveyDescription,
  surveyUrl,
  companyName,
}: {
  employeeName: string;
  surveyTitle: string;
  surveyDescription: string;
  surveyUrl: string;
  companyName: string;
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#111827;">${companyName}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;">
          <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">Hi ${employeeName},</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${surveyTitle}</h1>
          ${surveyDescription ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;">${surveyDescription}</p>` : ""}
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
            Your recurring pulse check is ready. It takes <strong>less than 2 minutes</strong> and is completely <strong>anonymous</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:28px;">
              <a href="${surveyUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                Take the survey →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
            Or copy: <a href="${surveyUrl}" style="color:#7c3aed;">${surveyUrl}</a>
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
}
