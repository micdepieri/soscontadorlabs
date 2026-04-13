import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { updateComment, deleteComment } from "@/lib/firestore";

async function getComment(commentId: string) {
  const db = getAdminFirestore();
  const doc = await db.collection("comments").doc(commentId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as { authorId: string; [k: string]: unknown };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await params;
  const comment = await getComment(commentId);
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  await updateComment(commentId, content.trim());
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: commentId } = await params;
  const comment = await getComment(commentId);
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.authorId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteComment(commentId);
  return NextResponse.json({ ok: true });
}
