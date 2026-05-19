import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin-emails";

async function loadUserClaims(userId: string) {
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

/** Persiste plan/rol en el JWT al iniciar sesión (solo en rutas Node con adapter). */
export async function jwtCallback({
  token,
  user,
}: {
  token: JWT;
  user?: User;
}): Promise<JWT> {
  const userId = user?.id ?? token.sub;
  if (!userId) return token;

  const row = await loadUserClaims(userId);
  if (!row) return token;

  token.sub = row.id;
  token.name = row.name ?? undefined;
  token.email = row.email;
  token.role = row.role === "admin" || isAdminEmail(row.email) ? "admin" : row.role;
  token.plan = row.plan;
  token.status = row.status;
  return token;
}

/** Rellena `session.user` desde JWT (Edge + Node) o desde `user` del adapter. */
export function applySessionClaims(
  session: Session,
  token: JWT | null | undefined,
  user?: User,
): Session {
  if (!session.user) return session;

  if (token?.sub) {
    session.user.id = token.sub;
    session.user.email = (token.email as string | undefined) ?? session.user.email ?? "";
    session.user.name = (token.name as string | undefined) ?? session.user.name;
    session.user.role = (token.role as string | undefined) ?? "user";
    session.user.plan = (token.plan as string | undefined) ?? "free";
    session.user.status = (token.status as string | undefined) ?? "active";
  } else if (user?.id) {
    session.user.id = user.id;
    session.user.email = user.email ?? session.user.email ?? "";
    session.user.name = user.name ?? session.user.name;
    session.user.role = "user";
    session.user.plan = "free";
    session.user.status = "active";
  }

  if (session.user.email && isAdminEmail(session.user.email)) {
    session.user.role = "admin";
  }

  return session;
}
