import { prisma } from "@/lib/prisma";
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  LINK: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  RESOURCE: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  const [categories, materials] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.material.findMany({
      where: {
        publishedAt: { not: null },
        ...(categoria ? { category: { slug: categoria } } : {}),
        ...(tipo ? { type: tipo as "PDF" | "LINK" | "RESOURCE" } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Materiais</h1>
        <p className="mt-2 text-gray-600">
          PDFs, links e recursos práticos sobre IA para contadores.
        </p>
      </div>

      {/* Search + Filter */}
      <form className="mb-8 flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar materiais..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          name="categoria"
          defaultValue={categoria || ""}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos os tipos</option>
          <option value="PDF">PDF</option>
          <option value="LINK">Link</option>
          <option value="RESOURCE">Recurso</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Materials list */}
      {materials.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">Nenhum material encontrado.</p>
          {(q || categoria || tipo) && (
            <Link href="/materiais" className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((material) => (
            <Link
              key={material.id}
              href={`/materiais/${material.id}`}
              className="group flex items-start gap-4 rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all bg-white"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-100 transition-colors">
                {typeIcons[material.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {material.title}
                  </h2>
                  <div className="flex shrink-0 items-center gap-2">
                    {material.isPremium && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        Premium
                      </span>
                    )}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {typeLabels[material.type]}
                    </span>
                  </div>
                </div>
                {material.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{material.description}</p>
                )}
                {material.category && (
                  <span className="mt-2 inline-block text-xs text-indigo-600 font-medium">
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
