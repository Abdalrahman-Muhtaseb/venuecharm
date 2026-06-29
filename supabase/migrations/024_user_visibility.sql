-- ─── 024_user_visibility.sql ───────────────────────────────────────────────────
-- Per-user privacy controls: which personal fields are shown to other people on
-- public surfaces (e.g. the "About the host" card on a venue page). Stored as a
-- small JSONB map of field → boolean. Name + avatar are always shown (needed for
-- trust), so they are not part of this map.
--
-- Default: bio public, contact details (phone/email) and birthday private.
-- Existing rows get the default via the column DEFAULT; the app also coalesces
-- missing keys defensively.
--
-- Idempotent: safe to re-run.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS visibility JSONB NOT NULL
  DEFAULT '{"bio": true, "phone": false, "email": false, "birthday": false}'::jsonb;
