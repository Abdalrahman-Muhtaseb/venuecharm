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
**Fix:** Created `update_venue_location(p_venue_id UUID, p_latitude FLOAT8, p_longitude FLOAT8)` RPC (migration 007). Call it via `supabase.rpc('update_venue_location', { ... })` immediately after the regular `.update()` in `updateVenue`. Venue creation still uses `create_venue_listing()` RPC which handles it inline.

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

### Reviews RLS INSERT policy must cover CONFIRMED+past bookings (not just COMPLETED)
**Problem:** Bookings stay in `CONFIRMED` status until the pg_cron job runs (every 5 min). An RLS INSERT policy that only checks `status = 'COMPLETED'` blocks all review submissions for the ≤5-min window after a booking ends. In practice, if pg_cron hasn't been applied yet, ALL reviews are blocked.
**Fix:** The INSERT policy also allows `b.status = 'CONFIRMED' AND b.end_at < NOW()`. Both migration 008 (initial) and 009 (fix) are required. The server action `submitReview` mirrors this logic in code as a belt-and-suspenders check.

### pg_cron for booking status: extension must be enabled in Supabase dashboard first
**Pattern:** Migration 010 schedules `cron.schedule(...)`. This fails with `ERROR: schema "cron" does not exist` if the pg_cron extension isn't enabled.
**Fix:** In Supabase dashboard → Database → Extensions → search "pg_cron" → Enable. Then run migration 010. The cron job runs `*/5 * * * *` and flips CONFIRMED bookings to COMPLETED when `end_at < NOW()`.

### Reviews + users join requires `createAdminClient()`
**Problem:** The venue detail page (`/venues/[id]`) needs reviewer names (first_name, last_name from `users` table). Using the regular `createClient()` for the join fails because the `users` table has RLS — the anon/public role cannot SELECT other users' data.
**Fix:** Use `createAdminClient().from('reviews').select('id, rating, comment, created_at, users(first_name, last_name)')` only for the reviews+users join. All other venue page queries keep using the regular client. This is safe because the query is read-only and runs server-side only.

### `avg_rating` on venue objects: use `buildRatingsMap()` — never join inline
**Pattern:** Supabase JS cannot aggregate ratings in a single query with Supabase JS (no `AVG()` in the select builder). The pattern used throughout the app: 1) fetch `venue_id, rating` from `reviews` for a list of IDs, 2) call `buildRatingsMap(rows)` from `src/lib/ratings.ts`, 3) merge `avg_rating` + `review_count` onto venue objects. This is done in 3 places: `src/app/page.tsx`, `src/app/venues/page.tsx`, and `src/app/api/venues/search/route.ts`.

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

