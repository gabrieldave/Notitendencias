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
