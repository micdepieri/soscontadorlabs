import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  return user?.role === "ADMIN" ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, url, description, categoryId, tags, isPremium, publishedAt } = body;

  if (!title || !url) {
    return NextResponse.json({ error: "Title and URL required" }, { status: 400 });
  }

  const video = await prisma.video.create({
    data: {
      title,
      url,
      description: description || null,
      categoryId: categoryId || null,
      tags: tags || [],
      isPremium: Boolean(isPremium),
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
  });

  return NextResponse.json(video, { status: 201 });
}
