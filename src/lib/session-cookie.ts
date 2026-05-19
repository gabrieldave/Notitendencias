import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

const SESSION_PREFIXES = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
] as const;

/** Lee cookie de sesión Auth.js, incluyendo variantes fragmentadas (.0, .1, …). */
export function readSessionCookieValue(
  cookieStore: Pick<RequestCookies, "get" | "getAll">,
): string | undefined {
  for (const prefix of SESSION_PREFIXES) {
    const direct = cookieStore.get(prefix)?.value;
    if (direct) return direct;

    const chunks: string[] = [];
    for (let i = 0; i < 32; i++) {
      const part = cookieStore.get(`${prefix}.${i}`)?.value;
      if (!part) break;
      chunks.push(part);
    }
    if (chunks.length > 0) return chunks.join("");
  }

  return undefined;
}
