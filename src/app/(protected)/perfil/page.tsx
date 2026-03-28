import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getSubscription } from "@/lib/firestore";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil | Portal da Comunidade",
};

export default async function PerfilPage() {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByUid(userId);
  if (!user) redirect("/sign-in");

  const sub = await getSubscription(userId);

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

  const subStatus = sub?.status ?? "INACTIVE";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Profile card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <div className="mb-6 flex items-center gap-6">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.name || "Avatar"}
              width={80}
              height={80}
              className="rounded-full"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
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

        <div className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
          Membro desde{" "}
          {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
            new Date(user.createdAt)
          )}
        </div>
      </div>

      {/* Subscription status */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Assinatura</h2>
        <div className="flex items-center justify-between">
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${subscriptionColor[subStatus]}`}
            >
              {subscriptionLabel[subStatus]}
            </span>
            {sub?.currentPeriodEnd && subStatus === "ACTIVE" && (
              <p className="mt-2 text-sm text-gray-500">
                Renova em {new Intl.DateTimeFormat("pt-BR").format(new Date(sub.currentPeriodEnd))}
              </p>
            )}
          </div>
          <Link
            href="/assinatura"
            className="rounded-lg border border-indigo-600 px-4 py-2 text-sm text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            Gerenciar
          </Link>
        </div>
      </div>
    </div>
  );
}
