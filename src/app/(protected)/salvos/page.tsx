import { getFavoritesByUser, getVideoById, getPostById, getMaterialById } from "@/lib/firestore";
import { getCurrentUser } from "@/lib/get-user";
import { getServerAuth } from "@/lib/server-auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ViewToggle } from "@/components/view-toggle";
import { SaveButton } from "@/components/save-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salvos | Portal da Comunidade",
  description: "Seus conteúdos salvos.",
};

export default async function SalvosPage() {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const cookieStore = await cookies();
  const isList = cookieStore.get("content-view")?.value === "list";
  const user = await getCurrentUser();

  const favorites = await getFavoritesByUser(userId);

  if (favorites.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cloud-white">Salvos</h1>
          <p className="mt-2 text-cloud-white/60">Conteúdos que você marcou para acessar depois.</p>
        </div>
        <div className="py-24 text-center text-cloud-white/40">
          <svg className="mx-auto mb-4 h-12 w-12 text-cloud-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-lg font-medium">Nenhum conteúdo salvo ainda.</p>
          <p className="mt-1 text-sm text-cloud-white/30">Clique no ícone de bookmark em qualquer vídeo, artigo ou material.</p>
          <Link href="/inicio" className="mt-6 inline-block rounded-lg bg-tech-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-tech-blue/80 transition-colors">
            Explorar conteúdos
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all saved content in parallel
  const contentItems = await Promise.all(
    favorites.map(async (fav) => {
      try {
        if (fav.contentType === "video") {
          const item = await getVideoById(fav.contentId);
          return item ? { ...item, contentType: "video" as const, savedAt: fav.savedAt } : null;
        } else if (fav.contentType === "post") {
          const item = await getPostById(fav.contentId);
          return item ? { ...item, contentType: "post" as const, savedAt: fav.savedAt } : null;
        } else {
          const item = await getMaterialById(fav.contentId);
          return item ? { ...item, contentType: "material" as const, savedAt: fav.savedAt } : null;
        }
      } catch {
        return null;
      }
    })
  );

  const items = contentItems.filter(Boolean) as NonNullable<(typeof contentItems)[number]>[];

  const typeLabel = { video: "Vídeo", post: "Artigo", material: "Material" } as const;
  const typeColor = {
    video: "bg-tech-blue/30 text-cyan-ia",
    post: "bg-emerald-100 text-emerald-700",
    material: "bg-purple-100 text-purple-700",
  } as const;

  const hrefFor = (item: (typeof items)[number]) => {
    if (item.contentType === "video") return `/videos/${item.id}`;
    if (item.contentType === "post") return `/posts/${item.id}`;
    return `/materiais/${item.id}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-cloud-white">Salvos</h1>
          <p className="mt-2 text-cloud-white/60">
            {items.length} {items.length === 1 ? "item salvo" : "itens salvos"}
          </p>
        </div>
        <Suspense fallback={null}>
          <ViewToggle view={isList ? "list" : "grid"} />
        </Suspense>
      </div>

      {isList ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div key={item.id} className="group relative flex items-center gap-4 rounded-xl border border-app-border bg-midnight-blue px-4 py-3 transition-all hover:border-cyan-ia/50 hover:shadow-md">
              <Link href={hrefFor(item)} className="flex flex-1 items-center gap-4 min-w-0">
                <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded-lg">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center rounded-lg ${item.contentType === "video" ? "bg-gradient-to-br from-indigo-900/60 to-purple-900/60" : "bg-deep-navy border border-app-border"}`}>
                      <svg className="h-6 w-6 text-cloud-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor[item.contentType]}`}>
                      {typeLabel[item.contentType]}
                    </span>
                    {item.isPremium && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase">Premium</span>}
                  </div>
                  <h2 className="line-clamp-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">{item.title}</h2>
                  {'description' in item && item.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-cloud-white/50">{item.description}</p>
                  )}
                </div>
                <span className="hidden shrink-0 text-[10px] text-cloud-white/30 sm:block">
                  Salvo em {new Date(item.savedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                </span>
              </Link>
              <SaveButton contentId={item.id} contentType={item.contentType} initialSaved={true} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-app-border bg-midnight-blue shadow-sm transition-all hover:border-cyan-ia/50 hover:shadow-md">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <SaveButton contentId={item.id} contentType={item.contentType} initialSaved={true} compact />
              </div>
              <Link href={hrefFor(item)} className="flex flex-1 flex-col">
                {item.thumbnail ? (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className={`flex aspect-video w-full items-center justify-center ${item.contentType === "video" ? "bg-gradient-to-br from-indigo-100 to-purple-100" : "bg-deep-navy border-b border-app-border"}`}>
                    <svg className="h-12 w-12 text-cloud-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor[item.contentType]}`}>
                      {typeLabel[item.contentType]}
                    </span>
                    {item.isPremium && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase">Premium</span>}
                  </div>
                  <h2 className="line-clamp-2 flex-1 font-semibold text-cloud-white transition-colors group-hover:text-cyan-ia">{item.title}</h2>
                  {'description' in item && item.description && (
                    <p className="mt-2 line-clamp-2 text-xs text-cloud-white/50">{item.description}</p>
                  )}
                  <div className="mt-4 border-t border-app-border pt-3">
                    <span className="text-[10px] text-cloud-white/30">
                      Salvo em {new Date(item.savedAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
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
