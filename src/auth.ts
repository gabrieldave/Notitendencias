import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin-emails";
import { resolveAuthSecret } from "@/lib/auth-env";
import { createGoogleProviders, googleProviderCount } from "@/lib/auth-providers";

const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

function runtimeTrustHost(): boolean {
  return process.env.AUTH_TRUST_HOST === "true";
}

/**
 * Config en cada petición: secret, trustHost y providers no deben fijarse en `next build`
 * (Dockerfile/Nixpacks sin AUTH_* en la fase de build → error Configuration en OAuth).
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
      strategy: "database",
      maxAge: 90 * 24 * 60 * 60,
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
      async session({ session, user }) {
        try {
          const [row] = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              role: users.role,
              plan: users.plan,
              status: users.status,
            })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);
          if (!row || !session.user) return session;
          session.user.id = row.id;
          session.user.email = row.email ?? "";
          session.user.name = row.name;
          session.user.role = row.role === "admin" || isAdminEmail(row.email) ? "admin" : row.role;
          session.user.plan = row.plan;
          session.user.status = row.status;
        } catch (e) {
          console.error("[auth] session callback:", e);
        }
        return session;
      },
    },
  };
});

export { googleProviderCount };
