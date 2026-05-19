import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { parseAdminEmails } from "@/lib/admin-emails";
import { applySessionClaims, jwtCallback } from "@/lib/auth-callbacks";
import { resolveAuthSecret } from "@/lib/auth-env";
import { createGoogleProviders, googleProviderCount } from "@/lib/auth-providers";

const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

const SESSION_MAX_AGE = 90 * 24 * 60 * 60;

function runtimeTrustHost(): boolean {
  return process.env.AUTH_TRUST_HOST === "true";
}

/**
 * Config en cada petición: secret, trustHost y providers no deben fijarse en `next build`.
 * Sesión JWT: estable en App Router/RSC (las sesiones solo en BD se perdían al navegar).
 */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const secret = resolveAuthSecret();
  const providers = createGoogleProviders();
  const trustHost = runtimeTrustHost();

  if (!secret) {
    console.error("[auth] AUTH_SECRET ausente en runtime.");
  }
  if (providers.length === 0) {
    console.error("[auth] 0 proveedores Google en runtime — revisa AUTH_GOOGLE_* en Coolify.");
  }
  if (!trustHost && process.env.NODE_ENV === "production") {
    console.warn("[auth] AUTH_TRUST_HOST no es true — OAuth puede fallar detrás del proxy.");
  }

  return {
    ...authConfig,
    secret,
    trustHost,
    adapter,
    providers,
    debug: process.env.AUTH_DEBUG === "true",
    cookies: {
      sessionToken: {
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
          maxAge: SESSION_MAX_AGE,
        },
      },
      pkceCodeVerifier: {
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: true,
          maxAge: 60 * 30,
        },
      },
    },
    session: {
      strategy: "jwt",
      maxAge: SESSION_MAX_AGE,
      updateAge: 24 * 60 * 60,
    },
    events: {
      async signIn({ user }) {
        try {
          if (!user.email) return;
          const em = user.email.toLowerCase().trim();
          if (!parseAdminEmails().includes(em)) return;
          await db
            .update(users)
            .set({ role: "admin", updatedAt: new Date() })
            .where(eq(users.email, em));
        } catch (e) {
          console.error("[auth] signIn event (admin role):", e);
        }
      },
    },
    callbacks: {
      ...authConfig.callbacks,
      jwt: jwtCallback,
      async session({ session, token, user }) {
        return applySessionClaims(session, token, user);
      },
    },
  };
});

export { googleProviderCount };
