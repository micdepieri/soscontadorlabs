import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getSubscription, getUserXP, getAllUsersXP, LEVEL_LABELS, calcLevel } from "@/lib/firestore";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import ProfileEditForm from "@/components/profile-edit-form";

export const metadata: Metadata = {
  title: "Perfil | Portal da Comunidade",
};

const subscriptionLabel: Record<string, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  CANCELLED: "Cancelada",
  PAST_DUE: "Pagamento pendente",
};

const subscriptionColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  PAST_DUE: "bg-amber-100 text-amber-700",
};

export default async function PerfilPage() {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByUid(userId);
  if (!user) redirect("/sign-in");

  const [sub, userXP, allXP] = await Promise.all([
    getSubscription(userId),
    getUserXP(userId),
    getAllUsersXP(),
  ]);

  const rank = userXP ? allXP.findIndex((x) => x.userId === userId) + 1 : null;
  const totalMembers = allXP.length;
  const subStatus = sub?.status ?? "INACTIVE";

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Profile card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        {/* Header */}
        <div className="mb-6 flex items-start gap-6">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name || "Avatar"}
              width={88}
              height={88}
              className="rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600 shrink-0">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.name || "Sem nome"}</h1>
              {user.role === "ADMIN" && (
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>

            {/* Location */}
            {(user.city || user.state) && (
              <p className="mt-1.5 flex items-center gap-1 text-sm text-gray-500">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[user.city, user.state].filter(Boolean).join(", ")}
              </p>
            )}

            {/* Social links */}
            <div className="mt-2 flex flex-wrap gap-3">
              {user.linkedin && (
                <a
                  href={user.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
              {user.instagram && (
                <a
                  href={`https://instagram.com/${user.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-pink-600 hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  {user.instagram}
                </a>
              )}
              {user.phone && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {user.phone}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Membro desde{" "}
              {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
                new Date(user.createdAt)
              )}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-5">
            {user.bio}
          </p>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div className={`${user.bio ? "" : "border-t border-gray-100 pt-5"} mb-5`}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Especialidades
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Edit form */}
        <div className={`${(user.bio || (user.skills && user.skills.length > 0)) ? "" : "border-t border-gray-100 pt-5"}`}>
          <ProfileEditForm
            initialData={{
              uid: user.uid,
              name: user.name,
              avatarUrl: user.avatarUrl,
              bio: user.bio ?? null,
              city: user.city ?? null,
              state: user.state ?? null,
              skills: user.skills ?? [],
              linkedin: user.linkedin ?? null,
              instagram: user.instagram ?? null,
              phone: user.phone ?? null,
            }}
          />
        </div>
      </div>

      {/* XP & Gamification */}
      {(() => {
        const xp = userXP?.totalXP ?? 0;
        const level = userXP ? userXP.level : calcLevel(0);
        const levelLabel = LEVEL_LABELS[level];
        const consumed = userXP?.contentConsumed ?? 0;

        // XP thresholds per level
        const thresholds = [0, 50, 150, 350, 700, Infinity];
        const levelStart = thresholds[level - 1];
        const levelEnd = thresholds[level];
        const progress = levelEnd === Infinity ? 100 : Math.round(((xp - levelStart) / (levelEnd - levelStart)) * 100);
        const xpToNext = levelEnd === Infinity ? null : levelEnd - xp;

        const levelColors: Record<number, { badge: string; bar: string; text: string }> = {
          1: { badge: "bg-zinc-100 text-zinc-600 border-zinc-200", bar: "bg-zinc-400", text: "text-zinc-500" },
          2: { badge: "bg-blue-50 text-blue-700 border-blue-100", bar: "bg-blue-500", text: "text-blue-600" },
          3: { badge: "bg-purple-50 text-purple-700 border-purple-100", bar: "bg-purple-500", text: "text-purple-600" },
          4: { badge: "bg-amber-50 text-amber-700 border-amber-100", bar: "bg-amber-500", text: "text-amber-600" },
          5: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", bar: "bg-emerald-500", text: "text-emerald-600" },
        };
        const colors = levelColors[level] || levelColors[1];

        return (
          <div className="rounded-xl border border-gray-200 bg-white p-8">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">Progresso na Comunidade</h2>

            <div className="flex flex-wrap items-start gap-6">
              {/* Level badge */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-black ${colors.badge}`}>
                  {level}
                </div>
                <span className={`text-xs font-semibold ${colors.text}`}>{levelLabel}</span>
              </div>

              {/* Progress details */}
              <div className="flex-1 min-w-0">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {xp.toLocaleString("pt-BR")} XP
                  </span>
                  {rank && (
                    <span className="text-sm text-gray-500">
                      #{rank} de {totalMembers} membros
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  {xpToNext !== null ? (
                    <span>Faltam <strong className="text-gray-600">{xpToNext} XP</strong> para o próximo nível</span>
                  ) : (
                    <span className="font-semibold text-emerald-600">Nível máximo atingido!</span>
                  )}
                  <span>{consumed} {consumed === 1 ? "conteúdo" : "conteúdos"} concluídos</span>
                </div>
              </div>
            </div>

            {/* Level ladder */}
            <div className="mt-6 flex justify-between border-t border-gray-100 pt-5">
              {([
                { level: 1, label: "Iniciante", xp: "0" },
                { level: 2, label: "Aprendiz", xp: "50" },
                { level: 3, label: "Praticante", xp: "150" },
                { level: 4, label: "Especialista", xp: "350" },
                { level: 5, label: "Mestre", xp: "700" },
              ] as const).map((l) => (
                <div
                  key={l.level}
                  className={`flex flex-col items-center gap-1 text-center ${l.level <= level ? "opacity-100" : "opacity-30"}`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${l.level <= level ? levelColors[l.level].badge : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                    {l.level}
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:block">{l.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Subscription */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Assinatura</h2>
        <div className="flex items-center justify-between">
          <div>
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${subscriptionColor[subStatus]}`}>
              {subscriptionLabel[subStatus]}
            </span>
            {sub?.currentPeriodEnd && subStatus === "ACTIVE" && (
              <p className="mt-2 text-sm text-gray-500">
                Renova em{" "}
                {new Intl.DateTimeFormat("pt-BR").format(new Date(sub.currentPeriodEnd))}
              </p>
            )}
          </div>
          <Link
            href="/assinatura"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Gerenciar
          </Link>
        </div>
      </div>

    </div>
  );
}
