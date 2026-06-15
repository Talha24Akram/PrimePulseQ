// @vitest-environment node
import { describe, it, expect } from "vitest";
import { blockCrossSite, requireJson } from "@/lib/csrf";

function req(headers: Record<string, string>): Request {
  return new Request("https://app.example.com/api/x", { method: "POST", headers });
}

describe("blockCrossSite", () => {
  it("blocks explicit cross-site requests (Sec-Fetch-Site)", () => {
    const res = blockCrossSite(req({ "sec-fetch-site": "cross-site" }));
    expect(res?.status).toBe(403);
  });

  it("allows same-origin requests", () => {
    expect(blockCrossSite(req({ "sec-fetch-site": "same-origin" }))).toBeNull();
  });

  it("allows same-site requests", () => {
    expect(blockCrossSite(req({ "sec-fetch-site": "same-site" }))).toBeNull();
  });

  it("blocks when Origin host differs from the request host", () => {
    // Request URL host is app.example.com (see req()).
    const res = blockCrossSite(req({ origin: "https://evil.com" }));
    expect(res?.status).toBe(403);
  });

  it("allows when Origin host matches the request host", () => {
    expect(blockCrossSite(req({ origin: "https://app.example.com" }))).toBeNull();
  });

  it("allows non-browser clients that send no Fetch-Metadata or Origin", () => {
    // curl / server-to-server / tests — must not be blocked.
    expect(blockCrossSite(req({}))).toBeNull();
  });

  it("rejects an unparseable Origin", () => {
    const res = blockCrossSite(req({ origin: "not-a-url" }));
    expect(res?.status).toBe(403);
  });
});

describe("requireJson", () => {
  it("allows application/json", () => {
    expect(requireJson(req({ "content-type": "application/json" }))).toBeNull();
  });
  it("allows application/json with charset", () => {
    expect(requireJson(req({ "content-type": "application/json; charset=utf-8" }))).toBeNull();
  });
  it("rejects missing Content-Type with 415", () => {
    expect(requireJson(req({}))?.status).toBe(415);
  });
  it("rejects non-JSON Content-Type with 415", () => {
    expect(requireJson(req({ "content-type": "text/plain" }))?.status).toBe(415);
  });
});
