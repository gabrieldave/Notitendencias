import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { resolveAuthSecretEdge } from "./lib/auth-env-edge";

/**
 * Config vía función para que `setEnvDefaults` corra en cada request del middleware
 * y el secreto se lea en runtime (Coolify), no quede «undefined» incrustado en el bundle Edge por el build.
 */
const { auth } = NextAuth(async () => ({
  ...authConfig,
  secret: resolveAuthSecretEdge(),
  trustHost: process.env.AUTH_TRUST_HOST === "true",
}));

export default auth;

/** Solo `/admin`: el middleware Edge no puede usar el adapter Drizzle; con sesión en BD `auth()` ahí no obtiene `user.id` y redirigía a login. `/mi-radar` se protege en servidor con `getOptionalSessionUser()`. */
export const config = {
  matcher: ["/admin/:path*"],
};
