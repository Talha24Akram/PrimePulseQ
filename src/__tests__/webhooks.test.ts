import { describe, expect, it, vi, afterEach } from "vitest";
import { isAllowedWebhookUrl, notifyWebhooks } from "@/lib/webhooks";

describe("webhook URL validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows expected Slack and Teams webhook hosts over HTTPS", () => {
    expect(isAllowedWebhookUrl("https://hooks.slack.com/services/T000/B000/xxx", "slack")).toBe(true);
    expect(isAllowedWebhookUrl("https://outlook.office.com/webhook/abc", "teams")).toBe(true);
    expect(isAllowedWebhookUrl("https://hooks.office.com/webhook/abc", "teams")).toBe(true);
  });

  it("rejects wrong types, non-HTTPS URLs, and lookalike hosts", () => {
    expect(isAllowedWebhookUrl("https://outlook.office.com/webhook/abc", "slack")).toBe(false);
    expect(isAllowedWebhookUrl("http://hooks.slack.com/services/T000/B000/xxx", "slack")).toBe(false);
    expect(isAllowedWebhookUrl("https://hooks.slack.com.evil.example/services/T000", "slack")).toBe(false);
    expect(isAllowedWebhookUrl("https://169.254.169.254/latest/meta-data", "teams")).toBe(false);
    expect(isAllowedWebhookUrl("not-a-url", "teams")).toBe(false);
  });

  it("does not fetch saved webhook URLs that fail validation", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await notifyWebhooks(
      "https://hooks.slack.com.evil.example/services/T000",
      "https://169.254.169.254/latest/meta-data",
      { title: "Test", text: "No unsafe fetches" }
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
