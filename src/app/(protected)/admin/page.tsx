import { getServerAuth } from "@/lib/server-auth";
import {
  getUserByUid,
  getVideos,
  getMaterials,
  getCategories,
  getContentRequests,
  getPosts,
  getAISettings,
  getUsers,
  getAllSubscriptions,
  getAllContentStats,
} from "@/lib/firestore";
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

  const [allVideos, allMaterials, categories, contentRequests, allPosts, rawAISettings, allUsers, allSubscriptions, ratingStats] =
    await Promise.all([
      getVideos({ publishedOnly: false }),
      getMaterials({ publishedOnly: false }),
      getCategories(),
      getContentRequests(),
      getPosts({ publishedOnly: false }),
      getAISettings(),
      getUsers(),
      getAllSubscriptions(),
      getAllContentStats(),
    ]);

  const subscriptionByUserId = Object.fromEntries(
    allSubscriptions.map((s) => [s.userId, s])
  );

  const members = allUsers.map((u) => {
    const sub = subscriptionByUserId[u.uid] || null;
    return {
      uid: u.uid,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatarUrl,
      role: u.role,
      createdAt: u.createdAt,
      subscription: sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            stripeCustomerId: sub.stripeCustomerId,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            stripePriceId: sub.stripePriceId,
          }
        : null,
    };
  });

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

  const posts = allPosts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    category: p.categoryId ? categoryMap[p.categoryId] || null : null,
  }));

  function maskKey(key: string) {
    if (!key || key.length < 8) return key ? "••••••••" : "";
    return "••••••••••••" + key.slice(-4);
  }

  const aiSettings = {
    provider: rawAISettings.provider,
    model: rawAISettings.model,
    anthropicApiKeySet: (rawAISettings.anthropicApiKey ?? "").length > 0,
    anthropicApiKeyMasked: maskKey(rawAISettings.anthropicApiKey ?? ""),
    openaiApiKeySet: (rawAISettings.openaiApiKey ?? "").length > 0,
    openaiApiKeyMasked: maskKey(rawAISettings.openaiApiKey ?? ""),
    openaiBaseUrl: rawAISettings.openaiBaseUrl,
    updatedAt: rawAISettings.updatedAt,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel Admin</h1>
        <p className="mt-2 text-gray-600">Gerencie vídeos, materiais, artigos e categorias.</p>
      </div>
      <AdminTabs
        videos={videos}
        materials={materials}
        categories={categories}
        contentRequests={contentRequests}
        posts={posts}
        aiSettings={aiSettings}
        members={members}
        ratingStats={ratingStats}
      />
    </div>
  );
}
