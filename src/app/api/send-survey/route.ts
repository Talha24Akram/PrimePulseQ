import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
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

    // Fetch selected employees
    const { data: employees } = await supabase
      .from("employees")
      .select("id, name, email")
      .in("id", employeeIds)
      .eq("workspace_id", user.id)
      .eq("is_active", true);

    if (!employees?.length) {
      return NextResponse.json({ error: "No valid employees found" }, { status: 400 });
    }

    // Fetch sender profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, company_name")
      .eq("id", user.id)
      .single();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/s/${surveyId}`;
    const fromName = profile?.company_name ?? profile?.full_name ?? "Your Team";
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

    // Send emails (batch up to 50 at a time — Resend free limit)
    const results = await Promise.allSettled(
      employees.map((emp) =>
        resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: emp.email,
          subject: `Quick pulse survey: ${survey.title}`,
          html: buildEmailHtml({
            employeeName: emp.name ?? emp.email.split("@")[0],
            surveyTitle: survey.title,
            surveyDescription: survey.description ?? "",
            surveyUrl,
            companyName: fromName,
          }),
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed, total: employees.length });
  } catch (err) {
    console.error("send-survey error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#111827;">${companyName}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:15px;color:#6b7280;">Hi ${employeeName},</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">
                ${surveyTitle}
              </h1>

              ${surveyDescription ? `<p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">${surveyDescription}</p>` : ""}

              <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
                We'd love to hear how you're doing. This short pulse survey takes <strong>less than 2 minutes</strong> and your responses are completely <strong>anonymous</strong> — your name is never attached to your answers.
              </p>

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${surveyUrl}"
                      style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:10px;">
                      Take the survey →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                Or copy this link: <a href="${surveyUrl}" style="color:#7c3aed;">${surveyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This survey is 100% anonymous. Your identity is never stored or linked to your responses.
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
