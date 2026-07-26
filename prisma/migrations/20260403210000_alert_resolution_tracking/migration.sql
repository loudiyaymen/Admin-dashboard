-- Track alert resolution state and timestamp so alerts can only be resolved once.
ALTER TABLE "alerts"
ADD COLUMN IF NOT EXISTS "is_resolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3);
