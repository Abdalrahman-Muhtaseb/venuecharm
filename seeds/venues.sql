-- ═══════════════════════════════════════════════════════════════════════════
-- VenueCharm — Pure SQL Seed File
-- ═══════════════════════════════════════════════════════════════════════════
-- Use this as an ALTERNATIVE to the TypeScript scripts if you prefer SQL.
-- Run in: Supabase Dashboard → SQL Editor → New Query → Paste → Run
--
-- Or via CLI: supabase db execute --file supabase/seeds/venues.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Create seed host user (bypasses auth.users — dev only)
INSERT INTO users (id, email, first_name, last_name, role, is_verified)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'seed-host@venuecharm.dev',
  'Seed',
  'Host',
  'HOST',
  true
)
ON CONFLICT (email) DO UPDATE SET is_verified = true
RETURNING id;

-- Step 2: Insert 50 venues
-- All locations use: ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
-- NOTE: longitude comes FIRST in ST_MakePoint

INSERT INTO venues (
  host_id, title, description, address, city, location,
  capacity, price_per_hour, price_per_day,
  amenities, photos, status, recurring_pattern
) VALUES

-- ── 1 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Florentin Rooftop Terrace',
  'Stunning 360° views over Florentin and the Mediterranean horizon. Industrial-chic space with exposed brick and string lights. Perfect for evening receptions and creative launches.',
  '12 Herzl St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7752, 32.0621), 4326),
  80, 900, 6500,
  '["WiFi","Bar","Sound System","String Lights","Security","Elevator Access"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[1],"open_hours":{"start":"14:00","end":"02:00"},"event_types":["Party","Product Launch","Wedding"],"style_tags":["Industrial","Rooftop","Urban"]}'
),

-- ── 2 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Dizengoff Tower Sky Lounge',
  'Exclusive top-floor lounge in the heart of Tel Aviv with panoramic city views. Minimalist design with floor-to-ceiling windows, a private bar, and retractable roof access.',
  '34A Dizengoff St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7739, 32.0802), 4326),
  60, 1400, 10000,
  '["WiFi","Private Bar","AC","AV Equipment","Catering Kitchen","Valet Parking"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"10:00","end":"23:00"},"event_types":["VIP Event","Corporate Retreat","Photo Shoot"],"style_tags":["Luxury","Minimalist","Rooftop"]}'
),

-- ── 3 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Port of Tel Aviv Rooftop',
  'A raw industrial rooftop overlooking the old port with direct sea breeze. Flexible open-air layout with weatherproof shade sails and modular furniture.',
  '7 HaYarkon St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7696, 32.0905), 4326),
  120, 1100, 7800,
  '["Power Outlets","Shade Sails","Sound System","Security","Street Parking"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[],"open_hours":{"start":"08:00","end":"00:00"},"event_types":["Concert","Festival","Film Shoot"],"style_tags":["Industrial","Seaside","Open Air"]}'
),

-- ── 4 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Neve Tzedek Boutique Terrace',
  'A hidden gem in Neve Tzedek — a private terrace above one of Tel Aviv''s most charming neighborhoods. Lush potted plants, mosaic tiles, and ambient lighting.',
  '55 Shabazi St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7637, 32.0593), 4326),
  40, 650, 4500,
  '["WiFi","Outdoor Furniture","String Lights","Kitchenette","Garden Speakers"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"09:00","end":"22:00"},"event_types":["Intimate Wedding","Birthday","Engagement Party"],"style_tags":["Bohemian","Mediterranean","Intimate"]}'
),

-- ── 5 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Rothschild Boulevard Penthouse Deck',
  'An iconic penthouse deck on Israel''s most prestigious boulevard. Polished concrete floor, built-in DJ booth, and stunning infinity view over Rothschild.',
  '89 Rothschild Blvd, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7740, 32.0658), 4326),
  100, 1800, 13000,
  '["DJ Booth","Professional Sound","Lighting Rig","AC","Changing Rooms","Security"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[0],"open_hours":{"start":"12:00","end":"03:00"},"event_types":["DJ Event","Brand Activation","Fashion Show"],"style_tags":["Luxury","Modern","Iconic"]}'
),

