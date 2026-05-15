import { DateTime } from "luxon";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { usageBudgetSettings, usageRuns } from "@/db/schema";

const TZ = "America/Mexico_City";
const DEFAULT_PROVIDER = "x";

export function num(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function cdmxStartOfToday(): Date {
  return DateTime.now().setZone(TZ).startOf("day").toJSDate();
}

export function cdmxStartOfMonth(): Date {
  return DateTime.now().setZone(TZ).startOf("month").toJSDate();
}

export function cdmxDaysAgo(days: number): Date {
  return DateTime.now().setZone(TZ).minus({ days }).startOf("day").toJSDate();
}

export async function getBudgetSettings(provider = DEFAULT_PROVIDER) {
  const [row] = await db
    .select()
    .from(usageBudgetSettings)
    .where(eq(usageBudgetSettings.provider, provider))
    .limit(1);

  if (row) return row;

  await db.insert(usageBudgetSettings).values({ provider });
  const [created] = await db
    .select()
    .from(usageBudgetSettings)
    .where(eq(usageBudgetSettings.provider, provider))
    .limit(1);
  return created!;
}

export function estimateRunCostUsd(
  postsReceived: number,
  settings: { postReadCostUsd: string | null },
): number {
  return postsReceived * num(settings.postReadCostUsd);
}

type RunAgg = {
  cost: number;
  postsReceived: number;
  postsSent: number;
  postsFiltered: number;
  duplicates: number;
};

async function aggregateRunsSince(provider: string, since: Date): Promise<RunAgg> {
  const [row] = await db
    .select({
      cost: sql<string>`coalesce(sum(${usageRuns.estimatedCostUsd}), 0)`,
      postsReceived: sql<number>`coalesce(sum(${usageRuns.postsReceived}), 0)`,
      postsSent: sql<number>`coalesce(sum(${usageRuns.postsSentToIngest}), 0)`,
      postsFiltered: sql<number>`coalesce(sum(${usageRuns.postsFiltered}), 0)`,
      duplicates: sql<number>`coalesce(sum(${usageRuns.duplicatesSkipped}), 0)`,
    })
    .from(usageRuns)
    .where(and(eq(usageRuns.provider, provider), gte(usageRuns.startedAt, since)));

  return {
    cost: num(row?.cost),
    postsReceived: Number(row?.postsReceived ?? 0),
    postsSent: Number(row?.postsSent ?? 0),
    postsFiltered: Number(row?.postsFiltered ?? 0),
    duplicates: Number(row?.duplicates ?? 0),
  };
}

export function budgetAlertLevel(percentUsed: number): "green" | "yellow" | "red" {
  if (percentUsed >= 80) return "red";
  if (percentUsed >= 50) return "yellow";
  return "green";
}

export function buildRecommendation(input: {
  percentUsed: number;
  projectedMonthly: number;
  monthlyBudget: number;
  avgCostPerIngest: number;
}): string {
  if (input.percentUsed >= 80 || input.projectedMonthly > input.monthlyBudget) {
    return "Reduce maxPostsPerRun, número de cuentas o frecuencia del cron para no superar el presupuesto.";
  }
  if (input.avgCostPerIngest > 0.05) {
    return "El costo por hallazgo enviado es alto: mejora filtros editoriales o reduce cuentas monitoreadas.";
  }
  return "Consumo dentro del presupuesto configurado.";
}

export async function getUsageSummary(provider = DEFAULT_PROVIDER) {
  const settings = await getBudgetSettings(provider);
  const todayStart = cdmxStartOfToday();
  const monthStart = cdmxStartOfMonth();
  const sevenDaysStart = cdmxDaysAgo(7);

  const [today, last7, month] = await Promise.all([
    aggregateRunsSince(provider, todayStart),
    aggregateRunsSince(provider, sevenDaysStart),
    aggregateRunsSince(provider, monthStart),
  ]);

  const monthlyBudget = num(settings.monthlyBudgetUsd);
  const prepaidBalance = num(settings.prepaidBalanceUsd);
  const percentUsed = monthlyBudget > 0 ? (month.cost / monthlyBudget) * 100 : 0;
  const avgDaily7 = last7.cost / 7;
  const projectedMonthly = avgDaily7 * 30;
  const budgetDelta = monthlyBudget - projectedMonthly;
  const avgCostPerPost = month.postsReceived > 0 ? month.cost / month.postsReceived : 0;
  const avgCostPerIngest = month.postsSent > 0 ? month.cost / month.postsSent : 0;

  const recentRuns = await db
    .select()
    .from(usageRuns)
    .where(eq(usageRuns.provider, provider))
    .orderBy(desc(usageRuns.startedAt))
    .limit(20);

  return {
    provider,
    settings: {
      monthlyBudgetUsd: monthlyBudget,
      prepaidBalanceUsd: prepaidBalance,
      postReadCostUsd: num(settings.postReadCostUsd),
      trendReadCostUsd: num(settings.trendReadCostUsd),
      userReadCostUsd: num(settings.userReadCostUsd),
    },
    spendTodayUsd: today.cost,
    spendLast7DaysUsd: last7.cost,
    spendMonthUsd: month.cost,
    percentBudgetUsed: percentUsed,
    alertLevel: budgetAlertLevel(percentUsed),
    projectedMonthlyUsd: projectedMonthly,
    budgetDeltaUsd: budgetDelta,
    today: {
      postsReceived: today.postsReceived,
      postsSent: today.postsSent,
      postsFiltered: today.postsFiltered,
      duplicatesSkipped: today.duplicates,
    },
    month: {
      postsReceived: month.postsReceived,
      postsSent: month.postsSent,
    },
    avgCostPerPostReceived: avgCostPerPost,
    avgCostPerIngest,
    recommendation: buildRecommendation({
      percentUsed,
      projectedMonthly,
      monthlyBudget,
      avgCostPerIngest,
    }),
    recentRuns: recentRuns.map((r) => ({
      ...r,
      estimatedCostUsd: num(r.estimatedCostUsd),
    })),
  };
}

export async function listUsageRuns(params: {
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  limit?: number;
}) {
  const provider = params.provider ?? DEFAULT_PROVIDER;
  const conditions = [eq(usageRuns.provider, provider)];

  if (params.status) {
    conditions.push(eq(usageRuns.status, params.status));
  }
  if (params.dateFrom) {
    const from = DateTime.fromISO(params.dateFrom, { zone: TZ }).startOf("day").toJSDate();
    conditions.push(gte(usageRuns.startedAt, from));
  }
  if (params.dateTo) {
    const to = DateTime.fromISO(params.dateTo, { zone: TZ }).endOf("day").toJSDate();
    conditions.push(lte(usageRuns.startedAt, to));
  }

  const rows = await db
    .select()
    .from(usageRuns)
    .where(and(...conditions))
    .orderBy(desc(usageRuns.startedAt))
    .limit(params.limit ?? 100);

  return rows.map((r) => ({ ...r, estimatedCostUsd: num(r.estimatedCostUsd) }));
}
