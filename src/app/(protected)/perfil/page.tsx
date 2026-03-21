import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil | Portal da Comunidade",
};

export default async function PerfilPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      subscription: true,
      comments: {
        where: { isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          video: { select: { id: true, title: true } },
          material: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!user) redirect("/sign-in");

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

  const subStatus = user.subscription?.status ?? "INACTIVE";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-6 mb-6">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name || "Avatar"}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name || "Sem nome"}</h1>
            <p className="text-gray-500">{user.email}</p>
            {user.role === "ADMIN" && (
              <span className="mt-1 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
                Administrador
              </span>
            )}
          </div>
        </div>

        {user.bio && (
          <p className="text-gray-700 border-t border-gray-100 pt-4">{user.bio}</p>
        )}

        <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
          Membro desde{" "}
          {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
            new Date(user.createdAt)
          )}
        </div>
      </div>

      {/* Subscription status */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assinatura</h2>
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${subscriptionColor[subStatus]}`}
            >
              {subscriptionLabel[subStatus]}
            </span>
            {user.subscription?.currentPeriodEnd && subStatus === "ACTIVE" && (
              <p className="mt-2 text-sm text-gray-500">
                Renova em{" "}
                {new Intl.DateTimeFormat("pt-BR").format(
                  new Date(user.subscription.currentPeriodEnd)
                )}
              </p>
            )}
          </div>
          <a
            href="/assinatura"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Gerenciar
          </a>
        </div>
      </div>

      {/* Recent comments */}
      {user.comments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comentários recentes</h2>
          <div className="space-y-4">
            {user.comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <p className="text-sm text-gray-700 line-clamp-2">{comment.content}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Em{" "}
                  {comment.video ? (
                    <a href={`/videos/${comment.video.id}`} className="text-indigo-600 hover:underline">
                      {comment.video.title}
                    </a>
                  ) : comment.material ? (
                    <a href={`/materiais/${comment.material.id}`} className="text-indigo-600 hover:underline">
                      {comment.material.title}
                    </a>
                  ) : (
                    "conteúdo removido"
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
