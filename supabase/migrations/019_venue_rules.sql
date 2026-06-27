-- House rules a host writes for guests (no smoking, music until 23:00, etc.).
-- Shown on the venue detail page beside the cancellation policy.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS rules TEXT;
