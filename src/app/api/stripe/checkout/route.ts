import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) return NextResponse.json({ error: "Stripe price not configured" }, { status: 500 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let customerId = user.subscription?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/assinatura?success=1`,
    cancel_url: `${baseUrl}/assinatura?cancelled=1`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
