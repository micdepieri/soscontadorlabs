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
  const { title, url, type, description, categoryId, tags, isPremium, publishedAt } = body;

  if (!title || !url || !type) {
    return NextResponse.json({ error: "Title, URL and type required" }, { status: 400 });
  }

  const material = await prisma.material.create({
    data: {
      title,
      url,
      type: type as "PDF" | "LINK" | "RESOURCE",
      description: description || null,
      categoryId: categoryId || null,
      tags: tags || [],
      isPremium: Boolean(isPremium),
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
  });

  return NextResponse.json(material, { status: 201 });
}
