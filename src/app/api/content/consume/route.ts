import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { markContentConsumed, getUserContentProgress, XP_VALUES } from "@/lib/firestore";
import type { ContentType } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { contentId, contentType } = await req.json();

    if (!contentId || !["video", "material", "post"].includes(contentType)) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    const xpAwarded = await markContentConsumed(userId, contentId, contentType as ContentType);

    return NextResponse.json({ success: true, xpAwarded, alreadyConsumed: xpAwarded === 0 });
  } catch (error) {
    console.error("Error marking content as consumed:", error);
    return NextResponse.json({ error: "Falha ao registrar consumo" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contentId = searchParams.get("contentId");

    if (!contentId) {
      return NextResponse.json({ error: "contentId obrigatório" }, { status: 400 });
    }

    const consumed = await getUserContentProgress(userId, contentId);
    return NextResponse.json({ consumed, xpValue: XP_VALUES });
  } catch (error) {
    console.error("Error checking content progress:", error);
    return NextResponse.json({ error: "Falha ao verificar progresso" }, { status: 500 });
  }
}
