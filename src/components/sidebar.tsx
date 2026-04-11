"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.toString();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityName, setCommunityName] = useState("Comunidade");

  useEffect(() => {
    async function fetchCategories() {
      try {
        const q = query(collection(db, "categories"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories for sidebar:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCommunitySettings() {
      try {
        const res = await fetch("/api/community-settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.communityName) setCommunityName(data.communityName);
        }
      } catch {
        // keep default
      }
    }

    fetchCategories();
    fetchCommunitySettings();

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.communityName) setCommunityName(detail.communityName);
    };
    window.addEventListener("communitySettingsUpdated", handleUpdate);
    return () => window.removeEventListener("communitySettingsUpdated", handleUpdate);
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-app-border bg-midnight-blue md:flex">
      {/* Header / Brand */}
      <div className="flex h-16 items-center border-b border-app-border px-6">
        <Link href="/videos" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tech-blue text-white font-bold text-lg">
            S
          </div>
          <span className="font-bold text-cloud-white tracking-tight">{communityName}</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Links */}
        <nav className="space-y-1">
          <Link
            href="/videos"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === "/videos" && !searchQuery
                ? "bg-tech-blue/20 text-cyan-ia"
                : "text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Início
          </Link>
          <Link
            href="/videos?tipo=video"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === "/videos" && searchQuery === "tipo=video"
                ? "bg-tech-blue/20 text-cyan-ia"
                : "text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vídeos
          </Link>
          <Link
            href="/materiais"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === "/materiais"
                ? "bg-tech-blue/20 text-cyan-ia"
                : "text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Biblioteca
          </Link>
          <Link
            href="/posts"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname.startsWith("/posts")
                ? "bg-tech-blue/20 text-cyan-ia"
                : "text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Artigos
          </Link>
          <Link
            href="/suporte"
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === "/suporte"
                ? "bg-tech-blue/20 text-cyan-ia"
                : "text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
            </svg>
            Assistente IA
          </Link>
        </nav>

        {/* Categories as Channels */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-cloud-white/40 uppercase tracking-wider mb-2">
            Canais de Assunto
          </h3>
          <nav className="space-y-0.5">
            {loading ? (
              <div className="px-3 py-2 space-y-2">
                <div className="h-4 w-3/4 bg-app-chip animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-app-chip animate-pulse rounded" />
              </div>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/videos?categoria=${cat.slug}`}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    pathname === "/videos" && cat.slug === new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("categoria")
                      ? "bg-app-chip text-cloud-white"
                      : "text-cloud-white/50 hover:bg-deep-navy hover:text-cloud-white"
                  }`}
                >
                  <span className="text-cloud-white/30 font-normal">#</span>
                  {cat.name}
                </Link>
              ))
            )}
          </nav>
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-cloud-white/40 uppercase tracking-wider mb-2">
              Administração
            </h3>
            <nav className="space-y-1">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  pathname === "/admin"
                    ? "bg-tech-blue/20 text-cyan-ia"
                    : "text-cloud-white/60 hover:bg-deep-navy hover:text-cloud-white"
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                </svg>
                Dashboard Admin
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* User info at bottom */}
      <div className="border-t border-app-border bg-deep-navy p-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-tech-blue flex items-center justify-center text-white text-xs font-bold uppercase overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name?.charAt(0) || user.email?.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cloud-white truncate">{user.name || "Usuário"}</p>
              <p className="text-xs text-cloud-white/50 truncate capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
