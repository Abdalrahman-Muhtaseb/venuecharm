-- Time-slot availability: daily operating hours on venues + per-hour host blocks.
-- Whole-day blocking stays in the `availability` table; this adds finer control so
-- a venue can host several bookings on the same day at different times.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS opening_time TIME NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS closing_time TIME NOT NULL DEFAULT '23:00';

-- Host-blocked hourly slots (e.g. maintenance 14:00–16:00) without blocking the day.
CREATE TABLE IF NOT EXISTS availability_blocks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venue_id, date, start_time)
);

CREATE INDEX IF NOT EXISTS availability_blocks_venue_date_idx
  ON availability_blocks (venue_id, date);

ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;

-- Blocked slots aren't sensitive — renters must read them to avoid double-booking.
DROP POLICY IF EXISTS "availability_blocks_select_all" ON availability_blocks;
CREATE POLICY "availability_blocks_select_all" ON availability_blocks
  FOR SELECT USING (true);

-- Only the venue's host may create/remove blocks.
DROP POLICY IF EXISTS "availability_blocks_host_manage" ON availability_blocks;
CREATE POLICY "availability_blocks_host_manage" ON availability_blocks
  FOR ALL
  USING (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND host_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND host_id = auth.uid()));
