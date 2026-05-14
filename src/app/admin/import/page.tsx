import { CSVImportForm } from "@/components/CSVImportForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-sm font-semibold text-brand-orange hover:underline">
        ← Volver al panel
      </Link>
      <h1 className="mt-4 text-3xl font-black text-brand-navy">Importar CSV</h1>
      <p className="mt-2 text-sm text-slate-600">
        Columnas: <code className="rounded bg-slate-100 px-1">category</code>,{" "}
        <code className="rounded bg-slate-100 px-1">source_name</code>,{" "}
        <code className="rounded bg-slate-100 px-1">source_url</code>,{" "}
        <code className="rounded bg-slate-100 px-1">title</code>,{" "}
        <code className="rounded bg-slate-100 px-1">raw_text</code>
      </p>
      <CSVImportForm />
    </div>
  );
}
