-- ─── 009_fix_reviews_rls.sql ──────────────────────────────────────────────────
-- The INSERT policy in 008 required status = 'COMPLETED', but bookings stay
-- CONFIRMED indefinitely (no background job flips them). Allow inserts for
-- CONFIRMED bookings whose end_at is already in the past.

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
