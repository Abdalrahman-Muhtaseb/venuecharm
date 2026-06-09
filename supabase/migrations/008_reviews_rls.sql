-- ─── 008_reviews_rls.sql ──────────────────────────────────────────────────────
-- Adds RLS policies for the reviews table (created in 001 but left policy-less).

DROP POLICY IF EXISTS "Reviews: public read" ON reviews;
CREATE POLICY "Reviews: public read" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Reviews: renter insert" ON reviews;
CREATE POLICY "Reviews: renter insert" ON reviews
  FOR INSERT WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND b.renter_id = auth.uid()
        AND (
          b.status = 'COMPLETED'
          OR (b.status = 'CONFIRMED' AND b.end_at < NOW())
        )
    )
  );
