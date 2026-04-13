import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, upsertPost, deletePost, getPostById, getAllMemberEmails } from "@/lib/firestore";
import { sendContentNotification } from "@/lib/email";

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

  const isPublishing = body.publishedAt && typeof body.publishedAt === "string";
  let wasUnpublished = false;
  if (isPublishing) {
    const current = await getPostById(id);
    wasUnpublished = !current?.publishedAt;
  }

  const post = await upsertPost({
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  });

  if (isPublishing && wasUnpublished) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const slug = body.slug ?? id;
    getAllMemberEmails().then((emails) =>
      sendContentNotification(
        {
          subject: `Novo artigo: ${body.title ?? ""}`,
          title: `Novo artigo publicado`,
          body: `"${body.title || "Novo artigo"}" — leia agora no portal da comunidade.`,
          ctaUrl: `${appUrl}/posts/${slug}`,
          ctaLabel: "Ler artigo",
        },
        emails
      )
    );
  }

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deletePost(id);

  return NextResponse.json({ success: true });
}
