import { NextResponse, type NextRequest } from "next/server";
import { isElevatedAdmin } from "@/lib/admin-auth";
import { processRawItemById } from "@/lib/admin-trend-actions";

/** DeepSeek puede tardar; evita cortes prematuros en despliegues que respetan este límite. */
export const maxDuration = 300;

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isElevatedAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await processRawItemById(id);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({
    ok: true,
    trend: result.trend,
    ...(result.reused !== undefined ? { reused: result.reused } : {}),
  });
}
