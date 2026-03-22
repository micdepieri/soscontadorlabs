"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-5xl font-bold text-red-500">Ops!</p>
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Algo deu errado</h1>
      <p className="mb-8 max-w-md text-gray-500">
        Ocorreu um erro inesperado. Tente novamente ou volte à página inicial.
      </p>
      <div className="flex gap-4">
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
