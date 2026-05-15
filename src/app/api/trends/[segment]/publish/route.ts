import { NextResponse, type NextRequest } from "next/server";
import { isElevatedAdmin } from "@/lib/admin-auth";
import { publishTrendById } from "@/lib/admin-trend-actions";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ segment: string }> },
) {
  if (!(await isElevatedAdmin())) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { segment } = await ctx.params;

  let confirmEditorialArxiv = false;
  const raw = await request.text();
  if (raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as { confirmEditorialArxiv?: unknown };
      if (parsed.confirmEditorialArxiv === true) confirmEditorialArxiv = true;
    } catch {
      return NextResponse.json({ ok: false, error: "JSON del cuerpo inválido" }, { status: 400 });
    }
  }

  const result = await publishTrendById(segment, { confirmEditorialArxiv });

  if (!result.ok) {
    if (result.code === "EDITORIAL_ARXIV_CONFIRM_REQUIRED") {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          message: result.message,
          hint: result.hint,
        },
        { status: result.httpStatus },
      );
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: result.httpStatus });
  }

  return NextResponse.json({ ok: true, trend: result.trend });
}
