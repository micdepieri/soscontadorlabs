import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, createEvent, getAllMemberEmails } from "@/lib/firestore";
import { sendContentNotification } from "@/lib/email";

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
  const { title, description, type, startDate, endDate, registrationUrl, thumbnail, isPremium, publishedAt } = body;

  if (!title || !startDate) {
    return NextResponse.json({ error: "Title and startDate required" }, { status: 400 });
  }

  const event = await createEvent({
    title,
    description: description || null,
    type: type || "WEBINAR",
    startDate: new Date(startDate).toISOString(),
    endDate: endDate ? new Date(endDate).toISOString() : null,
    registrationUrl: registrationUrl || null,
    thumbnail: thumbnail || null,
    isPremium: Boolean(isPremium),
    publishedAt: publishedAt ? new Date().toISOString() : null,
  });

  if (publishedAt) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const startFormatted = new Date(startDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    getAllMemberEmails().then((emails) =>
      sendContentNotification(
        {
          subject: `Novo evento: ${title}`,
          title: `Novo evento disponível`,
          body: `"${title}" acontece em ${startFormatted}. ${description ? description.slice(0, 120) + "..." : ""}`,
          ctaUrl: `${appUrl}/eventos`,
          ctaLabel: "Ver eventos",
        },
        emails
      )
    );
  }

  return NextResponse.json(event, { status: 201 });
}
