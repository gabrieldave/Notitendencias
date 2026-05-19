import { NextResponse } from "next/server";
import { getAuthSetupStatus } from "@/lib/auth-setup";

/** Para Coolify/Cloudflare: no usa base de datos. Incluye flags de auth (sin secretos). */
export async function GET() {
  const auth = getAuthSetupStatus();
  return NextResponse.json({
    ok: true,
    service: "notitendencias",
    ts: new Date().toISOString(),
    auth: {
      ready: auth.ok,
      hasSecret: auth.hasSecret,
      hasGoogle: auth.hasGoogle,
      googleProviderCount: auth.googleProviderCount,
      hasPublicUrl: auth.hasPublicUrl,
      trustHost: auth.trustHost,
    },
  });
}
