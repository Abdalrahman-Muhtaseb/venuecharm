/**
 * VenueCharm — Venue Seed Script
 * Generates and inserts 50 realistic Israeli venue profiles
 *
 * Usage:
 *   npx tsx scripts/seed-venues.ts
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js typescript ts-node @types/node dotenv
 *   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

// ─── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // service role bypasses RLS

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Types ─────────────────────────────────────────────────────────────────
interface VenueSeed {
  title: string;
  description: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  price_per_hour: number;
  price_per_day: number | null;
  amenities: string[];
  photos: string[];
  event_types: string[];
  style_tags: string[];
  recurring_pattern: Record<string, unknown>;
}

// ─── Israeli Cities with Central Coordinates ───────────────────────────────
const CITIES = [
  { name: "Tel Aviv",    lat: 32.0853, lng: 34.7818 },
  { name: "Jerusalem",   lat: 31.7683, lng: 35.2137 },
  { name: "Haifa",       lat: 32.7940, lng: 34.9896 },
  { name: "Be'er Sheva", lat: 31.2530, lng: 34.7915 },
  { name: "Eilat",       lat: 29.5577, lng: 34.9519 },
  { name: "Nazareth",    lat: 32.7021, lng: 35.2978 },
  { name: "Herzliya",    lat: 32.1663, lng: 34.8435 },
  { name: "Netanya",     lat: 32.3215, lng: 34.8532 },
  { name: "Ramat Gan",   lat: 32.0820, lng: 34.8130 },
  { name: "Rishon LeZion",lat: 31.9730, lng: 34.7896 },
];

// ─── Unsplash photo pools by venue style ──────────────────────────────────
const PHOTO_POOLS: Record<string, string[]> = {
  rooftop: [
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200",
    "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200",
    "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200",
    "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
  ],
  loft: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200",
  ],
  studio: [
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=1200",
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200",
    "https://images.unsplash.com/photo-1545128485-c400ce7b23d5?w=1200",
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200",
  ],
  garden: [
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200",
    "https://images.unsplash.com/photo-1478146059778-26b9e687cf6b?w=1200",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200",
    "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200",
  ],
  conference: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200",
    "https://images.unsplash.com/photo-1562664377-709f2c337eb2?w=1200",
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200",
  ],
  villa: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200",
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200",
  ],
  gallery: [
    "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=1200",
    "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=1200",
    "https://images.unsplash.com/photo-1577720643272-265f09367456?w=1200",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200",
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200",
  ],
  warehouse: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200",
    "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200",
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200",
  ],
};

// ─── Venue Templates (50 hand-crafted Israeli venue profiles) ───────────────
const VENUE_TEMPLATES: Omit<VenueSeed, "lat" | "lng" | "address">[] = [
  // ── Tel Aviv Rooftops (1–6) ──────────────────────────────────────────────
  {
    title: "Florentin Rooftop Terrace",
    description: "Stunning 360° views over Florentin and the Mediterranean horizon. Industrial-chic space with exposed brick and string lights. Perfect for evening receptions and creative launches. Features a custom bar and lounge seating for 80.",
    city: "Tel Aviv", capacity: 80, price_per_hour: 900, price_per_day: 6500,
    amenities: ["WiFi", "Bar", "Sound System", "String Lights", "Security", "Elevator Access"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["Party", "Product Launch", "Corporate Reception", "Wedding"],
    style_tags: ["Industrial", "Rooftop", "Urban", "Evening"],
    recurring_pattern: { closed_days: [1], open_hours: { start: "14:00", end: "02:00" } },
  },
  {
    title: "Dizengoff Tower Sky Lounge",
    description: "Exclusive top-floor lounge in the heart of Tel Aviv with panoramic city views. Minimalist design with floor-to-ceiling windows, a private bar, and retractable roof access. A show-stopper for VIP events.",
    city: "Tel Aviv", capacity: 60, price_per_hour: 1400, price_per_day: 10000,
    amenities: ["WiFi", "Private Bar", "AC", "AV Equipment", "Catering Kitchen", "Valet Parking"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["VIP Event", "Corporate Retreat", "Product Launch", "Photo Shoot"],
    style_tags: ["Luxury", "Minimalist", "Rooftop", "City Views"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "10:00", end: "23:00" } },
  },
  {
    title: "Port of Tel Aviv Rooftop",
    description: "A raw industrial rooftop overlooking the old port with direct sea breeze. Flexible open-air layout with weatherproof shade sails and modular furniture. The sunset views are unbeatable for golden-hour shoots.",
    city: "Tel Aviv", capacity: 120, price_per_hour: 1100, price_per_day: 7800,
    amenities: ["Power Outlets", "Shade Sails", "Sound System", "Security", "Street Parking"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["Concert", "Festival", "Film Shoot", "Corporate Event"],
    style_tags: ["Industrial", "Seaside", "Open Air", "Raw"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "00:00" } },
  },
  {
    title: "Neve Tzedek Boutique Terrace",
    description: "A hidden gem in Neve Tzedek — a private terrace above one of Tel Aviv's most charming neighborhoods. Lush potted plants, mosaic tiles, and ambient lighting create an intimate Mediterranean atmosphere.",
    city: "Tel Aviv", capacity: 40, price_per_hour: 650, price_per_day: 4500,
    amenities: ["WiFi", "Outdoor Furniture", "String Lights", "Kitchenette", "Garden Speakers"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Intimate Wedding", "Birthday", "Engagement Party", "Creative Workshop"],
    style_tags: ["Bohemian", "Mediterranean", "Intimate", "Terrace"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "09:00", end: "22:00" } },
  },
  {
    title: "Rothschild Boulevard Penthouse Deck",
    description: "An iconic penthouse deck on Israel's most prestigious boulevard. Designed by an award-winning architect, the space features a polished concrete floor, a built-in DJ booth, and a stunning infinity view over Rothschild.",
    city: "Tel Aviv", capacity: 100, price_per_hour: 1800, price_per_day: 13000,
    amenities: ["DJ Booth", "Professional Sound", "Lighting Rig", "AC", "Changing Rooms", "Security"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["DJ Event", "Brand Activation", "Fashion Show", "Corporate Party"],
    style_tags: ["Luxury", "Modern", "Rooftop", "Iconic"],
    recurring_pattern: { closed_days: [0], open_hours: { start: "12:00", end: "03:00" } },
  },
  {
    title: "South Tel Aviv Urban Garden Rooftop",
    description: "An urban garden paradise 12 floors up. Raised vegetable beds, vertical gardens, and reclaimed-wood benches make this the most photogenic eco-rooftop in the city. Fully off-grid with solar lighting.",
    city: "Tel Aviv", capacity: 50, price_per_hour: 700, price_per_day: 4800,
    amenities: ["Solar Lighting", "BBQ Grill", "Outdoor Speakers", "Parking", "Eco-Friendly Setup"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Workshop", "Team Building", "Intimate Dinner", "Photoshoot"],
    style_tags: ["Eco", "Garden", "Rustic", "Rooftop"],
    recurring_pattern: { closed_days: [], open_hours: { start: "07:00", end: "21:00" } },
  },

  // ── Remaining 44 venues (abbreviated for brevity in comments) ────────────────
  // ── Tel Aviv Lofts & Studios (7–13), Jerusalem (14–20), Haifa (21–25) ───
  // ── Herzliya & Greater Tel Aviv (26–32), Be'er Sheva & South (33–36) ────
  // ── Eilat (37–39), Nazareth & North (40–43), Mix/Special (44–50) ────────
  
  {
    title: "Florentin Creative Loft",
    description: "A classic Florentin industrial loft with 5m ceilings, polished concrete floors, and exposed steel beams. 200 sqm of completely blank canvas — bring your own vision. Wifi gigabit, 3-phase power for production.",
    city: "Tel Aviv", capacity: 150, price_per_hour: 800, price_per_day: 5500,
    amenities: ["3-Phase Power", "WiFi 1Gbps", "Loading Dock", "Freight Elevator", "AC", "Kitchenette"],
    photos: PHOTO_POOLS.loft,
    event_types: ["Film Shoot", "Photo Shoot", "Corporate Event", "Art Exhibition"],
    style_tags: ["Industrial", "Loft", "Raw", "Flexible"],
    recurring_pattern: { closed_days: [], open_hours: { start: "06:00", end: "00:00" } },
  },
  {
    title: "Jaffa Photography Studio",
    description: "Purpose-built photography studio in old Jaffa with natural north-facing light. Includes a 6m white cyclorama, a grey textured backdrop, and a makeup room. Fully equipped for commercial and fashion shoots.",
    city: "Tel Aviv", capacity: 20, price_per_hour: 500, price_per_day: 3200,
    amenities: ["6m Cyclorama", "Backdrop System", "Makeup Room", "WiFi", "Prop Storage", "Parking"],
    photos: PHOTO_POOLS.studio,
    event_types: ["Photo Shoot", "Video Production", "Fashion Shoot", "Content Creation"],
    style_tags: ["Studio", "Photography", "Professional", "Clean"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "07:00", end: "21:00" } },
  },
  {
    title: "Tel Aviv Design District Showroom",
    description: "A sleek 300 sqm showroom in Tel Aviv's design district. High-end finishes, moveable walls, and gallery rail lighting. Ideal for product launches, pop-up retail, or brand activations that demand a premium backdrop.",
    city: "Tel Aviv", capacity: 200, price_per_hour: 1200, price_per_day: 8000,
    amenities: ["Gallery Lighting", "Moveable Walls", "WiFi", "Loading Bay", "Reception Desk", "AC"],
    photos: PHOTO_POOLS.gallery,
    event_types: ["Product Launch", "Pop-up Retail", "Exhibition", "Brand Activation"],
    style_tags: ["Modern", "Gallery", "Luxury", "Showroom"],
    recurring_pattern: { closed_days: [0], open_hours: { start: "09:00", end: "22:00" } },
  },
  {
    title: "Allenby Recording Studio & Event Space",
    description: "A legendary recording studio turned multi-purpose event space. Full SSL console is display-only, but the acoustic panels and soundproofed walls make it the perfect sound environment for podcasts, live music, and intimate concerts.",
    city: "Tel Aviv", capacity: 80, price_per_hour: 1000, price_per_day: 7000,
    amenities: ["Acoustic Treatment", "Stage", "Full PA System", "Green Room", "WiFi", "Recording Booth"],
    photos: PHOTO_POOLS.studio,
    event_types: ["Live Music", "Podcast Recording", "Concert", "Music Launch"],
    style_tags: ["Music", "Studio", "Intimate", "Acoustic"],
    recurring_pattern: { closed_days: [1], open_hours: { start: "10:00", end: "02:00" } },
  },
  {
    title: "HaKirya Startup Hub",
    description: "A modern co-working event space in the heart of Tel Aviv's tech district. Modular furniture, moveable glass dividers, and A/V everywhere. Perfect for hackathons, product demos, and investor presentations.",
    city: "Tel Aviv", capacity: 100, price_per_hour: 600, price_per_day: 4000,
    amenities: ["4K Projection", "Video Conferencing", "WiFi 1Gbps", "Modular Tables", "Catering Service", "Parking"],
    photos: PHOTO_POOLS.conference,
    event_types: ["Hackathon", "Conference", "Workshop", "Investor Demo Day"],
    style_tags: ["Modern", "Tech", "Corporate", "Flexible"],
    recurring_pattern: { closed_days: [6, 0], open_hours: { start: "07:00", end: "22:00" } },
  },
  {
    title: "Old North Art Warehouse",
    description: "A converted 1940s warehouse in Tel Aviv's old north neighborhood. Raw whitewashed walls, terrazzo floors, and massive skylights that flood the space with diffused light. Used by Bezalel graduates for exhibitions.",
    city: "Tel Aviv", capacity: 180, price_per_hour: 950, price_per_day: 6500,
    amenities: ["Skylight Lighting", "Gallery Rails", "Loading Dock", "3-Phase Power", "AC", "Outdoor Courtyard"],
    photos: PHOTO_POOLS.warehouse,
    event_types: ["Art Exhibition", "Fashion Show", "Film Shoot", "Corporate Event"],
    style_tags: ["Warehouse", "Industrial", "Artistic", "Spacious"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "23:00" } },
  },
  {
    title: "Dizengoff Dance & Event Studio",
    description: "A professional 200 sqm dance studio with sprung hardwood floors, a mirrored wall, and a barre. Ideal for fitness events, dance workshops, yoga retreats, and intimate performances with a built-in speaker system.",
    city: "Tel Aviv", capacity: 60, price_per_hour: 450, price_per_day: 3000,
    amenities: ["Sprung Floor", "Mirror Wall", "Barre", "Sound System", "Changing Rooms", "AC"],
    photos: PHOTO_POOLS.studio,
    event_types: ["Dance Workshop", "Yoga Retreat", "Fitness Event", "Intimate Performance"],
    style_tags: ["Dance", "Studio", "Active", "Wellness"],
    recurring_pattern: { closed_days: [], open_hours: { start: "06:00", end: "22:00" } },
  },
  {
    title: "Mahane Yehuda Market Event Space",
    description: "A stunning event space directly above the Mahane Yehuda shuk. Stone arches, wooden beams, and the sounds and smells of the market below create an unforgettable atmosphere for dinners and cultural events.",
    city: "Jerusalem", capacity: 70, price_per_hour: 750, price_per_day: 5200,
    amenities: ["WiFi", "Catering Access", "AV System", "AC", "Balcony", "Parking Nearby"],
    photos: PHOTO_POOLS.loft,
    event_types: ["Dinner Party", "Cultural Event", "Wedding Reception", "Corporate Dinner"],
    style_tags: ["Jerusalem Stone", "Historic", "Market", "Atmospheric"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "10:00", end: "23:00" } },
  },
  {
    title: "Emek Refaim Victorian Villa",
    description: "A restored 19th-century Ottoman-era villa in the German Colony. Three interconnected halls with original mosaic floors, arched doorways, and a private garden. UNESCO heritage zone adds prestige to every event.",
    city: "Jerusalem", capacity: 120, price_per_hour: 1100, price_per_day: 7800,
    amenities: ["Private Garden", "Catering Kitchen", "AC", "WiFi", "On-site Parking", "Heritage Decor"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding", "Gala Dinner", "Corporate Retreat", "Private Party"],
    style_tags: ["Historic", "Heritage", "Villa", "Garden"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "09:00", end: "23:00" } },
  },
  {
    title: "Jerusalem Art Campus Gallery",
    description: "Part of a vibrant arts campus near the Israel Museum. White cube gallery with programmable LED track lighting, polished concrete floors, and a loading entrance for large installations. A favorite for contemporary art shows.",
    city: "Jerusalem", capacity: 90, price_per_hour: 850, price_per_day: 5800,
    amenities: ["LED Track Lighting", "Climate Control", "Security System", "WiFi", "Storage Room", "Loading Entrance"],
    photos: PHOTO_POOLS.gallery,
    event_types: ["Art Exhibition", "Sculpture Show", "Cultural Event", "Auction"],
    style_tags: ["Gallery", "White Cube", "Contemporary", "Cultural"],
    recurring_pattern: { closed_days: [0, 1], open_hours: { start: "09:00", end: "20:00" } },
  },
  {
    title: "Talbieh Diplomatic Quarter Mansion",
    description: "A grand pre-1948 mansion in Jerusalem's prestigious Talbieh neighborhood. High ornate ceilings, French windows, and a marble foyer. Hosts foreign dignitaries regularly — security-cleared and fully insured.",
    city: "Jerusalem", capacity: 150, price_per_hour: 2000, price_per_day: 15000,
    amenities: ["Grand Piano", "Full Catering", "Valet Parking", "Security", "AC", "Diplomatic Clearance"],
    photos: PHOTO_POOLS.villa,
    event_types: ["State Dinner", "Gala", "Corporate Summit", "Wedding"],
    style_tags: ["Luxury", "Historic", "Prestigious", "Mansion"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "08:00", end: "23:00" } },
  },
  {
    title: "Ein Kerem Vineyard Estate",
    description: "A working vineyard estate 15 minutes from central Jerusalem. Rustic stone winery, private vineyard rows, and a ceremony lawn with breathtaking Judean Hills views. Wine tasting add-on available.",
    city: "Jerusalem", capacity: 200, price_per_hour: 1500, price_per_day: 11000,
    amenities: ["Wine Tasting", "Outdoor Ceremony Lawn", "Catering", "Parking", "Scenic Views", "Event Coordinator"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Wedding", "Corporate Retreat", "Wine Event", "Team Building"],
    style_tags: ["Vineyard", "Rustic", "Outdoor", "Scenic"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "10:00", end: "22:00" } },
  },
  {
    title: "Jerusalem Conference Palace — Hall B",
    description: "A mid-sized breakout hall within the Jerusalem International Convention Center. Theater-style for 250, classroom for 150, or boardroom for 40. State-of-the-art A/V, video conferencing, and on-site catering.",
    city: "Jerusalem", capacity: 250, price_per_hour: 1800, price_per_day: 12000,
    amenities: ["4K Projection", "Video Conferencing", "Interpretation Booths", "Catering", "Parking", "Accessibility"],
    photos: PHOTO_POOLS.conference,
    event_types: ["Conference", "Academic Symposium", "Government Meeting", "Corporate Summit"],
    style_tags: ["Conference", "Professional", "Large-Scale", "Accessible"],
    recurring_pattern: { closed_days: [6, 0], open_hours: { start: "08:00", end: "22:00" } },
  },
  {
    title: "Musrara Neighborhood Studio",
    description: "A raw creative space in the Musrara arts neighborhood on the border of East and West Jerusalem. Exposed stone walls meet modern fixtures. Used by artists from both communities — a uniquely meaningful venue.",
    city: "Jerusalem", capacity: 45, price_per_hour: 400, price_per_day: 2800,
    amenities: ["WiFi", "Projector", "Sound System", "Kitchenette", "Stone Walls", "Courtyard"],
    photos: PHOTO_POOLS.loft,
    event_types: ["Art Workshop", "Community Event", "Film Screening", "Cultural Exchange"],
    style_tags: ["Raw", "Cultural", "Community", "Artistic"],
    recurring_pattern: { closed_days: [], open_hours: { start: "09:00", end: "21:00" } },
  },
  {
    title: "Carmel Mountain Panorama Venue",
    description: "A breathtaking open-air event deck on the slopes of Mount Carmel with unobstructed views of Haifa Bay and the Mediterranean. Natural stone flooring, olive trees, and the scent of pine. Ideal for sunset ceremonies.",
    city: "Haifa", capacity: 100, price_per_hour: 900, price_per_day: 6500,
    amenities: ["Panoramic Views", "Outdoor Ceremony Area", "String Lights", "Parking", "Catering Setup", "AC in Adjacent Hall"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Wedding", "Outdoor Ceremony", "Corporate Dinner", "Photo Shoot"],
    style_tags: ["Panoramic", "Outdoor", "Mediterranean", "Scenic"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "23:00" } },
  },
  {
    title: "German Colony Boutique Hall",
    description: "A lovingly restored Templar building in Haifa's German Colony. Original wooden floors, exposed stone arches, and ornate iron chandeliers create an intimate old-world atmosphere unlike anything else in northern Israel.",
    city: "Haifa", capacity: 65, price_per_hour: 700, price_per_day: 4800,
    amenities: ["Heritage Decor", "WiFi", "AC", "Catering Kitchen", "Sound System", "Street Parking"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding Reception", "Private Dinner", "Corporate Event", "Birthday Gala"],
    style_tags: ["Historic", "Boutique", "Intimate", "Heritage"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "09:00", end: "23:00" } },
  },
  {
    title: "Haifa Port Industrial Loft",
    description: "An authentic port warehouse converted into an events powerhouse. 500 sqm of raw industrial space with 8m ceilings, massive freight doors that open to the working port, and views of container ships.",
    city: "Haifa", capacity: 300, price_per_hour: 1300, price_per_day: 9000,
    amenities: ["Freight Doors", "3-Phase Power", "Loading Dock", "Sound System", "WiFi", "Parking"],
    photos: PHOTO_POOLS.warehouse,
    event_types: ["Concert", "Art Fair", "Corporate Party", "Film Production"],
    style_tags: ["Industrial", "Port", "Massive", "Raw"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "02:00" } },
  },
  {
    title: "Wadi Nisnas Gallery & Event Space",
    description: "A gallery space in Haifa's most colorful Arab neighborhood. Arched ceilings, hand-painted murals, and a courtyard spilling into the alley. Frequently used for interfaith cultural events and community celebrations.",
    city: "Haifa", capacity: 55, price_per_hour: 450, price_per_day: 3000,
    amenities: ["Gallery Walls", "Projector", "Sound System", "Courtyard", "WiFi", "Local Art"],
    photos: PHOTO_POOLS.gallery,
    event_types: ["Cultural Event", "Art Exhibition", "Community Gathering", "Film Screening"],
    style_tags: ["Cultural", "Artistic", "Community", "Colorful"],
    recurring_pattern: { closed_days: [], open_hours: { start: "10:00", end: "22:00" } },
  },
  {
    title: "Bat Galim Beachfront Studio",
    description: "A ground-floor studio 50 meters from Haifa beach. Natural light, white walls, and the sound of waves. Rents by the hour for yoga classes, wellness workshops, and intimate creative sessions.",
    city: "Haifa", capacity: 30, price_per_hour: 350, price_per_day: null,
    amenities: ["Sprung Floor", "Sound System", "Changing Room", "Kitchenette", "WiFi", "Beach Access"],
    photos: PHOTO_POOLS.studio,
    event_types: ["Yoga", "Wellness Workshop", "Dance Class", "Meditation Session"],
    style_tags: ["Beach", "Wellness", "Light-Filled", "Calm"],
    recurring_pattern: { closed_days: [], open_hours: { start: "06:00", end: "20:00" } },
  },
  {
    title: "Herzliya Pituah Marina Deck",
    description: "An elevated deck above the Herzliya Marina with a 180° view of luxury yachts and the sea. White teak furniture, built-in bar, and retractable sunshade. The go-to for hi-tech industry parties and corporate networking.",
    city: "Herzliya", capacity: 120, price_per_hour: 1600, price_per_day: 11000,
    amenities: ["Marina Views", "Built-in Bar", "Sound System", "Sunshade", "Valet Parking", "Catering Service"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["Corporate Networking", "Product Launch", "VIP Party", "Hi-tech Event"],
    style_tags: ["Luxury", "Marina", "Outdoor", "Prestigious"],
    recurring_pattern: { closed_days: [], open_hours: { start: "10:00", end: "01:00" } },
  },
  {
    title: "Ramat Gan Diamond Exchange Conference Center",
    description: "A sleek conference center in the heart of the Diamond Exchange District. Six modular meeting rooms that combine into one 600-person hall. State-of-the-art technology and walking distance from the train station.",
    city: "Ramat Gan", capacity: 600, price_per_hour: 2500, price_per_day: 18000,
    amenities: ["Modular Rooms", "4K LED Wall", "Video Conferencing", "Business Lounge", "Parking", "Kosher Catering"],
    photos: PHOTO_POOLS.conference,
    event_types: ["Large Conference", "Product Launch", "Corporate Summit", "Exhibition"],
    style_tags: ["Corporate", "Modern", "Large-Scale", "Professional"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "07:00", end: "22:00" } },
  },
  {
    title: "Rishon LeZion Winery Estate",
    description: "Israel's oldest winery — Carmel Winery's historic Rishon estate — offers event spaces within the original 1882 cellars. Barrel rooms, stone corridors, and an outdoor amphitheater for up to 300 guests.",
    city: "Rishon LeZion", capacity: 300, price_per_hour: 1400, price_per_day: 10000,
    amenities: ["Barrel Room", "Amphitheater", "Wine Service", "Catering", "Museum Access", "Parking"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding", "Gala", "Corporate Dinner", "Wine Event"],
    style_tags: ["Winery", "Historic", "Rustic", "Prestigious"],
    recurring_pattern: { closed_days: [6, 1], open_hours: { start: "10:00", end: "23:00" } },
  },
  {
    title: "Netanya Cliffside Event Garden",
    description: "A lush garden venue perched on the Netanya cliffs with direct sea views and a staircase to the beach below. Cedar trees provide natural shade, and the space features a stone ceremony circle with Mediterranean landscaping.",
    city: "Netanya", capacity: 150, price_per_hour: 1000, price_per_day: 7200,
    amenities: ["Cliffside Views", "Ceremony Circle", "Beach Access", "Catering", "Parking", "Lighting"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Wedding", "Outdoor Ceremony", "Photo Shoot", "Corporate Retreat"],
    style_tags: ["Cliffside", "Mediterranean", "Garden", "Scenic"],
    recurring_pattern: { closed_days: [], open_hours: { start: "09:00", end: "22:00" } },
  },
  {
    title: "Petah Tikva Startup Campus",
    description: "A modern innovation campus with large event halls, breakout spaces, and a makerspace. Designed for the hi-tech community with gigabit internet, 3D printers on-site, and an outdoor rooftop deck.",
    city: "Tel Aviv", capacity: 200, price_per_hour: 900, price_per_day: 6000,
    amenities: ["Gigabit WiFi", "Makerspace", "3D Printing", "AV System", "Outdoor Deck", "Parking"],
    photos: PHOTO_POOLS.conference,
    event_types: ["Hackathon", "Innovation Summit", "Workshop", "Demo Day"],
    style_tags: ["Tech", "Innovation", "Modern", "Campus"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "07:00", end: "22:00" } },
  },
  {
    title: "Jaffa Flea Market Loft",
    description: "Above the legendary Jaffa flea market, this loft fuses Eclectic antiques with a modern raw finish. Every corner is an Instagram moment — mosaic floors, brass fittings, and a rooftop terrace with the clock tower in frame.",
    city: "Tel Aviv", capacity: 70, price_per_hour: 850, price_per_day: 6000,
    amenities: ["Unique Antique Decor", "Rooftop Access", "Sound System", "WiFi", "Kitchenette", "Disability Access"],
    photos: PHOTO_POOLS.loft,
    event_types: ["Photo Shoot", "Brand Activation", "Art Pop-up", "Corporate Dinner"],
    style_tags: ["Eclectic", "Jaffa", "Unique", "Instagram-Worthy"],
    recurring_pattern: { closed_days: [], open_hours: { start: "09:00", end: "23:00" } },
  },
  {
    title: "Tel Aviv University Innovation Hall",
    description: "The flagship event hall at the Coller School of Management. Lecture-style up to 400, gala-style for 250. Academic gravitas with modern A/V, a video wall, and access to the lush campus grounds.",
    city: "Tel Aviv", capacity: 400, price_per_hour: 2000, price_per_day: 14000,
    amenities: ["Video Wall", "4K Projection", "Academic Setting", "Catering", "Parking", "Campus Access"],
    photos: PHOTO_POOLS.conference,
    event_types: ["Academic Conference", "Corporate Summit", "Gala Dinner", "Award Ceremony"],
    style_tags: ["Academic", "Prestigious", "Large-Scale", "Modern"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "08:00", end: "22:00" } },
  },
  {
    title: "Be'er Sheva Old City Ottoman Courtyard",
    description: "A preserved Ottoman-era courtyard in the heart of the old city. Stone archways, a central fountain, and 100-year-old fig trees. UNESCO listed zone. The most atmospheric venue in the Negev.",
    city: "Be'er Sheva", capacity: 80, price_per_hour: 600, price_per_day: 4200,
    amenities: ["Courtyard", "Heritage Architecture", "Sound System", "Ambient Lighting", "WiFi", "Parking Nearby"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding", "Cultural Event", "Film Shoot", "Corporate Dinner"],
    style_tags: ["Historic", "Courtyard", "Ottoman", "Atmospheric"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "22:00" } },
  },
  {
    title: "Negev Desert Glamping Event Site",
    description: "An extraordinary tented venue in the Negev desert near Be'er Sheva. Luxury Bedouin-style tents with Persian rugs, lanterns, and stargazing decks. A sky full of stars awaits your evening event.",
    city: "Be'er Sheva", capacity: 80, price_per_hour: 800, price_per_day: 5500,
    amenities: ["Generator Power", "Desert Views", "Bedouin Catering", "Bonfire Area", "Stargazing Deck", "Overnight Option"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Desert Retreat", "Team Building", "Wedding", "Adventure Event"],
    style_tags: ["Desert", "Unique", "Glamping", "Stargazing"],
    recurring_pattern: { closed_days: [], open_hours: { start: "12:00", end: "08:00" } },
  },
  {
    title: "Ben-Gurion University Campus Auditorium",
    description: "The main auditorium of Ben-Gurion University in the Negev. 600-seat theater with professional lighting, a full fly tower, and a separate 120-seat black box. Southern Israel's premier performance venue.",
    city: "Be'er Sheva", capacity: 600, price_per_hour: 2200, price_per_day: 16000,
    amenities: ["Full Stage Lighting", "Fly Tower", "Backstage Rooms", "AC", "Accessibility", "Parking"],
    photos: PHOTO_POOLS.conference,
    event_types: ["Concert", "Conference", "Theater Performance", "Award Ceremony"],
    style_tags: ["Academic", "Theater", "Professional", "Large-Scale"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "09:00", end: "23:00" } },
  },
  {
    title: "Arad Arts Center Studio",
    description: "A creative hub in the high-altitude desert town of Arad, known for its incredibly clear air and silence. The studio features a wooden stage, natural lighting from skylights, and a peaceful outdoor sculpture garden.",
    city: "Be'er Sheva", capacity: 60, price_per_hour: 350, price_per_day: 2500,
    amenities: ["Wooden Stage", "Skylight Lighting", "Sound System", "Sculpture Garden", "Kitchen", "Parking"],
    photos: PHOTO_POOLS.studio,
    event_types: ["Art Workshop", "Music Performance", "Wellness Retreat", "Creative Residency"],
    style_tags: ["Desert", "Artistic", "Peaceful", "Unique"],
    recurring_pattern: { closed_days: [0], open_hours: { start: "08:00", end: "21:00" } },
  },
  {
    title: "Red Sea Beachfront Pavilion",
    description: "An open-air pavilion on a private section of the Red Sea. Crystal-clear water laps at the deck, coral reefs are visible below, and Jordan's mountains glow at sunset. Israel's most exotic event setting.",
    city: "Eilat", capacity: 100, price_per_hour: 1400, price_per_day: 10000,
    amenities: ["Beach Access", "Sea Views", "Pavilion Structure", "Catering", "Snorkeling Equipment", "Parking"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Wedding", "Corporate Retreat", "VIP Event", "Outdoor Dinner"],
    style_tags: ["Beach", "Red Sea", "Tropical", "Exotic"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "23:00" } },
  },
  {
    title: "Eilat International Convention Hall",
    description: "Part of the Eilat convention complex adjacent to the luxury hotels. A 1,000-seat plenary hall and 10 breakout rooms. The only conference venue in Israel where delegates swim in the Red Sea at lunch.",
    city: "Eilat", capacity: 1000, price_per_hour: 4000, price_per_day: 30000,
    amenities: ["1000-Seat Hall", "10 Breakout Rooms", "Sea Views", "Hotel Adjacency", "Full Catering", "Exhibition Space"],
    photos: PHOTO_POOLS.conference,
    event_types: ["International Conference", "Trade Show", "Government Summit", "Gala Dinner"],
    style_tags: ["Large-Scale", "International", "Resort", "Prestigious"],
    recurring_pattern: { closed_days: [], open_hours: { start: "07:00", end: "23:00" } },
  },
  {
    title: "Coral Beach Artist Studio",
    description: "A cozy artist studio 5 minutes from Coral Beach nature reserve. Salt-bleached wooden walls, a sleeping loft above the workspace, and a private cactus garden. Hosts artists-in-residence and intimate creative workshops.",
    city: "Eilat", capacity: 15, price_per_hour: 300, price_per_day: 2000,
    amenities: ["Artist's Tools", "Private Garden", "WiFi", "Kitchenette", "Loft Sleeping Area", "Parking"],
    photos: PHOTO_POOLS.studio,
    event_types: ["Art Workshop", "Creative Residency", "Intimate Retreat", "Content Creation"],
    style_tags: ["Artistic", "Intimate", "Desert", "Unique"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "08:00", end: "20:00" } },
  },
  {
    title: "Nazareth Old City Mansion",
    description: "A fully restored 18th-century mansion in Nazareth's Christian Quarter. Hand-carved stone walls, Ottoman mashrabiya screens, and a central courtyard fountain. One of the most unique spaces in the Middle East.",
    city: "Nazareth", capacity: 90, price_per_hour: 900, price_per_day: 6500,
    amenities: ["Courtyard Fountain", "Heritage Decor", "Catering", "WiFi", "AC", "Guided Tours Available"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding", "Cultural Event", "Private Dinner", "Film Location"],
    style_tags: ["Historic", "Mansion", "Cultural", "Unique"],
    recurring_pattern: { closed_days: [], open_hours: { start: "09:00", end: "23:00" } },
  },
  {
    title: "Sea of Galilee Kibbutz Lawn",
    description: "A magnificent event lawn on a Galilee kibbutz with a direct view over the Sea of Galilee. Natural grass, towering palm trees, and a purpose-built stone stage. Spectacular for outdoor weddings and concerts.",
    city: "Nazareth", capacity: 300, price_per_hour: 1200, price_per_day: 8500,
    amenities: ["Stage", "Sound System", "Lake Views", "Catering", "Parking", "Overnight Accommodation Options"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Wedding", "Outdoor Concert", "Corporate Retreat", "Religious Celebration"],
    style_tags: ["Lakeside", "Outdoor", "Kibbutz", "Scenic"],
    recurring_pattern: { closed_days: [], open_hours: { start: "10:00", end: "22:00" } },
  },
  {
    title: "Acre (Akko) Crusader Vault",
    description: "An actual Crusader-era vault in the heart of old Acre, a UNESCO World Heritage Site. 900-year-old stone walls, barrel-vaulted ceilings, and torchlit atmosphere. The most historically significant event venue in Israel.",
    city: "Haifa", capacity: 50, price_per_hour: 1200, price_per_day: 8800,
    amenities: ["Historic Architecture", "Atmospheric Lighting", "Sound System", "WiFi", "Catering Access", "Tour Guide Available"],
    photos: PHOTO_POOLS.loft,
    event_types: ["Film Location", "Unique Event", "Cultural Dinner", "Wedding"],
    style_tags: ["Historic", "Crusader", "Unique", "UNESCO"],
    recurring_pattern: { closed_days: [0], open_hours: { start: "09:00", end: "22:00" } },
  },
  {
    title: "Golan Heights Winery & Event Barn",
    description: "A majestic event barn on the Golan Heights plateau surrounded by vineyards with views of Mount Hermon. Stone and timber construction with a vaulted ceiling, tasting room, and a vast outdoor deck.",
    city: "Nazareth", capacity: 160, price_per_hour: 1300, price_per_day: 9000,
    amenities: ["Mountain Views", "Winery Access", "Rustic Barn", "Outdoor Deck", "Catering", "Parking"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding", "Corporate Retreat", "Harvest Festival", "Private Dinner"],
    style_tags: ["Winery", "Rustic", "Mountains", "Scenic"],
    recurring_pattern: { closed_days: [6], open_hours: { start: "10:00", end: "22:00" } },
  },
  {
    title: "Tel Aviv Submarine Museum Event Deck",
    description: "An extraordinary outdoor event space next to a decommissioned submarine in the Tel Aviv port. The sub is visible from the deck — a truly unforgettable conversation starter for any corporate event.",
    city: "Tel Aviv", capacity: 200, price_per_hour: 1500, price_per_day: 10500,
    amenities: ["Submarine View", "Sea Breeze", "Catering", "PA System", "Parking", "Security"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["Corporate Party", "Product Launch", "Team Building", "Unique Event"],
    style_tags: ["Unique", "Port", "Industrial", "Memorable"],
    recurring_pattern: { closed_days: [1], open_hours: { start: "10:00", end: "23:00" } },
  },
  {
    title: "Jerusalem Hotel Ballroom",
    description: "The grand ballroom of one of Jerusalem's most beloved boutique hotels. Art deco chandeliers, parquet floors, and rich drapes create an old-world elegance. Hotel room block available for overnight guests.",
    city: "Jerusalem", capacity: 180, price_per_hour: 1700, price_per_day: 12500,
    amenities: ["Chandeliers", "Hotel Services", "Catering", "Bridal Suite", "Valet Parking", "AV System"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Wedding", "Gala", "Bar/Bat Mitzvah", "Corporate Gala"],
    style_tags: ["Ballroom", "Luxury", "Art Deco", "Hotel"],
    recurring_pattern: { closed_days: [], open_hours: { start: "10:00", end: "03:00" } },
  },
  {
    title: "Tel Aviv Surfer Hostel Rooftop Bar",
    description: "A trendy rooftop bar space above a boutique surfer hostel in central Tel Aviv. Low-slung furniture, tropical plants, and a biombo of climbing vines. The vibe is effortlessly cool and deliberately unpretentious.",
    city: "Tel Aviv", capacity: 45, price_per_hour: 550, price_per_day: null,
    amenities: ["Bar Setup", "Sound System", "Tropical Decor", "WiFi", "Street Parking"],
    photos: PHOTO_POOLS.rooftop,
    event_types: ["Private Party", "Brand Activation", "Photo Shoot", "Social Event"],
    style_tags: ["Trendy", "Rooftop", "Casual", "Cool"],
    recurring_pattern: { closed_days: [], open_hours: { start: "14:00", end: "02:00" } },
  },
  {
    title: "Herzliya Hi-Tech Campus Outdoor Amphitheater",
    description: "An outdoor amphitheater within a Herzliya Pituah hi-tech campus. Terraced stone seating for 300, a professional stage, and direct sightline to the Mediterranean horizon. Popular for product launches under the stars.",
    city: "Herzliya", capacity: 300, price_per_hour: 1600, price_per_day: 11500,
    amenities: ["Stage", "Professional PA", "Stage Lighting", "Parking", "Green Room", "Catering"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Outdoor Concert", "Product Launch", "Corporate Party", "Tech Event"],
    style_tags: ["Amphitheater", "Outdoor", "Tech", "Prestigious"],
    recurring_pattern: { closed_days: [], open_hours: { start: "09:00", end: "23:00" } },
  },
  {
    title: "Ramat Gan Safari Park Event Lawn",
    description: "Host your event at Africa in the Middle East. An exclusive lawn adjacent to the open safari can be rented for evening events — giraffes and zebras are your backdrop. The ultimate conversation piece.",
    city: "Ramat Gan", capacity: 250, price_per_hour: 3000, price_per_day: 22000,
    amenities: ["Safari Views", "Catering", "Lighting", "Exclusive Access", "Parking", "Animal Show Option"],
    photos: PHOTO_POOLS.garden,
    event_types: ["Corporate Gala", "Brand Activation", "Wedding", "VIP Event"],
    style_tags: ["Unique", "Safari", "Outdoor", "Unforgettable"],
    recurring_pattern: { closed_days: [0, 1], open_hours: { start: "18:00", end: "23:00" } },
  },
  {
    title: "Dead Sea Spa Resort Event Hall",
    description: "A resort event hall on the shores of the Dead Sea at 430m below sea level — the lowest point on Earth. Natural wood architecture, salt crystal chandeliers, and floor-to-ceiling views of the Dead Sea mineral waters.",
    city: "Jerusalem", capacity: 220, price_per_hour: 2200, price_per_day: 16000,
    amenities: ["Dead Sea Views", "Spa Access", "Catering", "Hotel Rooms", "Parking", "Unique Location Certificate"],
    photos: PHOTO_POOLS.villa,
    event_types: ["Corporate Retreat", "Wedding", "Conference", "Wellness Event"],
    style_tags: ["Unique", "Luxury", "Dead Sea", "Resort"],
    recurring_pattern: { closed_days: [], open_hours: { start: "08:00", end: "23:00" } },
  },
  {
    title: "Tel Aviv Street Art Warehouse",
    description: "A warehouse turned gallery with walls covered floor-to-ceiling in commissioned street art by Israel's top urban artists. Blacklight installations, graffiti workshops, and a raw concrete interior. For brands who mean it.",
    city: "Tel Aviv", capacity: 250, price_per_hour: 1100, price_per_day: 7800,
    amenities: ["Blacklight Art", "Sound System", "DJ Booth", "WiFi", "Loading Bay", "Security"],
    photos: PHOTO_POOLS.warehouse,
    event_types: ["Brand Activation", "Art Event", "Corporate Party", "Music Event"],
    style_tags: ["Urban", "Street Art", "Raw", "Creative"],
    recurring_pattern: { closed_days: [], open_hours: { start: "10:00", end: "03:00" } },
  },
];

// ─── Helper: offset lat/lng slightly for realism ────────────────────────────
function jitter(base: number, range = 0.025): number {
  return parseFloat((base + (Math.random() - 0.5) * 2 * range).toFixed(6));
}

// ─── Build Full Venue Objects ────────────────────────────────────────────────
function buildVenues(): VenueSeed[] {
  return VENUE_TEMPLATES.map((t) => {
    const cityData = CITIES.find((c) => c.name === t.city) ?? CITIES[0];
    const streetNumbers = ["12", "34A", "7", "55", "89", "101", "22B", "3", "47", "66"];
    const streetNames = [
      "Rothschild Blvd", "Allenby St", "Ben Gurion Ave", "Dizengoff St",
      "Ibn Gabirol St", "Herzl St", "HaYarkon St", "King David St",
      "Jaffa Rd", "Carmel St",
    ];
    const rnd = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    return {
      ...t,
      lat: jitter(cityData.lat),
      lng: jitter(cityData.lng),
      address: `${rnd(streetNumbers)} ${rnd(streetNames)}, ${t.city}`,
    };
  });
}

// ─── Seed Function ───────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱  VenueCharm Venue Seeder");
  console.log("════════════════════════════════════════");

  // 1. Ensure a seed host user exists
  console.log("👤  Ensuring seed host user...");
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", "seed-host@venuecharm.dev")
    .single();

  let hostId: string;

  if (existingUser) {
    hostId = existingUser.id;
    console.log(`    ✓  Reusing existing host: ${hostId}`);
  } else {
    // Create a placeholder host (in real dev, use Supabase Auth to register)
    const { data: newUser, error: userErr } = await supabase
      .from("users")
      .insert({
        email: "seed-host@venuecharm.dev",
        first_name: "Seed",
        last_name: "Host",
        role: "HOST",
        is_verified: true,
      })
      .select("id")
      .single();

    if (userErr) {
      console.error("❌  Failed to create seed user:", userErr.message);
      process.exit(1);
    }
    hostId = newUser!.id;
    console.log(`    ✓  Created seed host: ${hostId}`);
  }

  // 2. Wipe existing seed venues (idempotent re-runs)
  console.log("\n🗑️   Clearing previous seed venues...");
  const { error: deleteErr } = await supabase
    .from("venues")
    .delete()
    .eq("host_id", hostId);

  if (deleteErr) console.warn("    ⚠️  Could not clear old venues:", deleteErr.message);
  else console.log("    ✓  Cleared previous seed data");

  // 3. Build and insert venues
  const venues = buildVenues();
  console.log(`\n📍  Inserting ${venues.length} venues...\n`);

  let success = 0;
  let failed = 0;

  for (const venue of venues) {
    // PostGIS point must be inserted via raw SQL function
    // Supabase JS client supports calling rpc or passing raw geo strings
    const geoString = `SRID=4326;POINT(${venue.lng} ${venue.lat})`;

    const { error } = await supabase.from("venues").insert({
      host_id: hostId,
      title: venue.title,
      description: venue.description,
      address: venue.address,
      city: venue.city,
      location: geoString,   // Supabase PostGIS accepts WKT with SRID prefix
      capacity: venue.capacity,
      price_per_hour: venue.price_per_hour,
      price_per_day: venue.price_per_day,
      amenities: venue.amenities,
      photos: venue.photos,
      status: "ACTIVE",
      recurring_pattern: {
        ...venue.recurring_pattern,
        event_types: venue.event_types,
        style_tags: venue.style_tags,
      },
    });

    if (error) {
      console.error(`  ❌  ${venue.title}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✅  ${venue.title} (${venue.city})`);
      success++;
    }
  }

  // 4. Summary
  console.log("\n════════════════════════════════════════");
  console.log(`✅  Seeded: ${success}/${venues.length} venues`);
  if (failed > 0) console.log(`❌  Failed: ${failed} venues`);
  console.log("\nNext steps:");
  console.log("  1. Open Supabase Table Editor → venues to verify data");
  console.log("  2. Run: npx ts-node scripts/seed-availability.ts");
  console.log("  3. Run: npx ts-node scripts/verify-seed.ts");
  console.log("════════════════════════════════════════\n");
}

seed().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
