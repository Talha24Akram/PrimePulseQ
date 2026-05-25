import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { stripe, getPriceIdFromTier } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json();

    const priceId = getPriceIdFromTier(tier);
    if (!priceId) {
      return NextResponse.json({ error: "Invalid or unconfigured tier" }, { status: 400 });
    }

    // Auth check
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch profile to check for existing Stripe customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("paddle_customer_id, email, full_name, company_name")
      .eq("id", user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://primepulseq.vercel.app";

    // Get or create Stripe customer
    let customerId = profile?.paddle_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.company_name ?? profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Store immediately so the webhook can look them up
      await supabase
        .from("profiles")
        .update({ paddle_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?tab=billing`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        supabase_user_id: user.id,
        tier,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
