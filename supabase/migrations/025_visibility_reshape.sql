-- ─── 025_visibility_reshape.sql ────────────────────────────────────────────────
-- Reshapes the per-user `visibility` map (added in 024). Phone and email are NOT
-- public on VenueCharm — they're stored only for internal/manual verification and
-- to keep communication + payments on-platform — so they are removed from the map.
-- A `reviews` flag is added (controls whether your name is attached to reviews you
-- write; off = anonymous). New shape: { bio, birthday, reviews }.
--
-- Defaults: bio + reviews public, birthday private. Backfills existing rows.
-- Idempotent: safe to re-run.

ALTER TABLE users
  ALTER COLUMN visibility
  SET DEFAULT '{"bio": true, "birthday": false, "reviews": true}'::jsonb;

UPDATE users SET visibility = jsonb_build_object(
  'bio',      COALESCE((visibility->>'bio')::boolean, true),
  'birthday', COALESCE((visibility->>'birthday')::boolean, false),
  'reviews',  COALESCE((visibility->>'reviews')::boolean, true)
);
