import { db } from "@/db";
import { trends, type Trend } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TrendCard } from "@/components/TrendCard";

export const dynamic = "force-dynamic";

export default async function IaPage() {
  let list: Trend[] = [];
  try {
    list = await db
      .select()
      .from(trends)
      .where(and(eq(trends.status, "published"), eq(trends.categorySlug, "ia")))
      .orderBy(desc(trends.publishedAt))
      .limit(50);
  } catch {
    list = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-orange">
          Categoría
        </p>
        <h1 className="text-4xl font-black text-brand-navy">Inteligencia artificial</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Lanzamientos, modelos, agentes y señales prácticas para creadores y emprendedores en
          México.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {list.length === 0 ? (
          <p className="text-slate-600 md:col-span-2">
            No hay tendencias publicadas en IA todavía.
          </p>
        ) : (
          list.map((t) => <TrendCard key={t.id} trend={t} />)
        )}
      </div>
    </div>
  );
}
