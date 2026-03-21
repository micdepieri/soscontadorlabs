"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
      onClick={handleCheckout}
      disabled={loading}
      className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
    >
      {loading ? "Redirecionando..." : "Assinar agora"}
    </button>
  );
}
