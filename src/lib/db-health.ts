import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type DbHealthStatus = {
  ok: boolean;
  connected: boolean;
  hasStripeCustomerColumn: boolean;
  authJoinQueryOk: boolean;
  migrationCount: number | null;
  error?: string;
};

/** Comprueba que la BD que usa la app (DATABASE_URL de Coolify) tiene el esquema de auth. */
export async function getDbHealthStatus(): Promise<DbHealthStatus> {
  try {
    const col = await db.execute(sql`
      SELECT 1 AS ok FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'stripe_customer_id'
      LIMIT 1
    `);
    const hasStripeCustomerColumn = Array.isArray(col) && col.length > 0;

    let authJoinQueryOk = false;
    try {
      await db.execute(sql`
        SELECT users.stripe_customer_id
        FROM accounts
        INNER JOIN users ON accounts.user_id = users.id
        LIMIT 1
      `);
      authJoinQueryOk = true;
    } catch {
      authJoinQueryOk = false;
    }

    let migrationCount: number | null = null;
    try {
      const m = await db.execute(sql`
        SELECT count(*)::int AS c FROM drizzle.__drizzle_migrations
      `);
      const row = (m as { c?: number }[])[0];
      migrationCount = row?.c ?? null;
    } catch {
      migrationCount = null;
    }

    const ok = hasStripeCustomerColumn && authJoinQueryOk;

    return {
      ok,
      connected: true,
      hasStripeCustomerColumn,
      authJoinQueryOk,
      migrationCount,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      connected: false,
      hasStripeCustomerColumn: false,
      authJoinQueryOk: false,
      migrationCount: null,
      error: message,
    };
  }
}

/** Smoke test ligero en users (Drizzle schema). */
export async function canSelectUsersViaDrizzle(): Promise<boolean> {
  try {
    await db.select({ id: users.id }).from(users).limit(1);
    return true;
  } catch {
    return false;
  }
}
