// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateAIInsights } from "@/lib/ai-insights";
import type { InsightInput } from "@/lib/insights";

const input: InsightInput = {
  currentScore: 48,
  previousScore: 62,
  avgResponseRate: 35,
  burnoutPct: 32,
  pulseIndex: -10,
  totalResponses: 40,
  totalEmployees: 80,
};

const originalKey = process.env.ANTHROPIC_API_KEY;

afterEach(() => {
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
});

describe("generateAIInsights fallback", () => {
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY; // force the deterministic fallback path
  });

  it("returns a well-formed result without an API key", async () => {
    const r = await generateAIInsights(input);
    expect(r.fallback).toBe(true);
    expect(typeof r.narrative).toBe("string");
    expect(r.narrative.length).toBeGreaterThan(0);
    expect(["low", "medium", "high"]).toContain(r.burnout_risk.level);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeLessThanOrEqual(3);
  });

  it("maps high burnout percentage to high risk in the fallback", async () => {
    const r = await generateAIInsights({ ...input, burnoutPct: 40 });
    expect(r.burnout_risk.level).toBe("high");
  });

  it("maps low burnout percentage to low risk in the fallback", async () => {
    const r = await generateAIInsights({ ...input, burnoutPct: 5 });
    expect(r.burnout_risk.level).toBe("low");
  });

  it("never throws — always resolves to a usable shape", async () => {
    await expect(generateAIInsights(input)).resolves.toMatchObject({
      narrative: expect.any(String),
      burnout_risk: { level: expect.any(String), explanation: expect.any(String) },
      recommendations: expect.any(Array),
    });
  });
});
