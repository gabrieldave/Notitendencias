import { z } from "zod";
import { RAW_TEXT_MAX_LENGTH } from "./constants";

export const bridgeIngestSchema = z.object({
  category: z.string().min(1).max(64),
  source_name: z.string().min(1).max(200),
  source_url: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .refine((s) => !s || /^https?:\/\//i.test(s), { message: "URL inválida" }),
  title: z.string().min(1).max(500),
  raw_text: z
    .string()
    .max(RAW_TEXT_MAX_LENGTH)
    .optional()
    .nullable(),
  detected_at: z.string().datetime().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().email().max(320),
});

export const adminImportSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
});

export const authEmailLoginSchema = z.object({
  email: z.string().email().max(320).transform((e) => e.trim().toLowerCase()),
});

export const favoriteBodySchema = z.object({
  trendId: z.string().uuid(),
});

export const adminUserPlanSchema = z.object({
  plan: z.enum(["free", "premium"]),
});

export const usageRunCreateSchema = z.object({
  provider: z.string().min(1).max(32).default("x"),
  workflow_name: z.string().max(256).optional().nullable(),
  run_type: z.string().max(64).default("scheduled"),
  started_at: z.string().datetime().optional().nullable(),
  finished_at: z.string().datetime().optional().nullable(),
  status: z.string().max(32).default("success"),
  posts_requested: z.coerce.number().int().min(0).default(0),
  posts_received: z.coerce.number().int().min(0).default(0),
  posts_filtered: z.coerce.number().int().min(0).default(0),
  posts_sent_to_ingest: z.coerce.number().int().min(0).default(0),
  duplicates_skipped: z.coerce.number().int().min(0).default(0),
  errors_count: z.coerce.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const usageSettingsPatchSchema = z.object({
  provider: z.string().min(1).max(32).default("x"),
  monthly_budget_usd: z.coerce.number().min(0).optional(),
  prepaid_balance_usd: z.coerce.number().min(0).optional(),
  post_read_cost_usd: z.coerce.number().min(0).optional(),
  trend_read_cost_usd: z.coerce.number().min(0).optional(),
  user_read_cost_usd: z.coerce.number().min(0).optional(),
});
