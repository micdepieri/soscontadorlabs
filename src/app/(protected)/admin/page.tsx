import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getVideos, getMaterials, getCategories } from "@/lib/firestore";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import AdminTabs from "@/components/admin-tabs";

export const metadata: Metadata = {
  title: "Administração | Portal da Comunidade",
};

export default async function AdminPage() {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByUid(userId);
  if (!user || user.role !== "ADMIN") redirect("/videos");

  const [allVideos, allMaterials, categories] = await Promise.all([
    getVideos({ publishedOnly: false }),
    getMaterials({ publishedOnly: false }),
    getCategories(),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const videos = allVideos.map((v) => ({
    ...v,
    publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
    category: v.categoryId ? categoryMap[v.categoryId] || null : null,
  }));

  const materials = allMaterials.map((m) => ({
    ...m,
    publishedAt: m.publishedAt ? new Date(m.publishedAt) : null,
    category: m.categoryId ? categoryMap[m.categoryId] || null : null,
  }));

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
