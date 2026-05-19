"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Tras login OAuth, un solo refresh para alinear RSC con la cookie JWT.
 * No refrescar en cada cambio de ruta (provocaba parpadeos y sensación de logout).
 */
export function SessionRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    if (pathname.startsWith("/login") || pathname.startsWith("/auth/")) return;

    didRun.current = true;
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
