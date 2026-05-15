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
}));

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/mi-radar/:path*"],
};
