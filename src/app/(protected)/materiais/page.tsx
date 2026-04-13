import { getMaterials, getCategories, getFavoritesByUser } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/get-user";
import { getServerAuth } from "@/lib/server-auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ViewToggle } from "@/components/view-toggle";
import { SaveButton } from "@/components/save-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Materiais | Portal da Comunidade",
  description: "PDFs, links e recursos sobre IA para contadores.",
};

const typeLabels: Record<string, string> = { PDF: "PDF", LINK: "Link", RESOURCE: "Recurso" };

const typeIcons: Record<string, React.ReactNode> = {
  PDF: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  LINK: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  RESOURCE: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
};

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; tipo?: string }>;
}) {
  const { q, categoria, tipo } = await searchParams;
  const cookieStore = await cookies();
  const isList = cookieStore.get("content-view")?.value === "list";
  const user = await getCurrentUser();
  const { userId } = await getServerAuth();
  const isAdmin = user?.role === "ADMIN";

  const [categories, allMaterials, favorites] = await Promise.all([
    getCategories(),
    getMaterials({ publishedOnly: true, search: q || undefined, type: tipo || undefined }),
    userId ? getFavoritesByUser(userId) : Promise.resolve([]),
  ]);

  const savedIds = new Set(favorites.map((f) => f.contentId));
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const selectedCategory = categoria ? categories.find((c) => c.slug === categoria) : null;

  const filtered = selectedCategory ? allMaterials.filter((m) => m.categoryId === selectedCategory.id) : allMaterials;

  // Pinned first, then by date
  const sorted = filtered.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const da = new Date(a.publishedAt || a.createdAt).getTime();
    const db = new Date(b.publishedAt || b.createdAt).getTime();
    return db - da;
  });

  const materialsWithCategory = sorted.map((m) => ({
    ...m,
    publishedAt: m.publishedAt ? new Date(m.publishedAt) : null,
    category: m.categoryId ? categoryMap[m.categoryId] || null : null,
  }));

  return (
    <div>
      <div className="mb-8">
        {isAdmin ? (
          <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-lg">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold">Biblioteca de Materiais</h1>
              <p className="mt-2 text-indigo-100">Gerencie PDFs, links e recursos publicados na comunidade.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/admin?tab=materials" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-transform active:scale-95 hover:bg-gray-50">
                  Adicionar Material
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-cloud-white">{selectedCategory ? `# ${selectedCategory.name}` : "Materiais"}</h1>
            <p className="mt-2 text-cloud-white/60">{selectedCategory ? `Materiais sobre ${selectedCategory.name}.` : "PDFs, links e recursos práticos sobre IA para contadores."}</p>
          </>
        )}
      </div>

      {/* Search + Filter + view toggle */}
      <form className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar materiais..."
          className="flex-1 rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none" />
        <select name="categoria" defaultValue={categoria || ""}
          className="rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none">
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
        <select name="tipo" defaultValue={tipo || ""}
          className="rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none">
          <option value="">Todos os tipos</option>
          <option value="PDF">PDF</option>
          <option value="LINK">Link</option>
          <option value="RESOURCE">Recurso</option>
        </select>
        <button type="submit" className="rounded-lg bg-tech-blue px-6 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80">
          Buscar
        </button>
        <Suspense fallback={null}>
          <ViewToggle view={isList ? "list" : "grid"} />
        </Suspense>
      </form>

      {materialsWithCategory.length === 0 ? (
        <div className="py-20 text-center text-cloud-white/50">
          <p className="text-lg">Nenhum material encontrado.</p>
          {(q || categoria || tipo) && <Link href="/materiais" className="mt-4 inline-block text-sm text-cyan-ia hover:underline">Limpar filtros</Link>}
        </div>
      ) : isList ? (
        <div className="flex flex-col gap-2">
          {materialsWithCategory.map((material) => (
            <div key={material.id} className="group relative flex items-center gap-4 rounded-xl border border-app-border bg-midnight-blue px-4 py-3 transition-all hover:border-cyan-ia/50 hover:shadow-md">
              {material.isPinned && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-cyan-ia" />}
              <Link href={`/materiais/${material.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-lg">
                  {material.thumbnail ? (
                    <img src={material.thumbnail} alt={material.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-tech-blue/20 text-cyan-ia transition-colors group-hover:bg-tech-blue/30">
                      {typeIcons[material.type]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {material.isPinned && <span className="text-[10px] font-bold text-cyan-ia uppercase tracking-wider">📌</span>}
                  </div>
                  <h2 className="line-clamp-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">{material.title}</h2>
                  {material.description && <p className="mt-0.5 line-clamp-1 text-xs text-cloud-white/50">{material.description}</p>}
                  {material.category && <span className="mt-0.5 inline-block text-[10px] font-medium text-cyan-ia">{material.category.name}</span>}
                </div>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  {material.isPremium && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Premium</span>}
                  <span className="rounded-full bg-app-chip px-2 py-0.5 text-xs text-cloud-white/60">{typeLabels[material.type]}</span>
                </div>
              </Link>
              {userId && <SaveButton contentId={material.id} contentType="material" initialSaved={savedIds.has(material.id)} compact />}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {materialsWithCategory.map((material) => (
            <div key={material.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-app-border bg-midnight-blue transition-all hover:border-cyan-ia/50 hover:shadow-md">
              {material.isPinned && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-midnight-blue/90 px-2 py-0.5 text-[10px] font-bold text-cyan-ia backdrop-blur-sm border border-cyan-ia/30">
                  📌 Destaque
                </div>
              )}
              {userId && (
                <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SaveButton contentId={material.id} contentType="material" initialSaved={savedIds.has(material.id)} compact />
                </div>
              )}
              <Link href={`/materiais/${material.id}`} className="flex flex-col">
                {material.thumbnail && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={material.thumbnail} alt={material.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                )}
                <div className="flex items-start gap-4 p-5">
                  {!material.thumbnail && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tech-blue/20 text-cyan-ia transition-colors group-hover:bg-tech-blue/30">
                      {typeIcons[material.type]}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">{material.title}</h2>
                      <div className="flex shrink-0 items-center gap-2">
                        {material.isPremium && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Premium</span>}
                        <span className="rounded-full bg-app-chip px-2 py-0.5 text-xs text-cloud-white/60">{typeLabels[material.type]}</span>
                      </div>
                    </div>
                    {material.description && <p className="mt-1 line-clamp-2 text-sm text-cloud-white/50">{material.description}</p>}
                    {material.category && <span className="mt-2 inline-block text-xs font-medium text-cyan-ia">{material.category.name}</span>}
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
