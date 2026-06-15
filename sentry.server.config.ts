import * as Sentry from "@sentry/nextjs";

// Server-side Sentry init. No-op when SENTRY_DSN is unset, so local/dev and
// unconfigured deploys incur no overhead and never error.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
  });
}
