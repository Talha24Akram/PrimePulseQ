// @vitest-environment node
import { describe, it, expect, afterEach, vi } from "vitest";
import { resolveFromEmail, RESEND_SANDBOX_FROM } from "@/lib/email";

const original = process.env.RESEND_FROM_EMAIL;

afterEach(() => {
  if (original === undefined) delete process.env.RESEND_FROM_EMAIL;
  else process.env.RESEND_FROM_EMAIL = original;
  vi.restoreAllMocks();
});

describe("resolveFromEmail", () => {
  it("returns a configured, verified-domain address as-is", () => {
    process.env.RESEND_FROM_EMAIL = "team@acme.com";
    expect(resolveFromEmail()).toBe("team@acme.com");
  });

  it("falls back to the sandbox address when unset", () => {
    delete process.env.RESEND_FROM_EMAIL;
    expect(resolveFromEmail()).toBe(RESEND_SANDBOX_FROM);
  });

  it("treats the sandbox address as the fallback", () => {
    process.env.RESEND_FROM_EMAIL = RESEND_SANDBOX_FROM;
    expect(resolveFromEmail()).toBe(RESEND_SANDBOX_FROM);
  });

  it("trims whitespace around a configured address", () => {
    process.env.RESEND_FROM_EMAIL = "  team@acme.com  ";
    expect(resolveFromEmail()).toBe("team@acme.com");
  });
});
