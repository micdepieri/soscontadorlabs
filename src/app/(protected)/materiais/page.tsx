import { getMaterials, getCategories } from "@/lib/firestore";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Materiais | Portal da Comunidade",
  description: "PDFs, links e recursos sobre IA para contadores.",
};

const typeLabels: Record<string, string> = {
  PDF: "PDF",
  LINK: "Link",
  RESOURCE: "Recurso",
};

const typeIcons: Record<string, React.ReactNode> = {
  PDF: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  LINK: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  ),
  RESOURCE: (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
};

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string; tipo?: string }>;
}) {
  const { q, categoria, tipo } = await searchParams;

  const [categories, allMaterials] = await Promise.all([
    getCategories(),
    getMaterials({ publishedOnly: true, search: q || undefined, type: tipo || undefined }),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const selectedCategory = categoria ? categories.find((c) => c.slug === categoria) : null;

  const materials = selectedCategory
    ? allMaterials.filter((m) => m.categoryId === selectedCategory.id)
    : allMaterials;

  const materialsWithCategory = materials.map((m) => ({
    ...m,
    publishedAt: m.publishedAt ? new Date(m.publishedAt) : null,
    category: m.categoryId ? categoryMap[m.categoryId] || null : null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-cloud-white">Materiais</h1>
        <p className="mt-2 text-cloud-white/60">
          PDFs, links e recursos práticos sobre IA para contadores.
        </p>
      </div>

      {/* Search + Filter */}
      <form className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar materiais..."
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
        <select
          name="tipo"
          defaultValue={tipo || ""}
          className="rounded-lg border border-app-border px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-ia focus:outline-none"
        >
          <option value="">Todos os tipos</option>
          <option value="PDF">PDF</option>
          <option value="LINK">Link</option>
          <option value="RESOURCE">Recurso</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-tech-blue px-6 py-2 text-sm text-white transition-colors hover:bg-tech-blue/80"
        >
          Buscar
        </button>
      </form>

      {/* Materials list */}
      {materialsWithCategory.length === 0 ? (
        <div className="py-20 text-center text-cloud-white/50">
          <p className="text-lg">Nenhum material encontrado.</p>
          {(q || categoria || tipo) && (
            <Link
              href="/materiais"
              className="mt-4 inline-block text-sm text-cyan-ia hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {materialsWithCategory.map((material) => (
            <Link
              key={material.id}
              href={`/materiais/${material.id}`}
              className="group flex items-start gap-4 rounded-xl border border-app-border bg-midnight-blue p-5 transition-all hover:border-cyan-ia/50 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tech-blue/20 text-cyan-ia transition-colors group-hover:bg-tech-blue/30">
                {typeIcons[material.type]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">
                    {material.title}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {material.isPremium && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Premium
                      </span>
                    )}
                    <span className="rounded-full bg-app-chip px-2 py-0.5 text-xs text-cloud-white/60">
                      {typeLabels[material.type]}
                    </span>
                  </div>
                </div>
                {material.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-cloud-white/50">{material.description}</p>
                )}
                {material.category && (
                  <span className="mt-2 inline-block text-xs font-medium text-cyan-ia">
                    {material.category.name}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
