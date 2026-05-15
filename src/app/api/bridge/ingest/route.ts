import { NextResponse } from "next/server";
import { db } from "@/db";
import { rawTrendItems, categories } from "@/db/schema";
import { bridgeIngestSchema } from "@/lib/schemas";
import { RAW_TEXT_MAX_LENGTH } from "@/lib/constants";
import { mergeEditorialArxivMetadata, rawItemMentionsArxiv } from "@/lib/editorial";
import { eq } from "drizzle-orm";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
}

export async function POST(request: Request) {
  const expected = process.env.BRIDGE_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "BRIDGE_API_KEY no configurada en el servidor" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || token !== expected) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bridgeIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validación fallida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  if (data.raw_text && data.raw_text.length > RAW_TEXT_MAX_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `raw_text excede ${RAW_TEXT_MAX_LENGTH} caracteres` },
      { status: 400 },
    );
  }

  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, data.category))
    .limit(1);
  if (cat.length === 0) {
    return NextResponse.json(
      { ok: false, error: `Categoría desconocida: ${data.category}` },
      { status: 400 },
    );
  }

  const detected = data.detected_at ? new Date(data.detected_at) : null;

  const metaIn =
    data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : null;
  const mentionsArxiv = rawItemMentionsArxiv({
    title: data.title,
    rawText: data.raw_text ?? null,
    sourceUrl: data.source_url ?? null,
    metadataJson: metaIn,
  });
  const metadataJson = mentionsArxiv ? mergeEditorialArxivMetadata(metaIn) : metaIn;
  const status = mentionsArxiv ? "requires_review" : "new";

  const [item] = await db
    .insert(rawTrendItems)
    .values({
      categorySlug: data.category,
      sourceName: data.source_name,
      sourceUrl: data.source_url ?? null,
      title: data.title,
      rawText: data.raw_text ?? null,
      metadataJson: metadataJson && Object.keys(metadataJson).length > 0 ? metadataJson : null,
      status,
      detectedAt: detected,
    })
    .returning();

  return NextResponse.json({ ok: true, item });
}
