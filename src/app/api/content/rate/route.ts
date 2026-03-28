import { NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { saveRating } from "@/lib/firestore";

export async function POST(req: Request) {
  try {
    const { userId } = await getServerAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { contentId, contentType, value } = await req.json();

    if (!contentId || !contentType || typeof value !== "number") {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    await saveRating({
      userId,
      contentId,
      contentType,
      value: Math.min(Math.max(value, 1), 5), // Ensure 1-5
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rating content:", error);
    return NextResponse.json({ error: "Falha ao salvar avaliação" }, { status: 500 });
  }
}
