"use client";

import { useState } from "react";

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handlePortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
    >
      {loading ? "Carregando..." : "Gerenciar assinatura no Stripe"}
    </button>
  );
}
