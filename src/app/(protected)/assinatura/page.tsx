import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getSubscription } from "@/lib/firestore";
import { getStripeConfig } from "@/lib/stripe";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import CheckoutButton from "@/components/checkout-button";
import ManageSubscriptionButton from "@/components/manage-subscription-button";

export const metadata: Metadata = {
  title: "Assinatura | Portal da Comunidade",
  description: "Gerencie sua assinatura do Portal da Comunidade.",
};

export default async function AssinaturaPage() {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByUid(userId);
  if (!user) redirect("/sign-in");

  const sub = await getSubscription(userId);
  const isActive = sub?.status === "ACTIVE";
  const isCancelled = sub?.status === "CANCELLED";

  // Busca o preço real do Stripe para exibir na página
  let priceLabel = "R$ 67,90";
  let productName = "Assinatura Mensal SOS Contador Labs";
  try {
    const { stripe, priceId } = await getStripeConfig();
    if (priceId) {
      const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
      if (price.unit_amount) {
        priceLabel = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: price.currency.toUpperCase(),
        }).format(price.unit_amount / 100);
      }
      if (price.product && typeof price.product === "object" && "name" in price.product) {
        productName = (price.product as { name: string }).name;
      }
    }
  } catch {
    // Fallback para valores padrão se Stripe não estiver configurado
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinatura</h1>
        <p className="mt-2 text-gray-600">Acesse todo o conteúdo premium da comunidade.</p>
      </div>

      {isActive ? (
        /* Active subscription */
        <div className="rounded-xl border border-green-200 bg-white p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Assinatura ativa</h2>
              {sub?.currentPeriodEnd && (
                <p className="text-sm text-gray-500">
                  Renova em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(sub.currentPeriodEnd))}
                </p>
              )}
            </div>
          </div>
          <ul className="mb-6 space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Acesso a todos os vídeos premium
            </li>
            <li className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Acesso a todos os materiais premium
            </li>
            <li className="flex items-center gap-2">
              <svg
                className="h-4 w-4 shrink-0 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Participação na comunidade
            </li>
          </ul>
          <ManageSubscriptionButton />
        </div>
      ) : (
        /* No active subscription */
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">
              {isCancelled ? "Assinatura cancelada" : "Acesse o conteúdo premium"}
            </h2>
            <p className="mx-auto max-w-md text-gray-600">
              {isCancelled
                ? "Sua assinatura foi cancelada. Reative para continuar acessando o conteúdo premium."
                : "Desbloqueie todos os vídeos e materiais exclusivos sobre IA para contadores."}
            </p>
          </div>

          {/* Pricing */}
          <div className="mb-6 rounded-xl border-2 border-indigo-600 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {productName}
            </p>
            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{priceLabel}</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <p className="mb-6 text-sm text-gray-600">Cancele quando quiser.</p>
            <ul className="mb-6 space-y-3 text-sm text-gray-700">
              {[
                "Todos os vídeos premium",
                "PDFs e materiais exclusivos",
                "Comunidade de contadores",
                "Atualizações constantes",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 shrink-0 text-indigo-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <CheckoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
