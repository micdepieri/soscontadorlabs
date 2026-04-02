"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Erro ao abrir portal. Tente novamente.");
        setLoading(false);
      }
    } catch {
      setError("Erro de conexao. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handlePortal}
        disabled={loading}
        className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        {loading ? "Carregando..." : "Gerenciar assinatura no Stripe"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
