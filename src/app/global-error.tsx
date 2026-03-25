"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center font-sans">
        <p className="mb-4 text-5xl font-bold text-red-500">Ops!</p>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">Erro crítico</h1>
        <p className="mb-8 text-gray-500">Ocorreu um erro inesperado. Tente recarregar a página.</p>
        <button
          onClick={unstable_retry}
          className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700"
        >
          Recarregar
        </button>
      </body>
    </html>
  );
}
