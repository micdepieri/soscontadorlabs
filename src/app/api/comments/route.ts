import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getComments, createComment, createNotification } from "@/lib/firestore";

const VALID_TYPES = ["video", "material", "post"] as const;
type ContentType = (typeof VALID_TYPES)[number];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType") as ContentType | null;

  if (!contentId || !contentType || !VALID_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 });
  }

  const comments = await getComments(contentId, contentType);
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, contentId, contentType, parentId, imageUrl, mentions } = body;

  if ((!content?.trim() && !imageUrl) || !contentId || !contentType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Invalid contentType" }, { status: 400 });
  }

  const user = await getUserByUid(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const mentionedUids: string[] = Array.isArray(mentions)
    ? mentions.filter((id: unknown) => typeof id === "string" && id !== userId)
    : [];

  const comment = await createComment({
    content: (content || "").trim(),
    authorId: user.uid,
    authorName: user.name,
    authorAvatarUrl: user.avatarUrl,
    videoId: contentType === "video" ? contentId : null,
    materialId: contentType === "material" ? contentId : null,
    postId: contentType === "post" ? contentId : null,
    parentId: parentId || null,
    imageUrl: imageUrl || null,
    mentions: mentionedUids,
  });

  // Create mention notifications (fire-and-forget — don't block response)
  if (mentionedUids.length > 0) {
    Promise.all(
      mentionedUids.map((recipientId) =>
        createNotification({
          recipientId,
          type: "mention",
          fromUserId: user.uid,
          fromUserName: user.name,
          fromUserAvatarUrl: user.avatarUrl,
          contentId,
          contentType,
          commentId: comment.id,
        })
      )
    ).catch((err) => console.error("Error creating mention notifications:", err));
  }

  return NextResponse.json(comment, { status: 201 });
}
