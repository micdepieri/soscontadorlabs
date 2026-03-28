import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { upsertSubscription, updateSubscriptionByStripeId } from "@/lib/firestore";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.subscription || !session.customer) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await upsertSubscription(userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        status: "ACTIVE",
        currentPeriodEnd: new Date(
          (subscription.items.data[0]?.current_period_end ?? 0) * 1000
        ).toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const status = mapStripeStatus(subscription.status);

      await updateSubscriptionByStripeId(subscription.id, {
        status,
        currentPeriodEnd: new Date(
          (subscription.items.data[0]?.current_period_end ?? 0) * 1000
        ).toISOString(),
        stripePriceId: subscription.items.data[0]?.price.id,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionByStripeId(subscription.id, {
        status: "CANCELLED",
        currentPeriodEnd: null,
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        invoice.parent?.type === "subscription_details"
          ? (invoice.parent.subscription_details?.subscription as string | undefined)
          : undefined;
      if (subId) {
        await updateSubscriptionByStripeId(subId, { status: "PAST_DUE" });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

function mapStripeStatus(status: string): "ACTIVE" | "INACTIVE" | "CANCELLED" | "PAST_DUE" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "canceled":
      return "CANCELLED";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    default:
      return "INACTIVE";
  }
}
