import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trends, userFavorites } from "@/db/schema";
import { TrendCard } from "@/components/TrendCard";
import { isPremiumPlan } from "@/lib/membership";
import { getOptionalSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function MiRadarPage() {
  const user = await getOptionalSessionUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/mi-radar")}`);
  }

  if (!isPremiumPlan(user.plan)) {
    return (
      <div className="min-h-[60vh] bg-slate-50/80">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Mi radar</p>
          <h1 className="mt-3 text-3xl font-black text-brand-navy md:text-4xl">Desbloquea Mi radar</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Guarda tendencias, construye tu biblioteca editorial y vuelve a ellas cuando quieras. Esta función está
            incluida en el plan Premium.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?intent=premium&callbackUrl=%2Fmi-radar"
              className="inline-flex rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
            >
              Hazte Premium
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-brand-navy hover:border-brand-navy"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rows = await db
    .select({ trend: trends })
    .from(userFavorites)
    .innerJoin(trends, eq(userFavorites.trendId, trends.id))
    .where(and(eq(userFavorites.userId, user.id), eq(trends.status, "published")))
    .orderBy(desc(userFavorites.createdAt));

  const saved = rows.map((r) => r.trend);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/90">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <header className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Tu espacio</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-navy md:text-4xl">Mi radar</h1>
          <p className="mt-3 text-slate-600">
            Tendencias que marcaste como favoritas. Un tablero editorial simple para volver al análisis cuando lo
            necesites.
          </p>
        </header>

        {saved.length === 0 ? (
          <div className="mt-14 rounded-[2rem] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center shadow-inner md:px-10">
            <p className="text-lg font-bold text-brand-navy md:text-xl">
              Todavía no guardas tendencias. Explora IA y guarda las más útiles.
            </p>
            <Link
              href="/ia"
              className="mt-6 inline-flex rounded-2xl bg-brand-navy px-6 py-3 text-sm font-black text-white shadow-md hover:bg-slate-900"
            >
              Explorar tendencias
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((t) => (
              <TrendCard key={t.id} trend={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
