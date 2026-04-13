"use client";

import { useState, useTransition } from "react";

interface SaveButtonProps {
  contentId: string;
  contentType: "video" | "post" | "material";
  initialSaved: boolean;
  /** compact = just the icon, no label */
  compact?: boolean;
}

export function SaveButton({ contentId, contentType, initialSaved, compact = false }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      if (saved) {
        await fetch(`/api/favorites/${contentId}`, { method: "DELETE" });
        setSaved(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentId, contentType }),
        });
        setSaved(true);
      }
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      title={saved ? "Remover dos salvos" : "Salvar"}
      className={`flex items-center gap-1.5 rounded-lg transition-all disabled:opacity-50 ${
        compact
          ? "p-1.5"
          : "px-3 py-1.5 text-xs font-semibold"
      } ${
        saved
          ? "bg-cyan-ia/20 text-cyan-ia hover:bg-cyan-ia/30"
          : "bg-app-chip text-cloud-white/60 hover:bg-app-chip-accent hover:text-cloud-white"
      }`}
    >
      <svg
        className={compact ? "h-4 w-4" : "h-3.5 w-3.5"}
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
      {!compact && (saved ? "Salvo" : "Salvar")}
    </button>
  );
}
