import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getAISettings, updateAISettings, AISettings } from "@/lib/firestore";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  const body: Partial<AISettings> = await req.json();

  // Only allow safe fields — never let client set arbitrary data
  const allowed: Partial<AISettings> = {};
  if (body.provider === "anthropic" || body.provider === "openai") {
    allowed.provider = body.provider;
  }
  if (typeof body.model === "string" && body.model.trim()) {
    allowed.model = body.model.trim();
  }
  // Only update keys if a non-empty value is provided (empty string = keep existing)
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
