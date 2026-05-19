-- Idempotente: aplicar en la BD de producción si db:migrate no se ha ejecutado.
-- Error típico en login: column "stripe_customer_id" does not exist (42703).

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
ALTER TABLE "trends" ADD COLUMN IF NOT EXISTS "signal_posted_at" timestamp with time zone;
ALTER TABLE "trends" ADD COLUMN IF NOT EXISTS "radar_payload" jsonb DEFAULT '{}'::jsonb NOT NULL;
