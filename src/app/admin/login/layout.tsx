import { Suspense } from "react";

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="p-10 text-center text-slate-600">Cargando…</div>}>{children}</Suspense>;
}
