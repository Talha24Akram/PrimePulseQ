import { afterEach, describe, expect, it } from "vitest";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

const workspaceId = "11111111-1111-4111-8111-111111111111";
const employeeId = "22222222-2222-4222-8222-222222222222";

describe("unsubscribe tokens", () => {
  afterEach(() => {
    delete process.env.UNSUBSCRIBE_SECRET;
    delete process.env.CRON_SECRET;
  });

  it("creates and verifies an HMAC-signed token", () => {
    process.env.UNSUBSCRIBE_SECRET = "test-secret";

    const token = createUnsubscribeToken(workspaceId, employeeId);

    expect(verifyUnsubscribeToken(token)).toEqual({ workspaceId, employeeId });
  });

  it("rejects tampered, unsigned, and wrong-secret tokens", () => {
    process.env.UNSUBSCRIBE_SECRET = "test-secret";
    const token = createUnsubscribeToken(workspaceId, employeeId);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");

    expect(verifyUnsubscribeToken(tampered)).toBeNull();
    expect(verifyUnsubscribeToken(Buffer.from(`${workspaceId}:${employeeId}`).toString("base64url"))).toBeNull();

    process.env.UNSUBSCRIBE_SECRET = "different-secret";
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it("falls back to CRON_SECRET when UNSUBSCRIBE_SECRET is not configured", () => {
    process.env.CRON_SECRET = "cron-secret";

    const token = createUnsubscribeToken(workspaceId, employeeId);

    expect(verifyUnsubscribeToken(token)).toEqual({ workspaceId, employeeId });
  });
});
