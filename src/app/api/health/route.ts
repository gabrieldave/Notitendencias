import { NextResponse } from "next/server";

/** Para Coolify/Cloudflare: no usa base de datos. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "notitendencias",
    ts: new Date().toISOString(),
  });
}
