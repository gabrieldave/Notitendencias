import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { usageRuns } from "@/db/schema";
import { isUsageAdminAuthorized, isUsageRecorderAuthorized } from "@/lib/usage-auth";
import { estimateRunCostUsd, getBudgetSettings, listUsageRuns, num } from "@/lib/usage";
import { usageRunCreateSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  if (!(await isUsageRecorderAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = usageRunCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validación fallida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const provider = data.provider;
  const settings = await getBudgetSettings(provider);
  const estimatedCost = estimateRunCostUsd(data.posts_received, settings);

  const [run] = await db
    .insert(usageRuns)
    .values({
      provider,
      workflowName: data.workflow_name ?? null,
      runType: data.run_type,
      startedAt: data.started_at ? new Date(data.started_at) : new Date(),
      finishedAt: data.finished_at ? new Date(data.finished_at) : new Date(),
      status: data.status,
      timezone: "America/Mexico_City",
      postsRequested: data.posts_requested,
      postsReceived: data.posts_received,
      postsFiltered: data.posts_filtered,
      postsSentToIngest: data.posts_sent_to_ingest,
      duplicatesSkipped: data.duplicates_skipped,
      errorsCount: data.errors_count,
      estimatedCostUsd: String(estimatedCost.toFixed(4)),
      metadataJson: data.metadata ?? null,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    run: { ...run, estimatedCostUsd: num(run.estimatedCostUsd) },
  });
}

export async function GET(request: NextRequest) {
  if (!(await isUsageAdminAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const runs = await listUsageRuns({
    provider: searchParams.get("provider") ?? undefined,
    dateFrom: searchParams.get("date_from") ?? undefined,
    dateTo: searchParams.get("date_to") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    limit: Number(searchParams.get("limit") ?? 100),
  });

  return NextResponse.json({ ok: true, runs });
}
