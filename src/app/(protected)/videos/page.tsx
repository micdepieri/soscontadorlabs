import { getVideos, getCategories, getFavoritesByUser } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/get-user";
import { getServerAuth } from "@/lib/server-auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ViewToggle } from "@/components/view-toggle";
import { SaveButton } from "@/components/save-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vídeos | Portal da Comunidade",
  description: "Todos os vídeos publicados na comunidade.",
};

export default async function VideosPage({
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

  const [categories, allVideos, favorites] = await Promise.all([
    getCategories(),
    getVideos({ publishedOnly: true, search: q || undefined }),
    userId ? getFavoritesByUser(userId) : Promise.resolve([]),
  ]);

  const savedIds = new Set(favorites.map((f) => f.contentId));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const selectedCategory = categoria ? categories.find((c) => c.slug === categoria) : null;

  const filteredVideos = selectedCategory
    ? allVideos.filter((v) => v.categoryId === selectedCategory.id)
    : allVideos;

  // Pinned first, then by date
  const sortedVideos = filteredVideos.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const da = new Date(a.publishedAt || a.createdAt).getTime();
    const db = new Date(b.publishedAt || b.createdAt).getTime();
    return db - da;
  });

  const videosWithCategory = sortedVideos.map((item) => ({
    ...item,
    publishedAtDate: item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt),
    category: item.categoryId ? categoryMap[item.categoryId] || null : null,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      {isAdmin ? (
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-lg">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold">Vídeos</h1>
            <p className="mt-2 text-indigo-100">Gerencie os vídeos publicados na comunidade.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-transform active:scale-95 hover:bg-gray-50">
                Publicar Vídeo
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold text-cloud-white line-clamp-1">
            {selectedCategory ? `# ${selectedCategory.name}` : "Vídeos"}
          </h1>
          <p className="mt-2 text-cloud-white/60 max-w-2xl">
            {selectedCategory ? `Vídeos sobre ${selectedCategory.name}.` : "Todos os vídeos publicados na comunidade."}
          </p>
        </div>
      )}

      {/* Search + view toggle */}
      <form className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar vídeos..."
          className="flex-1 rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none" />
        <select name="categoria" defaultValue={categoria || ""}
          className="rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none">
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-tech-blue px-6 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80 font-semibold">
          Buscar
        </button>
        <Suspense fallback={null}>
          <ViewToggle view={isList ? "list" : "grid"} />
        </Suspense>
      </form>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/videos" className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${!categoria ? "bg-tech-blue text-white" : "bg-app-chip text-cloud-white/70 hover:bg-app-chip-accent"}`}>
            Todos
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/videos?categoria=${c.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${categoria === c.slug ? "bg-tech-blue text-white" : "bg-app-chip text-cloud-white/70 hover:bg-app-chip-accent"}`}>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Content */}
      {videosWithCategory.length === 0 ? (
        <div className="py-20 text-center text-cloud-white/50">
          <p className="text-lg font-medium">Nenhum vídeo encontrado.</p>
          {(q || categoria) && <Link href="/videos" className="mt-4 inline-block text-sm text-cyan-ia hover:underline">Limpar filtros</Link>}
        </div>
      ) : isList ? (
        <div className="flex flex-col gap-2">
          {videosWithCategory.map((item) => (
            <div key={item.id} className="group relative flex items-center gap-4 rounded-xl border border-app-border bg-midnight-blue px-4 py-3 transition-all hover:border-cyan-ia/50 hover:shadow-md">
              {item.isPinned && (
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-cyan-ia" />
              )}
              <Link href={`/videos/${item.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900/60 to-purple-900/60">
                      <svg className="h-6 w-6 text-cyan-ia/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.isPinned && <span className="text-[10px] font-bold text-cyan-ia uppercase tracking-wider">📌 Destaque</span>}
                    <span className="rounded-md bg-tech-blue/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-ia">Vídeo</span>
                    {item.isPremium && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Premium</span>}
                  </div>
                  <h2 className="line-clamp-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">{item.title}</h2>
                  {item.description && <p className="mt-0.5 line-clamp-1 text-xs text-cloud-white/50">{item.description}</p>}
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  {item.category && <span className="text-[10px] font-bold text-cloud-white/40 uppercase tracking-tight">{item.category.name}</span>}
                  <span className="text-[10px] text-cloud-white/40">{item.publishedAtDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </Link>
              {userId && <SaveButton contentId={item.id} contentType="video" initialSaved={savedIds.has(item.id)} compact />}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videosWithCategory.map((item) => (
            <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-app-border bg-midnight-blue shadow-sm transition-all hover:border-cyan-ia/50 hover:shadow-md">
              {item.isPinned && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-midnight-blue/90 px-2 py-0.5 text-[10px] font-bold text-cyan-ia backdrop-blur-sm border border-cyan-ia/30">
                  📌 Destaque
                </div>
              )}
              {userId && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SaveButton contentId={item.id} contentType="video" initialSaved={savedIds.has(item.id)} compact />
                </div>
              )}
              <Link href={`/videos/${item.id}`} className="flex flex-1 flex-col">
                {item.thumbnail ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <svg className="h-12 w-12 text-cyan-ia/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="rounded-md bg-tech-blue/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-ia">Vídeo</span>
                    {item.isPremium && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Premium</span>}
                  </div>
                  <h2 className="line-clamp-2 flex-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">{item.title}</h2>
                  {item.description && <p className="mt-2 line-clamp-2 text-xs text-cloud-white/50">{item.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-app-border pt-3">
                    {item.category && <span className="text-[10px] font-bold text-cloud-white/40 uppercase tracking-tight">{item.category.name}</span>}
                    <span className="text-[10px] text-cloud-white/40">{item.publishedAtDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
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
