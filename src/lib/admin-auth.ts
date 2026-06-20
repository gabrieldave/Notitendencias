import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isAdminEmail } from "@/lib/admin-emails";
import { ADMIN_COOKIE_NAME } from "./constants";

const SALT = "notitendencias:admin:v1";

export function getAdminSessionToken(): string {
  const pwd = process.env.ADMIN_PASSWORD ?? "";
  return createHmac("sha256", pwd).update(SALT).digest("hex");
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || !password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyAdminCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const token = getAdminSessionToken();
  if (value.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(token));
  } catch {
    return false;
  }
}

export async function isAdminFromCookies(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminCookieValue(store.get(ADMIN_COOKIE_NAME)?.value);
}

/** Cookie admin del panel o rol `admin` en BD (sesión NextAuth). */
export async function isElevatedAdmin(): Promise<boolean> {
  if (await isAdminFromCookies()) return true;
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;
  if (session.user.role === "admin") return true;
  if (isAdminEmail(session.user.email)) return true;
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  return row?.role === "admin";
}

export function isAdminFromRequest(request: NextRequest): boolean {
  return verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

/** Cookie admin o sesión Auth.js con rol/email de admin (misma lógica que isElevatedAdmin). */
export async function isElevatedAdminFromRequest(
  _request: NextRequest,
): Promise<boolean> {
  if (isAdminFromRequest(_request)) return true;
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;
  if (session.user.role === "admin") return true;
  if (isAdminEmail(session.user.email)) return true;
  const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, id)).limit(1);
  return row?.role === "admin";
}

/** Hash no reversible para mostrar en settings (estado de contraseña) */
export function maskSecretConfigured(value: string | undefined): boolean {
  return Boolean(value && value.length > 0 && value !== "change_me");
}

export function fingerprint(value: string | undefined): string {
  if (!value) return "no configurado";
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}
