import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { trends, userFavorites, users } from "@/db/schema";
import { CancelMembershipPanel } from "@/components/CancelMembershipPanel";
import { TrendCard } from "@/components/TrendCard";
import { isPremiumPlan } from "@/lib/membership";
import { radarPriceMxnHintLabel, radarPriceUsdLabel } from "@/lib/radar-pricing-display";
import { requireSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

/** Next puede pasar `searchParams` como Promise u objeto según versión/runtime; evita fallos al leer `bienvenida`. */
async function normalizeSearchParams(raw: unknown): Promise<Record<string, string | string[] | undefined>> {
  if (raw == null) return {};
  const maybeThenable = raw as { then?: unknown };
  if (typeof maybeThenable.then === "function") {
    return await (raw as Promise<Record<string, string | string[] | undefined>>);
  }
  if (typeof raw === "object") {
    return raw as Record<string, string | string[] | undefined>;
  }
  return {};
}

function bienvenidaFlag(sp: Record<string, string | string[] | undefined>): boolean {
  const v = sp.bienvenida;
  if (v === "1") return true;
  if (Array.isArray(v) && v.some((x) => x === "1")) return true;
  return false;
}

function formatMemberSince(d: Date): string {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function safeMemberSince(createdAt: unknown): Date {
  if (createdAt instanceof Date && !Number.isNaN(createdAt.getTime())) return createdAt;
  if (typeof createdAt === "string") {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function planDisplay(plan: string): string {
  if (plan === "premium") return "AI Radar activo";
  if (plan === "free") return "Beta / pendiente";
  return plan;
}

function statusDisplay(status: string): string {
  if (status === "active") return "Activa";
  if (status === "inactive") return "Inactiva";
  return status;
}

export default async function MiRadarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await normalizeSearchParams(searchParams);
  const bienvenidaStripe = bienvenidaFlag(sp);
  const user = await requireSessionUser("/mi-radar");

  const [profile] = await db
    .select({ createdAt: users.createdAt, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const memberSince = safeMemberSince(profile?.createdAt);
  const premium = isPremiumPlan(user.plan);

  const rows = premium
    ? await db
        .select({ trend: trends })
        .from(userFavorites)
        .innerJoin(trends, eq(userFavorites.trendId, trends.id))
        .where(and(eq(userFavorites.userId, user.id), eq(trends.status, "published")))
        .orderBy(desc(trends.signalPostedAt), desc(trends.publishedAt), desc(trends.createdAt))
    : [];

  const saved = rows.map((r) => r.trend);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/90">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <header className="border-b border-slate-100 pb-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-orange">Tu panel</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-navy md:text-4xl">Mi radar</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Resumen de tu cuenta, suscripción y tendencias que guardas para volver a ellas.
          </p>
          {user.name ? (
            <p className="mt-4 text-sm font-semibold text-brand-navy">
              Hola, <span className="text-brand-orange">{user.name}</span>
              <span className="font-normal text-slate-500"> · {user.email}</span>
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-500">{user.email}</p>
          )}
        </header>

        {bienvenidaStripe && premium ? (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-950 md:text-base"
          >
            ¡Bienvenido/a a Notitendencias AI Radar! Ya puedes ver el análisis completo, oportunidades e ideas de negocio
            en todo el radar.
          </div>
        ) : null}
        {bienvenidaStripe && !premium ? (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-relaxed text-amber-950"
          >
            Gracias por tu pago. Si tu cuenta sigue en beta, activa el webhook de Stripe→BD o asigna premium desde admin;
            usa el mismo correo en Google que en el checkout cuando sea posible.
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* Columna cuenta / suscripción */}
          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wide text-brand-navy">Tu cuenta</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Membresía</dt>
                  <dd>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${
                        premium
                          ? "bg-brand-orange/15 text-brand-orange"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {planDisplay(user.plan)}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Cuenta</dt>
                  <dd className="font-semibold text-brand-navy">{statusDisplay(user.status)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-slate-500">En Notitendencias desde</dt>
                  <dd className="font-semibold text-brand-navy">{formatMemberSince(memberSince)}</dd>
                </div>
              </dl>

              {!premium && (
                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Suscripción</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Con <strong className="text-brand-navy">Notitendencias AI Radar</strong> activo tendrás favoritos
                    ilimitados, esta biblioteca y lectura completa en cada señal ({radarPriceUsdLabel()} — orientativo{" "}
                    {radarPriceMxnHintLabel()} según tu banco).
                  </p>
                  <Link
                    href="/#pricing"
                    className="mt-4 inline-flex w-full justify-center rounded-2xl bg-brand-orange px-4 py-3 text-center text-sm font-black text-white shadow-md hover:bg-orange-600"
                  >
                    Unirme al radar
                  </Link>
                  <Link
                    href="/#pricing"
                    className="mt-2 block text-center text-xs font-semibold text-brand-navy underline decoration-dotted hover:text-brand-orange"
                  >
                    Ver precio y beneficios
                  </Link>
                </div>
              )}

              {premium && (
                <>
                  <p className="mt-6 rounded-2xl border border-brand-orange/25 bg-brand-orange/5 px-4 py-3 text-xs leading-relaxed text-slate-700">
                    Tu membresía AI Radar está activa. Las tendencias que guardes aparecen abajo; puedes volver cuando
                    quieras.
                  </p>
                  <CancelMembershipPanel
                    hasStripeCustomer={Boolean(profile?.stripeCustomerId?.trim())}
                  />
                </>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-wide text-brand-navy">Accesos rápidos</h2>
              <ul className="mt-4 space-y-2 text-sm font-semibold">
                <li>
                  <Link href="/ia" className="text-brand-orange hover:underline">
                    Explorar tendencias →
                  </Link>
                </li>
                <li>
                  <Link href="/" className="text-slate-600 hover:text-brand-orange">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-slate-600 hover:text-brand-orange">
                    Precios
                  </Link>
                </li>
              </ul>
            </section>
          </aside>

          {/* Favoritos / upsell */}
          <section className="lg:col-span-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-brand-navy">Tus favoritos</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {premium
                    ? `${saved.length} tendencia${saved.length === 1 ? "" : "s"} guardada${saved.length === 1 ? "" : "s"}.`
                    : "Incluido con Notitendencias AI Radar cuando tu cuenta esté activa."}
                </p>
              </div>
              {premium && (
                <Link
                  href="/ia"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-brand-navy hover:border-brand-orange"
                >
                  + Explorar más
                </Link>
              )}
            </div>

            {!premium ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-white/90 px-8 py-14 text-center shadow-inner">
                <p className="text-lg font-bold text-brand-navy md:text-xl">Biblioteca personal bloqueada</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                  Aquí verás el historial de tendencias que marques como favoritas, listas para revisión editorial y
                  equipos.
                </p>
                <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-brand-orange">✓</span> Guardar tendencias desde cualquier categoría
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand-orange">✓</span> Volver al análisis completo cuando lo necesites
                  </li>
                  <li className="flex gap-2">
                    <span className="text-brand-orange">✓</span> Tablero editorial propio
                  </li>
                </ul>
                <Link
                  href="/#pricing"
                  className="mt-8 inline-flex rounded-2xl bg-brand-navy px-8 py-3 text-sm font-black text-white hover:bg-slate-900"
                >
                  Unirme al radar
                </Link>
              </div>
            ) : saved.length === 0 ? (
              <div className="mt-8 rounded-[2rem] border border-dashed border-slate-200 bg-white/80 px-6 py-16 text-center shadow-inner md:px-10">
                <p className="text-lg font-bold text-brand-navy md:text-xl">
                  Todavía no guardas tendencias. Explora y marca las que más te sirvan.
                </p>
                <Link
                  href="/ia"
                  className="mt-6 inline-flex rounded-2xl bg-brand-orange px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600"
                >
                  Explorar tendencias
                </Link>
              </div>
            ) : (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {saved.map((t) => (
                  <TrendCard key={t.id} trend={t} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
