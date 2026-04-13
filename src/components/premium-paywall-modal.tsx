"use client";

import { useState } from "react";

interface PremiumPaywallModalProps {
  contentTitle: string;
  returnPath: string;
}

export default function PremiumPaywallModal({ contentTitle, returnPath }: PremiumPaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Erro ao iniciar pagamento. Tente novamente.");
        setLoading(false);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 flex items-start justify-center pt-16 pb-8 px-4 z-10">
      {/* Backdrop blur gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-deep-navy/80 to-deep-navy pointer-events-none" />

      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-midnight-blue shadow-2xl shadow-amber-500/5 animate-in fade-in zoom-in-95 duration-300">
        {/* Amber glow top border */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        <div className="p-8">
          {/* Icon + badge */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400 uppercase tracking-wider">
              Conteúdo Premium
            </span>
          </div>

          <h2 className="mb-2 text-xl font-black text-cloud-white leading-tight">
            Desbloqueie acesso completo
          </h2>
          <p className="mb-6 text-sm text-cloud-white/60 leading-relaxed">
            <span className="text-cloud-white/80 font-semibold">"{contentTitle}"</span> e todo o
            conteúdo exclusivo da comunidade estão disponíveis para assinantes Premium.
          </p>

          {/* Benefits */}
          <ul className="mb-7 space-y-2.5">
            {[
              "Todos os vídeos e aulas premium",
              "PDFs, planilhas e materiais exclusivos",
              "Comunidade de contadores especializados",
              "Novos conteúdos toda semana",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2.5 text-sm text-cloud-white/70">
                <svg className="h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/30 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecionando...
              </span>
            ) : (
              "Assinar agora e desbloquear"
            )}
          </button>

          {error && (
            <p className="mt-3 text-center text-xs text-red-400">{error}</p>
          )}

          <p className="mt-4 text-center text-xs text-cloud-white/35">
            Cancele quando quiser · Sem fidelidade
          </p>
        </div>
      </div>
    </div>
  );
}
