"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

/** Si hay sesión en el navegador pero el HTML vino sin usuario, revalida el RSC. */
export function TrendDetailAccessSync({ serverHasUser }: { serverHasUser: boolean }) {
  const { status, data } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (serverHasUser) return;
    if (status !== "authenticated" || !data?.user?.id) return;
    router.refresh();
  }, [serverHasUser, status, data?.user?.id, router]);

  return null;
}
