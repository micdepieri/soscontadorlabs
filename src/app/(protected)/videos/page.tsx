import { getVideos, getCategories, getPosts } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/get-user";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal da Comunidade",
  description: "Biblioteca de vídeos e artigos sobre IA e tecnologia para contadores.",
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const [categories, allVideos, allPosts] = await Promise.all([
    getCategories(),
    getVideos({ publishedOnly: true, search: q || undefined }),
    getPosts({ publishedOnly: true, search: q || undefined }),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const selectedCategory = categoria ? categories.find((c) => c.slug === categoria) : null;

  // Combine and sort by publishedAt
  const combinedContent = [
    ...allVideos.map(v => ({ ...v, contentType: 'video' as const })),
    ...allPosts.map(p => ({ ...p, contentType: 'post' as const }))
  ];

  const filteredContent = selectedCategory
    ? combinedContent.filter((c) => c.categoryId === selectedCategory.id)
    : combinedContent;

  const sortedContent = filteredContent.sort((a, b) => {
    const da = new Date(a.publishedAt || a.createdAt).getTime();
    const db = new Date(b.publishedAt || b.createdAt).getTime();
    return db - da;
  });

  const contentWithCategory = sortedContent.map((item) => ({
    ...item,
    publishedAtDate: item.publishedAt ? new Date(item.publishedAt) : new Date(item.createdAt),
    category: item.categoryId ? categoryMap[item.categoryId] || null : null,
  }));

  return (
    <div className="space-y-8">
      {/* Dynamic Header based on Role */}
      {isAdmin ? (
        <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-lg">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold">Olá, Administrador! 👋</h1>
            <p className="mt-2 text-indigo-100">
              Gerencie a publicação de novos conteúdos para a comunidade. 
              Mantenha os canais ativos com vídeos, artigos e materiais práticos.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-transform active:scale-95 hover:bg-gray-50"
              >
                Publicar Conteúdo
              </Link>
              <Link
                href="/admin?tab=categories"
                className="rounded-lg bg-indigo-500/30 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:bg-indigo-500/40"
              >
                Gerenciar Canais
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold text-cloud-white line-clamp-1">
            {selectedCategory ? `# ${selectedCategory.name}` : "Portal da Comunidade"}
          </h1>
          <p className="mt-2 text-cloud-white/60 max-w-2xl">
            {selectedCategory 
              ? `Explorando conteúdos sobre ${selectedCategory.name}.` 
              : "Bem-vindo! Escolha um canal na lateral para começar a explorar as experiências práticas com IA."
            }
          </p>
        </div>
      )}

      {/* Search + Filter */}
      <form className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar vídeos ou artigos..."
          className="flex-1 rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
        />
        <select
          name="categoria"
          defaultValue={categoria || ""}
          className="rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-tech-blue px-6 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80 font-semibold"
        >
          Buscar
        </button>
      </form>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/videos"
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              !categoria
                ? "bg-tech-blue text-white"
                : "bg-app-chip text-cloud-white/70 hover:bg-app-chip-accent"
            }`}
          >
            Todos
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/videos?categoria=${c.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                categoria === c.slug
                  ? "bg-tech-blue text-white"
                  : "bg-app-chip text-cloud-white/70 hover:bg-app-chip-accent"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Content grid */}
      {contentWithCategory.length === 0 ? (
        <div className="py-20 text-center text-cloud-white/50">
          <p className="text-lg font-medium">Nenhum conteúdo encontrado.</p>
          {(q || categoria) && (
            <Link
              href="/videos"
              className="mt-4 inline-block text-sm text-cyan-ia hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contentWithCategory.map((item) => {
            const isVideo = item.contentType === 'video';
            const href = isVideo ? `/videos/${item.id}` : `/posts/${item.id}`;
            
            return (
              <Link
                key={item.id}
                href={href}
                className="group flex flex-col overflow-hidden rounded-xl border border-app-border bg-midnight-blue shadow-sm transition-all hover:border-cyan-ia/50 hover:shadow-md"
              >
                {/* Visual Header (Thumbnail or Icon) */}
                {item.thumbnail ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className={`flex aspect-video w-full items-center justify-center ${isVideo ? 'bg-gradient-to-br from-indigo-100 to-purple-100' : 'bg-deep-navy border-b border-app-border'}`}>
                    {isVideo ? (
                      <svg
                        className="h-12 w-12 text-cyan-ia/60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    ) : (
                      <svg className="h-12 w-12 text-cloud-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                )}

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isVideo ? 'bg-tech-blue/30 text-cyan-ia' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isVideo ? 'Vídeo' : 'Artigo'}
                      </span>
                      {item.isPremium && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <h2 className="line-clamp-2 flex-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">
                    {item.title}
                  </h2>
                  
                  {'description' in item && item.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-cloud-white/50">{item.description}</p>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between border-t border-app-border pt-3">
                    {item.category && (
                      <span className="text-[10px] font-bold text-cloud-white/40 uppercase tracking-tight">
                        {item.category.name}
                      </span>
                    )}
                    <span className="text-[10px] text-cloud-white/40">
                      {item.publishedAtDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
