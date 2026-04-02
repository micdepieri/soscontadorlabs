import Stripe from "stripe";
import { getStripeSettings } from "@/lib/firestore";

export interface StripeConfig {
  stripe: Stripe;
  priceId: string;
  webhookSecret: string;
  publishableKey: string;
}

// Cache para não bater no Firestore em toda requisição
let cached: StripeConfig | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000; // 60 segundos

export async function getStripeConfig(): Promise<StripeConfig> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached;
  }

  const settings = await getStripeSettings();

  if (!settings.secretKey) {
    throw new Error("Stripe secret key não configurada. Configure em Admin > Configurações.");
  }

  const stripeInstance = new Stripe(settings.secretKey, { apiVersion: "2026-02-25.clover" });

  cached = {
    stripe: stripeInstance,
    priceId: settings.priceId,
    webhookSecret: settings.webhookSecret,
    publishableKey: settings.publishableKey,
  };
  cachedAt = now;

  return cached;
}
