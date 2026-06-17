-- ─── 015_host_calendar.sql ────────────────────────────────────────────────────
-- Google Calendar integration for hosts (Phase 1: push confirmed bookings).
-- Stores one OAuth connection per host + the Google event id on each booking.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.host_calendar_connections (
  host_id        UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  provider       TEXT NOT NULL DEFAULT 'google',
  refresh_token  TEXT NOT NULL,
  calendar_id    TEXT NOT NULL DEFAULT 'primary',
  sync_enabled   BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The refresh_token is a secret: RLS is ENABLED with NO policies, so the
-- anon/authenticated API roles get zero rows. Every read/write goes through the
-- service-role admin client (which bypasses RLS) in trusted server code only.
ALTER TABLE public.host_calendar_connections ENABLE ROW LEVEL SECURITY;

-- Google event id for the calendar event mirroring a confirmed booking.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS google_event_id TEXT;
