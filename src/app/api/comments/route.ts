import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType");

  if (!contentId || !contentType) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const where =
    contentType === "video"
      ? { videoId: contentId, parentId: null, isHidden: false }
      : { materialId: contentId, parentId: null, isHidden: false };

  const comments = await prisma.comment.findMany({
    where,
    include: {
      author: true,
      likes: true,
      replies: {
        where: { isHidden: false },
        include: { author: true, likes: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, contentId, contentType, parentId } = body;

  if (!content?.trim() || !contentId || !contentType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      authorId: user.id,
      videoId: contentType === "video" ? contentId : undefined,
      materialId: contentType === "material" ? contentId : undefined,
      parentId: parentId || undefined,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
