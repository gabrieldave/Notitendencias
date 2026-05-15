import { NextResponse, type NextRequest } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { isElevatedAdmin } from "@/lib/admin-auth";
import { publishTrendById } from "@/lib/admin-trend-actions";
import { EDITORIAL_ARXIV_ALERT_ES, trendMentionsArxiv } from "@/lib/editorial";

const BATCH_LIMIT = 100;

export async function POST(request: NextRequest) {
  if (!(await isElevatedAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let confirmEditorialArxiv = false;
  let ids: string[] | undefined;
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const parsed = JSON.parse(raw) as {
        confirmEditorialArxiv?: unknown;
        ids?: unknown;
      };
      if (parsed.confirmEditorialArxiv === true) confirmEditorialArxiv = true;
      if (Array.isArray(parsed.ids) && parsed.ids.every((x) => typeof x === "string")) {
        ids = parsed.ids.slice(0, BATCH_LIMIT);
      }
    }
  } catch {
    return NextResponse.json({ ok: false, error: "JSON del cuerpo inválido" }, { status: 400 });
  }

  let queue =
    ids && ids.length > 0
      ? await db.select().from(trends).where(inArray(trends.id, ids))
      : await db
          .select()
          .from(trends)
          .where(inArray(trends.status, ["draft", "pending"]))
          .orderBy(desc(trends.createdAt))
          .limit(BATCH_LIMIT);

  queue = queue.filter((t) => t.status === "draft" || t.status === "pending");

  const needsArxivConfirm = queue.some((t) => trendMentionsArxiv(t));
  if (needsArxivConfirm && !confirmEditorialArxiv) {
    return NextResponse.json(
      {
        ok: false,
        error: "EDITORIAL_ARXIV_CONFIRM_REQUIRED",
        message: EDITORIAL_ARXIV_ALERT_ES,
        hint: 'Repite la solicitud POST con JSON: { "confirmEditorialArxiv": true } tras revisión manual explícita.',
        arxivCount: queue.filter((t) => trendMentionsArxiv(t)).length,
      },
      { status: 400 },
    );
  }

  const results: Array<{ id: string; ok: boolean; slug?: string; error?: string }> = [];

  for (const t of queue) {
    const r = await publishTrendById(t.id, { confirmEditorialArxiv });
    if (r.ok) {
      results.push({ id: t.id, ok: true, slug: r.trend.slug });
    } else {
      results.push({ id: t.id, ok: false, error: r.error });
    }
  }

  const summary = {
    total: results.length,
    succeeded: results.filter((x) => x.ok).length,
    failed: results.filter((x) => !x.ok).length,
  };

  return NextResponse.json({ ok: true, results, summary });
}
