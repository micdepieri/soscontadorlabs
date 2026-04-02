import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getSubscription } from "@/lib/firestore";
import { getStripeConfig } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST() {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(userId);
  const customerId = sub?.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { stripe } = await getStripeConfig();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/assinatura`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 500 });
    }
    throw err;
  }
}
