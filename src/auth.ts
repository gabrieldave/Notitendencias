import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin-emails";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

if (!isGoogleAuthConfigured()) {
  console.warn(
    "[auth] AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET no configurados. El login de usuarios no estará disponible.",
  );
}

const providers = isGoogleAuthConfigured()
  ? [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      }),
    ]
  : [];

async function loadUserTokenFields(userId: string) {
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
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  /** JWT: sesión estable en App Router (database strategy fallaba en varias rutas). */
  session: {
    strategy: "jwt",
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
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub ?? (token.id as string | undefined);
      if (!userId) return token;

      // Siempre leer BD: plan premium puede cambiar (Stripe) sin nuevo login.
      const row = await loadUserTokenFields(userId);
      if (!row) return token;

      token.sub = row.id;
      token.id = row.id;
      token.email = row.email ?? "";
      token.name = row.name;
      token.role = row.role === "admin" || isAdminEmail(row.email) ? "admin" : row.role;
      token.plan = row.plan;
      token.status = row.status;
      return token;
    },
    async session({ session, token }) {
      if (!session.user) return session;
      const id = (token.id as string | undefined) ?? token.sub;
      if (!id) return session;

      session.user.id = id;
      session.user.email = (token.email as string) ?? "";
      session.user.name = (token.name as string | null) ?? null;
      session.user.role = (token.role as string) ?? "user";
      session.user.plan = (token.plan as string) ?? "free";
      session.user.status = (token.status as string) ?? "active";

      if (session.user.email && isAdminEmail(session.user.email)) {
        session.user.role = "admin";
      }
      return session;
    },
  },
});
