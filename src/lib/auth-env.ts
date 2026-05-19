/**
 * Secreto Auth.js en runtime (Node y Edge).
 * Evita que `next build` deje el secreto incrustado como vacío cuando solo existe en Coolify en runtime.
 */
export function resolveAuthSecret(): string | undefined {
  const auth = "AUTH";
  const secret = "SECRET";
  const keyAuth = `${auth}_${secret}`;
  const keyLegacy = `NEXTAUTH_${secret}`;
  return process.env[keyAuth]?.trim() || process.env[keyLegacy]?.trim() || undefined;
}
