import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getMaterialById,
  getUserByUid,
  getSubscription,
  getComments,
  getCategories,
  getContentRatingStats,
  getUserRating,
} from "@/lib/firestore";
import type { Metadata } from "next";
import Link from "next/link";
import CommentsSection from "@/components/comments-section";
import Thermometer from "@/components/thermometer";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const material = await getMaterialById(id);
  if (!material) return { title: "Material não encontrado" };
  return {
    title: `${material.title} | Portal da Comunidade`,
    description: material.description || undefined,
  };
}

const typeLabels: Record<string, string> = {
  PDF: "PDF",
  LINK: "Link externo",
  RESOURCE: "Recurso",
};

export default async function MaterialPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await getServerAuth();

  const [material, categories, ratingStats, userRating] = await Promise.all([
    getMaterialById(id),
    getCategories(),
    getContentRatingStats(id),
    userId ? getUserRating(userId, id) : null,
  ]);

  if (!material || !material.publishedAt) notFound();

  const dbUser = userId ? await getUserByUid(userId) : null;
  const sub = userId ? await getSubscription(userId) : null;
  const isSubscribed = sub?.status === "ACTIVE" || dbUser?.role === "ADMIN";

  if (material.isPremium && !isSubscribed) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <div className="mb-6 text-amber-500">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{material.title}</h1>
        <p className="mb-8 text-gray-600">
          Este material está disponível apenas para membros premium.
        </p>
        <Link
          href="/assinatura"
          className="inline-block rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Assinar agora
        </Link>
      </div>
    );
  }

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const category = material.categoryId ? categoryMap[material.categoryId] || null : null;
  const comments = await getComments(id, "material");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {typeLabels[material.type]}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
            {category && (
              <span className="mt-1 inline-block text-sm font-medium text-indigo-600">
                {category.name}
              </span>
            )}
          </div>
          {material.isPremium && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              Premium
            </span>
          )}
        </div>

        {material.description && (
          <p className="mb-6 leading-relaxed text-gray-700">{material.description}</p>
        )}

        {material.tags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {material.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {material.type === "PDF" ? "Baixar PDF" : "Acessar recurso"}
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      <div className="mt-8">
        <Thermometer 
          contentId={material.id} 
          contentType="material" 
          initialRating={userRating} 
          stats={ratingStats} 
        />
      </div>

      {/* Comments */}
      <div className="border-t border-gray-200 pt-8">
        <CommentsSection
          contentId={material.id}
          contentType="material"
          comments={comments}
          currentUserId={userId ?? null}
          isLoggedIn={!!userId}
        />
      </div>
    </div>
  );
}
