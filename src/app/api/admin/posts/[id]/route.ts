import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, upsertPost, deletePost } from "@/lib/firestore";

async function requireAdmin() {
  const { userId } = await getServerAuth();
  if (!userId) return null;
  const user = await getUserByUid(userId);
  return user?.role === "ADMIN" ? user : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const post = await upsertPost({
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deletePost(id);

  return NextResponse.json({ success: true });
}
