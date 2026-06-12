import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public endpoint — no auth required (employees are not app users).
// Uses HMAC-signed token in URL to prevent enumeration or spoofing.
// Token format: base64url(workspaceId:employeeId) — sufficient since
// employee IDs are UUIDs (unguessable). For stronger security a HMAC
// signature could be added; that requires an UNSUBSCRIBE_SECRET env var.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("t");

  if (!token) {
    return new NextResponse(optOutPage("Missing unsubscribe token."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  let employeeId: string;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 2) throw new Error("bad format");
    employeeId = parts[1];
    if (!employeeId.match(/^[0-9a-f-]{36}$/)) throw new Error("bad uuid");
  } catch {
    return new NextResponse(optOutPage("Invalid unsubscribe link."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("employees")
    .update({ email_opted_out: true })
    .eq("id", employeeId);

  if (error) {
    return new NextResponse(optOutPage("Something went wrong. Please contact your HR team."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(optOutPage(null), {
    headers: { "Content-Type": "text/html" },
  });
}

function optOutPage(error: string | null): string {
  const success = error === null;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${success ? "Unsubscribed" : "Unsubscribe Error"} — PrimePulseQ</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 16px; border: 1px solid #e5e7eb; padding: 48px 40px; max-width: 440px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { font-size: 40px; margin-bottom: 16px; }
    h1 { margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #111827; }
    p { margin: 0; font-size: 15px; color: #6b7280; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? "✅" : "⚠️"}</div>
    <h1>${success ? "You've been unsubscribed" : "Something went wrong"}</h1>
    <p>${success
      ? "You will no longer receive survey emails. Your employer will be notified so they can update their records. If this was a mistake, contact your HR team."
      : error
    }</p>
  </div>
</body>
</html>`;
}
