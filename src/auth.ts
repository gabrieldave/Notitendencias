import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { EmailConfig } from "@auth/core/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import authConfig from "@/auth.config";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin-emails";
import { assertMagicLinkRateLimit } from "@/lib/auth-rate-limit";
import { isGoogleAuthConfigured } from "@/lib/google-auth";
import { sendMagicLinkWebhook } from "@/lib/magic-link-webhook";

function publicAppOrigin(): string {
  const u = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3015";
  return new URL(u).origin;
}

const magicLink: EmailConfig = {
  id: "email",
  type: "email",
  name: "Correo",
  from: process.env.AUTH_EMAIL_FROM ?? "Notitendencias <login@notitendencias.com>",
  maxAge: 30 * 60,
  async sendVerificationRequest(params) {
    const { identifier, url, request } = params;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const emailKey = identifier.toLowerCase().trim();
    assertMagicLinkRateLimit(ip, emailKey);
    const name = emailKey.split("@")[0] ?? "allí";
    const logoUrl = `${publicAppOrigin()}/branding/logo-icon.png`;
    await sendMagicLinkWebhook({
      to: emailKey,
      name,
      verificationUrl: url,
      logoUrl,
    });
  },
};

const providers = [
  ...(isGoogleAuthConfigured()
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
      ]
    : []),
  magicLink,
];

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
});
