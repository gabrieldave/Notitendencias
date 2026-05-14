import { z } from "zod";

const deepSeekResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  why_it_matters: z.string().optional().nullable(),
  opportunity: z.string().optional().nullable(),
  content_ideas: z.array(z.string()).default([]),
  business_ideas: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  trend_score: z.number().min(0).max(100),
});

const SYSTEM_PROMPT = `Eres editor de Notitendencias, una plataforma mexicana de tendencias digitales. Convierte el hallazgo crudo en una tendencia clara, útil y accionable para público hispanohablante. No copies artículos completos. No inventes datos. Si falta contexto, dilo con cautela. Devuelve solo JSON válido con title, summary, why_it_matters, opportunity, content_ideas, business_ideas, tags y trend_score.`;

export type DeepSeekTrendResult = z.infer<typeof deepSeekResultSchema>;

function extractJson(content: string): string {
  const trimmed = content.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  if (fence) return fence[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

export async function processRawWithDeepSeek(input: {
  title: string;
  rawText: string | null;
  sourceName: string;
  sourceUrl: string | null;
  categorySlug: string;
  metadata: Record<string, unknown> | null;
}): Promise<DeepSeekTrendResult> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key || key === "change_me") {
    throw new Error("DEEPSEEK_API_KEY no configurada");
  }

  const userPayload = {
    category: input.categorySlug,
    title: input.title,
    raw_text: input.rawText,
    source_name: input.sourceName,
    source_url: input.sourceUrl,
    metadata: input.metadata,
  };

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analiza este hallazgo y devuelve solo el JSON:\n${JSON.stringify(userPayload)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`DeepSeek HTTP ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Respuesta vacía de DeepSeek");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch {
    throw new Error("JSON inválido devuelto por DeepSeek");
  }

  return deepSeekResultSchema.parse(parsed);
}
