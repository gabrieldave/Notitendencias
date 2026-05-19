"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { resolveLoggedInRedirect } from "@/lib/login-redirect";

/** Redirige si /api/me confirma sesión (más fiable que useSession solo). */
export function LoginAlreadyAuthed() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { user?: { id: string } | null };
        if (!data.user?.id) return;
        const sp: Record<string, string | string[] | undefined> = {};
        searchParams.forEach((value, key) => {
          sp[key] = value;
        });
        router.replace(resolveLoggedInRedirect(sp));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return null;
}
