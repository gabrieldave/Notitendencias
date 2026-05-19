import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isGoogleAuthConfigured } from "@/lib/google-auth";
import { resolveLoggedInRedirect } from "@/lib/login-redirect";
import { getOptionalSessionUser } from "@/lib/session-user";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

function LoginFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500">
      Cargando…
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalSessionUser();
  const sp = await searchParams;
  if (user) {
    redirect(resolveLoggedInRedirect(sp));
  }

  const googleEnabled = isGoogleAuthConfigured();
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient googleEnabled={googleEnabled} />
    </Suspense>
  );
}
