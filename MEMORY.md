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

### PostGIS geography: WKT insert DOES work via admin client
**Pattern:** When inserting directly via `createAdminClient().from('venues').insert({...})`, PostgREST accepts WKT strings for geography columns:
```ts
location: 'SRID=4326;POINT(34.7818 32.0853)' // POINT(longitude latitude)
```
The SRID prefix is required. Note longitude comes first in WKT, not latitude. Used by `adminSeedVenues()` in `src/actions/admin.ts`.

### Admin panel must use `createAdminClient()` for ALL queries, not just writes
**Problem:** The default Supabase client respects RLS. The `"Venues: public read"` policy restricts `SELECT` to `status = 'ACTIVE'`. Admin users are not hosts, so `"Venues: host manage"` doesn't cover them either. An admin using `createClient()` sees 0 PENDING_APPROVAL venues — they simply don't appear (no error, just empty results).
**Fix:** All admin page queries (including plain SELECTs) must use `createAdminClient()` (service role). Only the auth check (`requireAdmin()`) should use the regular client to verify the session.

### RLS INSERT policy was missing for bookings and payments
**Problem:** The initial schema (migration 001) only had SELECT policies for bookings/payments. Any attempt to insert a booking row from an authenticated user would fail silently with a 403.
**Fix:** Migration 004 adds `Bookings: renter insert` and `Payments: renter insert` policies. Must be applied.

### Availability table had no RLS at all
**Problem:** `availability` table had `ENABLE ROW LEVEL SECURITY` missing. The host calendar would silently fail to write.
**Fix:** Migration 004 adds `ALTER TABLE availability ENABLE ROW LEVEL SECURITY` and appropriate policies.

### `notes` column didn't exist until migration 004
**Problem:** `requestBooking` action tries to insert `notes` into bookings, but the column was added in migration 004. If 004 hasn't been applied, the insert fails with "column notes does not exist".
**Fix:** Apply migration 004. Until then, you can remove `notes: notes || null` from the insert in `src/actions/bookings.ts` as a quick workaround.

### Supabase SQL Editor runs migrations as a single transaction — rollback wipes everything
**Problem:** Migration 005 included a `CREATE TYPE cancellation_policy` followed by a `CREATE OR REPLACE FUNCTION` that used the type. When the function statement failed (wrong overload signature), the entire transaction rolled back — including the `CREATE TYPE`. Re-running showed `ERROR: type cancellation_policy does not exist` because the type was rolled back too.
**Fix:** Fix ALL errors in the migration file before running. Re-run the entire migration from scratch — don't try to apply partial sections separately in the SQL Editor; it all executes as one transaction.

### `CREATE OR REPLACE FUNCTION` with a new parameter creates an overload, not a replacement
**Problem:** Migration 005 added a new `p_cancellation_policy` parameter to `create_venue_listing()`. Using `CREATE OR REPLACE FUNCTION create_venue_listing(TEXT, TEXT, TEXT, TEXT, INTEGER, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC, cancellation_policy)` creates a *new overload* alongside the old 9-param version. Supabase then throws `ERROR 42725: function name "create_venue_listing" is not unique` on any call without a type cast.
**Fix:** Always `DROP FUNCTION IF EXISTS create_venue_listing(TEXT, TEXT, TEXT, TEXT, INTEGER, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, NUMERIC)` (listing the old signature) before `CREATE OR REPLACE`. Also: `GRANT EXECUTE ... TO authenticated` does NOT need argument types in the `GRANT` statement.

### Migration 004 `policy already exists` error after partial apply
**Problem:** Running migration 004 a second time fails with `ERROR 42710: policy already exists` because some policies were already applied from a previous partial run.
**Fix:** Prefix every `CREATE POLICY` in the migration with `DROP POLICY IF EXISTS "policy name" ON table_name;` to make the migration idempotent.

---

## Stripe / Payments

### `reverse_transfer` only works when a transfer actually exists
**Problem:** Old bookings created before Stripe Connect was set up have no associated transfer. Calling `stripe.refunds.create({ reverse_transfer: true })` on them throws "Cannot reverse transfer on charge because it does not have an associated transfer".
**Fix:** Check `payment.stripe_transfer_id` before adding `reverse_transfer` and `refund_application_fee` to the refund params:
```ts
const refundParams: Stripe.RefundCreateParams = {
  payment_intent: payment.stripe_payment_intent_id,
  amount: refundAmountAgorot,
}
if (payment.stripe_transfer_id) {
  refundParams.refund_application_fee = true
  refundParams.reverse_transfer = true
}
const refund = await stripe.refunds.create(refundParams)
```

