"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Si el HTML del detalle vino sin acceso pero /api/me confirma sesión premium, revalida una vez.
 */
export function TrendDetailAccessSync({ serverUnlocked }: { serverUnlocked: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (serverUnlocked) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { radarUnlocked?: boolean };
        if (data.radarUnlocked) router.refresh();
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serverUnlocked, router]);

  return null;
}
