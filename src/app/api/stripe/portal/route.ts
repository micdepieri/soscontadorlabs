import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getSubscription } from "@/lib/firestore";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(userId);
  const customerId = sub?.stripeCustomerId;

  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/assinatura`,
  });

  return NextResponse.json({ url: session.url });
}
