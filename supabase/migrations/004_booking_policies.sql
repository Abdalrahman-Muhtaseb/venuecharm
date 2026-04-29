-- Add message/notes field to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- ─── Booking RLS Policies ────────────────────────────────────────────────────
-- Renters can create bookings for themselves
CREATE POLICY "Bookings: renter insert" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

-- Renters can cancel their own PENDING bookings
CREATE POLICY "Bookings: renter cancel" ON bookings
  FOR UPDATE USING (auth.uid() = renter_id AND status = 'PENDING')
  WITH CHECK (status = 'CANCELLED');

-- Hosts can accept/decline bookings for their venues
CREATE POLICY "Bookings: host update" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND host_id = auth.uid())
  );

-- ─── Payment RLS Policies ────────────────────────────────────────────────────
-- Renters can create payment records for their own bookings
CREATE POLICY "Payments: renter insert" ON payments
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

-- Renters can view their own payments
CREATE POLICY "Payments: renter read" ON payments
  FOR SELECT USING (auth.uid() = renter_id);

-- Hosts can view payments linked to their venue bookings
CREATE POLICY "Payments: host read" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN venues v ON v.id = b.venue_id
      WHERE b.id = booking_id AND v.host_id = auth.uid()
    )
  );

-- ─── Availability RLS Policies ───────────────────────────────────────────────
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability (needed for search)
CREATE POLICY "Availability: public read" ON availability
  FOR SELECT USING (true);

-- Hosts manage their own venue availability
CREATE POLICY "Availability: host manage" ON availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND host_id = auth.uid())
  );
