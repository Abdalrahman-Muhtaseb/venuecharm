-- Turnaround buffer: minutes a venue needs between two bookings to clean and
-- reset the space. Enforced when creating bookings and reflected in availability.
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER NOT NULL DEFAULT 0;
