import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Build a nonce-based Content Security Policy.
//
// Production: scripts must carry a per-request nonce (Next applies it to its own
// framework scripts when it sees `x-nonce`), and 'strict-dynamic' lets those
// trusted scripts load the app chunks — so we avoid 'unsafe-inline'/'unsafe-eval'
// for scripts, which would otherwise neuter the CSP against XSS.
// Development: keep 'unsafe-eval'/'unsafe-inline' because the dev server and
// React Fast Refresh rely on them.
function buildCsp(nonce: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval'`;

  return [
    "default-src 'self'",
    scriptSrc,
    // Inline styles only (cannot execute JS); Tailwind/Next inject <style> tags.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.paddle.com https://sandbox-api.paddle.com",
    "frame-src https://cdn.paddle.com https://buy.paddle.com https://sandbox-buy.paddle.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  // Pass the nonce to the renderer via request headers so Next nonces its scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const applyCsp = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  // Public anonymous survey pages: apply CSP but skip the auth round-trip.
  if (request.nextUrl.pathname.startsWith("/s/")) {
    return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isCallbackRoute = request.nextUrl.pathname.startsWith("/auth/");

  // Don't interfere with the OAuth callback — session is established client-side
  if (isCallbackRoute) {
    return applyCsp(supabaseResponse);
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password");

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/surveys") ||
    request.nextUrl.pathname.startsWith("/employees") ||
    request.nextUrl.pathname.startsWith("/analytics") ||
    request.nextUrl.pathname.startsWith("/actions") ||
    request.nextUrl.pathname.startsWith("/settings");

  if (!user && isDashboardRoute) {
    return applyCsp(NextResponse.redirect(new URL("/login", request.url)));
  }

  // Redirect logged-in users away from auth pages and the landing page
  if (user && isAuthRoute) {
    return applyCsp(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (user && request.nextUrl.pathname === "/") {
    return applyCsp(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  return applyCsp(supabaseResponse);
}

export const config = {
  matcher: [
    // All routes except Next assets and API (which return their own responses).
    // Public /s/ survey pages ARE included so they get the CSP.
    "/((?!_next/static|_next/image|favicon.ico|logo.png|api/).*)",
  ],
};
