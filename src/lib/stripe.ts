import Stripe from "stripe";

// Singleton Stripe client (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-04-22.dahlia",
});

// Map Stripe price IDs → subscription tiers
export function getTierFromPriceId(priceId: string | null | undefined): "starter" | "growth" | "enterprise" | null {
  if (!priceId) return null;
  const map: Record<string, "starter" | "growth" | "enterprise"> = {
    [process.env.STRIPE_PRICE_STARTER ?? "__starter__"]: "starter",
    [process.env.STRIPE_PRICE_GROWTH ?? "__growth__"]: "growth",
    [process.env.STRIPE_PRICE_ENTERPRISE ?? "__enterprise__"]: "enterprise",
  };
  return map[priceId] ?? null;
}

// Map tier → Stripe price ID
export function getPriceIdFromTier(tier: string): string | null {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[tier] ?? null;
}
