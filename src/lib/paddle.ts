import { Environment, Paddle } from "@paddle/paddle-node-sdk";

// Singleton Paddle client (server-side only)
export const paddle = new Paddle(process.env.PADDLE_API_KEY ?? "placeholder", {
  environment:
    process.env.PADDLE_ENVIRONMENT === "production"
      ? Environment.production
      : Environment.sandbox,
});

// Map Paddle price IDs → subscription tiers
export function getTierFromPriceId(
  priceId: string | null | undefined
): "starter" | "growth" | "enterprise" | null {
  if (!priceId) return null;
  const map: Record<string, "starter" | "growth" | "enterprise"> = {
    [process.env.PADDLE_PRICE_STARTER ?? "__starter__"]: "starter",
    [process.env.PADDLE_PRICE_GROWTH ?? "__growth__"]: "growth",
    [process.env.PADDLE_PRICE_ENTERPRISE ?? "__enterprise__"]: "enterprise",
  };
  return map[priceId] ?? null;
}

// Map tier → Paddle price ID
export function getPriceIdFromTier(tier: string): string | null {
  const map: Record<string, string | undefined> = {
    starter: process.env.PADDLE_PRICE_STARTER,
    growth: process.env.PADDLE_PRICE_GROWTH,
    enterprise: process.env.PADDLE_PRICE_ENTERPRISE,
  };
  return map[tier] ?? null;
}
