-- ─── 023_user_bio_birthday.sql ─────────────────────────────────────────────────
-- Adds two self-service profile fields and the daily-birthday job source:
--   * users.bio        — free-text "about me" shown on the profile (and host about).
--   * users.birth_date — optional birthday, drives the happy-birthday email.
--
-- `users_with_birthday_today()` returns everyone whose birthday (month + day, in
-- Israel time) is today, so the /api/cron/birthday route can fetch recipients with
-- a single call (Supabase JS can't express the `to_char` month/day comparison).
-- Called only via the service-role admin client (RLS bypassed), but kept
-- SECURITY DEFINER + locked search_path so it is safe regardless of caller.
--
-- Idempotent: safe to re-run.

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;

CREATE OR REPLACE FUNCTION users_with_birthday_today()
RETURNS TABLE (id UUID, email TEXT, first_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.first_name
  FROM users u
  WHERE u.birth_date IS NOT NULL
    AND to_char(u.birth_date, 'MM-DD')
        = to_char((now() AT TIME ZONE 'Asia/Jerusalem')::date, 'MM-DD');
$$;
