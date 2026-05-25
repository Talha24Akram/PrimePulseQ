import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe, getTierFromPriceId } from "@/lib/stripe";

// App Router reads raw body via request.text() — no config needed.
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Use service role to bypass RLS for profile updates
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    switch (event.type) {
      // ── New subscription created via Checkout ─────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) break;

        // Fetch the subscription to get the price ID
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id;
        const tier = getTierFromPriceId(priceId);

        if (tier) {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: tier,
              subscription_status: "active",
              paddle_customer_id: session.customer as string,
            })
            .eq("id", userId);
        }
        break;
      }

      // ── Subscription changed (upgrade / downgrade via portal) ─────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const priceId = sub.items.data[0]?.price.id;
        const tier = getTierFromPriceId(priceId);
        const status = sub.status; // "active" | "past_due" | "canceled" | "trialing" etc.

        if (tier && (status === "active" || status === "trialing")) {
          await supabase
            .from("profiles")
            .update({ subscription_tier: tier, subscription_status: status })
            .eq("paddle_customer_id", customerId);
        } else if (status === "past_due" || status === "unpaid") {
          await supabase
            .from("profiles")
            .update({ subscription_status: status })
            .eq("paddle_customer_id", customerId);
        }
        break;
      }

      // ── Subscription cancelled ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await supabase
          .from("profiles")
          .update({ subscription_tier: "free", subscription_status: "canceled" })
          .eq("paddle_customer_id", customerId);
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("paddle_customer_id", customerId);
        break;
      }

      default:
        // Unhandled event type — ignore
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
