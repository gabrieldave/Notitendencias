import { z } from "zod";

const radarPayloadSchema = z
  .object({
    opportunity_level: z.enum(["baja", "media", "alta"]).optional(),
    urgency: z.enum(["observar", "probar", "actuar_esta_semana"]).optional(),
    audience: z.array(z.string()).max(10).optional(),
    actions_today: z.array(z.string()).max(5).optional(),
  })
  .optional()
  .nullable();

const deepSeekResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  why_it_matters: z.string().optional().nullable(),
  opportunity: z.string().optional().nullable(),
  content_ideas: z.array(z.string()).default([]),
  business_ideas: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  trend_score: z.number().min(0).max(100),
  radar_payload: radarPayloadSchema,
});

const SYSTEM_PROMPT = `Eres editor senior de Notitendencias AI Radar (México / LATAM). Convierte el hallazgo crudo en una señal de inteligencia de tendencias: clara, breve, comercialmente útil y accionable. No copies artículos enteros. No inventes datos. Evita hype y promesas absolutas (por ejemplo "estar al 100% en tendencias"). Si falta contexto, dilo con cautela.

Salida: solo JSON válido con estas claves:
- title, summary, why_it_matters, opportunity, content_ideas, business_ideas, tags, trend_score
- radar_payload (objeto opcional pero muy recomendado) con:
  - opportunity_level: "baja" | "media" | "alta"
  - urgency: "observar" | "probar" | "actuar_esta_semana"
  - audience: etiquetas entre Creadores, Agencias, Freelancers, Negocios pequeños, Desarrolladores, Consultores, Marketers, Educadores, Equipos de ventas, Equipos de soporte (solo las que apliquen, máx. 6)
  - actions_today: exactamente 3 strings cortos: acciones concretas para esta semana

Estilo:
- summary: qué pasó, 2–4 oraciones máximo; claro, no nota larga.
- why_it_matters: relevancia para creadores, freelancers, agencias, PyMEs y uso práctico de IA; evita párrafos genéricos.
- opportunity: valor premium — cómo llevar la señal a contenido, automatización, producto, servicio o ingreso; sin humo.
- content_ideas: 3 a 5 ideas específicas (video, hilo, newsletter, short, carrusel, tutorial).
- business_ideas: 3 a 5 ideas monetizables (servicio, plantilla, automatización, consultoría, mini-curso, auditoría…).

No cites ni enlaces a arxiv.org. No fingas información privada.`;

const X_SOURCE_PROMPT_APPEND = ` El hallazgo proviene de X (Twitter): trátalo como señal temprana, no como hecho verificado. No afirmes más de lo que el post permite. Si metadata incluye external_url, recomienda verificar esa fuente. Redacta en español claro orientado a México.`;

function isXSource(input: {
  sourceName: string;
  metadata: Record<string, unknown> | null;
}): boolean {
  if (input.sourceName.trim().toLowerCase() === "x") return true;
  const platform = input.metadata?.platform;
  return typeof platform === "string" && platform.toLowerCase() === "x";
}

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
    signal: AbortSignal.timeout(120_000),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT + (isXSource(input) ? X_SOURCE_PROMPT_APPEND : ""),
        },
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
