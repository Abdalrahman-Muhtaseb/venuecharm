CREATE OR REPLACE FUNCTION public.create_venue_listing(
  p_title TEXT,
  p_description TEXT,
  p_address TEXT,
  p_city TEXT,
  p_capacity INTEGER,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_price_per_hour NUMERIC,
  p_price_per_day NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.venues (
    id,
    host_id,
    title,
    description,
    location,
    address,
    city,
    capacity,
    price_per_hour,
    price_per_day,
    status
  )
  VALUES (
    gen_random_uuid(),
    auth.uid(),
    p_title,
    NULLIF(p_description, ''),
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_address,
    p_city,
    p_capacity,
    p_price_per_hour,
    p_price_per_day,
    'PENDING_APPROVAL'
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_venue_listing(
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  DOUBLE PRECISION,
  DOUBLE PRECISION,
  NUMERIC,
  NUMERIC
) TO authenticated;
