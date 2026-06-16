import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";
import { EventName } from "@paddle/paddle-node-sdk";
import { paddle, getTierFromPriceId } from "@/lib/paddle";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing paddle-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      body,
      process.env.PADDLE_WEBHOOK_SECRET!,
      signature
    );
  } catch (err) {
    Sentry.captureException(err);
    console.error("Paddle webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use service role to bypass RLS when updating profiles
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.eventType) {

      // ── New subscription paid (most reliable event for first purchase) ────
      case EventName.TransactionCompleted: {
        const tx = event.data;
        const customData = tx.customData as { supabase_user_id?: string; tier?: string } | null;
        const userId = customData?.supabase_user_id;
        const tier = customData?.tier;
        const customerId = tx.customerId;

        if (userId && tier) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              subscription_status: "active",
              paddle_customer_id: customerId,
            })
            .eq("id", userId);
          await supabase.rpc("write_audit_log", {
            p_org_id: userId, p_actor_id: null, p_action: "plan.upgraded",
            p_resource_type: "profile", p_resource_id: userId, p_meta: { tier, via: "paddle" },
          });
        }
        break;
      }

      // ── Subscription activated (fires after first payment) ────────────────
      case EventName.SubscriptionActivated: {
        const sub = event.data;
        const customerId = sub.customerId;
        const priceId = sub.items?.[0]?.price?.id ?? null;
        const tier = getTierFromPriceId(priceId);

        if (tier) {
          await supabase
            .from("profiles")
            .update({ subscription_tier: tier, subscription_status: "active" })
            .eq("paddle_customer_id", customerId);
        }
        break;
      }

      // ── Subscription changed (upgrade / downgrade via customer portal) ────
      case EventName.SubscriptionUpdated: {
        const sub = event.data;
        const customerId = sub.customerId;
        const priceId = sub.items?.[0]?.price?.id ?? null;
        const tier = getTierFromPriceId(priceId);
        const status = sub.status;

        if (tier && (status === "active" || status === "trialing")) {
          await supabase
            .from("profiles")
            .update({ subscription_tier: tier, subscription_status: status })
            .eq("paddle_customer_id", customerId);
        } else if (status === "past_due" || status === "paused") {
          await supabase
            .from("profiles")
            .update({ subscription_status: status })
            .eq("paddle_customer_id", customerId);
        }
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case EventName.SubscriptionCanceled: {
        const sub = event.data;
        const customerId = sub.customerId;

        const { data: canceled } = await supabase
          .from("profiles")
          .update({ subscription_tier: "free", subscription_status: "canceled" })
          .eq("paddle_customer_id", customerId)
          .select("id")
          .maybeSingle();
        if (canceled?.id) {
          await supabase.rpc("write_audit_log", {
            p_org_id: canceled.id, p_actor_id: null, p_action: "plan.downgraded",
            p_resource_type: "profile", p_resource_id: canceled.id, p_meta: { tier: "free", reason: "subscription_canceled" },
          });
        }
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case EventName.TransactionPaymentFailed: {
        const tx = event.data;
        const customerId = tx.customerId;

        if (customerId) {
          await supabase
            .from("profiles")
            .update({ subscription_status: "past_due" })
            .eq("paddle_customer_id", customerId);
        }
        break;
      }

      default:
        // Unhandled — acknowledge and move on
        break;
    }
  } catch (err) {
    Sentry.captureException(err);
    console.error("Paddle webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