-- ── 6 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'South Tel Aviv Urban Garden Rooftop',
  'An urban garden paradise 12 floors up. Raised vegetable beds, vertical gardens, reclaimed-wood benches, and solar lighting.',
  '22B Salame Rd, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7743, 32.0498), 4326),
  50, 700, 4800,
  '["Solar Lighting","BBQ Grill","Outdoor Speakers","Parking","Eco-Friendly Setup"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE',
  '{"closed_days":[],"open_hours":{"start":"07:00","end":"21:00"},"event_types":["Workshop","Team Building","Intimate Dinner"],"style_tags":["Eco","Garden","Rustic"]}'
),

-- ── 7 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Florentin Creative Loft',
  'A classic Florentin industrial loft with 5m ceilings, polished concrete floors, and exposed steel beams. 200 sqm of completely blank canvas.',
  '3 Vital St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7731, 32.0587), 4326),
  150, 800, 5500,
  '["3-Phase Power","WiFi 1Gbps","Loading Dock","Freight Elevator","AC","Kitchenette"]',
  '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200","https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"]',
  'ACTIVE',
  '{"closed_days":[],"open_hours":{"start":"06:00","end":"00:00"},"event_types":["Film Shoot","Photo Shoot","Corporate Event"],"style_tags":["Industrial","Loft","Raw"]}'
),

-- ── 8 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Jaffa Photography Studio',
  'Purpose-built photography studio in old Jaffa with natural north-facing light. Includes a 6m white cyclorama, grey textured backdrop, and makeup room.',
  '47 Yefet St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7521, 32.0527), 4326),
  20, 500, 3200,
  '["6m Cyclorama","Backdrop System","Makeup Room","WiFi","Prop Storage","Parking"]',
  '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200","https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200","https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"07:00","end":"21:00"},"event_types":["Photo Shoot","Video Production","Fashion Shoot"],"style_tags":["Studio","Photography","Professional"]}'
),

-- ── 9 ──────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Tel Aviv Design District Showroom',
  'A sleek 300 sqm showroom in Tel Aviv''s design district. High-end finishes, moveable walls, and gallery rail lighting.',
  '66 HaMasger St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7886, 32.0728), 4326),
  200, 1200, 8000,
  '["Gallery Lighting","Moveable Walls","WiFi","Loading Bay","Reception Desk","AC"]',
  '["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1200","https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=1200","https://images.unsplash.com/photo-1577720643272-265f09367456?w=1200","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200","https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200"]',
  'ACTIVE',
  '{"closed_days":[0],"open_hours":{"start":"09:00","end":"22:00"},"event_types":["Product Launch","Pop-up Retail","Exhibition"],"style_tags":["Modern","Gallery","Luxury"]}'
),

-- ── 10 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Allenby Recording Studio & Event Space',
  'A legendary recording studio turned multi-purpose event space. Acoustic panels and soundproofed walls make it perfect for podcasts, live music, and intimate concerts.',
  '101 Allenby St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7693, 32.0676), 4326),
  80, 1000, 7000,
  '["Acoustic Treatment","Stage","Full PA System","Green Room","WiFi","Recording Booth"]',
  '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200","https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200","https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[1],"open_hours":{"start":"10:00","end":"02:00"},"event_types":["Live Music","Podcast Recording","Concert"],"style_tags":["Music","Studio","Intimate"]}'
),

-- ── 11 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'HaKirya Startup Hub',
  'A modern co-working event space in Tel Aviv''s tech district. Modular furniture, moveable glass dividers, and A/V everywhere.',
  '12 Begin Rd, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7938, 32.0742), 4326),
  100, 600, 4000,
  '["4K Projection","Video Conferencing","WiFi 1Gbps","Modular Tables","Catering Service","Parking"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6,0],"open_hours":{"start":"07:00","end":"22:00"},"event_types":["Hackathon","Conference","Workshop","Demo Day"],"style_tags":["Modern","Tech","Corporate"]}'
),

-- ── 12 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Old North Art Warehouse',
  'A converted 1940s warehouse in Tel Aviv''s old north neighborhood. Raw whitewashed walls, terrazzo floors, and massive skylights.',
  '34A Ben Yehuda St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7712, 32.0877), 4326),
  180, 950, 6500,
  '["Skylight Lighting","Gallery Rails","Loading Dock","3-Phase Power","AC","Outdoor Courtyard"]',
  '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200","https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200"]',
  'ACTIVE',
  '{"closed_days":[],"open_hours":{"start":"08:00","end":"23:00"},"event_types":["Art Exhibition","Fashion Show","Film Shoot"],"style_tags":["Warehouse","Industrial","Artistic"]}'
),