### `Stripe.RefundCreateParams` — use the imported type, not `Parameters<>`
**Problem:** `Parameters<typeof stripe.refunds.create>[0]` resolves to `RequestOptions` (the wrong overload of the SDK's overloaded function signature), not `RefundCreateParams`.
**Fix:** `import Stripe from 'stripe'` and type the variable as `Stripe.RefundCreateParams` explicitly.

### Stripe account country — Israel not supported
**Problem:** Stripe doesn't list Israel as a supported country for account creation.
**Fix for dev/academic:** Select "United States" when creating the Stripe account. Use only test mode keys (`sk_test_`, `pk_test_`). No real money is processed, so country is irrelevant. ILS currency works in test mode.

### `updateVenue` does not update the PostGIS location column
**Known limitation:** The edit form accepts new lat/lng but the `updateVenue` server action skips the geography column update (no RPC for it). The location stays as the original. Fix requires a new SQL function or raw SQL via admin client. Tracked as GitHub #35.

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

### Sign-out form 404 — must create the route handler
**Problem:** The sign-out `<form action="/api/auth/signout">` returned 404 because the route didn't exist.
**Fix:** Created `src/app/api/auth/signout/route.ts` as a POST handler: `await supabase.auth.signOut()` then `redirect('/')`.

---

## Auth / OAuth

### Google OAuth users had no `public.users` row
**Problem:** The OAuth callback (`/api/auth/callback`) only exchanged the code for a session but never inserted into `public.users`. The app would crash when trying to read `users.role`.
**Fix:** Updated callback to upsert with `ignoreDuplicates: true`:
```ts
await supabase.from('users').upsert({
  id: user.id,
  email: user.email,
  role: pendingRole ?? 'RENTER',
  ...
}, { onConflict: 'id', ignoreDuplicates: true })
```

### Pending role cookie must be short-lived and httpOnly
**Pattern:** `signUpWithGoogle(role)` sets `venuecharm-pending-role` cookie with `maxAge: 300` (5 minutes), `httpOnly: true`, `sameSite: 'lax'`. The callback reads and deletes it. This survives the Google OAuth redirect without exposing the value to client JS.

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

## Google Maps / Maps API

### `window.google` is possibly `undefined` (TS18048)
**Problem:** After checking `if (!window.google?.maps) return`, TypeScript still complains about `window.google` being possibly undefined inside the block.
**Fix:** Assign to a local variable with non-null assertion:
```ts
const googleMaps = window.google!.maps
// use googleMaps.Marker, googleMaps.LatLngBounds, etc.
```

### `AdvancedMarkerElement` requires `mapId` and `libraries=marker`
**Problem:** `AdvancedMarkerElement` is undefined at runtime — `google.maps.marker` doesn't exist. Regular `Marker` works but has no DOM element for price bubbles.
**Fix:** Load the Maps script with `&libraries=marker` in the URL. Pass `mapId: 'DEMO_MAP_ID'` (Google's test ID) in map options. `DEMO_MAP_ID` is a real Google-provided string for development — no custom map style required.

### SVG data URL markers silently invisible
**Problem:** Creating price bubble markers via SVG data URL (`data:image/svg+xml,...`) and using `filter="url(#shadow)"` inside the SVG causes invisible markers. The local URL fragment `#shadow` doesn't resolve when the SVG is used as an external image source.
**Fix:** Use `AdvancedMarkerElement` with a real DOM `<div>` element. Style the price bubble with inline CSS. No SVG encoding needed.

### `AdvancedMarkerElement` fires `gmp-click`, not `click`
**Pattern:** `marker.addListener('click', ...)` does NOT fire for AdvancedMarkerElement. Use `marker.addListener('gmp-click', ...)` instead.

---

## Venue Search

### Default page load showed no map markers (before fix)
**Problem:** When `/venues` loaded with no query and no coords, the city-ilike fallback was used. Every venue got `distance_km: null` and `lat: null`. The map had no pins to render.
**Fix:** Always use the PostGIS `search_venues_nearby` RPC with Israel center (31.5, 34.85) and 500 km radius as the no-query default. Every venue then gets real lat/lng from the DB geography column.

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
