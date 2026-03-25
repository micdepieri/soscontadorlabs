import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada | Portal da Comunidade",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-6xl font-bold text-indigo-600">404</p>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Página não encontrada</h1>
      <p className="mb-8 max-w-md text-gray-500">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
