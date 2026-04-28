-- ═══════════════════════════════════════════════════════════════════════════
-- VenueCharm — PostGIS Helper Functions
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this ONCE in Supabase SQL Editor after seeding venues.
-- These functions are called by the app for geospatial queries.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Venues within radius ───────────────────────────────────────────────
-- Returns venues within `radius_km` km of a given lat/lng point
-- Used by verify-seed.ts and the search API route
CREATE OR REPLACE FUNCTION venues_within_radius(
  lat        FLOAT,
  lng        FLOAT,
  radius_km  FLOAT DEFAULT 10
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  city           TEXT,
  address        TEXT,
  capacity       INTEGER,
  price_per_hour NUMERIC,
  amenities      JSONB,
  photos         TEXT[],
  distance_km    FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    v.id,
    v.title,
    v.city,
    v.address,
    v.capacity,
    v.price_per_hour,
    v.amenities,
    v.photos,
    ROUND(
      (ST_Distance(
        v.location::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) / 1000)::NUMERIC, 2
    )::FLOAT AS distance_km
  FROM venues v
  WHERE
    v.status = 'ACTIVE'
    AND ST_DWithin(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000  -- ST_DWithin takes meters
    )
  ORDER BY distance_km ASC;
$$;

-- ─── 2. Search venues with all filters ────────────────────────────────────
-- The main search function used by the Next.js API route
-- Filters: location radius, date availability, capacity, price, amenities
CREATE OR REPLACE FUNCTION search_venues(
  lat           FLOAT,
  lng           FLOAT,
  radius_km     FLOAT DEFAULT 25,
  event_date    DATE DEFAULT NULL,
  min_capacity  INTEGER DEFAULT 1,
  max_price_hr  NUMERIC DEFAULT NULL,
  required_amenities TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id             UUID,
  title          TEXT,
  city           TEXT,
  address        TEXT,
  capacity       INTEGER,
  price_per_hour NUMERIC,
  price_per_day  NUMERIC,
  amenities      JSONB,
  photos         TEXT[],
  recurring_pattern JSONB,
  distance_km    FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    v.id,
    v.title,
    v.city,
    v.address,
    v.capacity,
    v.price_per_hour,
    v.price_per_day,
    v.amenities,
    v.photos,
    v.recurring_pattern,
    ROUND(
      (ST_Distance(
        v.location::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
      ) / 1000)::NUMERIC, 2
    )::FLOAT AS distance_km
  FROM venues v
  WHERE
    -- Must be active
    v.status = 'ACTIVE'
    -- Within radius
    AND ST_DWithin(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
    -- Capacity filter
    AND v.capacity >= min_capacity
    -- Price filter (optional)
    AND (max_price_hr IS NULL OR v.price_per_hour <= max_price_hr)
    -- Date availability filter (optional)
    -- Excludes venues that are explicitly blocked on the requested date
    AND (
      event_date IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM availability a
        WHERE a.venue_id = v.id
          AND a.date = event_date
          AND a.is_available = FALSE
      )
    )
    -- Amenities filter (optional) — venue must have ALL required amenities
    AND (
      required_amenities IS NULL
      OR v.amenities @> to_jsonb(required_amenities)
    )
  ORDER BY distance_km ASC;
$$;

-- Grant access to the anon and authenticated roles
GRANT EXECUTE ON FUNCTION venues_within_radius(FLOAT, FLOAT, FLOAT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_venues(FLOAT, FLOAT, FLOAT, DATE, INTEGER, NUMERIC, TEXT[]) TO anon, authenticated;

-- ─── Quick test ───────────────────────────────────────────────────────────
-- Run this to verify both functions work:
--
-- SELECT * FROM venues_within_radius(32.0853, 34.7818, 10);
-- SELECT * FROM search_venues(32.0853, 34.7818, 15, NULL, 50, 1500, NULL);
