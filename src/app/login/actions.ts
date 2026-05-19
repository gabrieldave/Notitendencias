"use server";

import { signIn } from "@/auth";

/** OAuth Google requiere POST + CSRF; GET /api/auth/signin/google lanza UnknownAction. */
export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const raw = formData.get("callbackUrl");
  const callbackUrl =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  await signIn("google", { redirectTo: callbackUrl });
}
