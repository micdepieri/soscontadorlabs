import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminTabs from "@/components/admin-tabs";

export const metadata: Metadata = {
  title: "Admin | Portal da Comunidade",
};

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || user.role !== "ADMIN") redirect("/videos");

  const [videos, materials, categories] = await Promise.all([
    prisma.video.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.material.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
        <p className="mt-2 text-gray-600">Gerencie vídeos, materiais e categorias.</p>
      </div>
      <AdminTabs videos={videos} materials={materials} categories={categories} />
    </div>
  );
}
