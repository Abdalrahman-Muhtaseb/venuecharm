-- Optional location for an RFP so Smart Matching can rank nearby venues higher.
-- The city is geocoded on submit; latitude/longitude are nullable when geocoding
-- is unavailable (matching then treats location as "no constraint").
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS city      TEXT;
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION;
ALTER TABLE rfps ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
