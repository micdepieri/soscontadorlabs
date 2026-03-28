"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  demandCreated?: boolean;
}

// Convert markdown links [text](url) and **bold** in assistant messages
function renderAssistantContent(text: string) {
  // Remove the ##DEMANDA_CRIADA## marker from displayed text
  const clean = text.replace(/##DEMANDA_CRIADA##/g, "").trim();

  const parts: React.ReactNode[] = [];
  // Regex to match markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(clean)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex}>{renderBold(clean.slice(lastIndex, match.index))}</span>
      );
    }
    const [, label, href] = match;
    const isInternal = href.startsWith("/");
    if (isInternal) {
      parts.push(
        <Link
          key={match.index}
          href={href}
          className="font-medium text-indigo-600 underline hover:text-indigo-800"
        >
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 underline hover:text-indigo-800"
        >
          {label}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < clean.length) {
    parts.push(<span key={lastIndex}>{renderBold(clean.slice(lastIndex))}</span>);
  }

  return parts;
}

function renderBold(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex}>{renderNewlines(text.slice(lastIndex, match.index))}</span>
      );
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{renderNewlines(text.slice(lastIndex))}</span>);
  }
  return parts;
}

function renderNewlines(text: string): React.ReactNode[] {
  return text.split("\n").flatMap((line, i, arr) =>
    i < arr.length - 1 ? [line, <br key={i} />] : [line]
  );
}

export default function AgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantMsg]);

    try {
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok || !res.body) throw new Error("Erro ao conectar com o assistente");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let demandCreated = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.text,
                };
                return updated;
              });
            }
            if (parsed.demandCreated) {
              demandCreated = true;
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch {
            // skip invalid JSON lines
          }
        }
      }

      if (demandCreated) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            demandCreated: true,
          };
          return updated;
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white text-3xl mb-4 shadow-lg">
              🤖
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Assistente SOS Contador Labs
            </h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Olá! Sou o assistente da comunidade. Posso ajudar você a encontrar vídeos,
              materiais e responder suas dúvidas contábeis. Como posso ajudar?
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {[
                "Quais vídeos estão disponíveis sobre IRPF?",
                "Tem algum material sobre MEI?",
                "Como funciona a apuração do Simples Nacional?",
                "Mostre conteúdos sobre planejamento tributário",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs mr-2 mt-0.5">
                IA
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="space-y-1 leading-relaxed">
                  {msg.content ? renderAssistantContent(msg.content) : (
                    <span className="inline-flex gap-1 items-center text-gray-400">
                      <span className="animate-bounce delay-0">.</span>
                      <span className="animate-bounce delay-100">.</span>
                      <span className="animate-bounce delay-200">.</span>
                    </span>
                  )}
                  {msg.demandCreated && (
                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                      📋 Sua dúvida foi registrada como uma demanda de conteúdo. O administrador será notificado para criar esse material.
                    </div>
                  )}
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida... (Enter para enviar)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-gray-400">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
