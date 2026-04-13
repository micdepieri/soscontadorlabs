import { getServerAuth } from "@/lib/server-auth";
import { getUserByUid, getSubscription } from "@/lib/firestore";
import { getStripeConfig } from "@/lib/stripe";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import CheckoutButton from "@/components/checkout-button";
import ManageSubscriptionButton from "@/components/manage-subscription-button";
import AssinaturaAlerts from "@/components/assinatura-alerts";

export const metadata: Metadata = {
  title: "Assinatura | Portal da Comunidade",
  description: "Gerencie sua assinatura do Portal da Comunidade.",
};

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string; return?: string }>;
}) {
  const { userId } = await getServerAuth();
  if (!userId) redirect("/sign-in");

  const user = await getUserByUid(userId);
  if (!user) redirect("/sign-in");

  const { success, cancelled, return: returnPath } = await searchParams;

  const sub = await getSubscription(userId);
  const isActive = sub?.status === "ACTIVE";
  const isCancelled = sub?.status === "CANCELLED";
  const isPastDue = sub?.status === "PAST_DUE";

  let priceLabel = "R$ 67,90";
  let productName = "Assinatura Mensal";
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
    // Fallback se Stripe não configurado
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Alerts for success / cancelled */}
      <AssinaturaAlerts
        success={success === "1"}
        cancelled={cancelled === "1"}
        returnPath={returnPath}
      />

      <div>
        <h1 className="text-3xl font-black text-cloud-white">Assinatura</h1>
        <p className="mt-2 text-cloud-white/60">
          {isActive
            ? "Sua assinatura está ativa. Aproveite todo o conteúdo premium."
            : "Acesse todo o conteúdo premium da comunidade."}
        </p>
      </div>

      {isActive ? (
        /* Active subscription */
        <div className="rounded-2xl border border-green-500/20 bg-midnight-blue p-8">
          {/* Top status */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-cloud-white">Assinatura ativa</p>
              {sub?.currentPeriodEnd && (
                <p className="text-sm text-cloud-white/50">
                  Renova em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(sub.currentPeriodEnd))}
                </p>
              )}
            </div>
            <span className="ml-auto rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400 uppercase tracking-wider">
              Premium
            </span>
          </div>

          <ul className="mb-8 space-y-3">
            {[
              "Acesso a todos os vídeos premium",
              "PDFs e materiais exclusivos",
              "Comunidade de contadores",
              "Novos conteúdos toda semana",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-cloud-white/70">
                <svg className="h-4 w-4 shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          <ManageSubscriptionButton />
        </div>
      ) : isPastDue ? (
        /* Past due */
        <div className="rounded-2xl border border-red-500/20 bg-midnight-blue p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-cloud-white">Pagamento pendente</p>
              <p className="text-sm text-cloud-white/50">Atualize seu método de pagamento para continuar.</p>
            </div>
          </div>
          <ManageSubscriptionButton />
        </div>
      ) : (
        /* No active subscription */
        <div className="rounded-2xl border border-app-border bg-midnight-blue p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-black text-cloud-white">
              {isCancelled ? "Reativar assinatura" : "Acesse o Premium"}
            </h2>
            <p className="mx-auto max-w-sm text-cloud-white/60 text-sm leading-relaxed">
              {isCancelled
                ? "Sua assinatura foi cancelada. Reative para voltar a acessar todo o conteúdo exclusivo."
                : "Desbloqueie vídeos, PDFs e materiais exclusivos sobre IA para contadores."}
            </p>
          </div>

          {/* Pricing card */}
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-deep-navy p-6">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">{productName}</p>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Mais popular
              </span>
            </div>
            <div className="mb-1 flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-cloud-white">{priceLabel}</span>
              <span className="text-cloud-white/40 text-sm">/mês</span>
            </div>
            <p className="mb-6 text-xs text-cloud-white/40">Cancele quando quiser, sem fidelidade.</p>

            <ul className="mb-6 space-y-3">
              {[
                "Todos os vídeos e aulas premium",
                "PDFs, planilhas e materiais exclusivos",
                "Comunidade de contadores especializados",
                "Novos conteúdos toda semana",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-cloud-white/70">
                  <svg className="h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <CheckoutButton
              label={isCancelled ? "Reativar assinatura" : "Começar agora"}
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95 disabled:opacity-60"
            />
          </div>

          <p className="text-center text-xs text-cloud-white/30">
            Pagamento seguro processado pela Stripe · Cancele a qualquer momento
          </p>
        </div>
      )}
    </div>
  );
}
