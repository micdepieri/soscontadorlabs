import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import CheckoutButton from "@/components/checkout-button";
import ManageSubscriptionButton from "@/components/manage-subscription-button";

export const metadata: Metadata = {
  title: "Assinatura | Portal da Comunidade",
  description: "Gerencie sua assinatura do Portal da Comunidade.",
};

export default async function AssinaturaPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true },
  });

  if (!user) redirect("/sign-in");

  const sub = user.subscription;
  const isActive = sub?.status === "ACTIVE";
  const isCancelled = sub?.status === "CANCELLED";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assinatura</h1>
        <p className="mt-2 text-gray-600">
          Acesse todo o conteúdo premium da comunidade.
        </p>
      </div>

      {isActive ? (
        /* Active subscription */
        <div className="bg-white rounded-xl border border-green-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Acesso a todos os vídeos premium
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Acesso a todos os materiais premium
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Participação na comunidade
            </li>
          </ul>
          <ManageSubscriptionButton />
        </div>
      ) : (
        /* No active subscription */
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isCancelled ? "Assinatura cancelada" : "Acesse o conteúdo premium"}
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              {isCancelled
                ? "Sua assinatura foi cancelada. Reative para continuar acessando o conteúdo premium."
                : "Desbloqueie todos os vídeos e materiais exclusivos sobre IA para contadores."}
            </p>
          </div>

          {/* Pricing */}
          <div className="rounded-xl border-2 border-indigo-600 p-6 mb-6">
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-gray-900">R$ 49</span>
              <span className="text-gray-500">/mês</span>
            </div>
            <p className="text-sm text-gray-600 mb-6">Cancele quando quiser.</p>
            <ul className="space-y-3 mb-6 text-sm text-gray-700">
              {[
                "Todos os vídeos premium",
                "PDFs e materiais exclusivos",
                "Comunidade de contadores",
                "Atualizações constantes",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
