import { CSVImportForm } from "@/components/CSVImportForm";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default function AdminImportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black text-brand-navy">Importar CSV</h1>
        <AdminNav active="/admin/import" />
      </div>
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
