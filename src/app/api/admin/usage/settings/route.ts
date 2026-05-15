import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usageBudgetSettings } from "@/db/schema";
import { isUsageAdminAuthorized } from "@/lib/usage-auth";
import { getBudgetSettings, num } from "@/lib/usage";
import { usageSettingsPatchSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  if (!(await isUsageAdminAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get("provider") ?? "x";
  const settings = await getBudgetSettings(provider);
  return NextResponse.json({
    ok: true,
    settings: {
      provider: settings.provider,
      monthlyBudgetUsd: num(settings.monthlyBudgetUsd),
      prepaidBalanceUsd: num(settings.prepaidBalanceUsd),
      postReadCostUsd: num(settings.postReadCostUsd),
      trendReadCostUsd: num(settings.trendReadCostUsd),
      userReadCostUsd: num(settings.userReadCostUsd),
      active: settings.active,
    },
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await isUsageAdminAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const parsed = usageSettingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validación fallida", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { provider, ...fields } = parsed.data;
  await getBudgetSettings(provider);

  const patch: {
    updatedAt: Date;
    monthlyBudgetUsd?: string;
    prepaidBalanceUsd?: string;
    postReadCostUsd?: string;
    trendReadCostUsd?: string;
    userReadCostUsd?: string;
  } = { updatedAt: new Date() };
  if (fields.monthly_budget_usd !== undefined) {
    patch.monthlyBudgetUsd = String(fields.monthly_budget_usd);
  }
  if (fields.prepaid_balance_usd !== undefined) {
    patch.prepaidBalanceUsd = String(fields.prepaid_balance_usd);
  }
  if (fields.post_read_cost_usd !== undefined) {
    patch.postReadCostUsd = String(fields.post_read_cost_usd);
  }
  if (fields.trend_read_cost_usd !== undefined) {
    patch.trendReadCostUsd = String(fields.trend_read_cost_usd);
  }
  if (fields.user_read_cost_usd !== undefined) {
    patch.userReadCostUsd = String(fields.user_read_cost_usd);
  }

  const [updated] = await db
    .update(usageBudgetSettings)
    .set(patch)
    .where(eq(usageBudgetSettings.provider, provider))
    .returning();

  return NextResponse.json({
    ok: true,
    settings: {
      provider: updated.provider,
      monthlyBudgetUsd: num(updated.monthlyBudgetUsd),
      prepaidBalanceUsd: num(updated.prepaidBalanceUsd),
      postReadCostUsd: num(updated.postReadCostUsd),
      trendReadCostUsd: num(updated.trendReadCostUsd),
      userReadCostUsd: num(updated.userReadCostUsd),
    },
  });
}
