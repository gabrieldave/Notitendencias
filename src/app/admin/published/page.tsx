import { desc, eq } from "drizzle-orm";
import { AdminNav } from "@/components/AdminNav";
import { AdminPublishedTrendTable } from "@/components/AdminPublishedTrendTable";
import { db } from "@/db";
import { trends } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminPublishedPage() {
  const published = await db
    .select()
    .from(trends)
    .where(eq(trends.status, "published"))
    .orderBy(desc(trends.publishedAt), desc(trends.createdAt))
    .limit(200);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-navy">Publicadas en la web</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Tendencias visibles en el sitio público. «Quitar de la web» las pasa a estado{" "}
            <span className="font-semibold">rejected</span> y dejan de mostrarse.
          </p>
        </div>
        <AdminNav active="/admin/published" />
      </div>
      <AdminPublishedTrendTable trends={published} />
    </div>
  );
}
