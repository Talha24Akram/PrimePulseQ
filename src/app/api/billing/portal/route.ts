import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { paddle } from "@/lib/paddle";
import { blockCrossSite } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  const csrf = blockCrossSite(request);
  if (csrf) return csrf;
  try {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("paddle_customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.paddle_customer_id as string | null;
    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 400 }
      );
    }

    // Generate a short-lived auth token for the Paddle Customer Portal
    const authToken = await paddle.customers.generateAuthToken(customerId);

    // Paddle Customer Portal URL
    const portalUrl = `https://customer.paddle.com/?token=${authToken.customerAuthToken}`;

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    Sentry.captureException(err);
    console.error("Paddle portal error:", err);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