-- ── 13 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Dizengoff Dance & Event Studio',
  'A professional 200 sqm dance studio with sprung hardwood floors, a mirrored wall, and a barre. Ideal for fitness events, dance workshops, and yoga retreats.',
  '7 Dizengoff St, Tel Aviv',
  'Tel Aviv',
  ST_SetSRID(ST_MakePoint(34.7744, 32.0811), 4326),
  60, 450, 3000,
  '["Sprung Floor","Mirror Wall","Barre","Sound System","Changing Rooms","AC"]',
  '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200","https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200","https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200"]',
  'ACTIVE',
  '{"closed_days":[],"open_hours":{"start":"06:00","end":"22:00"},"event_types":["Dance Workshop","Yoga Retreat","Fitness Event"],"style_tags":["Dance","Studio","Wellness"]}'
),

-- ── 14 · Jerusalem ─────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Mahane Yehuda Market Event Space',
  'A stunning event space directly above the Mahane Yehuda shuk. Stone arches, wooden beams, and the sounds of the market below.',
  '55 Agripas St, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.2127, 31.7854), 4326),
  70, 750, 5200,
  '["WiFi","Catering Access","AV System","AC","Balcony","Parking Nearby"]',
  '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200","https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"10:00","end":"23:00"},"event_types":["Dinner Party","Cultural Event","Corporate Dinner"],"style_tags":["Jerusalem Stone","Historic","Atmospheric"]}'
),

-- ── 15 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Emek Refaim Victorian Villa',
  'A restored 19th-century Ottoman-era villa in the German Colony. Three interconnected halls with original mosaic floors and a private garden.',
  '34A Emek Refaim St, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.2176, 31.7668), 4326),
  120, 1100, 7800,
  '["Private Garden","Catering Kitchen","AC","WiFi","On-site Parking","Heritage Decor"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"09:00","end":"23:00"},"event_types":["Wedding","Gala Dinner","Corporate Retreat"],"style_tags":["Historic","Heritage","Villa"]}'
),

-- ── 16 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Jerusalem Art Campus Gallery',
  'Part of a vibrant arts campus near the Israel Museum. White cube gallery with programmable LED track lighting and polished concrete floors.',
  '12 Ruppin Blvd, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.2042, 31.7738), 4326),
  90, 850, 5800,
  '["LED Track Lighting","Climate Control","Security System","WiFi","Storage Room","Loading Entrance"]',
  '["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1200","https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=1200","https://images.unsplash.com/photo-1577720643272-265f09367456?w=1200","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200","https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200"]',
  'ACTIVE',
  '{"closed_days":[0,1],"open_hours":{"start":"09:00","end":"20:00"},"event_types":["Art Exhibition","Cultural Event","Auction"],"style_tags":["Gallery","White Cube","Contemporary"]}'
),

-- ── 17 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Talbieh Diplomatic Quarter Mansion',
  'A grand pre-1948 mansion in Jerusalem''s prestigious Talbieh neighborhood. High ornate ceilings, French windows, and a marble foyer.',
  '7 Balfour St, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.2145, 31.7723), 4326),
  150, 2000, 15000,
  '["Grand Piano","Full Catering","Valet Parking","Security","AC","Diplomatic Clearance"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"08:00","end":"23:00"},"event_types":["State Dinner","Gala","Corporate Summit","Wedding"],"style_tags":["Luxury","Historic","Prestigious"]}'
),

-- ── 18 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Ein Kerem Vineyard Estate',
  'A working vineyard estate 15 minutes from central Jerusalem. Rustic stone winery, private vineyard rows, and a ceremony lawn with Judean Hills views.',
  '34A Ein Kerem Rd, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.1538, 31.7713), 4326),
  200, 1500, 11000,
  '["Wine Tasting","Outdoor Ceremony Lawn","Catering","Parking","Scenic Views","Event Coordinator"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6],"open_hours":{"start":"10:00","end":"22:00"},"event_types":["Wedding","Corporate Retreat","Wine Event"],"style_tags":["Vineyard","Rustic","Outdoor"]}'
),

