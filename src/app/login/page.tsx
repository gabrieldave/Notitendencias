import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/google-auth";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500">
      Cargando…
    </div>
  );
}

function safeInternalPath(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return "/";
  const t = v.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user?.id) {
    redirect(safeInternalPath(sp.callbackUrl ?? sp.next));
  }

  const googleEnabled = isGoogleAuthConfigured();
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient googleEnabled={googleEnabled} />
    </Suspense>
  );
}
