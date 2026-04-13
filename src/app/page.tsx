"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  BeakerIcon,
  CpuChipIcon,
  ChatBubbleBottomCenterTextIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const { user, loading } = useAuth();

  // Landing page is always dark — override any user theme preference
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("light");
    html.classList.add("dark");
    return () => {
      // Restore saved theme when leaving the landing page
      const saved = localStorage.getItem("theme");
      html.classList.remove("dark", "light");
      html.classList.add(saved === "light" ? "light" : "dark");
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-deep-navy text-cloud-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-deep-navy/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tech-blue shadow-lg shadow-tech-blue/20">
              <BeakerIcon className="h-6 w-6 text-cyan-ia" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              SOS Contador <span className="text-cyan-ia">Labs</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {!loading && !user && (
              <>
                <Link
                  href="/sign-in"
                  className="hidden text-sm font-medium text-gray-300 transition-colors hover:text-white sm:block"
                >
                  Entrar
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-full bg-tech-blue px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-tech-blue/80 hover:scale-105 active:scale-95"
                >
                  Fazer parte
                </Link>
              </>
            )}
            {!loading && user && (
              <Link
                href="/inicio"
                className="rounded-full bg-tech-blue px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-tech-blue/80 hover:scale-105 active:scale-95"
              >
                Acessar Portal
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/hero.png"
            alt="SOS Contador Labs Background"
            fill
            className="object-cover opacity-40 brightness-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-navy/20 via-deep-navy/40 to-deep-navy" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-ia/30 bg-cyan-ia/10 px-4 py-1.5 text-xs font-medium tracking-wide text-cyan-ia uppercase backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-ia opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-ia"></span>
            </span>
            Laboratório de IA & Contabilidade
          </div>
          
          <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            IA para contadores — <br />
            <span className="bg-gradient-to-r from-cyan-ia to-tech-blue bg-clip-text text-transparent">
              sem jargões, sem gurus.
            </span>
          </h1>
          
          <p className="mx-auto mt-8 max-w-3xl text-lg leading-relaxed text-gray-300 sm:text-xl">
            Bem-vindo ao único espaço onde contabilidade e inteligência artificial se encontram de verdade. 
            Experimentos reais, automações práticas e uma comunidade protagonizando a mudança.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {!loading && !user && (
              <Link
                href="/sign-up"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-tech-blue px-10 py-4 text-lg font-bold text-white shadow-xl shadow-tech-blue/20 transition-all hover:bg-tech-blue/80 hover:scale-105 active:scale-95 sm:w-auto"
              >
                Começar Experimento
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
            {!loading && user && (
              <Link
                href="/inicio"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-10 py-4 text-lg font-bold text-deep-navy shadow-xl transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 sm:w-auto"
              >
                Ir para o Portal
                <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/20 p-1">
            <div className="h-2 w-2 rounded-full bg-cyan-ia mx-auto" />
          </div>
        </div>
      </section>

      {/* Manifesto Intro */}
      <section className="bg-midnight-blue py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Por que <span className="text-brass-gold underline decoration-brass-gold/30 underline-offset-8">"Labs"</span>?
              </h2>
              <div className="mt-8 space-y-6 text-lg text-gray-300">
                <p>
                  Porque aqui a lógica é de laboratório, não de sala de aula. Num laboratório, você não assiste a uma aula sobre como a água ferve. Você coloca a água no fogo, mede a temperatura e tira suas conclusões.
                </p>
                <p>
                  O <strong>SOS Contador Labs</strong> foi construído por <strong>contadores ativos</strong> — não por consultores que só falam de teoria. É a união entre a visão estratégica contábil e a engenharia de automação avançada.
                </p>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-6 w-6 shrink-0 text-cyan-ia" />
                  <span><strong>Aprendizado real</strong>: Processos, erros e resultados práticos sem filtro.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="mt-1 h-6 w-6 shrink-0 text-cyan-ia" />
                  <span><strong>Prática extrema</strong>: Workspace reais onde a contabilidade acontece hoje.</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {/* Card Michael */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-deep-navy/50 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="h-12 w-12 rounded-full bg-tech-blue p-0.5 shadow-lg shadow-tech-blue/20">
                    <div className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://github.com/michaelpieri.png')" }}>
                      <span className="flex h-full w-full items-center justify-center rounded-full bg-tech-blue text-xs font-bold text-white">MP</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none">Michael Pieri</h3>
                    <p className="mt-1 text-xs text-cyan-ia font-medium">Idealizador · SOS Contador Labs</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-300 leading-relaxed">
                  Especialista em contabilidade consultiva e gestão de escritórios modernos. Criador do SOS Contador, apaixonado por transformar operação em estratégia.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["SOS Contador", "Consultiva", "Gestão", "Estratégia"].map(tag => (
                    <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-400 border border-white/10">{tag}</span>
                  ))}
                </div>
              </div>

              {/* Card Julio */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-deep-navy/50 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <div className="h-12 w-12 rounded-full bg-brass-gold p-0.5 shadow-lg shadow-brass-gold/20">
                    <div className="h-full w-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://github.com/juliomoreira.png')" }}>
                      <span className="flex h-full w-full items-center justify-center rounded-full bg-brass-gold text-xs font-bold text-white">JM</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none">Julio Moreira</h3>
                    <p className="mt-1 text-xs text-brass-gold font-medium">Co-fundador · iDVL Tecnologia</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-300 leading-relaxed">
                  Consultor SAP B1 e especialista em automação fiscal. Atua no DTE-CMF da SEFA/PR e constrói sistemas de IA para contabilidade do zero.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["iDVL", "IA Aplicada", "Automação", "SEFA/PR"].map(tag => (
                    <span key={tag} className="rounded-md bg-white/5 px-2 py-0.5 text-[9px] font-medium text-gray-400 border border-white/10">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey Section */}
      <section className="bg-midnight-blue/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Como aproveitar ao máximo o Labs
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Não seja apenas um espectador. Seja protagonista.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "1. Apresente-se",
                desc: "Conte sua trajetória no espaço de apresentações. Torne-se visível e crie conexões reais."
              },
              {
                title: "2. Explore o conteúdo fixado",
                desc: "Comece pelos experimentos mais relevantes e discussões que geraram mais valor."
              },
              {
                title: "3. Sem medo de perguntar",
                desc: "Aqui não existe pergunta boba. O momento perfeito para aprender é agora."
              },
              {
                title: "4. Compartilhe seus testes",
                desc: "Mostre o que você testou, mesmo que não tenha funcionado. É assim que evoluímos."
              },
              {
                title: "5. Participe ativamente",
                desc: "Questione, complemente e reaja. A qualidade da comunidade depende da sua participação."
              },
              {
                title: "A Promessa do Labs",
                desc: "Consistência, honestidade radical, relevância fiscal e acesso direto aos fundadores."
              }
            ].map((step, id) => (
              <div
                key={id}
                className="rounded-xl border border-white/5 bg-deep-navy/30 p-6 backdrop-blur-sm"
              >
                <h4 className="mb-3 font-bold text-cyan-ia">{step.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you find */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              O que acontece no laboratório
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Conteúdo denso. Aplicação direta. Resultado real.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: CpuChipIcon,
                title: "Experimentos IA",
                desc: "Agentes que emitem notas, processam documentos e analisam tributos de forma real.",
                color: "text-cyan-ia",
                bg: "bg-cyan-ia/10"
              },
              {
                icon: BeakerIcon,
                title: "Workflows N8N",
                desc: "Automações prontas para adaptar e usar, com explicação lógica de cada etapa.",
                color: "text-tech-blue",
                bg: "bg-tech-blue/10"
              },
              {
                icon: ShieldCheckIcon,
                title: "Análises Honestas",
                desc: "Sem hype. Testamos ferramentas antes de recomendar. Sem afiliação ou patrocínio.",
                color: "text-brass-gold",
                bg: "bg-brass-gold/10"
              },
              {
                icon: ChatBubbleBottomCenterTextIcon,
                title: "Comunidade Ativa",
                desc: "Troca de experiências entre profissionais que pensam fora do quadradinho fiscal.",
                color: "text-indigo-400",
                bg: "bg-indigo-400/10"
              }
            ].map((item, id) => (
              <div
                key={id}
                className="group relative rounded-2xl border border-white/10 bg-midnight-blue p-8 transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white transition-colors group-hover:text-cyan-ia">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-tech-blue opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Vamos construir a contabilidade inteligente juntos?
          </h2>
          <p className="mt-6 text-lg text-gray-300">
            A aplicação já está em estágio avançado. Não há lista de espera — apenas acesso direto ao conhecimento que transforma escritórios em todo o Brasil.
          </p>
          <div className="mt-10">
            {!loading && !user && (
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-ia px-10 py-4 text-lg font-bold text-deep-navy shadow-xl shadow-cyan-ia/20 transition-all hover:bg-cyan-ia/80 hover:scale-105 active:scale-95"
              >
                Fazer parte da Comunidade
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-deep-navy px-4 py-12">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tech-blue">
              <BeakerIcon className="h-5 w-5 text-cyan-ia" />
            </div>
            <span className="text-lg font-bold text-white">
              SOS Contador <span className="text-cyan-ia">Labs</span>
            </span>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Michael Pieri & Julio Moreira — SOS Contador Labs.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/termos-de-uso" className="hover:text-white transition-colors">Termos</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
