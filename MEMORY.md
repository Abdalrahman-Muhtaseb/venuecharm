# VenueCharm — Bug Fixes, Quirks & Tricky Logic

_Solved issues to avoid re-discovering in future sessions._

---

## Database / Supabase

### Supabase JS `.in()` does not accept subqueries
**Problem:** `supabase.from('bookings').select('*').in('venue_id', supabase.from('venues').select('id').eq('host_id', userId))` — this throws a TypeScript error and doesn't work at runtime.
**Fix:** Always fetch the IDs first, then pass as an array:
```ts
const { data: venues } = await supabase.from('venues').select('id').eq('host_id', userId)
const ids = (venues ?? []).map(v => v.id)
await supabase.from('bookings').select('*').in('venue_id', ids)
```

### Supabase join returns array OR object — must handle both
**Problem:** When selecting `venues(title)` on a bookings query, Supabase returns `venues` as `{ title: string }[]` (array) in the TS inferred type, even though it's logically a to-one relationship.
**Fix:**
```ts
const title = Array.isArray(booking.venues) ? booking.venues[0]?.title : booking.venues?.title
```
Or cast: `const v = booking.venues as unknown as { title: string } | { title: string }[]`

### PostGIS geography column cannot be updated via Supabase JS `.update()`
**Problem:** The `location` column is `GEOGRAPHY(POINT, 4326)`. Supabase JS `.update({ location: 'POINT(35 31)' })` does not work — the column requires a PostGIS-specific format.
**Fix:** Venue creation uses the `create_venue_listing()` RPC (migration 002) which calls `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`. The `updateVenue` action currently does NOT update the location — it leaves the original coordinates. A future fix would require a separate RPC or raw SQL.

### RLS INSERT policy was missing for bookings and payments
**Problem:** The initial schema (migration 001) only had SELECT policies for bookings/payments. Any attempt to insert a booking row from an authenticated user would fail silently with a 403.
**Fix:** Migration 004 adds `Bookings: renter insert` and `Payments: renter insert` policies. Must be applied.

### Availability table had no RLS at all
**Problem:** `availability` table had `ENABLE ROW LEVEL SECURITY` missing. The host calendar would silently fail to write.
**Fix:** Migration 004 adds `ALTER TABLE availability ENABLE ROW LEVEL SECURITY` and appropriate policies.

### `notes` column didn't exist until migration 004
**Problem:** `requestBooking` action tries to insert `notes` into bookings, but the column was added in migration 004. If 004 hasn't been applied, the insert fails with "column notes does not exist".
**Fix:** Apply migration 004. Until then, you can remove `notes: notes || null` from the insert in `src/actions/bookings.ts` as a quick workaround.

---

## Next.js App Router

### Route conflict: `src/app/dashboard/page.tsx` + `src/app/(host)/dashboard/page.tsx`
**Problem:** Both resolve to URL `/dashboard`. Next.js throws a build error.
**Fix:** Deleted `src/app/dashboard/page.tsx`. The `(host)/dashboard/page.tsx` now owns `/dashboard`. Non-HOST users are redirected by `(host)/layout.tsx` to `/profile`.

### Stale `.next/types` after deleting a page
**Problem:** After deleting `src/app/dashboard/page.tsx`, TypeScript kept reporting errors about the deleted file from `.next/types/app/dashboard/page.ts`.
**Fix:** `rm -rf .next/types` then re-run `npx tsc --noEmit`.

### Server action `redirect()` throws in client component catch blocks
**Problem:** When calling a server action from a client component with `useTransition`, the `redirect()` inside the server action throws a special `NEXT_REDIRECT` error. A naive `catch (err) { toast.error(...) }` catches it and breaks the redirect.
**Fix:** Re-throw redirect errors in the catch block:
```ts
catch (err: unknown) {
  const msg = err instanceof Error ? err.message : ''
  if (msg.includes('NEXT_REDIRECT')) throw err
  toast.error(msg || 'Something went wrong')
}
```

---

## shadcn / UI

### shadcn `violet` base color doesn't exist in registry
**Problem:** `npx shadcn@latest add ... ` with `"baseColor": "violet"` in `components.json` fails with "item not found at registry".
**Fix:** Use `"baseColor": "slate"` in `components.json`. The violet brand color is defined manually in `globals.css` as `--primary: 262.1 83.3% 57.8%` — shadcn components use `hsl(var(--primary))` which picks this up automatically.

### `class-variance-authority` and `tailwindcss-animate` not auto-installed by shadcn
**Problem:** After `npx shadcn@latest add ...`, TypeScript reported "Cannot find module 'class-variance-authority'". `tailwindcss-animate` also needs manual install.
**Fix:** `npm install class-variance-authority tailwindcss-animate`

### `DayModifiers` renamed to `Modifiers` in react-day-picker
**Problem:** `import type { DayModifiers } from 'react-day-picker'` fails — the type was renamed.
**Fix:** `import type { Modifiers } from 'react-day-picker'`

---

## Google Maps / TypeScript

### `window.google` is possibly `undefined` (TS18048)
**Problem:** After checking `if (!window.google?.maps) return`, TypeScript still complains about `window.google` being possibly undefined inside the block.
**Fix:** Assign to a local variable with non-null assertion:
```ts
const googleMaps = window.google!.maps
// use googleMaps.Marker, googleMaps.LatLngBounds, etc.
```

---

## Venue Search

### Search limit was capped at 24, hiding most venues
**Problem:** 52 venues in DB but only 24 shown. The limit was hardcoded in 3 places: `venues/page.tsx`, `/api/venues/search/route.ts` (×2), and the `search_venues_nearby` SQL function default.
**Fix:** All changed to 100. Also update the SQL function in Supabase SQL Editor (DEFAULT 24 → DEFAULT 100).

### Sort by distance is a no-op without Google Maps configured
**Explanation:** "Distance" sort only works when the `search_venues_nearby` PostGIS RPC is used (requires lat/lng from geocoding). Without a Google Maps API key, the search falls back to city-ilike which returns `distance_km: null` for all venues. Distance sort then treats all as equal (9999km) — results come back in `created_at DESC` order instead.

---

## Next.config

### Two conflicting next.config files
**Problem:** Both `next.config.js` and `next.config.mjs` existed with different image remote patterns.
**Fix:** Deleted `next.config.js`, merged all `remotePatterns` into `next.config.mjs`.

---

## Stripe

### Stripe account country — Israel not supported
**Problem:** Stripe doesn't list Israel as a supported country for account creation.
**Fix for dev/academic:** Select "United States" when creating the Stripe account. Use only test mode keys (`sk_test_`, `pk_test_`). No real money is processed, so country is irrelevant. ILS currency works in test mode.

### `updateVenue` does not update the PostGIS location column
**Known limitation:** The edit form accepts new lat/lng but the `updateVenue` server action skips the geography column update (no RPC for it). The location stays as the original. Fix requires a new SQL function or raw SQL via admin client.
