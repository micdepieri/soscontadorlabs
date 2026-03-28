import { getVideos, getCategories } from "@/lib/firestore";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vídeos | Portal da Comunidade",
  description: "Biblioteca de vídeos sobre IA e tecnologia para contadores.",
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;

  const [categories, allVideos] = await Promise.all([
    getCategories(),
    getVideos({ publishedOnly: true, search: q || undefined }),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const selectedCategory = categoria ? categories.find((c) => c.slug === categoria) : null;

  const videos = selectedCategory
    ? allVideos.filter((v) => v.categoryId === selectedCategory.id)
    : allVideos;

  const videosWithCategory = videos.map((v) => ({
    ...v,
    publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
    category: v.categoryId ? categoryMap[v.categoryId] || null : null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vídeos</h1>
        <p className="mt-2 text-gray-600">
          Experiências práticas com IA para contadores — sem jargões.
        </p>
      </div>

      {/* Search + Filter */}
      <form className="mb-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar vídeos..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
        <select
          name="categoria"
          defaultValue={categoria || ""}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm text-white transition-colors hover:bg-indigo-700"
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
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Video grid */}
      {videosWithCategory.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          <p className="text-lg">Nenhum vídeo encontrado.</p>
          {(q || categoria) && (
            <Link
              href="/videos"
              className="mt-4 inline-block text-sm text-indigo-600 hover:underline"
            >
              Limpar filtros
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videosWithCategory.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-indigo-300 hover:shadow-md"
            >
              {video.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="aspect-video w-full object-cover transition-opacity group-hover:opacity-90"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                  <svg
                    className="h-12 w-12 text-indigo-400"
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
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                    {video.title}
                  </h2>
                  {video.isPremium && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Premium
                    </span>
                  )}
                </div>
                {video.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{video.description}</p>
                )}
                {video.category && (
                  <span className="mt-2 inline-block text-xs font-medium text-indigo-600">
                    {video.category.name}
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
