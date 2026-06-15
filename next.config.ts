import type { NextConfig } from "next";

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
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // NOTE: Content-Security-Policy is set per-request in src/middleware.ts so it
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

export default nextConfig;
