import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { notifyWebhooks } from "@/lib/webhooks";
import { escapeHtml } from "@/lib/utils";
import { resolveFromEmail } from "@/lib/email";
import { getStrings, normalizeLocale, isRtl } from "@/lib/locales";
import { clampExpiryDays, expiryFromNow, DEFAULT_SURVEY_EXPIRY_DAYS } from "@/lib/preferences";
import { shouldSendNow, resolveSendPrefs } from "@/lib/cron-schedule";

// This route is called by Vercel Cron hourly.
// It finds active recurring surveys whose per-tenant schedule fires this hour
// and sends email reminders, with a retry pass for previously-failed emails.

interface RetryToken {
  token: string;
  survey_id: string;
  employee_id: string;
  surveys: { title: string; description: string | null; status: string; workspace_id: string } | null;
  employees: { email: string; name: string | null; locale: string | null } | null;
}

export async function GET(request: NextRequest) {
  // Guard: CRON_SECRET must be configured — an undefined secret means any
  // caller sending "Bearer undefined" would pass the check below.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET env var is not set — cron endpoint disabled");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://primepulseq.vercel.app";
  const fromEmail = resolveFromEmail();

  const now = new Date();

  // ── Observability: record this run, update it in finally ─────
  const { data: runRow } = await supabase
    .from("cron_runs")
    .insert({ started_at: now.toISOString() })
    .select("id")
    .single();
  const runId = runRow?.id as string | undefined;

  let totalSent = 0;
  let surveysSentCount = 0;
  let emailsAttempted = 0;
  let emailsFailed = 0;
  let purged = 0;
  let responsesPurged = 0;
  const errors: { stage: string; message: string }[] = [];

  try {
  // Cron runs hourly. Fetch all active recurring surveys; gate each on its
  // workspace's per-tenant send day/hour/timezone below.
  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, title, description, workspace_id, frequency")
    .eq("status", "active")
    .in("frequency", ["weekly", "biweekly", "monthly"]);

  for (const survey of surveys ?? []) {
    // Fetch workspace profile (webhook URLs + send-schedule prefs)
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name, slack_webhook_url, teams_webhook_url, survey_expiry_days, send_day_of_week, send_hour, timezone")
      .eq("id", survey.workspace_id)
      .single();

    // Per-tenant timing gate: only send at the workspace's configured local
    // day + hour for this frequency.
    if (!shouldSendNow(survey.frequency, resolveSendPrefs(profile ?? {}), now)) {
      continue;
    }

    // Fetch active employees — exclude those who have opted out of emails
    const { data: employees } = await supabase
      .from("employees")
      .select("id, name, email, locale")
      .eq("workspace_id", survey.workspace_id)
      .eq("is_active", true)
      .eq("email_opted_out", false);

    if (!employees?.length) continue;

    const companyName = profile?.company_name ?? profile?.full_name ?? "Your Team";

    // Generate per-employee survey tokens (per-workspace expiry preference)
    const expiresAt = expiryFromNow(
      clampExpiryDays((profile as { survey_expiry_days?: number })?.survey_expiry_days ?? DEFAULT_SURVEY_EXPIRY_DAYS)
    );
    const tokenRows = employees.map((emp) => ({
      token: crypto.randomUUID(),
      survey_id: survey.id,
      employee_id: emp.id,
      used: false,
      expires_at: expiresAt,
    }));

    await supabase
      .from("survey_tokens")
      .upsert(tokenRows, { onConflict: "survey_id,employee_id", ignoreDuplicates: false });

    const { data: savedTokens } = await supabase
      .from("survey_tokens")
      .select("token, employee_id")
      .eq("survey_id", survey.id)
      .in("employee_id", employees.map((e) => e.id));

    const tokenByEmployee = new Map(savedTokens?.map((r) => [r.employee_id, r.token]) ?? []);

    const results = await Promise.allSettled(
      employees.map((emp) => {
        const surveyToken = tokenByEmployee.get(emp.id);
        const surveyUrl = surveyToken ? `${appUrl}/s/${surveyToken}` : `${appUrl}/s/${survey.id}`;
        const unsubToken = Buffer.from(`${survey.workspace_id}:${emp.id}`).toString("base64url");
        const unsubscribeUrl = `${appUrl}/api/unsubscribe?t=${unsubToken}`;
        const locale = normalizeLocale((emp as { locale?: string }).locale);
        const s = getStrings(locale);
        const name = emp.name ?? emp.email.split("@")[0];
        return resend.emails.send({
          from: `${companyName} <${fromEmail}>`,
          to: emp.email,
          subject: s.emailSubject(survey.title),
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
          html: buildEmailHtml({
            greeting: s.emailGreeting(name),
            intro: s.emailIntro,
            cta: s.takeSurvey,
            dir: isRtl(locale) ? "rtl" : "ltr",
            surveyTitle: survey.title,
            surveyDescription: survey.description ?? "",
            surveyUrl,
            companyName,
            unsubscribeUrl,
          }),
        });
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    totalSent += sent;
    emailsAttempted += results.length;
    emailsFailed += failed;
    if (sent > 0) surveysSentCount += 1;

    // Record per-token delivery status for the retry pass below.
    const okTokens: string[] = [];
    for (let i = 0; i < employees.length; i++) {
      const tok = tokenByEmployee.get(employees[i].id);
      if (!tok) continue;
      const r = results[i];
      if (r.status === "fulfilled") okTokens.push(tok);
      else await supabase.from("survey_tokens").update({ email_status: "failed", email_error: String(r.reason).slice(0, 500) }).eq("token", tok);
    }
    if (okTokens.length) await supabase.from("survey_tokens").update({ email_status: "sent", email_error: null }).in("token", okTokens);

    // Post to Slack / Teams — link to the admin survey view, not a personal token
    await notifyWebhooks(
      (profile as { slack_webhook_url?: string })?.slack_webhook_url,
      (profile as { teams_webhook_url?: string })?.teams_webhook_url,
      {
        title: `📋 Pulse survey: ${survey.title}`,
        text: `Your ${survey.frequency} pulse survey is now live. ${sent} team member${sent !== 1 ? "s" : ""} have been invited.`,
        surveyUrl: `${appUrl}/surveys/${survey.id}`,
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

  // ── Retry pass: one more attempt at any previously-failed emails ─────
  // (still live, unused). Max one retry per cron run.
  const { data: failedTokens } = await supabase
    .from("survey_tokens")
    .select("token, survey_id, employee_id, surveys(title, description, status, workspace_id), employees(email, name, locale)")
    .eq("email_status", "failed")
    .eq("used", false)
    .gt("expires_at", now.toISOString())
    .limit(200);

  // supabase types to-one embeds as arrays; at runtime they are single objects.
  const companyCache = new Map<string, string>();
  for (const ft of (failedTokens ?? []) as unknown as RetryToken[]) {
    const survey = ft.surveys;
    const emp = ft.employees;
    if (!survey || !emp || survey.status !== "active") continue;

    let company = companyCache.get(survey.workspace_id);
    if (!company) {
      const { data: p } = await supabase.from("profiles").select("company_name, full_name").eq("id", survey.workspace_id).single();
      company = (p?.company_name ?? p?.full_name ?? "Your Team") as string;
      companyCache.set(survey.workspace_id, company);
    }
    const company2: string = company;

    const locale = normalizeLocale(emp.locale);
    const s = getStrings(locale);
    const name = emp.name ?? emp.email.split("@")[0];
    const surveyUrl = `${appUrl}/s/${ft.token}`;
    const unsubToken = Buffer.from(`${survey.workspace_id}:${ft.employee_id}`).toString("base64url");
    const unsubscribeUrl = `${appUrl}/api/unsubscribe?t=${unsubToken}`;

    emailsAttempted += 1;
    try {
      await resend.emails.send({
        from: `${company2} <${fromEmail}>`,
        to: emp.email,
        subject: s.emailSubject(survey.title),
        headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
        html: buildEmailHtml({
          greeting: s.emailGreeting(name), intro: s.emailIntro, cta: s.takeSurvey,
          dir: isRtl(locale) ? "rtl" : "ltr",
          surveyTitle: survey.title, surveyDescription: survey.description ?? "",
          surveyUrl, companyName: company2, unsubscribeUrl,
        }),
      });
      await supabase.from("survey_tokens").update({ email_status: "sent", email_error: null }).eq("token", ft.token);
    } catch (err) {
      emailsFailed += 1;
      await supabase.from("survey_tokens").update({ email_error: String(err).slice(0, 500) }).eq("token", ft.token);
    }
  }

  // ── Close completed one-time surveys + notify the owner ──────
  // A one-time survey is "done" once all its tokens are used or expired.
  const { data: oneTimeActive } = await supabase
    .from("surveys")
    .select("id, title, workspace_id")
    .eq("status", "active")
    .eq("frequency", "one-time");

  for (const sv of oneTimeActive ?? []) {
    const { count: totalTokens } = await supabase
      .from("survey_tokens").select("token", { count: "exact", head: true }).eq("survey_id", sv.id);
    if (!totalTokens) continue; // never sent
    const { count: liveTokens } = await supabase
      .from("survey_tokens").select("token", { count: "exact", head: true })
      .eq("survey_id", sv.id).eq("used", false).gt("expires_at", now.toISOString());
    if ((liveTokens ?? 0) > 0) continue; // still collecting

    await supabase.from("surveys").update({ status: "closed", closed_at: now.toISOString() }).eq("id", sv.id);

    const { count: respCount } = await supabase
      .from("responses").select("id", { count: "exact", head: true }).eq("survey_id", sv.id);
    const responseRate = totalTokens ? Math.round(((respCount ?? 0) / totalTokens) * 100) : 0;

    const { data: prof } = await supabase
      .from("profiles").select("email, company_name, full_name, response_rate_alert_pct")
      .eq("id", sv.workspace_id).single();
    const alertPct = (prof as { response_rate_alert_pct?: number } | null)?.response_rate_alert_pct ?? 50;
    const lowFlag = responseRate < alertPct;

    await supabase.rpc("write_audit_log", {
      p_org_id: sv.workspace_id, p_actor_id: null, p_action: "survey.closed",
      p_resource_type: "survey", p_resource_id: sv.id, p_meta: { responseRate, responses: respCount ?? 0, invited: totalTokens },
    });

    if (prof?.email) {
      const title = escapeHtml(sv.title);
      const analytics = `${appUrl}/surveys/${sv.id}`;
      try {
        await resend.emails.send({
          from: `PrimePulseQ <${fromEmail}>`,
          to: prof.email,
          subject: `Survey closed: ${sv.title}`,
          html: `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f9fafb;padding:32px 16px;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table style="max-width:480px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:32px;">
<tr><td>
<h1 style="margin:0 0 12px;font-size:20px;color:#111827;">${title} has closed</h1>
<p style="margin:0 0 16px;font-size:15px;color:#374151;">Response rate: <strong>${responseRate}%</strong> (${respCount ?? 0} of ${totalTokens} invited).</p>
${lowFlag ? `<p style="margin:0 0 16px;font-size:14px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;">⚠️ Below your ${alertPct}% alert threshold.</p>` : ""}
<a href="${analytics.replace(/"/g, "%22")}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px;">View analytics →</a>
</td></tr></table></td></tr></table></body></html>`,
        });
      } catch (err) {
        Sentry.captureException(err);
        errors.push({ stage: "close_notify", message: String(err) });
      }
    }
  }

  // Housekeeping: purge used/expired survey tokens so the table stays small.
  try {
    const { data } = await supabase.rpc("purge_expired_tokens");
    purged = typeof data === "number" ? data : Number(data ?? 0);
  } catch (err) {
    Sentry.captureException(err);
    console.error("purge_expired_tokens failed:", err);
    errors.push({ stage: "purge_expired_tokens", message: String(err) });
  }

  // Enforce per-workspace data retention (no-op for "keep forever" workspaces).
  try {
    const { data } = await supabase.rpc("purge_old_responses");
    responsesPurged = typeof data === "number" ? data : Number(data ?? 0);
  } catch (err) {
    Sentry.captureException(err);
    console.error("purge_old_responses failed:", err);
    errors.push({ stage: "purge_old_responses", message: String(err) });
  }
  } catch (err) {
    Sentry.captureException(err);
    console.error("cron run failed:", err);
    errors.push({ stage: "run", message: String(err) });
  } finally {
    // Always record the run outcome.
    if (runId) {
      await supabase
        .from("cron_runs")
        .update({
          completed_at: new Date().toISOString(),
          surveys_sent: surveysSentCount,
          emails_attempted: emailsAttempted,
          emails_failed: emailsFailed,
          errors: errors.length ? errors : null,
        })
        .eq("id", runId);
    }

    // Alert the instance owner via Slack on any failure.
    if (errors.length > 0 || emailsFailed > 0) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("slack_webhook_url")
        .eq("is_owner", true)
        .not("slack_webhook_url", "is", null)
        .limit(1)
        .maybeSingle();
      const ownerSlack = (owner as { slack_webhook_url?: string } | null)?.slack_webhook_url;
      if (ownerSlack) {
        await notifyWebhooks(ownerSlack, undefined, {
          title: "⚠️ PrimePulseQ cron run had failures",
          text: `surveys_sent=${surveysSentCount}, emails_attempted=${emailsAttempted}, emails_failed=${emailsFailed}, errors=${errors.length}`,
          surveyUrl: `${appUrl}/settings`,
          companyName: "PrimePulseQ",
        }).catch((e) => { Sentry.captureException(e); });
      }
    }
  }

  return NextResponse.json({
    message: "Done",
    sent: totalSent,
    surveysSent: surveysSentCount,
    emailsAttempted,
    emailsFailed,
    purged,
    responsesPurged,
  });
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
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body dir="${dir}" style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="padding-bottom:24px;text-align:center;">
          <span style="font-size:20px;font-weight:700;color:#111827;">${eCompany}</span>
        </td></tr>
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;">
          <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">${eGreeting}</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">${eTitle}</h1>
          ${eDesc ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;">${eDesc}</p>` : ""}
          <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
            ${eIntro}
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:28px;">
              <a href="${eUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                ${eCta}
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
            Or copy: <a href="${eUrl}" style="color:#7c3aed;">${eUrl}</a>
          </p>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">100% anonymous. <a href="${eTrust}" style="color:#7c3aed;text-decoration:underline;">How your privacy is protected →</a></p>
          <p style="margin:0;font-size:11px;color:#d1d5db;">Don't want to receive survey emails? <a href="${eUnsub}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
