import type { Metadata } from "next";
import AgentChat from "@/components/agent-chat";

export const metadata: Metadata = {
  title: "Assistente IA | Portal da Comunidade",
};

export default function SuportePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white text-lg">
            🤖
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Assistente SOS Contador Labs</h1>
            <p className="text-xs text-gray-500">
              Tire suas dúvidas e encontre conteúdos da comunidade instantaneamente
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-gray-50">
        <AgentChat />
      </div>
    </div>
  );
}
