import { NextResponse } from "next/server";
import { db } from "@/db";
import { trends } from "@/db/schema";
import { desc, eq, and, SQL } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categorySlug = searchParams.get("category_slug");

  const parts: SQL[] = [eq(trends.status, "published")];
  if (categorySlug) {
    parts.push(eq(trends.categorySlug, categorySlug));
  }

  const rows = await db
    .select()
    .from(trends)
    .where(and(...parts))
    .orderBy(desc(trends.publishedAt))
    .limit(100);

  return NextResponse.json({ ok: true, trends: rows });
}
