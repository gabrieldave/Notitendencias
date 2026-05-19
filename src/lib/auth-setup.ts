import { isGoogleAuthConfigured } from "@/lib/google-auth";
import { resolveAuthSecret } from "@/lib/auth-env";

export type AuthSetupIssue = "missing_secret" | "missing_google";

export type AuthSetupStatus = {
  ok: boolean;
  hasSecret: boolean;
  hasGoogle: boolean;
  hasPublicUrl: boolean;
  trustHost: boolean;
  issues: AuthSetupIssue[];
};

/** Comprueba variables mínimas para OAuth Google + Auth.js en runtime (servidor). */
export function getAuthSetupStatus(): AuthSetupStatus {
  const hasSecret = Boolean(resolveAuthSecret());
  const hasGoogle = isGoogleAuthConfigured();
  const hasPublicUrl = Boolean(
    process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim(),
  );
  const trustHost = process.env.AUTH_TRUST_HOST === "true";

  const issues: AuthSetupIssue[] = [];
  if (!hasSecret) issues.push("missing_secret");
  if (!hasGoogle) issues.push("missing_google");

  return {
    ok: hasSecret && hasGoogle,
    hasSecret,
    hasGoogle,
    hasPublicUrl,
    trustHost,
    issues,
  };
}

export function authSetupUserMessage(status: AuthSetupStatus): string {
  if (status.issues.includes("missing_secret")) {
    return "El servidor no tiene AUTH_SECRET configurado (variable de runtime en Coolify). Genera uno con openssl rand -base64 32 y redeploy.";
  }
  if (status.issues.includes("missing_google")) {
    return "Faltan AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET en el servidor. Revisa la guía de Google OAuth en docs/google-oauth-coolify.md.";
  }
  if (!status.hasPublicUrl) {
    return "Define AUTH_URL y NEXT_PUBLIC_APP_URL con la URL pública (https://notitendencias.iareal.net).";
  }
  if (!status.trustHost) {
    return "En producción detrás de proxy, define AUTH_TRUST_HOST=true en Coolify y redeploy.";
  }
  return "Revisa AUTH_SECRET, credenciales Google y AUTH_URL en Coolify; luego redeploy.";
}
