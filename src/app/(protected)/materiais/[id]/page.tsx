import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import CommentsSection from "@/components/comments-section";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const material = await prisma.material.findUnique({ where: { id } });
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
  const { userId } = await auth();

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      comments: {
        where: { parentId: null, isHidden: false },
        include: {
          author: true,
          likes: true,
          replies: {
            where: { isHidden: false },
            include: { author: true, likes: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!material || !material.publishedAt) notFound();

  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { subscription: true },
      })
    : null;

  const isSubscribed =
    dbUser?.subscription?.status === "ACTIVE" || dbUser?.role === "ADMIN";

  if (material.isPremium && !isSubscribed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="mb-6 text-amber-500">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{material.title}</h1>
        <p className="text-gray-600 mb-8">Este material está disponível apenas para membros premium.</p>
        <a
          href="/assinatura"
          className="inline-block rounded-lg bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Assinar agora
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <span className="inline-block rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 mb-3">
              {typeLabels[material.type]}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{material.title}</h1>
            {material.category && (
              <span className="mt-1 inline-block text-sm text-indigo-600 font-medium">
                {material.category.name}
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
          <p className="text-gray-700 leading-relaxed mb-6">{material.description}</p>
        )}

        {material.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
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
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          {material.type === "PDF" ? "Baixar PDF" : "Acessar recurso"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Comments */}
      <div className="border-t border-gray-200 pt-8">
        <CommentsSection
          contentId={material.id}
          contentType="material"
          comments={material.comments}
          currentUserId={dbUser?.id ?? null}
          currentUserClerkId={userId ?? null}
        />
      </div>
    </div>
  );
}
