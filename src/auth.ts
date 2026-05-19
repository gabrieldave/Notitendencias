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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
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
      const userId = user?.id;
      if (!userId || !session.user) return session;

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
});
