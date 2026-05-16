/** Zona horaria para “hoy / ayer” en feed (México). */
const TZ = "America/Mexico_City";

function calendarDayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Comparar día calendario (México) de una tendencia con “hoy”. */
export function calendarDayKeyForTrend(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  return calendarDayKey(d);
}

function timeHm(d: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Texto tipo feed: «hoy, 15:42», «ayer, 18:10», o fecha corta + hora.
 */
export function formatFeedTimestamp(input: Date | string | null | undefined): string {
  if (!input) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const keyD = calendarDayKey(d);
  const keyToday = calendarDayKey(now);
  const yest = new Date(now);
  yest.setUTCDate(yest.getUTCDate() - 1);
  const keyYest = calendarDayKey(yest);
  const hm = timeHm(d);

  if (keyD === keyToday) return `hoy, ${hm}`;
  if (keyD === keyYest) return `ayer, ${hm}`;

  const yNow = new Intl.DateTimeFormat("en", { timeZone: TZ, year: "numeric" }).format(now);
  const yD = new Intl.DateTimeFormat("en", { timeZone: TZ, year: "numeric" }).format(d);

  const datePart = new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    ...(yNow !== yD ? { year: "numeric" } : {}),
  }).format(d);

  return `${datePart} · ${hm}`;
}
