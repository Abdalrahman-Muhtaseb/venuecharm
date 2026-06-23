-- Returns the stored lat/lng for a single venue, extracted from the PostGIS
-- geography column (the host's exact pin). Used by the venue detail page map.
-- Mirrors the ST_Y/ST_X extraction added for search in migration 006.
CREATE OR REPLACE FUNCTION public.get_venue_coordinates(p_venue_id UUID)
RETURNS TABLE (
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ST_Y(v.location::geometry) AS lat,
    ST_X(v.location::geometry) AS lng
  FROM venues v
  WHERE v.id = p_venue_id
    AND v.location IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_venue_coordinates(UUID) TO anon, authenticated;
