// Server-only email helpers.

export const RESEND_SANDBOX_FROM = "onboarding@resend.dev";

let warnedSandbox = false;

/**
 * Resolve the "from" address for outbound email. Falls back to Resend's sandbox
 * sender, but warns once (in production) because the sandbox is capped at
 * ~100 emails/day and can't be used for real delivery.
 */
export function resolveFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();

  if (!configured || configured === RESEND_SANDBOX_FROM) {
    if (!warnedSandbox && process.env.NODE_ENV === "production") {
      warnedSandbox = true;
      console.warn(
        `[email] RESEND_FROM_EMAIL is unset or set to the Resend sandbox address ` +
          `(${RESEND_SANDBOX_FROM}). Delivery is capped at ~100/day and will not ` +
          `work for production sending. Set RESEND_FROM_EMAIL to a verified domain.`
      );
    }
    return RESEND_SANDBOX_FROM;
  }

  return configured;
}
