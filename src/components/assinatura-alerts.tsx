"use client";

import Link from "next/link";

interface AssinaturaAlertsProps {
  success: boolean;
  cancelled: boolean;
  returnPath?: string;
}

export default function AssinaturaAlerts({ success, cancelled, returnPath }: AssinaturaAlertsProps) {
  if (!success && !cancelled) return null;

  if (success) {
    return (
      <div className="animate-in fade-in slide-in-from-top-2 duration-500 rounded-xl border border-green-500/25 bg-green-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-300">Assinatura ativada com sucesso!</p>
            <p className="mt-0.5 text-sm text-green-300/70">
              Bem-vindo ao Premium. Todo o conteúdo exclusivo está liberado para você.
            </p>
            {returnPath && (
              <Link
                href={returnPath}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500/30"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar ao conteúdo
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500 rounded-xl border border-cloud-white/10 bg-cloud-white/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cloud-white/10 text-cloud-white/50">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-cloud-white/80">Checkout cancelado</p>
          <p className="mt-0.5 text-sm text-cloud-white/50">
            Você cancelou o processo. Assine quando quiser — o conteúdo estará aqui te esperando.
          </p>
        </div>
      </div>
    </div>
  );
}
