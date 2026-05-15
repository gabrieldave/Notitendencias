import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

function LoginFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm font-semibold text-slate-500">
      Cargando…
    </div>
  );
}

export default function LoginPage() {
  const googleEnabled =
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) && Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient googleEnabled={googleEnabled} />
    </Suspense>
  );
}