### react-day-picker v9: `onDayClick` removed — use `mode="multiple"` + `onSelect`
**Problem:** `onDayClick` was removed in react-day-picker v9 (which is what shadcn's Calendar uses). Trying to use it causes a TypeScript error ("no property onDayClick") and does nothing at runtime.
**Fix:** Use `mode="multiple"` with the `selected` prop (array of Date objects) and `onSelect` callback. `onSelect` receives the full new selection array after every click. Diff `old` vs `new` sets to find what was added/removed in a single click.

### `DayModifiers` renamed to `Modifiers` in react-day-picker
**Problem:** `import type { DayModifiers } from 'react-day-picker'` fails — the type was renamed.
**Fix:** `import type { Modifiers } from 'react-day-picker'`

---

## Google Maps / Maps API

### Scroll-to-zoom without Ctrl key: `gestureHandling: 'greedy'`
**Pattern:** By default, Google Maps requires Ctrl+scroll to zoom (to avoid hijacking page scroll). Setting `gestureHandling: 'greedy'` in map options makes scroll-to-zoom work without Ctrl AND prevents page scroll when the mouse is over the map — better UX for embedded maps. Apply in the `new googleMaps.Map(el, { ..., gestureHandling: 'greedy' })` options object.

### Places API must be enabled separately from Maps JS API
**Problem:** `google.maps.places.Autocomplete` throws `InvalidValueError` or simply doesn't load even when the Maps JS API key is valid. The Maps JS API and Places API are separate products in Google Cloud Console.
**Fix:** Enable "Places API" in Cloud Console (same project as the existing key). Also add `libraries=places` to the script URL. Without both, no autocomplete dropdown appears — and no error is shown to the user.

### `libraries=marker,places` — load both together on pages that need both
**Pattern:** `MapView.tsx` needs `AdvancedMarkerElement` (`libraries=marker`) AND Places Autocomplete (`libraries=places`). Both must be listed in the script src: `&libraries=marker,places`. The Google Maps script is loaded once per page — if two components on the same page need different libraries, they must be combined in one script tag.

### Places Autocomplete timing: poll for availability after async script load
**Problem:** `SearchBarAutocomplete` mounts in the sticky navbar before `MapView` loads the Google Maps script asynchronously. `window.google?.maps?.places?.Autocomplete` is undefined when the component first renders.
**Fix:** Poll with `setInterval(tryAttach, 200)` and clear the interval once `tryAttach()` succeeds. This avoids needing a ref or global callback — it just retries until the Places library is ready.

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

### `search_venues_nearby` return type: DROP FUNCTION required before changing
**Problem:** When migration 006 tried to add `lat` and `lng` columns to the function's `RETURNS TABLE`, PostgreSQL threw `ERROR: 42P13: cannot change return type of existing function`.
**Fix:** Always precede a `CREATE OR REPLACE FUNCTION` with `DROP FUNCTION IF EXISTS function_name(arg_types...)` (listing the exact argument types) when changing the `RETURNS TABLE` signature. `CREATE OR REPLACE` is limited to body/options changes only — the return type is immutable without a drop.

### Default page load showed no map markers (before fix)
**Problem:** When `/venues` loaded with no query and no coords, the city-ilike fallback was used. Every venue got `distance_km: null` and `lat: null`. The map had no pins to render.
**Fix:** Always use the PostGIS `search_venues_nearby` RPC with Israel center (31.5, 34.85) and 500 km radius as the no-query default. Every venue then gets real lat/lng from the DB geography column.

### Search limit was capped at 24, hiding most venues
**Problem:** 52 venues in DB but only 24 shown. The limit was hardcoded in 3 places: `venues/page.tsx`, `/api/venues/search/route.ts` (×2), and the `search_venues_nearby` SQL function default.
**Fix:** All changed to 100. Also update the SQL function in Supabase SQL Editor (DEFAULT 24 → DEFAULT 100).

### Sort by distance is a no-op without Google Maps configured
**Explanation:** "Distance" sort only works when the `search_venues_nearby` PostGIS RPC is used (requires lat/lng from geocoding). Without a Google Maps API key, the search falls back to city-ilike which returns `distance_km: null` for all venues. Distance sort then treats all as equal (9999km) — results come back in `created_at DESC` order instead.

---

## Search / Pagination

### Persistent navbar with `useSearchParams` requires Suspense and manual state sync
**Problem:** `SearchBarAutocomplete` moved into `PublicNavbar` (persistent across navigations). Because it uses `useSearchParams()`, it needs a `<Suspense>` boundary — otherwise Next.js throws a hydration error. Also, since the component doesn't remount on navigation (unlike page-level components), local state (`q`, `capacity`, `date`) gets stale after a new search executes.
**Fix:** Wrap the `SearchRow` sub-component in `<Suspense>` with an animated skeleton fallback. Add three `useEffect` hooks that sync local state from the URL params whenever they change:
```ts
useEffect(() => { setQ(urlQ) }, [urlQ])
useEffect(() => { setCapacity(urlCapacity) }, [urlCapacity])
useEffect(() => { setDate(urlDate) }, [urlDate])
```

### `useSearchParams()` inside a client component used in a persistent layout must be isolated
**Pattern:** Never put `useSearchParams()` directly in a layout or persistent component. Extract into a child component so only that child needs the Suspense boundary. `SearchRow` was created for exactly this reason — `PublicNavbar` itself doesn't use `useSearchParams()`.

### Pagination with server-side amenity filtering: fetch all then slice
**Explanation:** `search_venues_nearby` RPC returns all matching venues. Amenity filtering runs in-memory in the server component (Supabase doesn't support filtering JSONB arrays in PostgREST). So the page component must fetch ALL results, filter amenities, then slice to the current page. This gives accurate `totalCount` without a separate COUNT query. Trade-off: large result sets are fully loaded server-side, but this is acceptable for the current scale (~100 venues).

### Map-drag search vs. URL pagination: use `isMapSearch` boolean
**Pattern:** Two search modes coexist in `SearchResults`: URL-driven (server fetch, pagination visible) and bounds-driven (client `fetch()`, no pagination). The `isMapSearch` boolean distinguishes them. `setIsMapSearch(false)` is called in the `useEffect` that watches `initialVenues` (URL changes reset it). `setIsMapSearch(true)` is called in `searchByBounds`. Pagination is hidden when `isMapSearch` is true.

---

## Logo / SVG

### Next.js App Router auto-detects brand asset filenames
**Pattern:** Place these files directly in `src/app/` (not `public/`) and Next.js wires them up automatically — no `<head>` tags needed:
- `icon.png` → browser favicon (`<link rel="icon">`)
- `apple-icon.png` → Apple touch icon (`<link rel="apple-touch-icon">`)
- `opengraph-image.png` → `<meta property="og:image">`
- `twitter-image.png` → `<meta name="twitter:image">`

### Inline SVG `linearGradient` IDs must be unique per component
**Problem:** If two different SVG components on the same page both define `<linearGradient id="vc-g">`, the browser uses whichever definition appears last in the DOM for both — the first component's gradient breaks.
**Fix:** Use distinct IDs per component: `LogoFull` uses `vc-full-g`, any future icon-only component should use a different ID. Static IDs (not random) are fine as long as they're unique across all rendered SVGs on any given page.

### SVG `linearGradient` with `gradientUnits="userSpaceOnUse"` needs coordinates in SVG canvas space
**Pattern:** When `gradientUnits="userSpaceOnUse"`, `x1/y1/x2/y2` are in the same coordinate space as the path data — NOT relative to the element bounding box. `LogoFull` paths span roughly x=135–875, y=178–378, so the gradient is defined as `x1="135" y1="178" x2="875" y2="378"`. If you set `gradientUnits="objectBoundingBox"` instead, use 0.0–1.0 values. Mixing the two causes the gradient to appear as a solid color.

### `logo/file.svg` is the source of truth for all vector path data
**Pattern:** The real bezier paths (icon mark + 10 letter glyphs for "VenueCharm") all live in `logo/file.svg` (1024×544 canvas, all paths originally `fill="#000000"`). `LogoFull` in `src/components/ui/LogoIcon.tsx` inlines all 14 path elements with gradient fill replacing the black. If the logo is ever updated, replace the path data in that component. Do not edit `logo/file.svg` — it is the unmodified source.

---

## Next.config

### Two conflicting next.config files
**Problem:** Both `next.config.js` and `next.config.mjs` existed with different image remote patterns.
**Fix:** Deleted `next.config.js`, merged all `remotePatterns` into `next.config.mjs`.

---

## Messaging / Realtime

### conversations & messages had RLS enabled but NO policies
**Problem:** Migration 001 ran `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for `conversations` and `messages` but never created any policies. RLS-enabled-with-no-policies = **everything denied** (no error, just empty/blocked). Inserts, selects, and Realtime all silently fail.
**Fix:** Migration 013 adds participant-scoped SELECT/INSERT on both tables and a read-receipt UPDATE policy on `messages`. Pattern for "I'm a participant": `EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id AND (c.renter_id = auth.uid() OR c.host_id = auth.uid()))`.

### Supabase Realtime needs the table in the publication AND an RLS SELECT policy
**Pattern:** For `postgres_changes` to stream a table, two things are required: (1) `ALTER PUBLICATION supabase_realtime ADD TABLE <t>` and (2) an RLS SELECT policy the subscriber satisfies — Realtime applies RLS per-subscriber using the session JWT. The `@supabase/ssr` browser client auto-sets the Realtime auth token from the session, so no manual `realtime.setAuth()` is needed. Make the publication add idempotent with a `pg_publication_tables` catalog check inside a `DO $$` block (don't rely on catching a specific SQLSTATE).

### Realtime echoes the sender's own INSERT — dedupe by id
**Pattern:** A client subscribed to `messages` INSERT receives its own newly-inserted rows too. To avoid double-rendering when also appending optimistically, dedupe on `message.id` (`prev.some(x => x.id === m.id) ? prev : [...prev, m]`). Have the `sendMessage` action return the inserted row so the sender sees it instantly even if Realtime lags.

### Two `useUnreadMessages` instances never mount together
**Note:** PublicNavbar and HostSidebar both call `useUnreadMessages()`, but they're never rendered simultaneously (sidebar is the host layout, which has no PublicNavbar). Both subscribe a channel named `unread-messages`; safe because only one is alive at a time and each cleans up on unmount.

---

## CI / Build

### `next lint` with no ESLint config prompts interactively (hangs CI)
**Problem:** The project had no `.eslintrc*`. Running `next lint` (e.g. in `npm run lint`) triggers the interactive "How would you like to configure ESLint?" prompt, which hangs forever in a non-interactive CI runner.
**Fix:** Commit `.eslintrc.json` with `{ "extends": "next/core-web-vitals" }`. Note `next/core-web-vitals` turns `react/no-unescaped-entities` into an **error** — bare `"` in JSX text fails lint; use `&ldquo;`/`&rdquo;`.

### `next build` succeeds without real Supabase env — all pages are dynamic
**Explanation:** Every page reads `cookies()` (for locale/auth), so they're server-rendered on demand, never statically generated at build. The Supabase browser/server clients use `process.env...!` (non-null assertion, no throw at import), and `metadataBase` falls back to localhost. So `next build` only needs *placeholder* `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` to compile — the CI build doesn't connect to Supabase. Real values as repo secrets are optional.

### Bound server actions can be passed to client components as props
**Pattern:** `someServerAction.bind(null, id)` produces a callable `() => Promise<...>` that can be passed as a prop to a client component and invoked from `onClick`. Used by `StartConversationButton` for the messaging entry points. The action's `redirect()` still surfaces as a thrown `NEXT_REDIRECT` in the client `catch` — re-throw it (see the Next.js section above).
