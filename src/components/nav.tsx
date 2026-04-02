"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";

const links = [
  { href: "/videos", label: "Vídeos" },
  { href: "/materiais", label: "Materiais" },
  { href: "/assinatura", label: "Assinatura" },
];

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
                /* Sun icon */
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"
                  />
                </svg>
              ) : (
                /* Moon icon */
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

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
