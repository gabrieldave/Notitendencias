import { NextResponse, type NextRequest } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { rawTrendItems } from "@/db/schema";
import { isElevatedAdmin } from "@/lib/admin-auth";
import { processRawItemById } from "@/lib/admin-trend-actions";

const BATCH_LIMIT = 100;

export async function POST(request: NextRequest) {
  if (!(await isElevatedAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let ids: string[] | undefined;
  try {
    const raw = await request.text();
    if (raw.trim()) {
      const parsed = JSON.parse(raw) as { ids?: unknown };
      if (Array.isArray(parsed.ids) && parsed.ids.every((x) => typeof x === "string")) {
        ids = parsed.ids.slice(0, BATCH_LIMIT);
      }
    }
  } catch {
    return NextResponse.json({ ok: false, error: "JSON del cuerpo inválido" }, { status: 400 });
  }

  let queue: string[];
  if (ids && ids.length > 0) {
    queue = ids;
  } else {
    const rows = await db
      .select({ id: rawTrendItems.id })
      .from(rawTrendItems)
      .where(
        or(
          eq(rawTrendItems.status, "new"),
          eq(rawTrendItems.status, "error"),
          eq(rawTrendItems.status, "requires_review"),
        ),
      )
      .orderBy(desc(rawTrendItems.createdAt))
      .limit(BATCH_LIMIT);
    queue = rows.map((r) => r.id);
  }

  const results: Array<{
    id: string;
    ok: boolean;
    error?: string;
    reused?: boolean;
    trendId?: string;
  }> = [];

  for (const id of queue) {
    const r = await processRawItemById(id);
    if (r.ok) {
      results.push({ id, ok: true, reused: r.reused, trendId: r.trend.id });
    } else {
      results.push({ id, ok: false, error: r.error });
    }
  }

  const summary = {
    total: results.length,
    succeeded: results.filter((x) => x.ok).length,
    failed: results.filter((x) => !x.ok).length,
  };

  return NextResponse.json({ ok: true, results, summary });
}
