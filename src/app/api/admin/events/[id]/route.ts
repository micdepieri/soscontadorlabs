import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, updateEvent, deleteEvent, getEventById, getAllMemberEmails } from "@/lib/firestore";
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

  const { title, description, type, startDate, endDate, registrationUrl, thumbnail, isPremium, publishedAt } = body;

  const isPublishing = Boolean(publishedAt);
  let wasUnpublished = false;
  if (isPublishing) {
    const current = await getEventById(id);
    wasUnpublished = !current?.publishedAt;
  }

  await updateEvent(id, {
    title,
    description: description || null,
    type,
    startDate: startDate ? new Date(startDate).toISOString() : undefined,
    endDate: endDate ? new Date(endDate).toISOString() : null,
    registrationUrl: registrationUrl || null,
    thumbnail: thumbnail || null,
    isPremium: Boolean(isPremium),
    publishedAt: publishedAt !== undefined ? (publishedAt ? new Date().toISOString() : null) : undefined,
  });

  if (isPublishing && wasUnpublished) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const startFormatted = startDate
      ? new Date(startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : "";
    getAllMemberEmails().then((emails) =>
      sendContentNotification(
        {
          subject: `Novo evento: ${title ?? ""}`,
          title: `Novo evento disponível`,
          body: `"${title}" acontece em ${startFormatted}. ${description ? description.slice(0, 120) + "..." : ""}`,
          ctaUrl: `${appUrl}/eventos`,
          ctaLabel: "Ver eventos",
        },
        emails
      )
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await deleteEvent(id);
  return NextResponse.json({ ok: true });
}
