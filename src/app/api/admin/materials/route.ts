import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, createMaterial, getAllMemberEmails } from "@/lib/firestore";
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
  const { title, url, type, description, categoryId, tags, isPremium, publishedAt } = body;

  if (!title || !url || !type) {
    return NextResponse.json({ error: "Title, URL and type required" }, { status: 400 });
  }

  const material = await createMaterial({
    title,
    url,
    type: type as "PDF" | "LINK" | "RESOURCE",
    description: description || null,
    categoryId: categoryId || null,
    tags: tags || [],
    isPremium: Boolean(isPremium),
    publishedAt: publishedAt ? new Date(publishedAt).toISOString() : null,
  });

  if (publishedAt) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    getAllMemberEmails().then((emails) =>
      sendContentNotification(
        {
          subject: `Novo material: ${title}`,
          title: `Novo material publicado`,
          body: `${description || title} — disponível agora no portal da comunidade.`,
          ctaUrl: `${appUrl}/materiais`,
          ctaLabel: "Ver materiais",
        },
        emails
      )
    );
  }

  return NextResponse.json(material, { status: 201 });
}
