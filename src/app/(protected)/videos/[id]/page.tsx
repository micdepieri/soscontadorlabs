import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import CommentsSection from "@/components/comments-section";
import VideoEmbed from "@/components/video-embed";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return { title: "Vídeo não encontrado" };
  return {
    title: `${video.title} | Portal da Comunidade`,
    description: video.description || undefined,
  };
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await auth();

  const video = await prisma.video.findUnique({
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

  if (!video || !video.publishedAt) notFound();

  const dbUser = userId
    ? await prisma.user.findUnique({ where: { clerkId: userId } })
    : null;

  const isSubscribed =
    dbUser?.subscription?.status === "ACTIVE" ||
    dbUser?.role === "ADMIN";

  if (video.isPremium && !isSubscribed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="mb-6 text-amber-500">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h1>
        <p className="text-gray-600 mb-8">Este vídeo está disponível apenas para membros premium.</p>
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
      {/* Video */}
      <VideoEmbed url={video.url} title={video.title} />

      {/* Meta */}
      <div className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            {video.category && (
              <span className="mt-1 inline-block text-sm text-indigo-600 font-medium">
                {video.category.name}
              </span>
            )}
          </div>
          {video.isPremium && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              Premium
            </span>
          )}
        </div>
        {video.description && (
          <p className="mt-4 text-gray-700 leading-relaxed">{video.description}</p>
        )}
        {video.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {video.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <CommentsSection
          contentId={video.id}
          contentType="video"
          comments={video.comments}
          currentUserId={dbUser?.id ?? null}
          currentUserClerkId={userId ?? null}
        />
      </div>
    </div>
  );
}
