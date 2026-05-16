ALTER TABLE "trends" ADD COLUMN IF NOT EXISTS "radar_payload" jsonb DEFAULT '{}'::jsonb NOT NULL;
