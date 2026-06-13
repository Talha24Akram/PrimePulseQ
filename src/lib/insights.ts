// ============================================================
// Rule-based insights engine
//
// This module turns raw engagement metrics into human-readable
// insights and recommended actions. It is intentionally pure and
// dependency-free so it can run on the client or the server.
//
// TODO(ai-insights): Replace / augment `generateInsights` with a real
// AI-generated summary. The `InsightInput` shape below is designed to be
// the exact payload sent to an LLM (Claude) later — keep it stable so the
// rule-based and AI paths stay interchangeable. The rule-based output here
// should remain as a deterministic fallback when the AI call is unavailable.
// ============================================================

export type InsightSeverity = "positive" | "info" | "warning" | "critical";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  detail: string;
}

export interface ActionRecommendation {
  id: string;
  title: string;
  detail: string;
  /** Optional in-app destination for the CTA. */
  href?: string;
  cta?: string;
}

/** Stable input contract — also the future LLM payload. */
export interface InsightInput {
  currentScore: number;          // 0-100
  previousScore: number;         // 0-100
  avgResponseRate: number;       // 0-100
  burnoutPct: number;            // 0-100 (share of scores ≤ 4/10)
  pulseIndex: number;            // -100..100 (high scorers minus low scorers)
  totalResponses: number;
  totalEmployees: number;
}

/**
 * Produce rule-based insights from engagement metrics.
 * Ordered by severity so the UI can surface the most important first.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const insights: Insight[] = [];
  const delta = input.currentScore - input.previousScore;

  // ── Engagement trend ──────────────────────────────────────
  if (input.previousScore > 0 && delta <= -8) {
    insights.push({
      id: "engagement-drop",
      severity: "critical",
      title: "Engagement dropped sharply",
      detail: `Engagement fell ${Math.abs(delta)} points versus the previous period (now ${input.currentScore}%). A sudden decline often signals a specific event worth investigating.`,
    });
  } else if (delta >= 8) {
    insights.push({
      id: "engagement-rise",
      severity: "positive",
      title: "Positive engagement trend",
      detail: `Engagement climbed ${delta} points to ${input.currentScore}%. Whatever changed recently is working — reinforce it.`,
    });
  }

  // ── Absolute engagement level ─────────────────────────────
  if (input.currentScore > 0 && input.currentScore < 50) {
    insights.push({
      id: "low-engagement",
      severity: "warning",
      title: "Engagement is below healthy levels",
      detail: `An engagement score of ${input.currentScore}% is in the low band. Sustained low engagement correlates with attrition risk.`,
    });
  } else if (input.currentScore >= 80) {
    insights.push({
      id: "high-engagement",
      severity: "positive",
      title: "Engagement is strong",
      detail: `At ${input.currentScore}%, your team is highly engaged. Keep pulse checks consistent to catch any early dips.`,
    });
  }

  // ── Response rate ─────────────────────────────────────────
  if (input.totalEmployees > 0 && input.avgResponseRate < 40) {
    insights.push({
      id: "low-response-rate",
      severity: "warning",
      title: "Low response rate",
      detail: `Only ${input.avgResponseRate}% of employees are responding. Low participation makes results less representative and can hide problems.`,
    });
  }

  // ── Burnout risk ──────────────────────────────────────────
  if (input.burnoutPct >= 30) {
    insights.push({
      id: "burnout-high",
      severity: "critical",
      title: "Burnout risk is high",
      detail: `${input.burnoutPct}% of scale answers are 4/10 or lower. This is a strong burnout signal that warrants immediate attention.`,
    });
  } else if (input.burnoutPct >= 15) {
    insights.push({
      id: "burnout-moderate",
      severity: "warning",
      title: "Some burnout signals present",
      detail: `${input.burnoutPct}% of answers are in the low range. Monitor workload and check in with affected teams.`,
    });
  }

  // ── Fallback ──────────────────────────────────────────────
  if (insights.length === 0) {
    insights.push({
      id: "stable",
      severity: "info",
      title: "Metrics are stable",
      detail: "No significant changes detected this period. Continue running regular pulse surveys to keep your trend data fresh.",
    });
  }

  return insights;
}

/**
 * Map detected issues to concrete, professional next steps.
 */
export function generateActionPlan(input: InsightInput): ActionRecommendation[] {
  const actions: ActionRecommendation[] = [];

  if (input.currentScore > 0 && input.currentScore < 60) {
    actions.push({
      id: "manager-checkins",
      title: "Run manager 1:1 check-ins",
      detail: "Engagement is low. Have managers hold short, focused 1:1s this week to surface blockers and listen.",
      href: "/surveys/new",
      cta: "Create a follow-up survey",
    });
  }

  if (input.totalEmployees > 0 && input.avgResponseRate < 50) {
    actions.push({
      id: "boost-participation",
      title: "Boost participation",
      detail: "Shorten the next survey to 3–5 questions and send a friendly reminder. Higher participation makes results more trustworthy.",
      href: "/surveys",
      cta: "Review your surveys",
    });
  }

  if (input.burnoutPct >= 20) {
    actions.push({
      id: "review-workload",
      title: "Review workload and meeting load",
      detail: "Burnout signals are elevated. Audit recurring meetings and redistribute workload where a team or individual is overloaded.",
    });
  }

  if (input.pulseIndex < 0) {
    actions.push({
      id: "understand-detractors",
      title: "Understand disengagement",
      detail: "Low scorers currently outweigh high scorers. Run a short anonymous follow-up asking what one change would improve their week.",
      href: "/surveys/new",
      cta: "Create survey",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: "stay-consistent",
      title: "Keep the cadence",
      detail: "Things look healthy. Maintain a regular pulse survey schedule so you spot changes early.",
      href: "/surveys/new",
      cta: "Schedule next pulse",
    });
  }

  return actions;
}
