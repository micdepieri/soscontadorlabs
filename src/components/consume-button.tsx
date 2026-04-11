"use client";

import { useState, useEffect } from "react";

interface Props {
  contentId: string;
  contentType: "video" | "material" | "post";
  initialConsumed?: boolean;
}

export default function ConsumeButton({ contentId, contentType, initialConsumed = false }: Props) {
  const [consumed, setConsumed] = useState(initialConsumed);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ xp: number } | null>(null);

  useEffect(() => {
    setConsumed(initialConsumed);
  }, [initialConsumed]);

  async function handleMark() {
    if (consumed || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/content/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, contentType }),
      });
      const data = await res.json();
      if (data.success) {
        setConsumed(true);
        if (data.xpAwarded > 0) {
          setToast({ xp: data.xpAwarded });
          setTimeout(() => setToast(null), 3000);
        }
      }
    } catch {
      // silently fail — non-critical action
    } finally {
      setLoading(false);
    }
  }

  const xpMap = { video: 10, material: 5, post: 5 };
  const xp = xpMap[contentType];

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleMark}
        disabled={consumed || loading}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
          consumed
            ? "cursor-default bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-cyan-ia/10 text-cyan-ia border border-cyan-ia/30 hover:bg-cyan-ia/20 active:scale-95"
        } ${loading ? "opacity-60" : ""}`}
      >
        {consumed ? (
          <>
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Concluído
          </>
        ) : loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Registrando...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Marcar como concluído
            <span className="rounded-full bg-cyan-ia/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-ia">
              +{xp} XP
            </span>
          </>
        )}
      </button>

      {/* XP toast */}
      {toast && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg whitespace-nowrap">
          +{toast.xp} XP ganho!
        </div>
      )}
    </div>
  );
}
