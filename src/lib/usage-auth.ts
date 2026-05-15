import type { NextRequest } from "next/server";
import { isElevatedAdminFromRequest } from "@/lib/admin-auth";

export function verifyUsageApiKey(request: NextRequest): boolean {
  const expected = process.env.USAGE_API_KEY?.trim();
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  return Boolean(token && token === expected);
}

/** n8n con USAGE_API_KEY o sesión/cookie admin. */
export async function isUsageRecorderAuthorized(request: NextRequest): Promise<boolean> {
  if (verifyUsageApiKey(request)) return true;
  return isElevatedAdminFromRequest(request);
}

/** Panel y lecturas de uso: solo admin elevado. */
export async function isUsageAdminAuthorized(request: NextRequest): Promise<boolean> {
  return isElevatedAdminFromRequest(request);
}
