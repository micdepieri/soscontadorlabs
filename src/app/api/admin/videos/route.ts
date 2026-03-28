import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, createVideo } from "@/lib/firestore";

async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const user = await getUserByUid(userId);
  return user?.role === "ADMIN" ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, url, description, categoryId, tags, isPremium, publishedAt } = body;

  if (!title || !url) {
    return NextResponse.json({ error: "Title and URL required" }, { status: 400 });
  }

  const video = await createVideo({
    title,
    url,
    description: description || null,
    thumbnail: null,
    categoryId: categoryId || null,
    tags: tags || [],
    isPremium: Boolean(isPremium),
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
  });

  return NextResponse.json(video, { status: 201 });
}