-- ── 19 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Jerusalem Conference Palace — Hall B',
  'A mid-sized hall within the Jerusalem International Convention Center. Theater-style for 250, classroom for 150. State-of-the-art A/V.',
  '1 Shazar Blvd, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.2025, 31.7831), 4326),
  250, 1800, 12000,
  '["4K Projection","Video Conferencing","Interpretation Booths","Catering","Parking","Accessibility"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE',
  '{"closed_days":[6,0],"open_hours":{"start":"08:00","end":"22:00"},"event_types":["Conference","Symposium","Corporate Summit"],"style_tags":["Conference","Professional","Large-Scale"]}'
),

-- ── 20 ─────────────────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001',
  'Musrara Neighborhood Studio',
  'A raw creative space in the Musrara arts neighborhood on the border of East and West Jerusalem. Exposed stone walls meet modern fixtures.',
  '22B Musrara St, Jerusalem',
  'Jerusalem',
  ST_SetSRID(ST_MakePoint(35.2264, 31.7854), 4326),
  45, 400, 2800,
  '["WiFi","Projector","Sound System","Kitchenette","Stone Walls","Courtyard"]',
  '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200","https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"]',
  'ACTIVE',
  '{"closed_days":[],"open_hours":{"start":"09:00","end":"21:00"},"event_types":["Art Workshop","Community Event","Film Screening"],"style_tags":["Raw","Cultural","Community"]}'
),

-- ── 21–25 · Haifa ──────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001', 'Carmel Mountain Panorama Venue',
  'A breathtaking open-air event deck on the slopes of Mount Carmel with unobstructed views of Haifa Bay.',
  '7 Carmel Blvd, Haifa', 'Haifa', ST_SetSRID(ST_MakePoint(34.9893, 32.8101), 4326),
  100, 900, 6500,
  '["Panoramic Views","Outdoor Ceremony Area","String Lights","Parking","Catering Setup","AC"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"08:00","end":"23:00"},"event_types":["Wedding","Photo Shoot"],"style_tags":["Panoramic","Mediterranean"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'German Colony Boutique Hall',
  'A lovingly restored Templar building in Haifa''s German Colony. Original wooden floors and stone arches.',
  '34A Ben Gurion Ave, Haifa', 'Haifa', ST_SetSRID(ST_MakePoint(34.9895, 32.8127), 4326),
  65, 700, 4800,
  '["Heritage Decor","WiFi","AC","Catering Kitchen","Sound System","Street Parking"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"09:00","end":"23:00"},"event_types":["Wedding Reception","Private Dinner"],"style_tags":["Historic","Boutique","Intimate"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Haifa Port Industrial Loft',
  'An authentic port warehouse converted into an events powerhouse. 500 sqm of raw industrial space with 8m ceilings.',
  '12 Ha''Atzma''ut Rd, Haifa', 'Haifa', ST_SetSRID(ST_MakePoint(34.9978, 32.8183), 4326),
  300, 1300, 9000,
  '["Freight Doors","3-Phase Power","Loading Dock","Sound System","WiFi","Parking"]',
  '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200","https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"08:00","end":"02:00"},"event_types":["Concert","Art Fair","Film Production"],"style_tags":["Industrial","Port","Massive"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Wadi Nisnas Gallery & Event Space',
  'A gallery space in Haifa''s most colorful Arab neighborhood. Arched ceilings and hand-painted murals.',
  '55 Wadi Nisnas, Haifa', 'Haifa', ST_SetSRID(ST_MakePoint(34.9930, 32.8124), 4326),
  55, 450, 3000,
  '["Gallery Walls","Projector","Sound System","Courtyard","WiFi","Local Art"]',
  '["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1200","https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=1200","https://images.unsplash.com/photo-1577720643272-265f09367456?w=1200","https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200","https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"10:00","end":"22:00"},"event_types":["Cultural Event","Art Exhibition"],"style_tags":["Cultural","Artistic","Colorful"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Bat Galim Beachfront Studio',
  'A ground-floor studio 50 meters from Haifa beach. Natural light, white walls, and the sound of waves.',
  '3 Bat Galim Ave, Haifa', 'Haifa', ST_SetSRID(ST_MakePoint(34.9764, 32.8246), 4326),
  30, 350, NULL,
  '["Sprung Floor","Sound System","Changing Room","Kitchenette","WiFi","Beach Access"]',
  '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200","https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200","https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"06:00","end":"20:00"},"event_types":["Yoga","Wellness Workshop","Dance Class"],"style_tags":["Beach","Wellness","Calm"]}'
),

