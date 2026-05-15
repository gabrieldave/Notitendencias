import { db } from "@/db";
import { rawTrendItems, trends } from "@/db/schema";
import { desc, eq, inArray, or } from "drizzle-orm";
import { AdminNav } from "@/components/AdminNav";
import { AdminRawItemTable } from "@/components/AdminRawItemTable";
import { AdminTrendTable } from "@/components/AdminTrendTable";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const rawPending = await db
    .select()
    .from(rawTrendItems)
    .where(
      or(
        eq(rawTrendItems.status, "new"),
        eq(rawTrendItems.status, "error"),
        eq(rawTrendItems.status, "requires_review"),
      ),
    )
    .orderBy(desc(rawTrendItems.createdAt))
    .limit(100);

  const trendQueue = await db
    .select()
    .from(trends)
    .where(inArray(trends.status, ["draft", "pending"]))
    .orderBy(desc(trends.createdAt))
    .limit(100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-navy">Panel admin</h1>
          <p className="text-sm text-slate-600">Procesar hallazgos, publicar tendencias.</p>
        </div>
        <AdminNav active="/admin" />
      </div>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-brand-navy">Hallazgos nuevos</h2>
        <AdminRawItemTable items={rawPending} />
      </section>

      <section>
        <h2 className="text-xl font-bold text-brand-navy">Tendencias en revisión</h2>
        <AdminTrendTable trends={trendQueue} />
      </section>
    </div>
  );
}
