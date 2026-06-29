import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { notifyWebhooks } from "@/lib/webhooks";
import { escapeHtml } from "@/lib/utils";
import { resolveFromEmail } from "@/lib/email";
import { getStrings, normalizeLocale, isRtl } from "@/lib/locales";
import { blockCrossSite, requireJson } from "@/lib/csrf";
import { clampExpiryDays, expiryFromNow, DEFAULT_SURVEY_EXPIRY_DAYS } from "@/lib/preferences";
import { createUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  const ct = requireJson(request);
  if (ct) return ct;
  try {
    const { surveyId, employeeIds } = await request.json();

    if (!surveyId || !employeeIds?.length) {
      return NextResponse.json({ error: "surveyId and employeeIds are required" }, { status: 400 });
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

    // Fetch survey and verify ownership
    const { data: survey } = await supabase
      .from("surveys")
      .select("id, title, description, workspace_id")
      .eq("id", surveyId)
      .eq("workspace_id", user.id)
      .single();

    if (!survey) return NextResponse.json({ error: "Survey not found" }, { status: 404 });

    // Fetch selected employees — exclude those who have opted out of survey emails
    const { data: employees } = await supabase
      .from("employees")
      .select("id, name, email, locale")
      .in("id", employeeIds)
      .eq("workspace_id", user.id)
      .eq("is_active", true)
      .eq("email_opted_out", false);

    if (!employees?.length) {
      return NextResponse.json({ error: "No valid employees found" }, { status: 400 });
    }

    // Fetch sender profile (including webhook URLs + preferences)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, slack_webhook_url, teams_webhook_url, survey_expiry_days")
      .eq("id", user.id)
      .single();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const fromName = profile?.company_name ?? profile?.full_name ?? "Your Team";
    const fromEmail = resolveFromEmail();

    // Service role client for inserting survey tokens (bypasses RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate per-employee tokens (upsert so resending creates a fresh token)
    const expiresAt = expiryFromNow(
      clampExpiryDays((profile as { survey_expiry_days?: number })?.survey_expiry_days ?? DEFAULT_SURVEY_EXPIRY_DAYS)
    );
    const tokenRows = employees.map((emp) => ({
      token: crypto.randomUUID(),
      survey_id: surveyId,
      employee_id: emp.id,
      used: false,
      expires_at: expiresAt,
    }));

    await serviceClient
      .from("survey_tokens")
      .upsert(tokenRows, { onConflict: "survey_id,employee_id", ignoreDuplicates: false });

    // Re-fetch tokens to get the authoritative UUIDs (upsert may have updated existing rows)
    const { data: savedTokens } = await serviceClient
      .from("survey_tokens")
      .select("token, employee_id")
      .eq("survey_id", surveyId)
      .in("employee_id", employees.map((e) => e.id));

    const tokenByEmployee = new Map(savedTokens?.map((r) => [r.employee_id, r.token]) ?? []);

    // Send emails (batch up to 50 at a time — Resend free limit)
    const results = await Promise.allSettled(
      employees.map((emp) => {
        const surveyToken = tokenByEmployee.get(emp.id);
        const surveyUrl = surveyToken ? `${appUrl}/s/${surveyToken}` : `${appUrl}/s/${surveyId}`;
        const unsubToken = createUnsubscribeToken(user.id, emp.id);
        const unsubscribeUrl = `${appUrl}/api/unsubscribe?t=${unsubToken}`;
        const locale = normalizeLocale((emp as { locale?: string }).locale);
        const s = getStrings(locale);
        const name = emp.name ?? emp.email.split("@")[0];
        return resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: emp.email,
          subject: s.emailSubject(survey.title),
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          html: buildEmailHtml({
            greeting: s.emailGreeting(name),
            intro: s.emailIntro,
            cta: s.takeSurvey,
            anonymityNote: s.identityNote,
            dir: isRtl(locale) ? "rtl" : "ltr",
            surveyTitle: survey.title,
            surveyDescription: survey.description ?? "",
            surveyUrl,
            companyName: fromName,
            unsubscribeUrl,
          }),
        });
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Record per-token delivery status so failures can be retried by the cron.
    const sentTokens: string[] = [];
    for (let i = 0; i < employees.length; i++) {
      const tok = tokenByEmployee.get(employees[i].id);
      if (!tok) continue;
      const r = results[i];
      if (r.status === "fulfilled") {
        sentTokens.push(tok);
      } else {
        await serviceClient
          .from("survey_tokens")
          .update({ email_status: "failed", email_error: String(r.reason).slice(0, 500) })
          .eq("token", tok);
      }
    }
    if (sentTokens.length) {
      await serviceClient.from("survey_tokens").update({ email_status: "sent", email_error: null }).in("token", sentTokens);
    }

    // Post to Slack / Teams if configured
    const webhookSurveyUrl = `${appUrl}/surveys/${surveyId}`;
    await notifyWebhooks(
      (profile as { slack_webhook_url?: string })?.slack_webhook_url,
      (profile as { teams_webhook_url?: string })?.teams_webhook_url,
      {
        title: `📋 Survey sent: ${survey.title}`,
        text: `${sent} employee${sent !== 1 ? "s" : ""} have been invited to complete the survey.`,
        surveyUrl: webhookSurveyUrl,
        companyName: fromName,
      }
    );

    return NextResponse.json({ sent, failed, total: employees.length });
  } catch (err) {
    Sentry.captureException(err);
    console.error("send-survey error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildEmailHtml({
  greeting,
  intro,
  cta,
  dir,
  surveyTitle,
  surveyDescription,
  surveyUrl,
  companyName,
  unsubscribeUrl,
}: {
  greeting: string;
  intro: string;
  cta: string;
  anonymityNote: string;
  dir: "ltr" | "rtl";
  surveyTitle: string;
  surveyDescription: string;
  surveyUrl: string;
  companyName: string;
  unsubscribeUrl: string;
}) {
  const eGreeting = escapeHtml(greeting);
  const eIntro = escapeHtml(intro);
  const eCta = escapeHtml(cta);
  const eTitle = escapeHtml(surveyTitle);
  const eDesc = surveyDescription ? escapeHtml(surveyDescription) : "";
  const eCompany = escapeHtml(companyName);
  const eUrl = surveyUrl.replace(/"/g, "%22");
  const eUnsub = unsubscribeUrl.replace(/"/g, "%22");
  const eTrust = (unsubscribeUrl.split("/api/unsubscribe")[0] + "/trust").replace(/"/g, "%22");

  return `<!DOCTYPE html>
<html dir="${dir}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body dir="${dir}" style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#111827;">${eCompany}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">${eGreeting}</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                ${eTitle}
              </h1>

              ${eDesc ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">${eDesc}</p>` : ""}

              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                ${eIntro}
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${eUrl}"
                      style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      ${eCta}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Or copy this link: <a href="${eUrl}" style="color:#7c3aed;">${eUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
                This survey is 100% anonymous. <a href="${eTrust}" style="color:#7c3aed;text-decoration:underline;">How your privacy is protected →</a>
              </p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">
                Don't want to receive survey emails? <a href="${eUnsub}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
