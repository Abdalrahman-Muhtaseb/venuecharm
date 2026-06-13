-- Amenities catalog — single source of truth for the listing form, search
-- filter and venue detail page. Admin-managed via the admin client.
CREATE TABLE IF NOT EXISTS public.amenities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  label_en   TEXT NOT NULL,
  label_he   TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'Other',
  icon       TEXT NOT NULL DEFAULT 'CheckCircle2',
  sort_order INT  NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS amenities_sort_idx ON public.amenities(sort_order);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- Anyone may read the catalog; writes happen only through the service-role
-- admin client (no public INSERT/UPDATE/DELETE policies).
DROP POLICY IF EXISTS "amenities_select_all" ON public.amenities;
CREATE POLICY "amenities_select_all" ON public.amenities
  FOR SELECT USING (true);

-- Seed from the existing hardcoded list (idempotent).
INSERT INTO public.amenities (key, label_en, label_he, category, icon, sort_order) VALUES
  ('WiFi',             'WiFi',              'WiFi',              'Core',              'Wifi',             10),
  ('Parking',          'Parking',           'חניה',              'Core',              'Car',              20),
  ('Air conditioning', 'Air Conditioning',  'מיזוג אוויר',       'Core',              'Thermometer',      30),
  ('Heating',          'Heating',           'חימום',             'Core',              'Flame',            40),
  ('Elevator',         'Elevator',          'מעלית',             'Core',              'ArrowUpDown',      50),
  ('Accessible',       'Wheelchair Access', 'נגיש לנכים',        'Core',              'Accessibility',    60),
  ('AV',               'AV Equipment',      'ציוד שמע/וידאו',    'AV & Events',       'Volume2',          70),
  ('Projector',        'Projector',         'מקרן',              'AV & Events',       'Projector',        80),
  ('Lighting',         'Lighting System',   'תאורה מקצועית',     'AV & Events',       'Lightbulb',        90),
  ('Stage',            'Stage',             'במה',               'AV & Events',       'Mic2',            100),
  ('Music',            'Music System',      'מערכת מוסיקה',      'AV & Events',       'Music',           110),
  ('Kitchen',          'Kitchen',           'מטבח',              'Food & Drink',      'UtensilsCrossed', 120),
  ('Coffee',           'Coffee Station',    'קפה',               'Food & Drink',      'Coffee',          130),
  ('Catering',         'Catering',          'קייטרינג',          'Food & Drink',      'ChefHat',         140),
  ('Bar',              'Bar',               'בר',                'Food & Drink',      'Wine',            150),
  ('Outdoor',          'Outdoor Space',     'שטח חוץ',           'Outdoor & Spaces',  'Trees',           160),
  ('Garden',           'Garden',            'גינה',              'Outdoor & Spaces',  'Flower2',         170),
  ('Pool',             'Pool',              'בריכה',             'Outdoor & Spaces',  'Waves',           180),
  ('Lounge',           'Lounge Area',       'פינת ישיבה',        'Outdoor & Spaces',  'Sofa',            190),
  ('Shower',           'Shower',            'מקלחת',             'Facilities',        'ShowerHead',      200),
  ('Gym',              'Gym',               'חדר כושר',          'Facilities',        'Dumbbell',        210),
  ('Dressing Room',    'Dressing Room',     'חדר הלבשה',         'Facilities',        'Shirt',           220),
  ('Photo Studio',     'Photo Studio',      'סטודיו צילום',      'Facilities',        'Camera',          230),
  ('Security',         'Security',          'אבטחה',             'Facilities',        'ShieldCheck',     240)
ON CONFLICT (key) DO NOTHING;
