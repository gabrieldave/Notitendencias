import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAuthSetupStatus } from "@/lib/auth-setup";
import { getAuthUrlCheck } from "@/lib/auth-url-check";
import { canSelectUsersViaDrizzle, getDbHealthStatus } from "@/lib/db-health";

/** Coolify/Cloudflare: auth env + esquema mínimo de BD para login Google. */
export async function GET() {
  const auth = getAuthSetupStatus();
  const db = await getDbHealthStatus();
  const drizzleOk = await canSelectUsersViaDrizzle();
  const dbReady = db.ok && drizzleOk;

  const h = await headers();
  const requestHost = h.get("x-forwarded-host") ?? h.get("host");
  const urls = getAuthUrlCheck(requestHost);

  const authReady = auth.ok && (urls.hostMatchesConfig !== false);
  const ok = authReady && dbReady;

  return NextResponse.json({
    ok,
    service: "notitendencias",
    ts: new Date().toISOString(),
    auth: {
      ready: authReady,
      hasSecret: auth.hasSecret,
      hasGoogle: auth.hasGoogle,
      googleProviderCount: auth.googleProviderCount,
      hasPublicUrl: auth.hasPublicUrl,
      publicUrl: auth.publicUrl,
      googleCallbackUrl: auth.googleCallbackUrl,
      googleClientIdSuffix: auth.googleClientIdSuffix,
      trustHost: auth.trustHost,
    },
    urls: {
      configuredOrigin: urls.configuredOrigin,
      requestHost: urls.requestHost,
      hostMatchesConfig: urls.hostMatchesConfig,
      googleCallbackUrl: urls.googleCallbackUrl,
    },
    db: {
      ready: dbReady,
      hasStripeCustomerColumn: db.hasStripeCustomerColumn,
      authJoinQueryOk: db.authJoinQueryOk,
      migrationCount: db.migrationCount,
      drizzleUsersSelectOk: drizzleOk,
      error: db.error,
    },
  });
}
