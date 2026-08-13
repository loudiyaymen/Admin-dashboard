-- Add participant profile fields so the admin dashboard can show registered users.
ALTER TABLE "EventParticipant"
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "email" TEXT;