CREATE OR REPLACE FUNCTION public.search_venues_nearby(
  p_latitude     DOUBLE PRECISION,
  p_longitude    DOUBLE PRECISION,
  p_radius_km    DOUBLE PRECISION DEFAULT 50,
  p_capacity_min INTEGER          DEFAULT 0,
  p_price_max    NUMERIC          DEFAULT NULL,
  p_limit        INTEGER          DEFAULT 100,
  p_offset       INTEGER          DEFAULT 0
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  address        TEXT,
  city           TEXT,
  capacity       INTEGER,
  price_per_hour NUMERIC,
  price_per_day  NUMERIC,
  photos         TEXT[],
  amenities      JSONB,
  distance_km    DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.title,
    v.address,
    v.city,
    v.capacity,
    v.price_per_hour,
    v.price_per_day,
    v.photos,
    v.amenities,
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) / 1000.0 AS distance_km
  FROM venues v
  WHERE
    v.status = 'ACTIVE'
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_km * 1000
    )
    AND v.capacity >= p_capacity_min
    AND (p_price_max IS NULL
         OR v.price_per_hour <= p_price_max
         OR v.price_per_day  <= p_price_max * 8)
  ORDER BY distance_km ASC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_venues_nearby(
  DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION,
  INTEGER, NUMERIC, INTEGER, INTEGER
) TO anon, authenticated;
