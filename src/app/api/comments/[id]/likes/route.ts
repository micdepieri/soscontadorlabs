import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { toggleCommentLike } from "@/lib/firestore";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await params;
  const liked = await toggleCommentLike(commentId, userId);
  return NextResponse.json({ liked });
}
