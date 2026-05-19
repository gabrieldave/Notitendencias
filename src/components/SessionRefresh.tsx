"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Tras login OAuth o navegación, alinea RSC con la cookie real llamando /api/me.
 */
export function SessionRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { user?: { id: string } | null };
        if (data.user?.id) router.refresh();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  return null;
}
