ALTER TABLE "trends" ADD COLUMN IF NOT EXISTS "signal_posted_at" timestamp with time zone;
--> statement-breakpoint
UPDATE trends t
SET signal_posted_at = (r.metadata_json->>'x_created_at')::timestamptz
FROM raw_trend_items r
WHERE t.raw_item_id = r.id
  AND t.signal_posted_at IS NULL
  AND r.metadata_json ? 'x_created_at'
  AND NULLIF(trim(r.metadata_json->>'x_created_at'), '') IS NOT NULL;
