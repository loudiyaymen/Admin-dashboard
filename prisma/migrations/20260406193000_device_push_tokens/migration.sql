CREATE TABLE IF NOT EXISTS "device_push_tokens" (
  "id" SERIAL PRIMARY KEY,
  "device_id" TEXT NOT NULL,
  "push_token" TEXT NOT NULL,
  "platform" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "last_registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "device_push_tokens_push_token_key"
  ON "device_push_tokens" ("push_token");

CREATE INDEX IF NOT EXISTS "device_push_tokens_device_id_idx"
  ON "device_push_tokens" ("device_id");
