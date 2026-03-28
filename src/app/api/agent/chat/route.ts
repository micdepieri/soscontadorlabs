import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getServerAuth } from "@/lib/server-auth";
import {
  getUserByUid,
  getVideos,
  getMaterials,
  getCategories,
  createContentRequest,
  getAISettings,
} from "@/lib/firestore";

function buildKnowledgeBase(
  videos: Awaited<ReturnType<typeof getVideos>>,
  materials: Awaited<ReturnType<typeof getMaterials>>,
  categories: Awaited<ReturnType<typeof getCategories>>
) {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const videosText = videos
    .map((v) => {
      const cat = v.categoryId ? categoryMap[v.categoryId] : null;
      return [
        `- ID: ${v.id}`,
        `  Título: ${v.title}`,
        v.description ? `  Descrição: ${v.description}` : null,
        cat ? `  Categoria: ${cat}` : null,
        v.tags.length ? `  Tags: ${v.tags.join(", ")}` : null,
        `  Link: /videos/${v.id}`,
        v.isPremium ? `  Acesso: Premium` : `  Acesso: Gratuito`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const materialsText = materials
    .map((m) => {
      const cat = m.categoryId ? categoryMap[m.categoryId] : null;
      return [
        `- ID: ${m.id}`,
        `  Título: ${m.title}`,
        m.description ? `  Descrição: ${m.description}` : null,
        `  Tipo: ${m.type}`,
        cat ? `  Categoria: ${cat}` : null,
        m.tags.length ? `  Tags: ${m.tags.join(", ")}` : null,
        `  Link: /materiais/${m.id}`,
        m.isPremium ? `  Acesso: Premium` : `  Acesso: Gratuito`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const categoriesText = categories.map((c) => `- ${c.name} (slug: ${c.slug})`).join("\n");

  return { videosText, materialsText, categoriesText };
}

function buildSystemPrompt(videosText: string, materialsText: string, categoriesText: string) {
  return `Você é o Assistente SOS Contador Labs — o clone inteligente do administrador da comunidade. Seu papel é ajudar os membros a encontrar rapidamente os conteúdos certos para suas dúvidas contábeis e fiscais.

## Sua personalidade
- Amigável, direto e profissional
- Fala em português brasileiro
- Conhece cada conteúdo da comunidade como o próprio administrador
- Direciona o usuário com confiança para o conteúdo correto

## Base de conhecimento atual da comunidade

### VÍDEOS DISPONÍVEIS:
${videosText || "Nenhum vídeo publicado ainda."}

### MATERIAIS DISPONÍVEIS:
${materialsText || "Nenhum material publicado ainda."}

### CATEGORIAS:
${categoriesText || "Nenhuma categoria criada ainda."}

## Regras de resposta

1. **Quando encontrar conteúdo relevante**: Mencione o título e inclua o link no formato markdown: [Título do Conteúdo](/videos/ID) ou [Título do Material](/materiais/ID). Seja específico — indique por que aquele conteúdo responde à dúvida do usuário.

2. **Quando não encontrar conteúdo específico**: Informe o usuário de forma honesta que ainda não temos esse conteúdo, ofereça alternativas relacionadas se houver, e inclua exatamente esta marcação no FINAL da sua resposta (em nova linha, sem mais texto depois): ##DEMANDA_CRIADA##

3. **Conteúdo premium**: Quando indicar um conteúdo premium, mencione que é necessário ter assinatura ativa.

4. **Navegação**: Para vídeos use /videos/ID, para materiais use /materiais/ID. Nunca invente IDs ou links que não existam na base acima.

5. **Tom**: Seja o especialista que sabe de cor onde está cada conteúdo. Não diga "vou verificar" ou "deixa eu ver" — você já sabe tudo.`;
}

async function streamWithAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<string> {
  const client = new Anthropic({ apiKey });
  let fullText = "";

  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      const chunk = event.delta.text;
      fullText += chunk;
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
    }
  }

  return fullText;
}

async function streamWithOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  baseURL?: string
): Promise<string> {
  const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  let fullText = "";

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    messages: openaiMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      fullText += delta;
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`));
    }
  }

  return fullText;
}

export async function POST(req: NextRequest) {
  const { userId } = await getServerAuth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUserByUid(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let body: { messages: Array<{ role: "user" | "assistant"; content: string }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  const [videos, materials, categories, aiSettings] = await Promise.all([
    getVideos({ publishedOnly: true }),
    getMaterials({ publishedOnly: true }),
    getCategories(),
    getAISettings(),
  ]);

  const { videosText, materialsText, categoriesText } = buildKnowledgeBase(
    videos,
    materials,
    categories
  );
  const systemPrompt = buildSystemPrompt(videosText, materialsText, categoriesText);

  // Resolve active API key: prefer Firestore setting, fall back to env var
  const resolvedAnthropicKey =
    aiSettings.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "";
  const resolvedOpenAIKey = aiSettings.openaiApiKey || process.env.OPENAI_API_KEY || "";

  const { provider, model } = aiSettings;

  if (provider === "anthropic" && !resolvedAnthropicKey) {
    return NextResponse.json(
      { error: "Chave da API Anthropic não configurada. Configure em Configurações > IA." },
      { status: 503 }
    );
  }
  if (provider === "openai" && !resolvedOpenAIKey) {
    return NextResponse.json(
      { error: "Chave da API OpenAI não configurada. Configure em Configurações > IA." },
      { status: 503 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      try {
        if (provider === "openai") {
          fullText = await streamWithOpenAI(
            resolvedOpenAIKey,
            model,
            systemPrompt,
            messages,
            controller,
            encoder,
            aiSettings.openaiBaseUrl || undefined
          );
        } else {
          fullText = await streamWithAnthropic(
            resolvedAnthropicKey,
            model,
            systemPrompt,
            messages as Anthropic.MessageParam[],
            controller,
            encoder
          );
        }

        // Check if agent signaled missing content
        if (fullText.includes("##DEMANDA_CRIADA##")) {
          const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
          const userText = lastUserMsg?.content ?? "";

          await createContentRequest({
            userId,
            userName: user.name,
            topic: userText.slice(0, 120),
            userMessage: userText.slice(0, 500),
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ demandCreated: true })}\n\n`)
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
