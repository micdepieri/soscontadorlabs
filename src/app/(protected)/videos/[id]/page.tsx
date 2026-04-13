import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import {
  getVideoById,
  getUserByUid,
  getSubscription,
  getComments,
  getCategories,
  getContentRatingStats,
  getUserRating,
  getUserContentProgress,
} from "@/lib/firestore";
import type { Metadata } from "next";
import Link from "next/link";
import CommentsSection from "@/components/comments-section";
import VideoEmbed from "@/components/video-embed";
import Thermometer from "@/components/thermometer";
import ConsumeButton from "@/components/consume-button";
import PremiumPaywallModal from "@/components/premium-paywall-modal";

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

  const [video, categories, ratingStats, userRating, alreadyConsumed] = await Promise.all([
    getVideoById(id),
    getCategories(),
    getContentRatingStats(id),
    userId ? getUserRating(userId, id) : null,
    userId ? getUserContentProgress(userId, id) : false,
  ]);

  if (!video || !video.publishedAt) notFound();

  const dbUser = userId ? await getUserByUid(userId) : null;
  const sub = userId ? await getSubscription(userId) : null;
  const isSubscribed = sub?.status === "ACTIVE" || dbUser?.role === "ADMIN";

  if (video.isPremium && !isSubscribed) {
    return (
      <div className="mx-auto max-w-4xl">
        {/* Visible header — always shown so user knows what they're missing */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-md bg-tech-blue/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-ia">
              Vídeo
            </span>
            <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Premium
            </span>
          </div>
          <h1 className="text-2xl font-black text-cloud-white">{video.title}</h1>
          {video.description && (
            <p className="mt-2 text-cloud-white/50">{video.description}</p>
          )}
        </div>

        {/* Blurred preview + paywall overlay */}
        <div className="relative overflow-hidden rounded-2xl min-h-[360px]">
          {/* Blurred thumbnail placeholder */}
          <div className="pointer-events-none select-none">
            {video.thumbnail ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl blur-sm brightness-50">
                <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 blur-sm">
                <svg className="h-20 w-20 text-cyan-ia/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>
          {/* Paywall modal overlay */}
          <PremiumPaywallModal contentTitle={video.title} returnPath={`/videos/${id}`} />
        </div>
      </div>
    );
  }

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

        <div className="mt-12 space-y-4">
          <Thermometer
            contentId={video.id}
            contentType="video"
            initialRating={userRating}
            stats={ratingStats}
          />
          {userId && (
            <div className="flex items-center gap-3">
              <ConsumeButton contentId={video.id} contentType="video" initialConsumed={alreadyConsumed} />
              {!alreadyConsumed && (
                <span className="text-xs text-cloud-white/40">Marque como concluído para ganhar XP</span>
              )}
            </div>
          )}
        </div>
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
