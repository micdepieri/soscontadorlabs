"use client";

import { useState, useEffect } from "react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  totalXP: number;
  level: number;
  levelLabel: string;
  contentConsumed: number;
}

interface TopContent {
  contentId: string;
  count: number;
  contentType: "video" | "material" | "post";
}

interface Overview {
  totalXPDistributed: number;
  totalConsumptions: number;
  activeMembers: number;
}

interface AnalyticsData {
  overview: Overview;
  leaderboard: LeaderboardEntry[];
  topContent: TopContent[];
}

const LEVEL_COLORS: Record<number, string> = {
  1: "text-zinc-400 bg-zinc-500/20 border-zinc-500/30",
  2: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  3: "text-purple-400 bg-purple-500/20 border-purple-500/30",
  4: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  5: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
};

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: "Vídeo",
  material: "Material",
  post: "Artigo",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  video: "text-cyan-400 bg-cyan-500/10",
  material: "text-amber-400 bg-amber-500/10",
  post: "text-purple-400 bg-purple-500/10",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-app-border bg-midnight-blue p-5">
      <p className="text-sm text-cloud-white/50">{label}</p>
      <p className="mt-1 text-3xl font-bold text-cloud-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-cloud-white/40">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-ia border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
        Erro ao carregar analytics: {error}
      </div>
    );
  }

  if (!data) return null;

  const { overview, leaderboard, topContent } = data;

  return (
    <div className="space-y-8">
      {/* Overview */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-cloud-white">Visão Geral</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de XP distribuído"
            value={overview.totalXPDistributed.toLocaleString("pt-BR")}
            sub="soma de todos os pontos ganhos"
          />
          <StatCard
            label="Conteúdos consumidos"
            value={overview.totalConsumptions.toLocaleString("pt-BR")}
            sub="marcações de conteúdo concluído"
          />
          <StatCard
            label="Membros ativos"
            value={overview.activeMembers}
            sub="com pelo menos 1 conteúdo consumido"
          />
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-cloud-white">Ranking de Membros</h2>
        {leaderboard.length === 0 ? (
          <div className="rounded-xl border border-app-border bg-midnight-blue p-8 text-center text-cloud-white/40">
            Nenhum membro consumiu conteúdo ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-app-border">
            <table className="w-full text-sm">
              <thead className="bg-midnight-blue">
                <tr className="text-left text-xs text-cloud-white/50 uppercase tracking-wider">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Membro</th>
                  <th className="px-4 py-3 text-center">Nível</th>
                  <th className="px-4 py-3 text-right">XP</th>
                  <th className="px-4 py-3 text-right">Conteúdos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {leaderboard.map((entry) => (
                  <tr
                    key={entry.userId}
                    className={`transition-colors hover:bg-midnight-blue/60 ${
                      entry.rank <= 3 ? "bg-midnight-blue/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-base">
                      {RANK_MEDALS[entry.rank] ?? (
                        <span className="text-cloud-white/40 font-mono">{entry.rank}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {entry.avatarUrl ? (
                          <img
                            src={entry.avatarUrl}
                            alt={entry.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-ia/20 text-cyan-ia text-xs font-bold">
                            {(entry.name[0] || "?").toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-cloud-white">{entry.name}</p>
                          <p className="text-xs text-cloud-white/40">{entry.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[entry.level] || LEVEL_COLORS[1]}`}
                      >
                        Nv.{entry.level} {entry.levelLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-cyan-ia">
                      {entry.totalXP.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right text-cloud-white/70">
                      {entry.contentConsumed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top content */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-cloud-white">Conteúdos Mais Consumidos</h2>
        {topContent.length === 0 ? (
          <div className="rounded-xl border border-app-border bg-midnight-blue p-8 text-center text-cloud-white/40">
            Nenhum conteúdo foi consumido ainda.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-app-border">
            <table className="w-full text-sm">
              <thead className="bg-midnight-blue">
                <tr className="text-left text-xs text-cloud-white/50 uppercase tracking-wider">
                  <th className="px-4 py-3 w-8">#</th>
                  <th className="px-4 py-3">ID do Conteúdo</th>
                  <th className="px-4 py-3 text-center">Tipo</th>
                  <th className="px-4 py-3 text-right">Consumos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {topContent.map((item, i) => (
                  <tr key={item.contentId} className="hover:bg-midnight-blue/60 transition-colors">
                    <td className="px-4 py-3 text-cloud-white/40 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-cloud-white/70 max-w-xs truncate">
                      {item.contentId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTENT_TYPE_COLORS[item.contentType] || ""}`}
                      >
                        {CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-cloud-white">
                      {item.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-app-border bg-midnight-blue/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-cloud-white/60 uppercase tracking-wider">
          Tabela de Níveis
        </h3>
        <div className="flex flex-wrap gap-3">
          {([
            { level: 1, label: "Iniciante", range: "0–49 XP" },
            { level: 2, label: "Aprendiz", range: "50–149 XP" },
            { level: 3, label: "Praticante", range: "150–349 XP" },
            { level: 4, label: "Especialista", range: "350–699 XP" },
            { level: 5, label: "Mestre", range: "700+ XP" },
          ] as const).map(({ level, label, range }) => (
            <div
              key={level}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${LEVEL_COLORS[level]}`}
            >
              Nv.{level} {label}
              <span className="opacity-60">{range}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-cloud-white/50">
          <span>Vídeo = 10 XP</span>
          <span>Artigo = 5 XP</span>
          <span>Material = 5 XP</span>
        </div>
      </div>
    </div>
  );
}
