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
  {
    key: "Content-Security-Policy",
    value: [
      // Default: only same origin
      "default-src 'self'",
      // Scripts: self + Next.js inline scripts (needed for hydration)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com",
      // Styles: self + inline (Tailwind inline styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs (avatars) + Supabase storage
      "img-src 'self' data: https://*.supabase.co",
      // XHR/fetch: self + Supabase + Paddle
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.paddle.com https://sandbox-api.paddle.com",
      // Frames: Paddle checkout iframe
      "frame-src https://cdn.paddle.com https://buy.paddle.com https://sandbox-buy.paddle.com",
      // Block all object embeds
      "object-src 'none'",
      // Only allow HTTPS base URIs
      "base-uri 'self'",
      // Forms only submit to same origin
      "form-action 'self'",
    ].join("; "),
  },
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
