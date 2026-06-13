import { describe, it, expect } from "vitest";
import { generateInsights, generateActionPlan, type InsightInput } from "@/lib/insights";

const base: InsightInput = {
  currentScore: 70,
  previousScore: 70,
  avgResponseRate: 80,
  burnoutPct: 5,
  pulseIndex: 20,
  totalResponses: 50,
  totalEmployees: 60,
};

describe("generateInsights", () => {
  it("always returns at least one insight", () => {
    expect(generateInsights(base).length).toBeGreaterThan(0);
  });

  it("flags a sharp engagement drop as critical", () => {
    const insights = generateInsights({ ...base, previousScore: 80, currentScore: 65 });
    const drop = insights.find((i) => i.id === "engagement-drop");
    expect(drop?.severity).toBe("critical");
  });

  it("flags a positive trend", () => {
    const insights = generateInsights({ ...base, previousScore: 60, currentScore: 75 });
    expect(insights.some((i) => i.id === "engagement-rise")).toBe(true);
  });

  it("flags high burnout as critical", () => {
    const insights = generateInsights({ ...base, burnoutPct: 40 });
    const burnout = insights.find((i) => i.id === "burnout-high");
    expect(burnout?.severity).toBe("critical");
  });

  it("flags low response rate", () => {
    const insights = generateInsights({ ...base, avgResponseRate: 20 });
    expect(insights.some((i) => i.id === "low-response-rate")).toBe(true);
  });

  it("returns a stable fallback when nothing notable happens", () => {
    const insights = generateInsights(base);
    expect(insights.some((i) => i.id === "stable")).toBe(true);
  });
});

describe("generateActionPlan", () => {
  it("always returns at least one action", () => {
    expect(generateActionPlan(base).length).toBeGreaterThan(0);
  });

  it("recommends manager check-ins for low engagement", () => {
    const actions = generateActionPlan({ ...base, currentScore: 45 });
    expect(actions.some((a) => a.id === "manager-checkins")).toBe(true);
  });

  it("recommends boosting participation for low response rate", () => {
    const actions = generateActionPlan({ ...base, avgResponseRate: 30 });
    expect(actions.some((a) => a.id === "boost-participation")).toBe(true);
  });

  it("recommends workload review for elevated burnout", () => {
    const actions = generateActionPlan({ ...base, burnoutPct: 25 });
    expect(actions.some((a) => a.id === "review-workload")).toBe(true);
  });

  it("recommends understanding detractors for negative pulse index", () => {
    const actions = generateActionPlan({ ...base, pulseIndex: -10 });
    expect(actions.some((a) => a.id === "understand-detractors")).toBe(true);
  });
});