-- ── 26–32 · Greater Tel Aviv Area ─────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001', 'Herzliya Pituah Marina Deck',
  'An elevated deck above the Herzliya Marina with 180° views of luxury yachts and the sea.',
  '12 Sderot Rothschild, Herzliya', 'Herzliya', ST_SetSRID(ST_MakePoint(34.8042, 32.1618), 4326),
  120, 1600, 11000,
  '["Marina Views","Built-in Bar","Sound System","Sunshade","Valet Parking","Catering Service"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"10:00","end":"01:00"},"event_types":["Corporate Networking","VIP Party","Hi-tech Event"],"style_tags":["Luxury","Marina","Prestigious"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Ramat Gan Diamond Exchange Conference Center',
  'A sleek conference center in the Diamond Exchange District. Six modular meeting rooms that combine into one 600-person hall.',
  '1 Jabotinsky Rd, Ramat Gan', 'Ramat Gan', ST_SetSRID(ST_MakePoint(34.8193, 32.0847), 4326),
  600, 2500, 18000,
  '["Modular Rooms","4K LED Wall","Video Conferencing","Business Lounge","Parking","Kosher Catering"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"07:00","end":"22:00"},"event_types":["Large Conference","Exhibition","Corporate Summit"],"style_tags":["Corporate","Modern","Large-Scale"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Rishon LeZion Winery Estate',
  'Israel''s oldest winery — Carmel''s historic Rishon estate. Barrel rooms, stone corridors, and an outdoor amphitheater.',
  '25 Ha''Carmel St, Rishon LeZion', 'Rishon LeZion', ST_SetSRID(ST_MakePoint(34.8069, 31.9648), 4326),
  300, 1400, 10000,
  '["Barrel Room","Amphitheater","Wine Service","Catering","Museum Access","Parking"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[6,1],"open_hours":{"start":"10:00","end":"23:00"},"event_types":["Wedding","Gala","Wine Event"],"style_tags":["Winery","Historic","Rustic"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Netanya Cliffside Event Garden',
  'A lush garden venue perched on the Netanya cliffs with direct sea views and a staircase to the beach.',
  '34A Gad Machnes Blvd, Netanya', 'Netanya', ST_SetSRID(ST_MakePoint(34.8565, 32.3275), 4326),
  150, 1000, 7200,
  '["Cliffside Views","Ceremony Circle","Beach Access","Catering","Parking","Lighting"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"09:00","end":"22:00"},"event_types":["Wedding","Outdoor Ceremony","Photo Shoot"],"style_tags":["Cliffside","Mediterranean","Garden"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Jaffa Flea Market Loft',
  'Above the legendary Jaffa flea market, this loft fuses antiques with modern raw finish. Mosaic floors, brass fittings, and a rooftop terrace.',
  '7 HaPishpeshim St, Tel Aviv', 'Tel Aviv', ST_SetSRID(ST_MakePoint(34.7508, 32.0492), 4326),
  70, 850, 6000,
  '["Unique Antique Decor","Rooftop Access","Sound System","WiFi","Kitchenette","Disability Access"]',
  '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200","https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"09:00","end":"23:00"},"event_types":["Photo Shoot","Brand Activation","Art Pop-up"],"style_tags":["Eclectic","Jaffa","Unique"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Petah Tikva Startup Campus',
  'A modern innovation campus with large event halls, breakout spaces, and a makerspace with gigabit internet.',
  '101 Jabotinsky St, Petah Tikva', 'Tel Aviv', ST_SetSRID(ST_MakePoint(34.8878, 32.0874), 4326),
  200, 900, 6000,
  '["Gigabit WiFi","Makerspace","3D Printing","AV System","Outdoor Deck","Parking"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"07:00","end":"22:00"},"event_types":["Hackathon","Innovation Summit","Demo Day"],"style_tags":["Tech","Innovation","Modern"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Tel Aviv University Innovation Hall',
  'The flagship event hall at the Coller School of Management. Lecture-style up to 400, gala-style for 250.',
  '12 Einstein St, Tel Aviv', 'Tel Aviv', ST_SetSRID(ST_MakePoint(34.8027, 32.1133), 4326),
  400, 2000, 14000,
  '["Video Wall","4K Projection","Academic Setting","Catering","Parking","Campus Access"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"08:00","end":"22:00"},"event_types":["Academic Conference","Gala Dinner","Award Ceremony"],"style_tags":["Academic","Prestigious"]}'
),

