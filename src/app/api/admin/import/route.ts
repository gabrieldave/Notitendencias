import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { rawTrendItems, categories } from "@/db/schema";
import { adminImportSchema } from "@/lib/schemas";
import { isAdminFromRequest } from "@/lib/admin-auth";
import { parseAdminImportCsv } from "@/lib/csv";
import { RAW_TEXT_MAX_LENGTH } from "@/lib/constants";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  if (!isAdminFromRequest(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = adminImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validación fallida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { rows, error } = parseAdminImportCsv(parsed.data.csv);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  const inserted: unknown[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const category = r.category?.trim();
    if (!category) {
      errors.push(`Fila ${i + 2}: categoría vacía`);
      continue;
    }
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);
    if (!cat) {
      errors.push(`Fila ${i + 2}: categoría desconocida ${category}`);
      continue;
    }
    const rawText = (r.raw_text ?? "").slice(0, RAW_TEXT_MAX_LENGTH);
    const title = (r.title ?? "").trim();
    if (!title) {
      errors.push(`Fila ${i + 2}: título vacío`);
      continue;
    }
    const [item] = await db
      .insert(rawTrendItems)
      .values({
        categorySlug: category,
        sourceName: (r.source_name ?? "").trim() || "import",
        sourceUrl: r.source_url?.trim() || null,
        title,
        rawText: rawText || null,
        metadataJson: { import: "csv" },
        status: "new",
      })
      .returning();
    inserted.push(item);
  }

  return NextResponse.json({
    ok: true,
    inserted: inserted.length,
    errors,
  });
}
