"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { resolveLoggedInRedirect } from "@/lib/login-redirect";

/** Si la sesión existe en cliente pero el HTML de login se mostró, redirige sin pedir Google otra vez. */
export function LoginAlreadyAuthed() {
  const { status, data } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.id) return;
    const sp: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((value, key) => {
      sp[key] = value;
    });
    router.replace(resolveLoggedInRedirect(sp));
  }, [status, data?.user?.id, router, searchParams]);

  return null;
}
