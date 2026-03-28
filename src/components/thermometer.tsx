"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  contentId: string;
  contentType: "video" | "material" | "post";
  initialRating: number | null; // 1 to 5
  stats: { average: number; count: number };
}

const levels = [
  { value: 1, label: "Frio/Básico", emoji: "❄️", color: "text-blue-500", bg: "bg-blue-50" },
  { value: 2, label: "Morno", emoji: "☁️", color: "text-blue-700", bg: "bg-blue-100" },
  { value: 3, label: "Bom", emoji: "✨", color: "text-indigo-600", bg: "bg-indigo-50" },
  { value: 4, label: "Muito Quente", emoji: "🔥", color: "text-orange-500", bg: "bg-orange-50" },
  { value: 5, label: "Explosivo!", emoji: "🚀", color: "text-red-600", bg: "bg-red-50" },
];

export default function Thermometer({ contentId, contentType, initialRating, stats }: Props) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRate(value: number) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/content/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, contentType, value }),
      });
      if (res.ok) {
        setRating(value);
        router.refresh(); // Invalidate server components to get new stats
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Termômetro da Comunidade</h3>
          <p className="text-sm text-gray-500">Sua opinião ajuda a moldar o futuro deste portal.</p>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-black text-indigo-600">{stats.average > 0 ? stats.average.toFixed(1) : "-"}</span>
            <span className="text-xs font-bold text-gray-300">/ 5.0</span>
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{stats.count} Votos</p>
        </div>
      </div>

      <div className="flex justify-between gap-2 mb-8">
        {levels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleRate(level.value)}
            disabled={loading}
            className={`flex flex-1 flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
              rating === level.value 
                ? `${level.bg} ${level.color} ring-2 ring-current shadow-lg shadow-current/10` 
                : 'bg-white hover:bg-gray-50 text-gray-300 hover:text-gray-500 border border-transparent hover:border-gray-100'
            } group`}
          >
            <span className={`text-3xl transition-transform duration-500 group-hover:scale-125 ${rating === level.value ? 'scale-110' : ''}`}>
              {level.emoji}
            </span>
            <span className={`text-[9px] font-black uppercase text-center leading-tight tracking-tighter sm:tracking-normal ${rating === level.value ? 'opacity-100' : 'opacity-60'}`}>
              {level.label}
            </span>
          </button>
        ))}
      </div>
      
      {/* The visual thermometer bar */}
      <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-1000 bg-linear-to-r from-blue-400 via-indigo-500 to-red-500"
          style={{ width: `${(stats.average / 5) * 100}%` }}
        />
        {/* Glow effect at the end of the bar */}
        <div 
          className="absolute h-full w-4 blur-sm bg-white/40 mix-blend-overlay transition-all duration-1000"
          style={{ left: `calc(${(stats.average / 5) * 100}% - 16px)` }}
        />
      </div>
    </div>
  );
}
