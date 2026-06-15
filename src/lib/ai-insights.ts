// ============================================================
// AI-powered insights (server-only).
//
// Calls the Anthropic API (claude-sonnet-4-6) to turn the existing
// `InsightInput` metrics into a narrative + burnout assessment + manager
// recommendations. If the API key is missing or the call fails for any reason,
// it falls back to a deterministic result derived from the rule-based engine
// in `insights.ts`, so the feature never hard-fails.
//
// Do NOT import this from a client component — it uses ANTHROPIC_API_KEY.
// ============================================================
import Anthropic from "@anthropic-ai/sdk";
import {
  type InsightInput,
  generateInsights,
  generateActionPlan,
} from "@/lib/insights";

export type BurnoutLevel = "low" | "medium" | "high";

export interface AIInsight {
  narrative: string;
  burnout_risk: { level: BurnoutLevel; explanation: string };
  recommendations: string[];
  /** True when this came from the rule-based fallback, not the model. */
  fallback: boolean;
}

const MODEL = "claude-sonnet-4-6";

function isBurnoutLevel(v: unknown): v is BurnoutLevel {
  return v === "low" || v === "medium" || v === "high";
}

/** Build a deterministic AIInsight from the rule-based engine. */
function fallbackInsight(input: InsightInput): AIInsight {
  const insights = generateInsights(input);
  const actions = generateActionPlan(input);
  const level: BurnoutLevel =
    input.burnoutPct >= 30 ? "high" : input.burnoutPct >= 15 ? "medium" : "low";

  const narrative =
    insights
      .slice(0, 2)
      .map((i) => i.detail)
      .join(" ") ||
    "Not enough signal yet — keep running pulse surveys to build a trend.";

  return {
    narrative,
    burnout_risk: {
      level,
      explanation: `${input.burnoutPct}% of scale answers are 4/10 or lower.`,
    },
    recommendations: actions.slice(0, 3).map((a) => `${a.title}: ${a.detail}`),
    fallback: true,
  };
}

/** Validate the model's parsed JSON into an AIInsight (throws on bad shape). */
function parseModelJson(raw: string): AIInsight {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const burnout = (data.burnout_risk ?? {}) as Record<string, unknown>;
  const recs = data.recommendations;

  if (typeof data.narrative !== "string" || data.narrative.trim() === "") {
    throw new Error("missing narrative");
  }
  if (!isBurnoutLevel(burnout.level) || typeof burnout.explanation !== "string") {
    throw new Error("invalid burnout_risk");
  }
  if (!Array.isArray(recs) || recs.some((r) => typeof r !== "string") || recs.length === 0) {
    throw new Error("invalid recommendations");
  }

  return {
    narrative: data.narrative.trim(),
    burnout_risk: { level: burnout.level, explanation: burnout.explanation.trim() },
    recommendations: (recs as string[]).slice(0, 3).map((r) => r.trim()),
    fallback: false,
  };
}

export async function generateAIInsights(input: InsightInput): Promise<AIInsight> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackInsight(input);

  try {
    const client = new Anthropic({ apiKey });

    const system =
      "You are an people-analytics assistant for an anonymous employee pulse-survey product. " +
      "You receive aggregate, fully anonymous engagement metrics for one team — never individual data. " +
      "Respond with ONLY a JSON object (no markdown, no prose) matching exactly this shape: " +
      '{"narrative": string (2-3 sentences summarizing team mood), ' +
      '"burnout_risk": {"level": "low"|"medium"|"high", "explanation": string}, ' +
      '"recommendations": string[] (exactly 3 specific, actionable items for the manager)}. ' +
      "Be concrete and professional. Do not invent data beyond the metrics provided.";

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content:
            "Here are this team's anonymous aggregate metrics as JSON:\n" +
            JSON.stringify(input) +
            "\n\nReturn the JSON object described in the system prompt.",
        },
      ],
    });

    const text = message.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return fallbackInsight(input);

    // Model may wrap JSON in stray text; extract the outermost object.
    const jsonStr = text.text.slice(text.text.indexOf("{"), text.text.lastIndexOf("}") + 1);
    return parseModelJson(jsonStr);
  } catch (err) {
    console.error("generateAIInsights failed, using fallback:", err);
    return fallbackInsight(input);
  }
}
