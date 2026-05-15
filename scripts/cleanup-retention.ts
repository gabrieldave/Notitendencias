/**
 * Política de retención y limpieza (PostgreSQL).
 * Por defecto DRY_RUN=true: solo cuenta e informa, sin mutar datos.
 * Ejecución real: DRY_RUN=false npm run cleanup:retention
 */
import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import {
  appEvents,
  newsletterSends,
  rawTrendItems,
  trends,
} from "../src/db/schema";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

function isDryRun(): boolean {
  return process.env.DRY_RUN !== "false";
}

function num(x: unknown): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

type Summary = {
  rawItemsDeleted: number;
  rawStaleNewMarkedRejected: number;
  trendsArchivedFromPublished: number;
  trendsArchivedFromDraftPending: number;
  trendsDeletedRejected: number;
  trendsDeletedArchived: number;
  appEventsDeleted: number;
  newsletterSendsDeleted: number;
  trendsDetachedFromRaw: number;
};

const emptySummary = (): Summary => ({
  rawItemsDeleted: 0,
  rawStaleNewMarkedRejected: 0,
  trendsArchivedFromPublished: 0,
  trendsArchivedFromDraftPending: 0,
  trendsDeletedRejected: 0,
  trendsDeletedArchived: 0,
  appEventsDeleted: 0,
  newsletterSendsDeleted: 0,
  trendsDetachedFromRaw: 0,
});

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL no está definida.");
    process.exit(1);
  }

  const RAW_PROCESSED_DAYS = envInt("RAW_PROCESSED_DAYS", 30);
  const RAW_BAD_DAYS = envInt("RAW_BAD_DAYS", 15);
  const PUBLISHED_ARCHIVE_DAYS = envInt("PUBLISHED_ARCHIVE_DAYS", 45);
  const REJECTED_DELETE_DAYS = envInt("REJECTED_DELETE_DAYS", 30);
  const ARCHIVED_DELETE_DAYS = envInt("ARCHIVED_DELETE_DAYS", 180);
  const DRAFT_PENDING_DAYS = envInt("DRAFT_PENDING_DAYS", 30);
  const APP_EVENTS_DAYS = envInt("APP_EVENTS_DAYS", 30);
  const NEWSLETTER_SENDS_DAYS = envInt("NEWSLETTER_SENDS_DAYS", 90);

  const dry = isDryRun();
  console.log(`\n=== Notitendencias — retención de datos (${dry ? "DRY RUN" : "EJECUCIÓN REAL"}) ===\n`);
  console.log(
    "Umbrales:",
    `RAW processed=${RAW_PROCESSED_DAYS}d, RAW bad=${RAW_BAD_DAYS}d, publicados→archived=${PUBLISHED_ARCHIVE_DAYS}d,`,
    `trends rejected elim=${REJECTED_DELETE_DAYS}d, archived elim=${ARCHIVED_DELETE_DAYS}d, draft/pending→archived=${DRAFT_PENDING_DAYS}d,`,
    `app_events=${APP_EVENTS_DAYS}d, newsletter_sends=${NEWSLETTER_SENDS_DAYS}d\n`,
  );

  const client = postgres(url, { max: 1, connect_timeout: 15 });
  const db = drizzle(client, {
    schema: { appEvents, newsletterSends, rawTrendItems, trends },
  });

  const sum = emptySummary();

  const cutProcessed = daysAgo(RAW_PROCESSED_DAYS);
  const cutBadRaw = daysAgo(RAW_BAD_DAYS);
  const cutStaleNew = daysAgo(RAW_PROCESSED_DAYS); // misma ventana que "processed" (30 por defecto)
  const cutPubArchive = daysAgo(PUBLISHED_ARCHIVE_DAYS);
  const cutTrendRejected = daysAgo(REJECTED_DELETE_DAYS);
  const cutArchivedDelete = daysAgo(ARCHIVED_DELETE_DAYS);
  const cutDraftPending = daysAgo(DRAFT_PENDING_DAYS);
  const cutEvents = daysAgo(APP_EVENTS_DAYS);
  const cutNewsletter = daysAgo(NEWSLETTER_SENDS_DAYS);

  try {
    // —— newsletter_sends ——
    const nsPred = lt(newsletterSends.createdAt, cutNewsletter);
    if (dry) {
      const nsRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(newsletterSends)
        .where(nsPred);
      sum.newsletterSendsDeleted = num(nsRows[0]?.c);
    } else {
      const del = await db.delete(newsletterSends).where(nsPred).returning({ id: newsletterSends.id });
      sum.newsletterSendsDeleted = del.length;
    }

    // —— app_events ——
    const evPred = lt(appEvents.createdAt, cutEvents);
    if (dry) {
      const evRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(appEvents)
        .where(evPred);
      sum.appEventsDeleted = num(evRows[0]?.c);
    } else {
      const del = await db.delete(appEvents).where(evPred).returning({ id: appEvents.id });
      sum.appEventsDeleted = del.length;
    }

    // —— trends: publicados antiguos → archived ——
    const pubArchivePred = and(
      eq(trends.status, "published"),
      or(
        and(isNotNull(trends.publishedAt), lt(trends.publishedAt, cutPubArchive)),
        and(isNull(trends.publishedAt), lt(trends.createdAt, cutPubArchive)),
      ),
    );
    if (dry) {
      const pubRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(trends)
        .where(pubArchivePred);
      sum.trendsArchivedFromPublished = num(pubRows[0]?.c);
    } else {
      const now = new Date();
      const upd = await db
        .update(trends)
        .set({ status: "archived", updatedAt: now })
        .where(pubArchivePred)
        .returning({ id: trends.id });
      sum.trendsArchivedFromPublished = upd.length;
    }

    // —— trends: draft / pending antiguos → archived ——
    const draftPred = and(
      inArray(trends.status, ["draft", "pending"]),
      lt(trends.createdAt, cutDraftPending),
    );
    if (dry) {
      const drRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(trends)
        .where(draftPred);
      sum.trendsArchivedFromDraftPending = num(drRows[0]?.c);
    } else {
      const now = new Date();
      const upd = await db
        .update(trends)
        .set({ status: "archived", updatedAt: now })
        .where(draftPred)
        .returning({ id: trends.id });
      sum.trendsArchivedFromDraftPending = upd.length;
    }

    // —— trends: rejected antiguos → eliminar ——
    const rejPred = and(eq(trends.status, "rejected"), lt(trends.createdAt, cutTrendRejected));
    if (dry) {
      const rjRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(trends)
        .where(rejPred);
      sum.trendsDeletedRejected = num(rjRows[0]?.c);
    } else {
      const del = await db.delete(trends).where(rejPred).returning({ id: trends.id });
      sum.trendsDeletedRejected = del.length;
    }

    // —— trends: archived muy antiguos → eliminar (por updated_at tras archivado) ——
    const archDelPred = and(eq(trends.status, "archived"), lt(trends.updatedAt, cutArchivedDelete));
    if (dry) {
      const arRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(trends)
        .where(archDelPred);
      sum.trendsDeletedArchived = num(arRows[0]?.c);
    } else {
      const del = await db.delete(trends).where(archDelPred).returning({ id: trends.id });
      sum.trendsDeletedArchived = del.length;
    }

    // —— raw: new / requires_review muy antiguos → rejected ——
    const staleNewPred = and(
      inArray(rawTrendItems.status, ["new", "requires_review"]),
      lt(rawTrendItems.createdAt, cutStaleNew),
    );
    if (dry) {
      const snRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(rawTrendItems)
        .where(staleNewPred);
      sum.rawStaleNewMarkedRejected = num(snRows[0]?.c);
    } else {
      const now = new Date();
      const upd = await db
        .update(rawTrendItems)
        .set({ status: "rejected", updatedAt: now })
        .where(staleNewPred)
        .returning({ id: rawTrendItems.id });
      sum.rawStaleNewMarkedRejected = upd.length;
    }

    // IDs de raw a borrar (processed viejo + bad statuses viejos + rejected por antigüedad tras paso anterior)
    const rawDeletePred = or(
      and(eq(rawTrendItems.status, "processed"), lt(rawTrendItems.createdAt, cutProcessed)),
      and(
        inArray(rawTrendItems.status, ["rejected", "duplicate", "error"]),
        lt(rawTrendItems.createdAt, cutBadRaw),
      ),
    );

    const rawWouldDeletePred = or(rawDeletePred, staleNewPred);

    if (dry) {
      const rwRows = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(rawTrendItems)
        .where(rawWouldDeletePred);
      sum.rawItemsDeleted = num(rwRows[0]?.c);

      const rawIdsRows = await db
        .select({ id: rawTrendItems.id })
        .from(rawTrendItems)
        .where(rawWouldDeletePred);
      const idList = rawIdsRows.map((r) => r.id);
      if (idList.length > 0) {
        const dtRows = await db
          .select({ d: sql<number>`count(*)::int` })
          .from(trends)
          .where(inArray(trends.rawItemId, idList));
        sum.trendsDetachedFromRaw = num(dtRows[0]?.d);
      }
    } else {
      const toDelete = await db
        .select({ id: rawTrendItems.id })
        .from(rawTrendItems)
        .where(rawDeletePred);
      const ids = toDelete.map((r) => r.id);
      if (ids.length > 0) {
        const detach = await db
          .update(trends)
          .set({ rawItemId: null, updatedAt: new Date() })
          .where(inArray(trends.rawItemId, ids))
          .returning({ id: trends.id });
        sum.trendsDetachedFromRaw = detach.length;

        const del = await db
          .delete(rawTrendItems)
          .where(inArray(rawTrendItems.id, ids))
          .returning({ id: rawTrendItems.id });
        sum.rawItemsDeleted = del.length;
      }
    }

    printSummary(sum, dry);
  } catch (e) {
    console.error("\nError durante la limpieza:", e);
    process.exitCode = 1;
  } finally {
    try {
      await client.end({ timeout: 5 });
    } catch {
      /* ignore */
    }
  }
}

function printSummary(s: Summary, dry: boolean) {
  console.log("Resumen:");
  console.log(`  • raw_trend_items eliminados:              ${s.rawItemsDeleted}`);
  console.log(`  • raw “new”/“requires_review” → rejected:  ${s.rawStaleNewMarkedRejected}`);
  console.log(`  • trends.raw_item_id puestos a NULL:       ${s.trendsDetachedFromRaw}`);
  console.log(`  • trends archivadas (publicadas antiguas): ${s.trendsArchivedFromPublished}`);
  console.log(`  • trends archivadas (draft/pending):       ${s.trendsArchivedFromDraftPending}`);
  console.log(`  • trends eliminadas (rejected):            ${s.trendsDeletedRejected}`);
  console.log(`  • trends eliminadas (archived):            ${s.trendsDeletedArchived}`);
  console.log(`  • app_events eliminados:                   ${s.appEventsDeleted}`);
  console.log(`  • newsletter_sends eliminados:             ${s.newsletterSendsDeleted}`);
  console.log(dry ? "\n(DRY RUN: no se aplicaron cambios.)\n" : "\nLimpieza aplicada.\n");
}

void main();
