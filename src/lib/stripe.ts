import Stripe from "stripe";

let stripeInstance: Stripe | undefined;

function getStripeSecretKey(): string {
  // 1. Environment variable (local dev, .env.local)
  if (process.env.STRIPE_SECRET_KEY) {
    return process.env.STRIPE_SECRET_KEY;
  }

  // 2. Firebase Functions config (production)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const functions = require("firebase-functions");
    const key = functions.config()?.stripe?.secret;
    if (key) return key;
  } catch {
    // firebase-functions not available (local dev or SSR)
  }

  throw new Error(
    'STRIPE_SECRET_KEY is not set. Set it via env var or `firebase functions:config:set stripe.secret="sk_..."`'
  );
}

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeSecretKey());
  }
  return stripeInstance;
};

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
