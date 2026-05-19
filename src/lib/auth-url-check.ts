import { googleOAuthCallbackUrl, resolvePublicAppUrl } from "@/lib/app-url";

export type AuthUrlCheck = {
  configuredOrigin: string | null;
  googleCallbackUrl: string | null;
  requestHost: string | null;
  hostMatchesConfig: boolean | null;
};

export function getAuthUrlCheck(requestHost?: string | null): AuthUrlCheck {
  const configuredOrigin = resolvePublicAppUrl() ?? null;
  const googleCallbackUrl = googleOAuthCallbackUrl() ?? null;
  const host = requestHost?.split(",")[0]?.trim().toLowerCase() || null;

  let hostMatchesConfig: boolean | null = null;
  if (configuredOrigin && host) {
    try {
      const configHost = new URL(configuredOrigin).host.toLowerCase();
      hostMatchesConfig = host === configHost || host.endsWith(`.${configHost}`);
    } catch {
      hostMatchesConfig = false;
    }
  }

  return {
    configuredOrigin,
    googleCallbackUrl,
    requestHost: host,
    hostMatchesConfig,
  };
}
