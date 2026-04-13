"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState, useEffect, useRef } from "react";

const links = [
  { href: "/inicio", label: "Início" },
  { href: "/videos", label: "Vídeos" },
  { href: "/materiais", label: "Materiais" },
  { href: "/assinatura", label: "Assinatura" },
];

interface Notification {
  id: string;
  type: "mention";
  fromUserName: string | null;
  contentId: string;
  contentType: "video" | "material" | "post";
  isRead: boolean;
  createdAt: string;
}

const CONTENT_PATH: Record<string, string> = {
  video: "/videos",
  material: "/materiais",
  post: "/posts",
};

function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setNotifications(data))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
    }
  }

  function formatDate(dateStr: string) {
    try {
      const diffDays = Math.round(
        (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(diffDays, "day");
    } catch {
      return "recentemente";
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-cloud-white/60 transition-colors hover:border-cyan-ia hover:text-cyan-ia"
        aria-label="Notificações"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-ia text-[9px] font-bold text-deep-navy">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-app-border bg-midnight-blue shadow-2xl">
          <div className="border-b border-app-border px-4 py-3">
            <p className="text-sm font-bold text-cloud-white">Notificações</p>
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-cloud-white/40">
              Nenhuma notificação ainda
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-app-border overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`${CONTENT_PATH[n.contentType]}/${n.contentId}#comments`}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-deep-navy ${
                      n.isRead ? "opacity-60" : ""
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-ia/20 text-cyan-ia">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-cloud-white/90">
                        <span className="font-semibold text-cloud-white">
                          {n.fromUserName || "Alguém"}
                        </span>{" "}
                        marcou você em um comentário
                      </p>
                      <p className="mt-0.5 text-[11px] text-cloud-white/40">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-cyan-ia" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-app-border bg-midnight-blue">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-cyan-ia">
              Portal da Comunidade
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 md:flex" />

          {/* User + theme toggle + mobile menu */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-app-border text-cloud-white/60 transition-colors hover:border-cyan-ia hover:text-cyan-ia"
              aria-label="Alternar tema"
              title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {/* Notification bell (only when logged in) */}
            {!loading && user && <NotificationBell userId={user.uid} />}

            {!loading && user && (
              <>
                <Link
                  href="/perfil"
                  className="hidden text-sm text-cloud-white/60 transition-colors hover:text-cloud-white sm:block"
                >
                  {user.displayName || user.email?.split("@")[0] || "Perfil"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden text-sm text-cloud-white/50 transition-colors hover:text-cloud-white/80 sm:block"
                >
                  Sair
                </button>
              </>
            )}
            {!loading && !user && (
              <Link
                href="/sign-in"
                className="rounded-lg bg-tech-blue px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tech-blue/80"
              >
                Entrar
              </Link>
            )}
            <button
              className="rounded-md p-2 text-cloud-white/60 hover:bg-midnight-blue md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="space-y-1 border-t border-app-border py-3 md:hidden">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-tech-blue/20 text-cyan-ia"
                    : "text-cloud-white/70 hover:bg-midnight-blue"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/perfil"
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-2 py-2 text-sm text-cloud-white/70 hover:bg-midnight-blue"
            >
              Perfil
            </Link>
            {!loading && user && (
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false); }}
                className="block w-full rounded-md px-2 py-2 text-left text-sm text-cloud-white/70 hover:bg-midnight-blue"
              >
                Sair
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
