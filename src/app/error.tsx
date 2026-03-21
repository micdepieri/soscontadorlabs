"use client";

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
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-5xl font-bold text-red-500 mb-4">Ops!</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Algo deu errado</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        Ocorreu um erro inesperado. Tente novamente ou volte à página inicial.
      </p>
      <div className="flex gap-4">
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Tentar novamente
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
