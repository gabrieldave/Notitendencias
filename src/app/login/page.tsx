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
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