-- ── 33–36 · Be''er Sheva & South ───────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001', 'Be''er Sheva Old City Ottoman Courtyard',
  'A preserved Ottoman-era courtyard in the heart of the old city. Stone archways, a central fountain, and 100-year-old fig trees.',
  '12 Herzl St, Be''er Sheva', 'Be''er Sheva', ST_SetSRID(ST_MakePoint(34.7993, 31.2421), 4326),
  80, 600, 4200,
  '["Courtyard","Heritage Architecture","Sound System","Ambient Lighting","WiFi","Parking Nearby"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"08:00","end":"22:00"},"event_types":["Wedding","Cultural Event","Corporate Dinner"],"style_tags":["Historic","Courtyard","Ottoman"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Negev Desert Glamping Event Site',
  'An extraordinary tented venue in the Negev desert. Luxury Bedouin-style tents with Persian rugs, lanterns, and stargazing decks.',
  'Route 40 KM 124, Be''er Sheva', 'Be''er Sheva', ST_SetSRID(ST_MakePoint(34.7603, 31.1845), 4326),
  80, 800, 5500,
  '["Generator Power","Desert Views","Bedouin Catering","Bonfire Area","Stargazing Deck","Overnight Option"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"12:00","end":"08:00"},"event_types":["Desert Retreat","Team Building","Wedding"],"style_tags":["Desert","Unique","Glamping"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Ben-Gurion University Campus Auditorium',
  'The main auditorium of Ben-Gurion University. 600-seat theater with professional lighting and a full fly tower.',
  '1 Ben-Gurion Blvd, Be''er Sheva', 'Be''er Sheva', ST_SetSRID(ST_MakePoint(34.8014, 31.2626), 4326),
  600, 2200, 16000,
  '["Full Stage Lighting","Fly Tower","Backstage Rooms","AC","Accessibility","Parking"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"09:00","end":"23:00"},"event_types":["Concert","Conference","Theater Performance"],"style_tags":["Academic","Theater","Large-Scale"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Arad Arts Center Studio',
  'A creative hub in the high-altitude desert town of Arad. Wooden stage, natural skylights, and a peaceful outdoor sculpture garden.',
  '7 Ben Yair St, Arad', 'Be''er Sheva', ST_SetSRID(ST_MakePoint(35.2126, 31.2595), 4326),
  60, 350, 2500,
  '["Wooden Stage","Skylight Lighting","Sound System","Sculpture Garden","Kitchen","Parking"]',
  '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200","https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200","https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200"]',
  'ACTIVE', '{"closed_days":[0],"open_hours":{"start":"08:00","end":"21:00"},"event_types":["Art Workshop","Music Performance","Wellness Retreat"],"style_tags":["Desert","Artistic","Peaceful"]}'
),

-- ── 37–39 · Eilat ──────────────────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001', 'Red Sea Beachfront Pavilion',
  'An open-air pavilion on a private section of the Red Sea. Crystal-clear water laps at the deck; coral reefs visible below.',
  '1 Ha''Arava Rd, Eilat', 'Eilat', ST_SetSRID(ST_MakePoint(34.9597, 29.5463), 4326),
  100, 1400, 10000,
  '["Beach Access","Sea Views","Pavilion Structure","Catering","Snorkeling Equipment","Parking"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"08:00","end":"23:00"},"event_types":["Wedding","Corporate Retreat","VIP Event"],"style_tags":["Beach","Red Sea","Exotic"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Eilat International Convention Hall',
  'Part of the Eilat convention complex adjacent to luxury hotels. A 1,000-seat plenary hall and 10 breakout rooms.',
  '1 King Solomon Promenade, Eilat', 'Eilat', ST_SetSRID(ST_MakePoint(34.9569, 29.5482), 4326),
  1000, 4000, 30000,
  '["1000-Seat Hall","10 Breakout Rooms","Sea Views","Hotel Adjacency","Full Catering","Exhibition Space"]',
  '["https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200","https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200","https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200","https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"07:00","end":"23:00"},"event_types":["International Conference","Trade Show","Gala Dinner"],"style_tags":["Large-Scale","International","Resort"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Coral Beach Artist Studio',
  'A cozy artist studio 5 minutes from Coral Beach nature reserve. Salt-bleached wooden walls and a private cactus garden.',
  '34A Coral Beach Rd, Eilat', 'Eilat', ST_SetSRID(ST_MakePoint(34.9468, 29.5325), 4326),
  15, 300, 2000,
  '["Artist''s Tools","Private Garden","WiFi","Kitchenette","Loft Sleeping Area","Parking"]',
  '["https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200","https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200","https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200","https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"08:00","end":"20:00"},"event_types":["Art Workshop","Creative Residency","Intimate Retreat"],"style_tags":["Artistic","Intimate","Desert"]}'
),

