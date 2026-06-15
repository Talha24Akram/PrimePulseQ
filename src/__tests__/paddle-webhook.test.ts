// @vitest-environment node
import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/billing/webhook/route";
import type { NextRequest } from "next/server";

function makeReq(headers: Record<string, string>, body = "{}"): NextRequest {
  return new Request("https://app.example.com/api/billing/webhook", {
    method: "POST",
    headers,
    body,
  }) as unknown as NextRequest;
}

describe("Paddle webhook signature verification", () => {
  it("rejects a request with no Paddle-Signature header (400)", async () => {
    const res = await POST(makeReq({ "content-type": "application/json" }));
    expect(res.status).toBe(400);
  });

  it("rejects a request with an invalid signature before processing (400)", async () => {
    // A bogus signature (and/or missing secret) makes unmarshal() throw — the
    // route must reject with 400 and never reach the billing logic.
    const res = await POST(makeReq({ "content-type": "application/json", "paddle-signature": "ts=1;h1=deadbeef" }));
    expect(res.status).toBe(400);
  });
});
