import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

// Public endpoint — no auth required (employees are not app users).
// The opt-out link carries an HMAC-signed token (see lib/unsubscribe-token.ts:
// base64url(workspaceId:employeeId).sig), so it can't be enumerated or spoofed.
//
// GET never mutates: it only renders a confirmation page. This matters because
// corporate email security scanners (Outlook SafeLinks, Mimecast, Barracuda)
// and link prefetchers automatically issue GETs against links in mail — a
// mutating GET would silently opt people out without them ever clicking.
//
// The actual opt-out happens on POST, which also satisfies RFC 8058 one-click
// unsubscribe (the mail client POSTs `List-Unsubscribe=One-Click`). The signed
// token is the authorization, so this route intentionally does NOT use the
// CSRF / JSON guards (one-click POSTs are cross-site and form-encoded).

function getToken(request: NextRequest): string | null {
  return new URL(request.url).searchParams.get("t");
}

export async function GET(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return htmlResponse(errorPage("Missing unsubscribe token."));
  }

  const verified = verifyUnsubscribeToken(token);
  if (!verified) {
    return htmlResponse(errorPage("Invalid unsubscribe link."));
  }

  // Valid token — show a confirmation page. No state change here.
  return htmlResponse(confirmPage(token));
}

export async function POST(request: NextRequest) {
  const token = getToken(request);

  if (!token) {
    return htmlResponse(errorPage("Missing unsubscribe token."));
  }

  const verified = verifyUnsubscribeToken(token);
  if (!verified) {
    return htmlResponse(errorPage("Invalid unsubscribe link."));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("employees")
    .update({ email_opted_out: true })
    .eq("workspace_id", verified.workspaceId)
    .eq("id", verified.employeeId);

  if (error) {
    return htmlResponse(errorPage("Something went wrong. Please contact your HR team."));
  }

  return htmlResponse(successPage());
}

function htmlResponse(body: string): NextResponse {
  return new NextResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const PAGE_STYLE = `
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; box-sizing: border-box; }
    .card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 48px 40px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); box-sizing: border-box; }
    .icon { font-size: 40px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #111827; }
    p { margin: 0 0 24px; font-size: 15px; color: #6b7280; line-height: 1.6; }
    p:last-child { margin-bottom: 0; }
    button { font: inherit; font-size: 15px; font-weight: 600; color: #fff; background: #dc2626; border: none; border-radius: 10px; padding: 12px 24px; cursor: pointer; width: 100%; max-width: 280px; }
    button:hover { background: #b91c1c; }`;

function pageShell(title: string, icon: string, heading: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — PrimePulseQ</title>
  <style>${PAGE_STYLE}</style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${heading}</h1>
    ${inner}
  </div>
</body>
</html>`;
}

// `token` is a server-generated HMAC token (base64url chars + a dot), so it is
// safe to interpolate into the form action without additional escaping.
function confirmPage(token: string): string {
  return pageShell(
    "Unsubscribe",
    "📭",
    "Unsubscribe from survey emails?",
    `<p>You will no longer receive pulse survey invitations. Your employer will be notified so they can update their records.</p>
    <form method="POST" action="/api/unsubscribe?t=${encodeURIComponent(token)}">
      <button type="submit">Confirm unsubscribe</button>
    </form>`
  );
}

function successPage(): string {
  return pageShell(
    "Unsubscribed",
    "✅",
    "You've been unsubscribed",
    `<p>You will no longer receive survey emails. Your employer will be notified so they can update their records. If this was a mistake, contact your HR team.</p>`
  );
}

function errorPage(message: string): string {
  return pageShell("Unsubscribe Error", "⚠️", "Something went wrong", `<p>${message}</p>`);
}
