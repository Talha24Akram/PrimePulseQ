import { Environment, Paddle } from "@paddle/paddle-node-sdk";

// Loud guard: running a real production deploy against Paddle's sandbox means
// billing silently doesn't work. Warn rather than default quietly.
if (
  process.env.NODE_ENV === "production" &&
  process.env.PADDLE_ENVIRONMENT !== "production"
) {
  console.warn(
    "[paddle] NODE_ENV=production but PADDLE_ENVIRONMENT is not 'production' — " +
      "billing is pointed at the Paddle sandbox. Set PADDLE_ENVIRONMENT=production for live billing."
  );
}

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
