CREATE TABLE IF NOT EXISTS "usage_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text DEFAULT 'x' NOT NULL,
  "workflow_name" text,
  "run_type" text DEFAULT 'scheduled',
  "started_at" timestamptz,
  "finished_at" timestamptz,
  "status" text DEFAULT 'success',
  "timezone" text DEFAULT 'America/Mexico_City',
  "posts_requested" integer DEFAULT 0,
  "posts_received" integer DEFAULT 0,
  "posts_filtered" integer DEFAULT 0,
  "posts_sent_to_ingest" integer DEFAULT 0,
  "duplicates_skipped" integer DEFAULT 0,
  "errors_count" integer DEFAULT 0,
  "estimated_cost_usd" numeric(12, 4) DEFAULT 0,
  "metadata_json" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "usage_run_id" uuid REFERENCES "usage_runs"("id") ON DELETE CASCADE,
  "provider" text DEFAULT 'x' NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text,
  "username" text,
  "source_url" text,
  "unit_cost_usd" numeric(12, 6) DEFAULT 0,
  "quantity" integer DEFAULT 1,
  "estimated_cost_usd" numeric(12, 6) DEFAULT 0,
  "metadata_json" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "usage_budget_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text DEFAULT 'x' NOT NULL UNIQUE,
  "monthly_budget_usd" numeric(12, 2) DEFAULT 60,
  "prepaid_balance_usd" numeric(12, 2) DEFAULT 5,
  "post_read_cost_usd" numeric(12, 6) DEFAULT 0.005,
  "trend_read_cost_usd" numeric(12, 6) DEFAULT 0.010,
  "user_read_cost_usd" numeric(12, 6) DEFAULT 0,
  "active" boolean DEFAULT true,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "usage_runs_provider_started_at_idx" ON "usage_runs" ("provider", "started_at" DESC);
CREATE INDEX IF NOT EXISTS "usage_events_run_id_idx" ON "usage_events" ("usage_run_id");
