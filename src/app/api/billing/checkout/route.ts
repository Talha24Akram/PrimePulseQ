import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { paddle, getPriceIdFromTier } from "@/lib/paddle";

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

    // Fetch profile (check for existing Paddle customer ID)
    const { data: profile } = await supabase
      .from("profiles")
      .select("paddle_customer_id, email, full_name, company_name")
      .eq("id", user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://primepulseq.vercel.app";

    // Get or create Paddle customer
    let customerId = profile?.paddle_customer_id as string | null;
    if (!customerId) {
      const customer = await paddle.customers.create({
        email: user.email!,
        name: profile?.company_name ?? profile?.full_name ?? undefined,
        customData: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Store immediately so webhooks can look the user up by customer ID
      await supabase
        .from("profiles")
        .update({ paddle_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create Paddle transaction → generates a hosted checkout URL
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customerId,
      customData: { supabase_user_id: user.id, tier },
      checkout: {
        url: `${appUrl}/billing/success`,
      },
    });

    const checkoutUrl = transaction.checkout?.url;
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Paddle did not return a checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err) {
    console.error("Paddle checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
