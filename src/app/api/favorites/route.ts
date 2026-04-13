import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getFavoritesByUser, addFavorite } from "@/lib/firestore";

export async function GET() {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favorites = await getFavoritesByUser(userId);
  return NextResponse.json(favorites);
}

export async function POST(req: NextRequest) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentId, contentType } = await req.json();
  if (!contentId || !contentType) {
    return NextResponse.json({ error: "contentId and contentType required" }, { status: 400 });
  }

  await addFavorite(userId, {
    contentId,
    contentType,
    savedAt: new Date().toISOString(),
  });

  return NextResponse.json({ saved: true });
}
