import Google from "next-auth/providers/google";
import { isGoogleAuthConfigured } from "@/lib/google-auth";

/** Proveedores OAuth evaluados en runtime (no en `next build`). */
export function createGoogleProviders() {
  if (!isGoogleAuthConfigured()) return [];
  return [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!.trim(),
      clientSecret: process.env.AUTH_GOOGLE_SECRET!.trim(),
    }),
  ];
}

export function googleProviderCount(): number {
  return createGoogleProviders().length;
}
