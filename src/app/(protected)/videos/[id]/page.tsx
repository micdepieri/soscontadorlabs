import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getVideoById,
  getUserByUid,
  getSubscription,
  getComments,
  getCategories,
} from "@/lib/firestore";
import type { Metadata } from "next";
import Link from "next/link";
import CommentsSection from "@/components/comments-section";
import VideoEmbed from "@/components/video-embed";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoById(id);
  if (!video) return { title: "Vídeo não encontrado" };
  return {
    title: `${video.title} | Portal da Comunidade`,
    description: video.description || undefined,
  };
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await getServerAuth();

  const video = await getVideoById(id);
  if (!video || !video.publishedAt) notFound();

  const dbUser = userId ? await getUserByUid(userId) : null;
  const sub = userId ? await getSubscription(userId) : null;
  const isSubscribed = sub?.status === "ACTIVE" || dbUser?.role === "ADMIN";

  if (video.isPremium && !isSubscribed) {
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
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{video.title}</h1>
        <p className="mb-8 text-gray-600">
          Este vídeo está disponível apenas para membros premium.
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

  const categories = await getCategories();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const category = video.categoryId ? categoryMap[video.categoryId] || null : null;
  const comments = await getComments(id, "video");

  return (
    <div className="mx-auto max-w-4xl">
      {/* Video */}
      <VideoEmbed url={video.url} title={video.title} />

      {/* Meta */}
      <div className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            {category && (
              <span className="mt-1 inline-block text-sm font-medium text-indigo-600">
                {category.name}
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
          <p className="mt-4 leading-relaxed text-gray-700">{video.description}</p>
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
          comments={comments}
          currentUserId={userId ?? null}
          isLoggedIn={!!userId}
        />
      </div>
    </div>
  );
}
