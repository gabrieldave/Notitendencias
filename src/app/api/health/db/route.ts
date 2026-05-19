import { NextResponse } from "next/server";
import { canSelectUsersViaDrizzle, getDbHealthStatus } from "@/lib/db-health";

/** Diagnóstico de BD real (misma DATABASE_URL que Auth). No expone secretos. */
export async function GET() {
  const db = await getDbHealthStatus();
  const drizzleOk = await canSelectUsersViaDrizzle();

  return NextResponse.json({
    ok: db.ok && drizzleOk,
    db: {
      ...db,
      drizzleUsersSelectOk: drizzleOk,
    },
    ts: new Date().toISOString(),
  });
}
