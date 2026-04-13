import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, upsertPost, getAllMemberEmails } from "@/lib/firestore";
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
  const { title, slug, content, categoryId, tags, isPremium, publishedAt } = body;

  if (!title || !slug || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const post = await upsertPost({
    title,
    slug,
    content,
    authorId: admin.uid,
    authorName: admin.name,
    authorAvatarUrl: admin.avatarUrl,
    categoryId: categoryId || null,
    tags: tags || [],
    isPremium: Boolean(isPremium),
    publishedAt: publishedAt || null,
  });

  if (publishedAt) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    getAllMemberEmails().then((emails) =>
      sendContentNotification(
        {
          subject: `Novo artigo: ${title}`,
          title: `Novo artigo publicado`,
          body: `"${title}" — leia agora no portal da comunidade.`,
          ctaUrl: `${appUrl}/posts/${slug}`,
          ctaLabel: "Ler artigo",
        },
        emails
      )
    );
  }

  return NextResponse.json(post, { status: 201 });
}
