import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { blockCrossSite } from "@/lib/csrf";

// Allowlist of trusted webhook hostnames — prevents SSRF to internal/cloud-metadata services.
const ALLOWED_WEBHOOK_HOSTS = [
  "hooks.slack.com",
  "outlook.office.com",
  "outlook.office365.com",
  "hooks.office.com",
];

function isAllowedWebhookUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_WEBHOOK_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, type } = await request.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  if (!isAllowedWebhookUrl(url)) {
    return NextResponse.json(
      { error: "Invalid webhook URL. Must be a Slack (hooks.slack.com) or Teams (outlook.office.com) URL over HTTPS." },
      { status: 400 }
    );
  }

  try {
    let body: object;

    if (type === "slack") {
      body = {
        text: "✅ *PrimePulseQ connected!* Your Slack integration is working.",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "✅ *PrimePulseQ connected!*\nYour Slack integration is working. Survey links and summaries will be posted here.",
            },
          },
        ],
      };
    } else {
      // Teams adaptive card
      body = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              type: "AdaptiveCard",
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              version: "1.4",
              body: [
                {
                  type: "TextBlock",
                  text: "✅ PrimePulseQ connected!",
                  weight: "Bolder",
                  size: "Medium",
                },
                {
                  type: "TextBlock",
                  text: "Your Microsoft Teams integration is working. Survey links and summaries will be posted here.",
                  wrap: true,
                },
              ],
            },
          },
        ],
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Webhook returned ${res.status}: ${text}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Failed to reach webhook URL" }, { status: 400 });
  }
}
