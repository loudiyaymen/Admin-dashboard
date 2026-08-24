-- Add reporter contact fields to support admin review details
ALTER TABLE "Report"
ADD COLUMN "reporter_name" TEXT,
ADD COLUMN "reporter_email" TEXT;
