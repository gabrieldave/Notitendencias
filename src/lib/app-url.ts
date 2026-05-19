/** URL pública canónica (sin barra final). */
export function resolvePublicAppUrl(): string | undefined {
  const raw = process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return undefined;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return undefined;
  }
}

export function googleOAuthCallbackUrl(): string | undefined {
  const base = resolvePublicAppUrl();
  return base ? `${base}/api/auth/callback/google` : undefined;
}

/** Sufijo del client id para diagnóstico (no expone el id completo). */
export function maskGoogleClientId(): string | null {
  const id = process.env.AUTH_GOOGLE_ID?.trim();
  if (!id) return null;
  if (id.length <= 12) return "…";
  return `…${id.slice(-12)}`;
}
