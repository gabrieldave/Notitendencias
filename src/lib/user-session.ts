import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { USER_SESSION_COOKIE_NAME } from "./constants";

export type PublicUser = Pick<User, "id" | "email" | "name" | "plan" | "status">;

type SessionPayload = { sub: string; exp: number };

function getSecret(): string | undefined {
  const s = process.env.USER_SESSION_SECRET?.trim();
  return s && s.length >= 16 ? s : undefined;
}

export function canSignUserSessions(): boolean {
  return Boolean(getSecret());
}

export function signUserSession(userId: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("USER_SESSION_SECRET no configurada o demasiado corta");
  }
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
  const body: SessionPayload = { sub: userId, exp };
  const payload = Buffer.from(JSON.stringify(body), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyUserSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const secret = getSecret();
  if (!secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
  if (!parsed?.sub || typeof parsed.exp !== "number") return null;
  if (parsed.exp * 1000 < Date.now()) return null;
  return parsed;
}

export async function getOptionalSessionUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token = store.get(USER_SESSION_COOKIE_NAME)?.value;
  const payload = verifyUserSessionToken(token);
  if (!payload) return null;
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);
  if (!row || row.status !== "active") return null;
  return row;
}

export function getSessionPayloadFromRequest(request: NextRequest): SessionPayload | null {
  return verifyUserSessionToken(request.cookies.get(USER_SESSION_COOKIE_NAME)?.value);
}

export async function getUserByIdForSession(userId: string): Promise<PublicUser | null> {
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row.status !== "active") return null;
  return row;
}
