import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Portal da Comunidade
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Compartilhamento de experiências com tecnologia e IA para contadores
          — sem jargões, sem gurus, só o que funciona.
        </p>
      </div>

      <SignedOut>
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition-colors">
              Entrar
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-md border border-indigo-600 px-6 py-2 text-indigo-600 hover:bg-indigo-50 transition-colors">
              Criar conta
            </button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex gap-4">
          <Link
            href="/videos"
            className="rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 transition-colors"
          >
            Ver vídeos
          </Link>
          <Link
            href="/materiais"
            className="rounded-md border border-indigo-600 px-6 py-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            Materiais
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
