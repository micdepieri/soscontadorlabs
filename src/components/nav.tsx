"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
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
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-indigo-600">
              Portal da Comunidade
            </span>
          </Link>

          {/* Desktop nav - Hidden as they are now in the Sidebar */}
          <div className="hidden items-center gap-6 md:flex">
            {/* Empty or Breadcrumbs can go here later */}
          </div>

          {/* User + mobile menu */}
          <div className="flex items-center gap-3">
            {!loading && user && (
              <>
                <Link
                  href="/perfil"
                  className="hidden text-sm text-gray-600 transition-colors hover:text-gray-900 sm:block"
                >
                  {user.displayName || user.email?.split("@")[0] || "Perfil"}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hidden text-sm text-gray-500 transition-colors hover:text-gray-700 sm:block"
                >
                  Sair
                </button>
              </>
            )}
            {!loading && !user && (
              <Link
                href="/sign-in"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Entrar
              </Link>
            )}
            <button
              className="rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="space-y-1 border-t border-gray-100 py-3 md:hidden">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/perfil"
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Perfil
            </Link>
            {!loading && user && (
              <button
                onClick={() => {
                  handleSignOut();
                  setMenuOpen(false);
                }}
                className="block w-full rounded-md px-2 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
