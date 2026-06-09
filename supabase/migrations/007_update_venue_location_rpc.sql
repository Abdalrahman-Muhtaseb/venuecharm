-- ─── 007_update_venue_location_rpc.sql ───────────────────────────────────────
-- Adds update_venue_location() RPC so updateVenue server action can update
-- the PostGIS geography column (not updatable via Supabase JS .update()).

DROP FUNCTION IF EXISTS update_venue_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION update_venue_location(
  p_venue_id  UUID,
  p_latitude  DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE venues
  SET location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  WHERE id = p_venue_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_venue_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated;
