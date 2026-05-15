import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

const SALT = "notitendencias:admin:v1";

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function expectedAdminToken(): Promise<string> {
  const pwd = process.env.ADMIN_PASSWORD ?? "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pwd),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(SALT));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Fragmento sin adapter ni providers para usar en middleware (Edge).
 * La sesión se resuelve vía la ruta interna de Auth.js.
 */
export default {
  providers: [],
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async authorized({ request, auth }) {
      const pathname = request.nextUrl.pathname;

      if (pathname.startsWith("/admin")) {
        if (pathname.startsWith("/admin/login")) return true;
        const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
        const token = await expectedAdminToken();
        const ok = cookie ? timingSafeEqualStr(cookie, token) : false;
        if (!ok) {
          const url = request.nextUrl.clone();
          url.pathname = "/admin/login";
          url.searchParams.set("next", pathname);
          return NextResponse.redirect(url);
        }
        return true;
      }

      if (pathname.startsWith("/mi-radar")) {
        return Boolean(auth?.user?.id);
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