-- ── 40–43 · Nazareth & North ───────────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001', 'Nazareth Old City Mansion',
  'A fully restored 18th-century mansion in Nazareth''s Christian Quarter. Hand-carved stone walls and Ottoman mashrabiya screens.',
  '12 Al-Bishara St, Nazareth', 'Nazareth', ST_SetSRID(ST_MakePoint(35.2996, 32.7029), 4326),
  90, 900, 6500,
  '["Courtyard Fountain","Heritage Decor","Catering","WiFi","AC","Guided Tours Available"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"09:00","end":"23:00"},"event_types":["Wedding","Cultural Event","Private Dinner"],"style_tags":["Historic","Mansion","Unique"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Sea of Galilee Kibbutz Lawn',
  'A magnificent event lawn on a Galilee kibbutz with a direct view over the Sea of Galilee. Natural grass, palm trees, and a purpose-built stone stage.',
  'Kibbutz Ein Gev, Jordan Valley', 'Nazareth', ST_SetSRID(ST_MakePoint(35.6527, 32.7784), 4326),
  300, 1200, 8500,
  '["Stage","Sound System","Lake Views","Catering","Parking","Overnight Accommodation Options"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"10:00","end":"22:00"},"event_types":["Wedding","Outdoor Concert","Corporate Retreat"],"style_tags":["Lakeside","Outdoor","Kibbutz","Scenic"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Acre Crusader Vault',
  'An actual Crusader-era vault in the heart of old Acre, a UNESCO World Heritage Site. 900-year-old stone walls and barrel-vaulted ceilings.',
  '1 Saladin St, Acre', 'Haifa', ST_SetSRID(ST_MakePoint(35.0699, 32.9278), 4326),
  50, 1200, 8800,
  '["Historic Architecture","Atmospheric Lighting","Sound System","WiFi","Catering Access","Tour Guide Available"]',
  '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200","https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200"]',
  'ACTIVE', '{"closed_days":[0],"open_hours":{"start":"09:00","end":"22:00"},"event_types":["Film Location","Cultural Dinner","Wedding"],"style_tags":["Historic","Crusader","Unique","UNESCO"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Golan Heights Winery & Event Barn',
  'A majestic event barn on the Golan Heights with views of Mount Hermon. Stone and timber construction with a vaulted ceiling and tasting room.',
  'Katzrin Industrial Zone, Golan', 'Nazareth', ST_SetSRID(ST_MakePoint(35.6878, 32.9946), 4326),
  160, 1300, 9000,
  '["Mountain Views","Winery Access","Rustic Barn","Outdoor Deck","Catering","Parking"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[6],"open_hours":{"start":"10:00","end":"22:00"},"event_types":["Wedding","Corporate Retreat","Harvest Festival"],"style_tags":["Winery","Rustic","Mountains"]}'
),

