-- ─── 014_rfp.sql ──────────────────────────────────────────────────────────────
-- RFP "Smart Matching": add an amenities-preference column to rfps, enable RLS on
-- rfps + rfp_matches (they were created in 001 with NO RLS at all — fully exposed),
-- and make rfp_matches cascade-delete with its parent rfp.
--
-- Idempotent: safe to re-run.

-- rfps gains an amenities wishlist (mirrors venues.amenities: a JSONB array of keys).
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE rfps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_matches ENABLE ROW LEVEL SECURITY;

-- rfps: a renter fully owns their own requests.
DROP POLICY IF EXISTS "Rfps: owner read"   ON rfps;
DROP POLICY IF EXISTS "Rfps: owner insert" ON rfps;
DROP POLICY IF EXISTS "Rfps: owner delete" ON rfps;

CREATE POLICY "Rfps: owner read"   ON rfps FOR SELECT USING (renter_id = auth.uid());
CREATE POLICY "Rfps: owner insert" ON rfps FOR INSERT WITH CHECK (renter_id = auth.uid());
CREATE POLICY "Rfps: owner delete" ON rfps FOR DELETE USING (renter_id = auth.uid());

-- rfp_matches: visible / insertable / deletable only by the owner of the parent rfp.
DROP POLICY IF EXISTS "Rfp matches: owner read"   ON rfp_matches;
DROP POLICY IF EXISTS "Rfp matches: owner insert" ON rfp_matches;
DROP POLICY IF EXISTS "Rfp matches: owner delete" ON rfp_matches;

CREATE POLICY "Rfp matches: owner read" ON rfp_matches FOR SELECT USING (
  EXISTS (SELECT 1 FROM rfps r WHERE r.id = rfp_id AND r.renter_id = auth.uid())
);
CREATE POLICY "Rfp matches: owner insert" ON rfp_matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM rfps r WHERE r.id = rfp_id AND r.renter_id = auth.uid())
);
CREATE POLICY "Rfp matches: owner delete" ON rfp_matches FOR DELETE USING (
  EXISTS (SELECT 1 FROM rfps r WHERE r.id = rfp_id AND r.renter_id = auth.uid())
);

-- ── Cascade: deleting an rfp removes its matches ─────────────────────────────
ALTER TABLE rfp_matches DROP CONSTRAINT IF EXISTS rfp_matches_rfp_id_fkey;
ALTER TABLE rfp_matches
  ADD CONSTRAINT rfp_matches_rfp_id_fkey
  FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE;

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS rfps_renter_idx        ON rfps (renter_id);
CREATE INDEX IF NOT EXISTS rfp_matches_rfp_score_idx ON rfp_matches (rfp_id, score DESC);
