import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getPostById, getUserByUid, getSubscription, getCategories, getContentRatingStats, getUserRating, getUserContentProgress, getComments } from "@/lib/firestore";
import Link from "next/link";
import CommentsSection from "@/components/comments-section";
import Thermometer from "@/components/thermometer";
import ConsumeButton from "@/components/consume-button";
import PremiumPaywallModal from "@/components/premium-paywall-modal";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) return { title: "Artigo não encontrado" };
  return {
    title: `${post.title} | Portal da Comunidade`,
    description: post.content.substring(0, 160),
  };
}

// Simple manual markdown renderer for common Substack elements
function renderPostContent(content: string) {
  // 1. Code blocks
  const withCode = content.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="my-6 overflow-hidden rounded-xl border border-app-border bg-deep-navy shadow-inner">
      ${lang ? `<div class="bg-midnight-blue px-4 py-1.5 text-[10px] font-bold text-cloud-white/50 uppercase tracking-widest border-b border-app-border">${lang}</div>` : ""}
      <pre class="overflow-x-auto p-4 text-sm font-mono text-cloud-white/90 leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`;
  });

  // 2. Headings
  const withHeadings = withCode.replace(/^### (.*$)/gim, '<h3 class="mt-8 mb-4 text-xl font-bold text-cloud-white">$1</h3>')
                               .replace(/^## (.*$)/gim, '<h2 class="mt-10 mb-5 text-2xl font-extrabold text-cloud-white border-b border-app-border pb-2">$1</h2>')
                               .replace(/^# (.*$)/gim, '<h1 class="mt-12 mb-6 text-3xl font-black text-cloud-white">$1</h1>');

  // 3. Paragraphs (simple split)
  const lines = withHeadings.split("\n\n");
  return lines.map(line => {
    if (line.startsWith("<h") || line.startsWith("<div")) return line;
    return `<p class="mb-5 leading-relaxed text-cloud-white/85 text-lg">${line}</p>`;
  }).join("");
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await getServerAuth();

  const [post, categories, ratingStats, userRating, alreadyConsumed, comments] = await Promise.all([
    getPostById(id),
    getCategories(),
    getContentRatingStats(id),
    userId ? getUserRating(userId, id) : null,
    userId ? getUserContentProgress(userId, id) : false,
    getComments(id, "post"),
  ]);

  if (!post || !post.publishedAt) notFound();

  const dbUser = userId ? await getUserByUid(userId) : null;
  const sub = userId ? await getSubscription(userId) : null;
  const isSubscribed = sub?.status === "ACTIVE" || dbUser?.role === "ADMIN";

  if (post.isPremium && !isSubscribed) {
    // First paragraph of content for the blurred preview
    const previewText = post.content.split("\n\n").slice(0, 2).join("\n\n").replace(/[#*`]/g, "");

    return (
      <article className="mx-auto max-w-3xl py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Full visible header */}
        <header className="mb-10 border-b border-app-border pb-10">
          <div className="flex items-center gap-3 mb-5">
            {post.isPremium && (
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400 tracking-wide uppercase">
                Premium
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-cloud-white tracking-tight leading-tight mb-6">
            {post.title}
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-app-chip overflow-hidden ring-2 ring-midnight-blue">
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt={post.authorName || "Autor"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-tech-blue/30 text-cyan-ia font-bold">
                  {post.authorName?.[0] || "S"}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-cloud-white">{post.authorName || "Time SOS Contador"}</p>
              <p className="text-xs text-cloud-white/50">
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </header>

        {/* Blurred content preview + paywall overlay */}
        <div className="relative overflow-hidden rounded-2xl min-h-[400px]">
          {/* Blurred text preview */}
          <div className="pointer-events-none select-none px-2 blur-sm brightness-50">
            {post.thumbnail && (
              <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl">
                <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover" />
              </div>
            )}
            <p className="mb-5 leading-relaxed text-cloud-white/85 text-lg">{previewText}</p>
            <p className="mb-5 leading-relaxed text-cloud-white/85 text-lg">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </div>
          {/* Paywall modal overlay */}
          <PremiumPaywallModal contentTitle={post.title} returnPath={`/posts/${id}`} />
        </div>
      </article>
    );
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const category = post.categoryId ? categoryMap[post.categoryId] || null : null;

  return (
    <article className="mx-auto max-w-3xl py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="mb-12 border-b border-app-border pb-12">
        <div className="flex items-center gap-3 mb-6">
          {category && (
            <span className="rounded-full bg-indigo-900/30 px-4 py-1 text-xs font-bold text-indigo-300 tracking-wide uppercase">
              {category.name}
            </span>
          )}
          {post.isPremium && (
            <span className="rounded-full bg-amber-900/30 px-4 py-1 text-xs font-bold text-amber-400 tracking-wide uppercase">
              Premium
            </span>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-cloud-white tracking-tight leading-tight mb-8">
          {post.title}
        </h1>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-app-chip overflow-hidden ring-2 ring-midnight-blue shadow-sm">
            {post.authorAvatarUrl ? (
              <img src={post.authorAvatarUrl} alt={post.authorName || "Autor"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-tech-blue/30 text-cyan-ia font-bold">
                {post.authorName?.[0] || "S"}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-cloud-white">{post.authorName || "Time SOS Contador"}</p>
            <p className="text-xs text-cloud-white/50 font-medium">
              Publicado em {new Date(post.publishedAt || post.createdAt).toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div 
        className="prose prose-indigo max-w-none mb-16"
        dangerouslySetInnerHTML={{ __html: renderPostContent(post.content) }}
      />

      {/* Thermometer */}
      <Thermometer
        contentId={post.id}
        contentType="post"
        initialRating={userRating}
        stats={ratingStats}
      />

      {/* Consume */}
      {userId && (
        <div className="mt-6 flex items-center gap-3">
          <ConsumeButton contentId={post.id} contentType="post" initialConsumed={alreadyConsumed} />
          {!alreadyConsumed && (
            <span className="text-xs text-cloud-white/40">Marque como concluído para ganhar XP</span>
          )}
        </div>
      )}

      {/* Footer / Interaction */}
      <footer className="mt-20 border-t border-app-border pt-16">
        <div className="mb-12 rounded-2xl bg-midnight-blue p-8 text-center text-cloud-white border border-app-border">
          <h3 className="text-xl font-black mb-2">Gostou deste conteúdo?</h3>
          <p className="text-cloud-white/70 mb-6">Compartilhe sua dúvida ou o que achou deste artigo nos comentários abaixo.</p>
          <div className="flex justify-center gap-4">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-bold text-cyan-ia bg-deep-navy px-3 py-1.5 rounded-lg border border-app-border">#{tag}</span>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div id="comments" className="mt-12">
          <CommentsSection
            contentId={post.id}
            contentType="post"
            comments={comments as any}
            currentUserId={userId || null}
            isLoggedIn={!!userId}
          />
        </div>
      </footer>
    </article>
  );
}
