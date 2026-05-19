/** Rutas internas seguras para redirects post-login. */
export function safeInternalPath(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return "/ia";
  const t = v.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/ia";
  return t;
}

function isLoginPath(path: string): boolean {
  return path === "/login" || path.startsWith("/login?");
}

/**
 * Destino cuando el usuario ya tiene sesión activa y visita /login.
 */
export function resolveLoggedInRedirect(
  sp: Record<string, string | string[] | undefined>,
): string {
  const intent = Array.isArray(sp.intent) ? sp.intent[0] : sp.intent;
  const callback = safeInternalPath(sp.callbackUrl ?? sp.next);

  if (intent === "premium") {
    if (!isLoginPath(callback) && callback !== "/") return callback;
    return "/ia#pricing";
  }

  if (isLoginPath(callback) || callback === "/") return "/ia";
  return callback;
}

/** Enlace para activar premium sin pasar por /login si ya hay cuenta. */
export function premiumUpgradeHref(callbackPath: string): string {
  const safe = safeInternalPath(callbackPath);
  return `/login?intent=premium&callbackUrl=${encodeURIComponent(safe)}`;
}
