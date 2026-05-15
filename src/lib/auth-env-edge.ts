/**
 * Lee AUTH_SECRET en runtime sin que el bundler del Edge Middleware lo sustituya
 * por `undefined` durante `next build` (cuando la variable solo existe en Coolify en runtime).
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export function resolveAuthSecretEdge(): string | undefined {
  const auth = "AUTH";
  const secret = "SECRET";
  const keyAuth = `${auth}_${secret}`;
  const keyLegacy = `NEXTAUTH_${secret}`;
  return process.env[keyAuth] ?? process.env[keyLegacy];
}
