import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { rawTrendItems } from "@/db/schema";
import { isElevatedAdmin } from "@/lib/admin-auth";
import { desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!(await isElevatedAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const rows = status
    ? await db
        .select()
        .from(rawTrendItems)
        .where(eq(rawTrendItems.status, status))
        .orderBy(desc(rawTrendItems.createdAt))
        .limit(200)
    : await db
        .select()
        .from(rawTrendItems)
        .orderBy(desc(rawTrendItems.createdAt))
        .limit(200);

  return NextResponse.json({ ok: true, items: rows });
}
