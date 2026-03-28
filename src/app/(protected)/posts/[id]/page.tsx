import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/server-auth";
import { getPostById, getUserByUid, getSubscription, getCategories, getContentRatingStats, getUserRating } from "@/lib/firestore";
import Link from "next/link";
import CommentsSection from "@/components/comments-section";
import Thermometer from "@/components/thermometer";
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
    return `<div class="my-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50 shadow-inner">
      ${lang ? `<div class="bg-gray-100 px-4 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">${lang}</div>` : ""}
      <pre class="overflow-x-auto p-4 text-sm font-mono text-gray-800 leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`;
  });

  // 2. Headings
  const withHeadings = withCode.replace(/^### (.*$)/gim, '<h3 class="mt-8 mb-4 text-xl font-bold text-gray-900">$1</h3>')
                               .replace(/^## (.*$)/gim, '<h2 class="mt-10 mb-5 text-2xl font-extrabold text-gray-900 border-b border-gray-100 pb-2">$1</h2>')
                               .replace(/^# (.*$)/gim, '<h1 class="mt-12 mb-6 text-3xl font-black text-gray-900">$1</h1>');

  // 3. Paragraphs (simple split)
  const lines = withHeadings.split("\n\n");
  return lines.map(line => {
    if (line.startsWith("<h") || line.startsWith("<div")) return line;
    return `<p class="mb-5 leading-relaxed text-gray-800 text-lg">${line}</p>`;
  }).join("");
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const { userId } = await getServerAuth();

  const [post, categories, ratingStats, userRating] = await Promise.all([
    getPostById(id),
    getCategories(),
    getContentRatingStats(id),
    userId ? getUserRating(userId, id) : null,
  ]);

  if (!post || !post.publishedAt) notFound();

  const dbUser = userId ? await getUserByUid(userId) : null;
  const sub = userId ? await getSubscription(userId) : null;
  const isSubscribed = sub?.status === "ACTIVE" || dbUser?.role === "ADMIN";

  if (post.isPremium && !isSubscribed) {
    return (
      <div className="mx-auto max-w-2xl py-24 text-center animate-in fade-in zoom-in-95">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 shadow-sm">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="mb-4 text-3xl font-black text-gray-900">{post.title}</h1>
        <p className="mb-10 text-gray-600 text-lg">
          Este conteúdo exclusivo faz parte do nosso plano premium. Assine hoje para acessar este e centenas de outros códigos e estratégias.
        </p>
        <Link
          href="/assinatura"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
        >
          Destravar agora
        </Link>
      </div>
    );
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c]));
  const category = post.categoryId ? categoryMap[post.categoryId] || null : null;

  return (
    <article className="mx-auto max-w-3xl py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <header className="mb-12 border-b border-gray-100 pb-12">
        <div className="flex items-center gap-3 mb-6">
          {category && (
            <span className="rounded-full bg-indigo-50 px-4 py-1 text-xs font-bold text-indigo-700 tracking-wide uppercase">
              {category.name}
            </span>
          )}
          {post.isPremium && (
            <span className="rounded-full bg-amber-100 px-4 py-1 text-xs font-bold text-amber-700 tracking-wide uppercase">
              Premium
            </span>
          )}
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-8">
          {post.title}
        </h1>

        <div className="flex items-center gap-4">
          <div className="h-12 w-12 shrink-0 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white shadow-sm">
            {post.authorAvatarUrl ? (
              <img src={post.authorAvatarUrl} alt={post.authorName || "Autor"} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-indigo-700 font-bold">
                {post.authorName?.[0] || "S"}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{post.authorName || "Time SOS Contador"}</p>
            <p className="text-xs text-gray-400 font-medium">
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

      {/* Footer / Interaction */}
      <footer className="mt-20 border-t border-gray-200 pt-16">
        <div className="mb-12 rounded-2xl bg-gray-50 p-8 text-center text-gray-900 shadow-sm border border-gray-100">
          <h3 className="text-xl font-black mb-2">Gostou deste conteúdo?</h3>
          <p className="text-gray-600 mb-6">Compartilhe sua dúvida ou o que achou deste artigo nos comentários abaixo.</p>
          <div className="flex justify-center gap-4">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-xs">#{tag}</span>
            ))}
          </div>
        </div>

        {/* Comments Section */}
        <div id="comments" className="mt-12">
          <CommentsSection
            contentId={post.id}
            contentType="post"
            comments={[]}
            currentUserId={userId || null}
            isLoggedIn={!!userId}
          />
        </div>
      </footer>
    </article>
  );
}
