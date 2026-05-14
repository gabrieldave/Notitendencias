import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
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

export function isAdminFromRequest(request: NextRequest): boolean {
  return verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

/** Hash no reversible para mostrar en settings (estado de contraseña) */
export function maskSecretConfigured(value: string | undefined): boolean {
  return Boolean(value && value.length > 0 && value !== "change_me");
}

export function fingerprint(value: string | undefined): string {
  if (!value) return "no configurado";
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}
