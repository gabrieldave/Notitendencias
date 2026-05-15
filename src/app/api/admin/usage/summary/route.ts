import { NextResponse, type NextRequest } from "next/server";
import { isUsageAdminAuthorized } from "@/lib/usage-auth";
import { getUsageSummary } from "@/lib/usage";

export async function GET(request: NextRequest) {
  if (!(await isUsageAdminAuthorized(request))) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get("provider") ?? "x";
  const summary = await getUsageSummary(provider);
  return NextResponse.json({ ok: true, summary });
}
