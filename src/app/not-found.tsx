import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada | Portal da Comunidade",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-bold text-indigo-600 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Página não encontrada</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
