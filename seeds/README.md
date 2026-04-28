# VenueCharm — Seed Scripts

Three ways to seed your database, from fastest to most flexible.

## Files

```
scripts/
  seed-venues.ts        ← Inserts 50 venues via Supabase JS client
  seed-availability.ts  ← Adds random blocked dates for each venue
  verify-seed.ts        ← Runs sanity checks on seeded data

supabase/seeds/
  venues.sql            ← Pure SQL alternative (paste into SQL Editor)
  postgis_functions.sql ← Required RPC functions for geospatial queries
```

---

## Option A — TypeScript Scripts (Recommended)

### 1. Copy into your project

```bash
cp scripts/seed-venues.ts       your-project/scripts/
cp scripts/seed-availability.ts your-project/scripts/
cp scripts/verify-seed.ts       your-project/scripts/
```

### 2. Install dependencies (if not already in your project)

```bash
npm install @supabase/supabase-js typescript ts-node @types/node
```

### 3. Set environment variables

```bash
# Make sure these are set in .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run in order

```bash
# Load env vars then run each script
npx dotenv -e .env.local -- npx ts-node scripts/seed-venues.ts
npx dotenv -e .env.local -- npx ts-node scripts/seed-availability.ts
npx dotenv -e .env.local -- npx ts-node scripts/verify-seed.ts
```

Or add these to your `package.json`:

```json
"scripts": {
  "seed": "dotenv -e .env.local -- ts-node scripts/seed-venues.ts",
  "seed:availability": "dotenv -e .env.local -- ts-node scripts/seed-availability.ts",
  "seed:verify": "dotenv -e .env.local -- ts-node scripts/verify-seed.ts",
  "seed:all": "npm run seed && npm run seed:availability && npm run seed:verify"
}
```

Then just: `npm run seed:all`

---

## Option B — Pure SQL (Quickest)

1. Open **Supabase Dashboard → SQL Editor → New Query**
2. Paste the contents of `supabase/seeds/venues.sql`
3. Click **Run**
4. Then paste and run `supabase/seeds/postgis_functions.sql`

---

## Option C — Supabase CLI

```bash
# From your project root
supabase db execute --file supabase/seeds/venues.sql
supabase db execute --file supabase/seeds/postgis_functions.sql
```

---

## PostGIS Functions (Required)

After seeding venues, run `postgis_functions.sql` once. This creates two Postgres functions callable from your Next.js app:

```typescript
// In your API route — search venues near a location
const { data } = await supabase.rpc('search_venues', {
  lat: 32.0853,
  lng: 34.7818,
  radius_km: 10,
  event_date: '2026-06-15',
  min_capacity: 50,
  max_price_hr: 1200,
  required_amenities: ['WiFi', 'Parking'],
})

// Simple radius-only query
const { data } = await supabase.rpc('venues_within_radius', {
  lat: 32.0853,
  lng: 34.7818,
  radius_km: 5,
})
```

---

## What Gets Seeded

| Metric | Value |
|---|---|
| Total venues | 50 |
| Cities covered | Tel Aviv, Jerusalem, Haifa, Be'er Sheva, Eilat, Nazareth, Herzliya, Netanya, Ramat Gan, Rishon LeZion |
| Price range | ₪300/hr – ₪4,000/hr |
| Capacity range | 15 – 1,000 guests |
| Photos per venue | 5 (Unsplash URLs) |
| Venue types | Rooftop, Loft, Studio, Garden, Conference Hall, Villa, Gallery, Warehouse, Amphitheater |
| Amenities variety | 30+ unique amenities |
| Availability blocks | 4–10 random blocked date ranges per venue |

---

## Re-Running (Idempotent)

The TypeScript script deletes existing seed venues before inserting fresh ones, so it's safe to re-run:

```bash
npm run seed:all   # Wipes old seed data, inserts fresh 50 venues
```

The SQL file uses `ON CONFLICT DO UPDATE` on the host user, but you'll need to manually delete venues before re-running the INSERT block.