-- ── 44–50 · Unique/Special Spaces ─────────────────────────────────────────
(
  'a0000000-0000-0000-0000-000000000001', 'Tel Aviv Submarine Museum Event Deck',
  'An outdoor event space next to a decommissioned submarine in the Tel Aviv port — a truly unforgettable backdrop.',
  '1 Tel Aviv Port, Tel Aviv', 'Tel Aviv', ST_SetSRID(ST_MakePoint(34.7712, 32.0992), 4326),
  200, 1500, 10500,
  '["Submarine View","Sea Breeze","Catering","PA System","Parking","Security"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE', '{"closed_days":[1],"open_hours":{"start":"10:00","end":"23:00"},"event_types":["Corporate Party","Product Launch","Team Building"],"style_tags":["Unique","Port","Memorable"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Jerusalem Hotel Ballroom',
  'The grand ballroom of one of Jerusalem''s most beloved boutique hotels. Art deco chandeliers, parquet floors, and rich drapes.',
  '22 King David St, Jerusalem', 'Jerusalem', ST_SetSRID(ST_MakePoint(35.2181, 31.7693), 4326),
  180, 1700, 12500,
  '["Chandeliers","Hotel Services","Catering","Bridal Suite","Valet Parking","AV System"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"10:00","end":"03:00"},"event_types":["Wedding","Gala","Bar/Bat Mitzvah"],"style_tags":["Ballroom","Luxury","Art Deco"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Tel Aviv Surfer Hostel Rooftop Bar',
  'A trendy rooftop bar space above a boutique surfer hostel. Low-slung furniture, tropical plants, and a climbing vine biombo.',
  '55 Ben Yehuda St, Tel Aviv', 'Tel Aviv', ST_SetSRID(ST_MakePoint(34.7669, 32.0809), 4326),
  45, 550, NULL,
  '["Bar Setup","Sound System","Tropical Decor","WiFi","Street Parking"]',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200","https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200","https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200","https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"14:00","end":"02:00"},"event_types":["Private Party","Brand Activation","Photo Shoot"],"style_tags":["Trendy","Rooftop","Casual"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Herzliya Hi-Tech Campus Amphitheater',
  'An outdoor amphitheater within a Herzliya Pituah hi-tech campus. Terraced stone seating for 300, professional stage, Mediterranean horizon.',
  '3 Ha''Maskit St, Herzliya', 'Herzliya', ST_SetSRID(ST_MakePoint(34.8212, 32.1649), 4326),
  300, 1600, 11500,
  '["Stage","Professional PA","Stage Lighting","Parking","Green Room","Catering"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"09:00","end":"23:00"},"event_types":["Outdoor Concert","Product Launch","Corporate Party"],"style_tags":["Amphitheater","Outdoor","Tech"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Ramat Gan Safari Park Event Lawn',
  'Host your event at Africa in the Middle East. An exclusive lawn adjacent to the open safari — giraffes and zebras are your backdrop.',
  '1 Ha''Tayelet Rd, Ramat Gan', 'Ramat Gan', ST_SetSRID(ST_MakePoint(34.8377, 32.0789), 4326),
  250, 3000, 22000,
  '["Safari Views","Catering","Lighting","Exclusive Access","Parking","Animal Show Option"]',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200","https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200","https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200","https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200","https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200"]',
  'ACTIVE', '{"closed_days":[0,1],"open_hours":{"start":"18:00","end":"23:00"},"event_types":["Corporate Gala","Brand Activation","Wedding","VIP Event"],"style_tags":["Unique","Safari","Outdoor"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Dead Sea Spa Resort Event Hall',
  'A resort event hall on the shores of the Dead Sea at 430m below sea level — the lowest point on Earth. Salt crystal chandeliers and sea views.',
  'Ein Bokek Resort Area, Dead Sea', 'Jerusalem', ST_SetSRID(ST_MakePoint(35.3615, 31.1949), 4326),
  220, 2200, 16000,
  '["Dead Sea Views","Spa Access","Catering","Hotel Rooms","Parking","Unique Location Certificate"]',
  '["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200","https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"08:00","end":"23:00"},"event_types":["Corporate Retreat","Wedding","Wellness Event"],"style_tags":["Unique","Luxury","Dead Sea","Resort"]}'
),
(
  'a0000000-0000-0000-0000-000000000001', 'Tel Aviv Street Art Warehouse',
  'A warehouse with walls covered floor-to-ceiling in commissioned street art. Blacklight installations, graffiti workshops, raw concrete interior.',
  '89 Kibbutz Galuyot Rd, Tel Aviv', 'Tel Aviv', ST_SetSRID(ST_MakePoint(34.7826, 32.0438), 4326),
  250, 1100, 7800,
  '["Blacklight Art","Sound System","DJ Booth","WiFi","Loading Bay","Security"]',
  '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200","https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200","https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200","https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200","https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200"]',
  'ACTIVE', '{"closed_days":[],"open_hours":{"start":"10:00","end":"03:00"},"event_types":["Brand Activation","Art Event","Corporate Party","Music Event"],"style_tags":["Urban","Street Art","Raw","Creative"]}'
);

-- ─── Verify ────────────────────────────────────────────────────────────────
SELECT
  COUNT(*)                              AS total_venues,
  COUNT(DISTINCT city)                  AS cities,
  MIN(price_per_hour)                   AS min_price_ils,
  MAX(price_per_hour)                   AS max_price_ils,
  MIN(capacity)                         AS min_capacity,
  MAX(capacity)                         AS max_capacity
FROM venues
WHERE status = 'ACTIVE';
