"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col items-center justify-center text-center px-4 font-sans">
        <p className="text-5xl font-bold text-red-500 mb-4">Ops!</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Erro crítico</h1>
        <p className="text-gray-500 mb-8">Ocorreu um erro inesperado. Tente recarregar a página.</p>
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700"
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
