import { Suspense } from "react";
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

export default function LoginPage() {
  const googleEnabled = isGoogleAuthConfigured();
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient googleEnabled={googleEnabled} />
    </Suspense>
  );
}
