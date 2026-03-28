import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getComments, createComment } from "@/lib/firestore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType");

  if (!contentId || !contentType || (contentType !== "video" && contentType !== "material")) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const comments = await getComments(contentId, contentType);
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, contentId, contentType, parentId, imageUrl } = body;

  if ((!content?.trim() && !imageUrl) || !contentId || !contentType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await getUserByUid(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const comment = await createComment({
    content: (content || "").trim(),
    authorId: user.uid,
    authorName: user.name,
    authorAvatarUrl: user.avatarUrl,
    videoId: contentType === "video" ? contentId : null,
    materialId: contentType === "material" ? contentId : null,
    parentId: parentId || null,
    imageUrl: imageUrl || null,
  });

  return NextResponse.json(comment, { status: 201 });
}
