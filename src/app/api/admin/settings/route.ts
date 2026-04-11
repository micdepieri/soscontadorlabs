import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import {
  getUserByUid,
  getAISettings,
  updateAISettings,
  AISettings,
  getStripeSettings,
  updateStripeSettings,
  StripeSettings,
  getCommunitySettings,
  updateCommunitySettings,
  CommunitySettings,
} from "@/lib/firestore";

async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const user = await getUserByUid(userId);
  return user?.role === "ADMIN" ? user : null;
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? "••••••••" : "";
  return "••••••••••••" + key.slice(-4);
}

// ── AI Settings ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");

  if (section === "community") {
    const settings = await getCommunitySettings();
    return NextResponse.json({
      communityName: settings.communityName,
      communityTagline: settings.communityTagline,
      updatedAt: settings.updatedAt,
    });
  }

  if (section === "stripe") {
    const settings = await getStripeSettings();
    return NextResponse.json({
      publishableKey: settings.publishableKey,
      publishableKeySet: settings.publishableKey.length > 0,
      secretKeySet: settings.secretKey.length > 0,
      secretKeyMasked: maskKey(settings.secretKey),
      webhookSecretSet: settings.webhookSecret.length > 0,
      webhookSecretMasked: maskKey(settings.webhookSecret),
      priceId: settings.priceId,
      updatedAt: settings.updatedAt,
    });
  }

  // Default: AI settings
  const settings = await getAISettings();

  // Never send actual keys to the client — only masked versions
  return NextResponse.json({
    provider: settings.provider,
    model: settings.model,
    anthropicApiKeySet: settings.anthropicApiKey.length > 0,
    anthropicApiKeyMasked: maskKey(settings.anthropicApiKey),
    openaiApiKeySet: settings.openaiApiKey.length > 0,
    openaiApiKeyMasked: maskKey(settings.openaiApiKey),
    openaiBaseUrl: settings.openaiBaseUrl,
    updatedAt: settings.updatedAt,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section");

  if (section === "community") {
    const body: Partial<CommunitySettings> = await req.json();
    const allowed: Partial<CommunitySettings> = {};
    if (typeof body.communityName === "string") allowed.communityName = body.communityName.trim();
    if (typeof body.communityTagline === "string") allowed.communityTagline = body.communityTagline.trim();
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    await updateCommunitySettings(allowed);
    return NextResponse.json({ success: true });
  }

  if (section === "stripe") {
    const body: Partial<StripeSettings> = await req.json();
    const allowed: Partial<StripeSettings> = {};

    // publishableKey é pública — pode ser atualizada diretamente
    if (typeof body.publishableKey === "string") {
      allowed.publishableKey = body.publishableKey.trim();
    }
    // Chaves sensíveis: só atualiza se um valor não-vazio for enviado
    if (typeof body.secretKey === "string" && body.secretKey.trim()) {
      allowed.secretKey = body.secretKey.trim();
    }
    if (typeof body.webhookSecret === "string" && body.webhookSecret.trim()) {
      allowed.webhookSecret = body.webhookSecret.trim();
    }
    if (typeof body.priceId === "string") {
      allowed.priceId = body.priceId.trim();
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await updateStripeSettings(allowed);
    return NextResponse.json({ success: true });
  }

  // Default: AI settings
  const body: Partial<AISettings> = await req.json();
  const allowed: Partial<AISettings> = {};

  if (body.provider === "anthropic" || body.provider === "openai") {
    allowed.provider = body.provider;
  }
  if (typeof body.model === "string" && body.model.trim()) {
    allowed.model = body.model.trim();
  }
  if (typeof body.anthropicApiKey === "string" && body.anthropicApiKey.trim()) {
    allowed.anthropicApiKey = body.anthropicApiKey.trim();
  }
  if (typeof body.openaiApiKey === "string" && body.openaiApiKey.trim()) {
    allowed.openaiApiKey = body.openaiApiKey.trim();
  }
  if (typeof body.openaiBaseUrl === "string") {
    allowed.openaiBaseUrl = body.openaiBaseUrl.trim();
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await updateAISettings(allowed);
  return NextResponse.json({ success: true });
}
