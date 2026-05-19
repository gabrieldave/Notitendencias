import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin-emails";
import { resolveAuthSecret } from "@/lib/auth-env";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

const adapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

/** Proveedores en cada request: en `next build` no hay AUTH_GOOGLE_* → si se fijan al import, quedan []. */
function createGoogleProviders() {
  if (!isGoogleAuthConfigured()) return [];
  return [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!.trim(),
      clientSecret: process.env.AUTH_GOOGLE_SECRET!.trim(),
    }),
  ];
}

/**
 * Config como función (igual que middleware): secret y providers se leen en runtime
 * en Coolify, no durante `npm run build` del Dockerfile.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(async () => {
  const secret = resolveAuthSecret();
  const providers = createGoogleProviders();

  if (!secret) {
    console.error("[auth] AUTH_SECRET ausente en runtime — error Configuration.");
  }
  if (providers.length === 0) {
    console.error("[auth] Sin proveedor Google en runtime — revisa AUTH_GOOGLE_* en Coolify.");
  }

  return {
    ...authConfig,
    secret,
    adapter,
    providers,
    session: {
      strategy: "database",
      maxAge: 90 * 24 * 60 * 60,
    },
    events: {
      async signIn({ user }) {
        if (!user.email) return;
        const em = user.email.toLowerCase().trim();
        if (!parseAdminEmails().includes(em)) return;
        await db.update(users).set({ role: "admin", updatedAt: new Date() }).where(eq(users.email, em));
      },
    },
    callbacks: {
      ...authConfig.callbacks,
      async session({ session, user }) {
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
        return session;
      },
    },
  };
});
