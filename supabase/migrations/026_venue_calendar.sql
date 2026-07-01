-- Each venue gets its own Google Calendar once the host connects.
-- The calendar ID is stored here so we create it once and reuse it on every booking.
-- Clearing on disconnect is intentional so reconnecting the SAME Google account
-- reuses the existing calendars rather than creating duplicates.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS google_calendar_id TEXT;
