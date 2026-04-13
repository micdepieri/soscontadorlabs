import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, deleteVideo, updateVideo, getVideoById, getAllMemberEmails } from "@/lib/firestore";
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

  // Detect first publish: publishedAt being set while current value is null
  const isPublishing = body.publishedAt && typeof body.publishedAt === "string";
  let wasUnpublished = false;
  if (isPublishing) {
    const current = await getVideoById(id);
    wasUnpublished = !current?.publishedAt;
  }

  await updateVideo(id, body);

  if (isPublishing && wasUnpublished) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    getAllMemberEmails().then((emails) =>
      sendContentNotification(
        {
          subject: `Novo vídeo: ${body.title ?? ""}`,
          title: `Novo vídeo publicado`,
          body: `${body.description || body.title || "Novo vídeo"} — confira agora no portal da comunidade.`,
          ctaUrl: `${appUrl}/videos`,
          ctaLabel: "Ver vídeos",
        },
        emails
      )
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteVideo(id);
  return NextResponse.json({ deleted: true });
}
