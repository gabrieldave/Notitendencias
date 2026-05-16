import type { Trend } from "@/db/schema";

export type OpportunityLevel = "baja" | "media" | "alta";
export type UrgencyLevel = "observar" | "probar" | "actuar_esta_semana";

export type RadarPayloadV1 = {
  opportunity_level?: OpportunityLevel;
  urgency?: UrgencyLevel;
  audience?: string[];
  actions_today?: string[];
};

const AUDIENCE_RULES: { re: RegExp; label: string }[] = [
  { re: /creador|creator|influencer|contenido digital/i, label: "Creadores" },
  { re: /agencia\b/i, label: "Agencias" },
  { re: /freelance/i, label: "Freelancers" },
  { re: /pyme|negocio pequeño|emprendedor|startup|negocio local/i, label: "Negocios pequeños" },
  { re: /desarrollador|developer|código|API|SDK|software/i, label: "Desarrolladores" },
  { re: /consultor/i, label: "Consultores" },
  { re: /market|marketing|marca|campaña|ads\b/i, label: "Marketers" },
  { re: /educador|curso|tutorial|academia/i, label: "Educadores" },
  { re: /ventas|sales|pipeline/i, label: "Equipos de ventas" },
  { re: /soporte|atención al cliente|CX\b/i, label: "Equipos de soporte" },
];

export function parseRadarPayload(t: Trend): RadarPayloadV1 {
  const raw = t.radarPayload;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const opportunity_level = normalizeOpportunityLevel(o.opportunity_level);
  const urgency = normalizeUrgency(o.urgency);
  const audience = Array.isArray(o.audience)
    ? o.audience.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim())
    : undefined;
  const actions_today = Array.isArray(o.actions_today)
    ? o.actions_today.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim())
    : undefined;
  return {
    opportunity_level: opportunity_level ?? undefined,
    urgency: urgency ?? undefined,
    audience,
    actions_today,
  };
}

function normalizeOpportunityLevel(v: unknown): OpportunityLevel | null {
  if (v === "baja" || v === "media" || v === "alta") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    if (s === "baja" || s === "media" || s === "alta") return s;
  }
  return null;
}

function normalizeUrgency(v: unknown): UrgencyLevel | null {
  if (v === "observar" || v === "probar" || v === "actuar_esta_semana") return v;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim().replace(/\s+/g, "_");
    if (s === "observar" || s === "probar" || s === "actuar_esta_semana") return s as UrgencyLevel;
    if (s === "actuar esta semana") return "actuar_esta_semana";
  }
  return null;
}

export function deriveOpportunityLevel(score: number, persisted?: OpportunityLevel): OpportunityLevel {
  if (persisted) return persisted;
  if (score >= 72) return "alta";
  if (score >= 42) return "media";
  return "baja";
}

export function deriveUrgency(
  score: number,
  signalPostedAt: Date | null | undefined,
  persisted?: UrgencyLevel,
): UrgencyLevel {
  if (persisted) return persisted;
  let daysOld = 999;
  if (signalPostedAt instanceof Date && !Number.isNaN(signalPostedAt.getTime())) {
    daysOld = (Date.now() - signalPostedAt.getTime()) / 86_400_000;
  }
  if (score >= 78 && daysOld < 5) return "actuar_esta_semana";
  if (score >= 52) return "probar";
  return "observar";
}

export function deriveAudienceLabels(t: Trend, persisted?: string[]): string[] {
  const cap = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))].slice(0, 8);
  if (persisted?.length) return cap(persisted);
  const blob = [t.title, t.summary, t.whyItMatters, t.opportunity].filter(Boolean).join("\n");
  const found: string[] = [];
  for (const { re, label } of AUDIENCE_RULES) {
    if (re.test(blob)) found.push(label);
  }
  if (t.categorySlug === "ia") {
    if (!found.includes("Creadores")) found.unshift("Creadores");
    if (!found.includes("Emprendedores")) found.push("Emprendedores");
  }
  if (found.length === 0) return ["Creadores", "Freelancers", "Negocios pequeños"];
  return cap(found);
}

function splitActionCandidates(opportunity: string | null | undefined): string[] {
  if (!opportunity?.trim()) return [];
  const lines = opportunity
    .split(/\n+/)
    .map((l) => l.replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean);
  return lines.filter((l) => l.length >= 12 && l.length < 280).slice(0, 5);
}

export function deriveActionsToday(t: Trend, persisted?: string[]): string[] {
  const fromDb = persisted?.filter(Boolean) ?? [];
  if (fromDb.length >= 3) return fromDb.slice(0, 3);
  const fromOpp = splitActionCandidates(t.opportunity);
  const merged = [...fromDb, ...fromOpp];
  if (merged.length >= 3) return merged.slice(0, 3);
  const tag = t.categorySlug === "ia" ? "esta señal de IA" : "esta tendencia";
  const fallbacks = [
    `Lee la fuente original y anota un caso de uso concreto para tu negocio o canal.`,
    `Comparte ${tag} con tu equipo (5 min) y define una mini-prueba para esta semana.`,
    `Esboza un contenido corto (hilo, newsletter o video) explicando “qué pasó” y “qué hacer”.`,
  ];
  const out = [...merged];
  for (const f of fallbacks) {
    if (out.length >= 3) break;
    out.push(f);
  }
  return out.slice(0, 3);
}

export function clampIdeasList(items: string[] | null | undefined, min: number, max: number): string[] {
  const clean = (items ?? []).map((s) => s.trim()).filter(Boolean);
  const dedup = [...new Set(clean)];
  if (dedup.length >= min) return dedup.slice(0, max);
  const topic = dedup[0] ?? "esta señal";
  const fillers = [
    `Video corto (90 s): ${topic.slice(0, 72)}${topic.length > 72 ? "…" : ""}`,
    `Hilo en X: 5 bullets — qué pasó, por qué importa, qué probar hoy.`,
    `Newsletter o nota breve para tu audiencia con un CTA accionable.`,
    `Carrusel: antes / durante / después de aplicar la idea.`,
    `Tutorial mínimo paso a paso para replicar el caso en tu contexto.`,
  ];
  const out = [...dedup];
  for (const f of fillers) {
    if (out.length >= min) break;
    if (!out.includes(f)) out.push(f);
  }
  return out.slice(0, max);
}

export function estimateReadingMinutes(t: Trend): number {
  const parts = [
    t.summary,
    t.whyItMatters,
    t.opportunity,
    ...(t.contentIdeas ?? []),
    ...(t.businessIdeas ?? []),
  ].filter(Boolean);
  const words = parts.join(" ").split(/\s+/).filter(Boolean).length;
  const mins = Math.ceil(words / 200);
  return Math.min(12, Math.max(2, mins));
}

export function opportunityLevelLabel(level: OpportunityLevel): string {
  if (level === "alta") return "Alta";
  if (level === "media") return "Media";
  return "Baja";
}

export function urgencyLabel(u: UrgencyLevel): string {
  if (u === "actuar_esta_semana") return "Actuar esta semana";
  if (u === "probar") return "Probar";
  return "Observar";
}
