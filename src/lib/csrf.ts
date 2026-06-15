import { NextResponse } from "next/server";

// Lightweight CSRF defense for authenticated, cookie-backed mutating routes.
//
// Returns a 403 response if the request looks cross-site, otherwise null.
// Uses the Fetch Metadata `Sec-Fetch-Site` header (sent by all modern browsers)
// plus an Origin/Host cross-check. Non-browser clients (curl, server-to-server,
// tests) omit these headers and are allowed through — so this never applies to
// the Paddle webhook or Vercel cron routes (which are not browser-driven and do
// not use the auth cookie anyway). Do NOT add this to those routes.
export function blockCrossSite(req: Request): NextResponse | null {
  const site = req.headers.get("sec-fetch-site");
  if (site && site === "cross-site") {
    return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      // Prefer the Host header; fall back to the request URL's host.
      const host = req.headers.get("host") ?? new URL(req.url).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
      }
    } catch {
      // Unparseable Origin — reject to be safe.
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  return null;
}

// Reject requests that don't declare a JSON body. Returns a 415 response or null.
// Do NOT use on routes that read raw bodies (e.g. the Paddle webhook).
export function requireJson(req: Request): NextResponse | null {
  const ct = req.headers.get("content-type");
  if (!ct || !ct.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  return null;
}
