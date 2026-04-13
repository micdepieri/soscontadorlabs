"use client";

import { useRouter } from "next/navigation";

interface ViewToggleProps {
  view: "grid" | "list";
}

export function ViewToggle({ view }: ViewToggleProps) {
  const router = useRouter();

  const setView = (newView: "grid" | "list") => {
    document.cookie = `content-view=${newView}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-app-border bg-midnight-blue p-1">
      <button
        onClick={() => setView("grid")}
        title="Visualização em cards"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          view === "grid"
            ? "bg-tech-blue/30 text-cyan-ia"
            : "text-cloud-white/40 hover:text-cloud-white/70"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        onClick={() => setView("list")}
        title="Visualização em lista"
        className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
          view === "list"
            ? "bg-tech-blue/30 text-cyan-ia"
            : "text-cloud-white/40 hover:text-cloud-white/70"
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
}
