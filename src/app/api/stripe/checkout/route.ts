import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getSubscription, upsertSubscription } from "@/lib/firestore";
import { getStripeConfig } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByUid(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // returnPath is an optional path (e.g. "/videos/abc") to redirect back to after payment
  let returnPath: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.returnPath === "string" && body.returnPath.startsWith("/")) {
      returnPath = body.returnPath;
    }
  } catch {
    // body may be empty — that's fine
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { stripe, priceId } = await getStripeConfig();

    if (!priceId) return NextResponse.json({ error: "Plano de assinatura não configurado. Configure em Admin > Configurações." }, { status: 500 });

    const existingSub = await getSubscription(userId);
    let customerId = existingSub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.uid },
      });
      customerId = customer.id;
      // Salva imediatamente para evitar criar customers duplicados em tentativas futuras
      await upsertSubscription(userId, { stripeCustomerId: customerId });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: returnPath
        ? `${baseUrl}/assinatura?success=1&return=${encodeURIComponent(returnPath)}`
        : `${baseUrl}/assinatura?success=1`,
      cancel_url: returnPath
        ? `${baseUrl}${returnPath}`
        : `${baseUrl}/assinatura?cancelled=1`,
      metadata: { userId: user.uid },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode ?? 500 });
    }
    throw err;
  }
}
