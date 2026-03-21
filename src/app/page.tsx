import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 mb-6 tracking-wide uppercase">
            Comunidade de Contadores
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            IA para contadores —{" "}
            <span className="text-indigo-600">sem jargões, sem gurus</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Só o que funciona. Experimentos reais, resultados práticos e uma
            comunidade que compartilha o que aprendeu — de contador para contador.
          </p>

          <Show when="signed-out">
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
                  Criar conta gratuita
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="w-full sm:w-auto rounded-xl border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  Já tenho conta
                </button>
              </SignInButton>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/videos"
                className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Ver vídeos
              </Link>
              <Link
                href="/materiais"
                className="w-full sm:w-auto rounded-xl border border-gray-300 px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Materiais
              </Link>
            </div>
          </Show>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
            O que você encontra no portal
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Vídeos práticos",
                desc: "Tutoriais e cases reais sobre IA aplicada à contabilidade.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Materiais",
                desc: "PDFs, templates e recursos curados pela comunidade.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: "Comunidade",
                desc: "Comente, tire dúvidas e aprenda com outros contadores.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: "Curadoria honesta",
                desc: "Sem afiliações ou gurus. Só o que realmente testamos.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 text-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Portal da Comunidade — Contadores que usam IA de verdade.
        </p>
      </footer>
    </main>
  );
}
