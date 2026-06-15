import { describe, it, expect } from "vitest";
import { escapeHtml } from "@/lib/utils";

// Every user-supplied value interpolated into an email HTML body (company name,
// employee name, survey title, description, question text) is routed through
// escapeHtml() before interpolation. This test pins that contract with the
// canonical XSS payload.
const XSS = `<script>alert(1)</script>`;

describe("email template HTML escaping", () => {
  it("neutralizes a <script> payload used as a company name", () => {
    const escaped = escapeHtml(XSS);
    expect(escaped).not.toContain("<script>");
    expect(escaped).not.toContain("</script>");
    expect(escaped).toContain("&lt;script&gt;");
  });

  it("produces no raw script tag when interpolated into a template fragment", () => {
    // Mirrors how the email builders interpolate: `...${escapeHtml(value)}...`
    const company = XSS;
    const fragment = `<span style="font-weight:700;">${escapeHtml(company)}</span>`;
    expect(fragment).not.toContain("<script>");
    expect(fragment).not.toContain("onerror=");
  });

  it("escapes attribute-breaking characters", () => {
    expect(escapeHtml(`" onmouseover="alert(1)`)).not.toContain('"');
    expect(escapeHtml(`x' onfocus='alert(1)`)).not.toContain("'");
  });

  it("leaves ordinary names intact", () => {
    expect(escapeHtml("Acme Inc.")).toBe("Acme Inc.");
  });
});
