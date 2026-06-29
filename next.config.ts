import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevents MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Blocks framing by other origins (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Enforce HTTPS for 1 year, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Restrict referrer to same-origin so employee emails don't leak to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Limit browser feature access
  // Lock down browser features; allow payment for Paddle's checkout iframe.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // NOTE: Content-Security-Policy is set per-request in src/proxy.ts so it
  // can carry a nonce (avoids 'unsafe-inline'/'unsafe-eval' for scripts).
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

// Wrap with Sentry. Without SENTRY_AUTH_TOKEN/org/project, source-map upload is
// skipped — the build still succeeds; only runtime error capture is active when
// a DSN is configured.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
