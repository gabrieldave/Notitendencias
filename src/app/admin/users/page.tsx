import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { updateUserPlanAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const list = await db.select().from(users).orderBy(desc(users.createdAt)).limit(500);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin" className="text-sm font-semibold text-brand-orange hover:underline">
        ← Volver al panel
      </Link>
      <h1 className="mt-4 text-3xl font-black text-brand-navy">Usuarios</h1>
      <p className="mt-2 text-sm text-slate-600">
        Cambia el plan manualmente durante la beta (sin pasarela de pago todavía).
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((u) => (
              <tr key={u.id} className="text-slate-800">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      u.plan === "premium"
                        ? "bg-amber-100 text-amber-950 ring-1 ring-amber-200"
                        : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                    }`}
                  >
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.status}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {u.plan !== "premium" && (
                      <form action={updateUserPlanAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="plan" value="premium" />
                        <button
                          type="submit"
                          className="rounded-full bg-brand-orange px-3 py-1.5 text-xs font-black text-white shadow-sm hover:bg-orange-600"
                        >
                          Premium
                        </button>
                      </form>
                    )}
                    {u.plan !== "free" && (
                      <form action={updateUserPlanAction}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="plan" value="free" />
                        <button
                          type="submit"
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-brand-navy"
                        >
                          Free
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Aún no hay usuarios registrados.</p>
        )}
      </div>
    </div>
  );
}
