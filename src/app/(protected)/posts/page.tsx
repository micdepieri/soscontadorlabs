import { getPosts, getCategories, getFavoritesByUser } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/get-user";
import { getServerAuth } from "@/lib/server-auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ViewToggle } from "@/components/view-toggle";
import { SaveButton } from "@/components/save-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artigos | Portal da Comunidade",
  description: "Artigos, tutoriais e códigos de agentes de IA para contadores.",
};

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;
  const cookieStore = await cookies();
  const isList = cookieStore.get("content-view")?.value === "list";
  const user = await getCurrentUser();
  const { userId } = await getServerAuth();
  const isAdmin = user?.role === "ADMIN";

  const [categories, allPosts, favorites] = await Promise.all([
    getCategories(),
    getPosts({ publishedOnly: true, search: q || undefined }),
    userId ? getFavoritesByUser(userId) : Promise.resolve([]),
  ]);

  const savedIds = new Set(favorites.map((f) => f.contentId));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const selectedCategory = categoria ? categories.find((c) => c.slug === categoria) : null;

  const posts = selectedCategory ? allPosts.filter((p) => p.categoryId === selectedCategory.id) : allPosts;

  // Pinned first, then by date
  const sortedPosts = posts.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const da = new Date(a.publishedAt || a.createdAt).getTime();
    const db = new Date(b.publishedAt || b.createdAt).getTime();
    return db - da;
  });

  const postsWithCategory = sortedPosts.map((p) => ({
    ...p,
    publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    category: p.categoryId ? categoryMap[p.categoryId] || null : null,
  }));

  return (
    <div>
      <div className="mb-8">
        {isAdmin ? (
          <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-lg">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold">Artigos e Postagens</h1>
              <p className="mt-2 text-indigo-100">Gerencie os artigos e postagens publicados na comunidade.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/admin?tab=posts" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-transform active:scale-95 hover:bg-gray-50">
                  Publicar Artigo
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-cloud-white line-clamp-1">
              {selectedCategory ? `# ${selectedCategory.name}` : "Artigos e Postagens"}
            </h1>
            <p className="mt-2 text-cloud-white/60 max-w-2xl text-lg">
              {selectedCategory ? `Explorando artigos sobre ${selectedCategory.name}.` : "Confira as últimas estratégias, códigos e automações de IA preparadas para você."}
            </p>
          </>
        )}
      </div>

      {/* Search + Filter + view toggle */}
      <form className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar artigos..."
          className="flex-1 rounded-lg border border-app-border px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none shadow-sm" />
        <select name="categoria" defaultValue={categoria || ""}
          className="rounded-lg border border-app-border px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none shadow-sm">
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-tech-blue px-8 py-2.5 text-sm font-semibold text-white transition-all hover:bg-tech-blue/80 active:scale-95 shadow-md shadow-indigo-100">
          Buscar
        </button>
        <Suspense fallback={null}>
          <ViewToggle view={isList ? "list" : "grid"} />
        </Suspense>
      </form>

      {postsWithCategory.length === 0 ? (
        <div className="py-20 text-center text-cloud-white/40">
          <div className="mx-auto mb-4 h-16 w-16 text-cloud-white/20">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 3v5h5" />
            </svg>
          </div>
          <p className="text-xl font-medium">Nenhum artigo encontrado.</p>
          {(q || categoria) && <Link href="/posts" className="mt-4 inline-block text-sm text-cyan-ia hover:underline">Limpar filtros</Link>}
        </div>
      ) : isList ? (
        <div className="flex flex-col gap-2">
          {postsWithCategory.map((post) => (
            <div key={post.id} className="group relative flex items-center gap-4 rounded-xl border border-app-border bg-midnight-blue px-4 py-3 transition-all hover:border-cyan-ia/50 hover:shadow-md">
              {post.isPinned && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-cyan-ia" />}
              <Link href={`/posts/${post.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg">
                  {post.thumbnail ? (
                    <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-deep-navy border border-app-border rounded-lg">
                      <svg className="h-6 w-6 text-cloud-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {post.isPinned && <span className="text-[10px] font-bold text-cyan-ia uppercase tracking-wider">📌 Destaque</span>}
                    {post.category && <span className="text-[10px] font-bold text-cyan-ia uppercase tracking-wider">{post.category.name}</span>}
                    {post.isPremium && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100 uppercase">Premium</span>}
                  </div>
                  <h2 className="line-clamp-1 font-bold text-cloud-white transition-colors group-hover:text-cyan-ia">{post.title}</h2>
                  <p className="mt-0.5 line-clamp-1 text-xs text-cloud-white/50">{post.content.split('\n\n')[0].replace(/[#*`]/g, '')}</p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                  <div className="flex items-center gap-1.5">
                    <div className="h-5 w-5 rounded-full bg-tech-blue/30 flex items-center justify-center text-[9px] font-bold text-cyan-ia">{post.authorName?.[0] || 'S'}</div>
                    <span className="text-xs text-cloud-white/50">{post.authorName || 'SOS Contador'}</span>
                  </div>
                  <span className="text-[10px] text-cloud-white/40">{post.publishedAt?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </Link>
              {userId && <SaveButton contentId={post.id} contentType="post" initialSaved={savedIds.has(post.id)} compact />}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {postsWithCategory.map((post) => (
            <div key={post.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-app-border bg-midnight-blue transition-all hover:border-cyan-ia/50 hover:shadow-xl hover:shadow-indigo-50/50">
              {post.isPinned && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-midnight-blue/90 px-2 py-0.5 text-[10px] font-bold text-cyan-ia backdrop-blur-sm border border-cyan-ia/30">
                  📌 Destaque
                </div>
              )}
              {userId && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SaveButton contentId={post.id} contentType="post" initialSaved={savedIds.has(post.id)} compact />
                </div>
              )}
              <Link href={`/posts/${post.id}`} className="flex flex-1 flex-col">
                {post.thumbnail ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-deep-navy border-b border-app-border">
                    <div className="text-cyan-ia opacity-20 transition-opacity group-hover:opacity-40">
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    {post.category && <span className="text-xs font-bold text-cyan-ia uppercase tracking-wider">{post.category.name}</span>}
                    {post.isPremium && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 border border-amber-100 uppercase">Premium</span>}
                  </div>
                  <h2 className="mb-2 line-clamp-2 text-xl font-bold leading-tight text-cloud-white transition-colors group-hover:text-cyan-ia">{post.title}</h2>
                  <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-cloud-white/50">{post.content.split('\n\n')[0].replace(/[#*`]/g, '')}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-app-border">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-tech-blue/30 flex items-center justify-center text-[10px] font-bold text-cyan-ia">{post.authorName?.[0] || 'S'}</div>
                      <span className="text-xs font-semibold text-cloud-white/60">{post.authorName || 'SOS Contador'}</span>
                    </div>
                    <span className="text-xs text-cloud-white/40">{post.publishedAt?.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
