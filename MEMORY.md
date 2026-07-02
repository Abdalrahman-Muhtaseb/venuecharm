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

### Route-group folders do NOT add a URL segment — `/host/listings/new` was a 404
**Problem:** The navbar "Become a host" linked to `/host/listings/new`, which 404s. The `(host)` route group is a *grouping* folder — it doesn't add `/host` to the URL. The venue-creation page lives at `src/app/(host)/listings/new/page.tsx`, so its real URL is `/listings/new`. (Only files physically nested under a `host/` folder — e.g. `(host)/host/bookings` — get the `/host` prefix.)
**Fix:** Link to `/listings/new`. Session 10's `becomeHost()` action redirects there after upgrading the role.

### Post-login redirect — guard against open redirects
**Pattern:** To send users back to where they were after login, the target is passed as `?redirect=` through the middleware → login page → `signIn`/OAuth callback. Always validate it with `isSafeRedirectPath()` (`src/lib/utils.ts`) — same-origin relative paths only (`startsWith('/')`, not `//`, no `://`) — before redirecting, or it's an open-redirect hole. Default to `/` (not `/dashboard`, which bounces non-hosts to `/profile`).

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

### `logo/logo-name-horizantal.svg` is the source of truth for all vector path data
**Pattern:** The real bezier paths (icon mark + 10 letter glyphs for "VenueCharm") all live in `logo/logo-name-horizantal.svg` (formerly `logo/file.svg`; 1024×544 canvas, all paths originally `fill="#000000"`). `LogoFull` in `src/components/ui/LogoIcon.tsx` inlines all 14 path elements with gradient fill replacing the black. If the logo is ever updated, replace the path data in that component. Do not edit `logo/logo-name-horizantal.svg` — it is the unmodified source.

---

## Images / Cloudinary

### Seed venue photos are external Unsplash hotlinks — NOT Cloudinary (by design)
**Explanation:** `seeds/seed-venues.ts` fills `photos` with `https://images.unsplash.com/...?w=1200` URLs, and `adminSeedVenues()` seeds venues with *no* photos at all. Cloudinary only ever receives images a real host uploads via `/api/upload-venue-photos`. So "none of the seeded images are in Cloudinary" is expected, not a bug. `images.unsplash.com` is whitelisted in `next.config.mjs` so they still render.
**Migrate when wanted:** `npm run migrate:images` (`seeds/migrate-images-to-cloudinary.ts`) dedupes the unique external URLs, uploads each once, and rewrites `venues.photos` to `f_auto,q_auto` Cloudinary delivery URLs. Idempotent (skips `res.cloudinary.com`).

### Cloudinary can upload directly from a remote URL — no manual download
**Pattern:** `cloudinary.uploader.upload(remoteUrl, opts)` fetches the URL server-side and uploads it. The migration script relies on this — no `fetch()` + Buffer round-trip needed. Build the optimized delivery URL afterward with `cloudinary.url(publicId, { fetch_format: 'auto', quality: 'auto', width, height, crop: 'fill' })`.

### `next/image` blur placeholder for REMOTE images needs a base64 `blurDataURL`
**Problem:** `placeholder="blur"` on a remote `<Image>` requires an explicit `blurDataURL` — a remote URL is not accepted, only a data URI.
**Fix:** `src/lib/image.ts` exports a shared `BLUR_DATA_URL` (a tiny gray SVG → base64) used across the card, gallery, and homepage. One constant, zero per-image work. (Note: shadcn `<AvatarImage>` is a plain `<img>`, not `next/image`, so the `next.config` remotePatterns whitelist doesn't gate avatars — and the `?v=` cache-buster on re-uploaded avatars is harmless.)

### Carousel perf: swap one `<Image>` src, don't render all photos
**Pattern:** `VenueCard` keeps a single `<Image>` and changes its `src` by index (touch-swipe or arrows). Photos 2–N are never in the DOM and never fetched until navigated to — so a results grid loads ~1 image per card, not all carousel photos. Prefer this over a scroll-snap strip when image count × card count is large.

## Windows / Git

### `git mv` can throw "Permission denied" on some directories mid-restructure
**Problem:** Bulk-moving the host route tree (`(host)/dashboard` → `(host)/host/(panel)/dashboard`, etc.) hit `fatal: renaming '...' failed: Permission denied` on some directories via `git mv`, even though the same operation succeeded for sibling folders seconds apart. Reproducible on this Windows checkout (path contains a non-ASCII character), not consistently tied to any one tool (editor/AV/OneDrive-style file locks are the usual suspect).
**Fix:** For the directories that fail, use PowerShell `Move-Item -LiteralPath ... -Destination ...` (which isn't blocked) then `git add -A <touched root>` — git detects the rename from content similarity just as well as `git mv` would have. Verify with `git status --short` (look for `R` status) before continuing.

## Vercel / Deployment

### Hobby-tier cron jobs are capped at once-daily — confirm the plan before scheduling anything more frequent
**Problem:** `vercel.json` crons are easy to write with any schedule expression, but Vercel's Hobby (free) plan silently restricts cron execution to once per day regardless of what the cron expression says. An hourly schedule (`0 * * * *`) was first added for `expire-bookings` (session 15) without checking this.
**Fix:** This project stays on Hobby, so the schedule was changed to `0 5 * * *` (daily). The 7-day host-response window in `booking-expiry.ts` easily tolerates daily-granularity checks — no logic change was needed, only the cron expression. General rule: before relying on a sub-daily cron on Vercel, check the plan first.

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

---

## RFP / Smart Matching

### rfps & rfp_matches had RLS DISABLED entirely (not just missing policies)
**Problem:** Unlike `conversations`/`messages` (RLS enabled in 001 but no policies → all denied), `rfps` and `rfp_matches` were never in the `ENABLE ROW LEVEL SECURITY` list in 001 at all. With RLS *off*, Supabase exposes the table to the `anon`/`authenticated` API roles with **no restriction** — any user could read/write every row (Supabase flags this as a Security Advisor warning).
**Fix:** Migration 014 runs `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on both, then adds owner-scoped policies (`renter_id = auth.uid()` on rfps; `EXISTS (... parent rfp owned by me)` on rfp_matches). Lesson: when adding a feature on a pre-existing table, check whether RLS is actually *enabled*, not just whether policies exist.

### rfp_matches → rfps FK had no ON DELETE CASCADE
**Problem:** 001 created `rfp_id UUID NOT NULL REFERENCES rfps(id)` with no cascade. Deleting an rfp that has matches throws a FK violation.
**Fix:** Migration 014 drops and recreates the constraint with `ON DELETE CASCADE` (`ALTER TABLE rfp_matches DROP CONSTRAINT IF EXISTS rfp_matches_rfp_id_fkey; ADD CONSTRAINT ... ON DELETE CASCADE`). The default constraint name for that column is `rfp_matches_rfp_id_fkey`.

### Scoring lives in a pure lib with a documented cost assumption
**Pattern:** `src/lib/rfp-matching.ts` is pure (no I/O) so it's trivially testable and reusable by the server action. **Weights sum to 100 — session 10 rebalanced to 5 axes: capacity 25 / price 25 / amenities 15 / location 20 / event-type 15.** Because the RFP captures only a total `budget` (no duration), cost is estimated as `price_per_day`, or `price_per_hour × 8` (assumed 8h event). If you add event duration to the RFP later, update `estimatedCost()`.

### Unconstrained match dimensions award FULL marks (not zero)
**Pattern:** When the RFP gives no location, event type `OTHER`, or no amenities, those dimensions return the full weight for every venue — a constant that doesn't change the ranking, rather than zero (which would deflate everyone) or half (arbitrary). Venues that simply haven't declared `event_types` get a neutral *half* so legacy listings aren't punished.

### Reuse `search_venues_nearby` for bulk distances in matching
**Pattern:** RFP matching needs each venue's distance from the RFP's geocoded city, but Supabase JS can't read the PostGIS `location` column as lat/lng. Instead of a new RPC, call `search_venues_nearby(lat, lng, 500, 0, null, 1000, 0)` — radius 500 km covers all of Israel, `capacity_min 0` / `price_max null` disable its filters — and build an `id → distance_km` map from the result. The 5-dimension scorer (not the RPC's radius) decides how much distance matters.

### Shared event-type vocabulary between RFPs and venues
**Pattern:** `src/types/event-types.ts` is the single source of `eventTypes`/`EventType`, re-exported from `src/types/rfp.ts` for back-compat. Both `rfps.event_type` (one) and `venues.event_types` (JSONB array) use it, which is what lets matching compare them. The venue picker hides `OTHER` (an RFP-only "no constraint" fallback).

### `useFormStatus` gives a pending submit without useTransition
**Pattern:** For a plain `<form action={serverAction}>` (server-action form, like `RfpForm`/`VenueCreationForm`), put the submit button in a small child client component that calls `useFormStatus()` (`react-dom`) to read `pending`. No `useTransition`/`onClick` wiring needed — the redirect still happens natively server-side.

---

## Auth Modal / Onboarding (session 11)

### NEXT_REDIRECT lives in `error.digest`, not always `error.message`
**Problem:** The auth modal closed by catching the server-action redirect with `err.message.includes('NEXT_REDIRECT')`. On a real login the redirect error's marker is in `err.digest` (e.g. `"NEXT_REDIRECT;push;/;307;"`) and `message` may be empty — so the check failed, the redirect was swallowed as a generic error, the session got set but the modal never closed / never navigated.
**Fix:** Detect redirects by **both** `digest` (startsWith `NEXT_REDIRECT`) and `message`. See `isRedirectError()` in `src/components/auth/AuthModal.tsx`. (Refines the older "re-throw NEXT_REDIRECT" note above, which only checked `message`.)

### The auth modal lives in the root-layout provider → it survives navigation
**Pattern:** `AuthModalProvider` is mounted in `src/app/layout.tsx`, so the modal's `open` state persists across client navigations. Two consequences: (1) on success you must explicitly `onOpenChange(false)` — the redirect alone won't unmount it; (2) a same-path redirect (`/` → `/` after login on the homepage) doesn't change `pathname`, so a route-change close effect alone is insufficient. Belt-and-suspenders: close on the redirect path **and** add a `usePathname` effect that closes on any route change.

### Homepage/public counts via the regular client are RLS-scoped (per-user)
**Problem:** The homepage "Bookings completed" stat used `createClient().from('bookings').select(count)` — bookings RLS limits SELECT to the viewer's own rows, so the count was per-user (or 0 logged-out), not the platform total.
**Fix:** Use `createAdminClient()` for global aggregate counts on public pages. (Venue counts are fine on the regular client — ACTIVE venues are publicly SELECTable.)

### Onboarding "skip" memory is a cookie, not a DB column
**Pattern:** New-user "About me" (`/onboarding`) is skippable. To avoid re-nagging without a migration, completing/skipping sets an httpOnly `venuecharm-onboarded` cookie (`src/actions/onboarding.ts`); `signIn` + the OAuth callback only redirect to `/onboarding` when the profile is incomplete (`first_name` empty) AND the cookie is absent. Per-browser, not cross-device — acceptable for the demo; a `users.onboarded` column would be the robust version.

---

## Messaging / Realtime (session 11)

### Optimistic send: reconcile the temp bubble by content+status, not id
**Pattern:** `MessageThread` appends an optimistic message with a `temp-<uuid>` id and `status: 'sending'`. The server action returns the real row AND realtime echoes the same INSERT. The realtime handler dedupes by real `id`, and for the sender's own message replaces a matching `status==='sending'` temp (matched by `content`) so there's no duplicate; the action result then drops the temp if the real row already arrived.

### `scrollIntoView` scrolls the window — scroll the container instead
**Problem:** The thread auto-scroll used `bottomRef.scrollIntoView()`, which scrolls the nearest scrollable ancestor *and the page* — so the whole window jumped to the bottom on load and on every message.
**Fix:** Keep a ref on the messages container and set `el.scrollTop = el.scrollHeight`. Pair with a fixed-height (`h-[100dvh]`) layout so the page itself can't scroll.

### App Router layouts don't re-fetch on sub-navigation
**Pattern:** The `/messages` conversation list is fetched in `messages/layout.tsx`. Layouts stay mounted across child navigations (switching conversations), so the list won't reflect new server data until a full reload — `ConversationList` subscribes to realtime to stay fresh (live last message, unread bump-to-top, reset-on-open). Re-seeds from server props only on a real reload.

### `search_venues_nearby` doesn't return `event_types` — secondary lookup
**Pattern:** The PostGIS search RPC returns `amenities` but not `event_types`. Event-type filtering (venues page + `/api/venues/search`) fetches `select id, event_types` for the result ids and filters in memory — same approach as amenity filtering, and avoids a migration to change the RPC's return shape.

---

## UI / Layout (session 12)

### tailwind-merge: adding `relative` to a `fixed` shadcn `DialogContent` makes the modal vanish
**Problem:** Wrapping a themed background needed a positioned container, so `DialogContent` got `className="relative overflow-hidden"`. shadcn's `DialogContent` base class is `fixed`; `cn()` runs tailwind-merge, which treats `fixed`/`relative` as the same (position) group and **keeps the last one** — so the dialog lost `position: fixed`, rendered collapsed in normal flow, and the auth modal "stopped appearing". Symptom looked like a JS/provider bug; it was pure CSS class precedence.
**Fix:** Don't re-declare position on shadcn components. A `fixed` element is already a containing block for `absolute` children, so just add `overflow-hidden` and drop `relative`. General rule: never pass a conflicting layout utility (position/display) to a shadcn primitive via `className` unless you intend to override its base.

### react-day-picker v9 styling key is `disabled`, not `day_disabled`; nav arrows need `relative` on `months`
**Problem (a):** `classNames={{ day_disabled: '...' }}` is the **v8** key and is silently ignored in v9 (shadcn Calendar) — the strikethrough on unavailable days never applied.
**Fix (a):** Use the v9 part name: `classNames={{ disabled: 'line-through text-muted-foreground/45' }}`.
**Problem (b):** Overriding `classNames={{ months: '...' }}` and omitting `relative` removed the prev/next month arrows — the nav is `absolute inset-x-0 top-0` and anchors to the nearest positioned ancestor (the default `months` class is `relative`).
**Fix (b):** Keep `relative` in any custom `months` class.

### Per-navigation avatar flicker → root-layout `UserProvider`, server-seeded
**Pattern:** `PublicNavbar` used to fetch the user in a `useEffect` on every mount; crossing route groups remounts the layout → the avatar/links blink (looks like re-auth). Fix: `src/components/auth/UserProvider.tsx` (client) lives in the **root** layout (never remounts), seeded server-side via `getInitialUser()` in `app/layout.tsx`, and subscribed to `onAuthStateChange` for login/logout. Navbar reads `useCurrentUser()` — no per-page refetch, correct on first paint.

### Lazy conversation creation — don't insert the row until the first message
**Pattern:** Eagerly creating a `conversations` row on "Contact host" leaves an empty thread in both inboxes after an accidental click. Now `startVenueConversation` resumes an existing thread or redirects to a draft composer `/messages/new?venue=`; the row + first message are created together in `sendFirstMessage` (then redirect to `/messages/<id>`). `MessageThread` takes an optional `draftVenueId` and skips the realtime subscription until a real `conversationId` exists.

---

## Availability time-slots / Booking (session 12)

### Turnaround-buffer clash check must use the admin client
**Problem:** Bookings RLS limits the regular client's SELECT to the viewer's own rows, so a "is anything within the buffer window?" check run as the renter can't see **other** renters' bookings — buffer would never be enforced.
**Fix:** `requestBooking` runs the buffer overlap query (`start_at < winEnd AND end_at > winStart`) via `createAdminClient()`. The DB `EXCLUDE` constraint still independently blocks exact overlaps; the buffer is the extra gap on top.

### Whole-day selection must resolve to the day rate, not hours × hourly
**Problem:** The week grid's "select whole day" picked an opening→closing hourly range, so a venue with both prices showed 15h × ₪hourly (₪37,500) instead of the flat day rate (₪18,000).
**Fix:** The grid signals whole-day **intent** (`fullDay` flag + `selectFullDay` in `BookingDateContext`); the widget resolves price: if `pricePerDay` exists → Full-day mode (day rate); else hourly opening→closing. Keep per-day pricing — it's a deliberate discount, not a bug.

### UI must stop flattening bookings to whole days for time-slot booking to work
**Pattern:** The DB always allowed same-day/different-time bookings (the `bookings` EXCLUDE is on `tstzrange`, not the date), but the widget + host calendars expanded each booking to **all its days** and disabled them — so one 2-hour booking blocked the whole day. Time-slot availability = stop the whole-day flattening (hourly mode), and instead filter the Start/End dropdowns against per-day taken minute-ranges (`takenRangesForDate` in `src/lib/availability-slots.ts`). Full-day mode still disables any day that has a booking/block.

---

## Auth / Notifications / Maps / Domain (session 13)

### A server-action sign-in never updates the client UI — do login on the browser client
**Problem:** `signIn` was a server action calling `supabase.auth.signInWithPassword` on the **server** client. It sets the session cookie, but the **browser** Supabase client never finds out, so `UserProvider`'s `onAuthStateChange` doesn't fire — the navbar stayed logged-out and the modal stayed open until a manual refresh (a redirect to the same path `/`→`/` doesn't re-render server components either).
**Fix:** Do login **client-side** in `LoginForm` via `createClient().auth.signInWithPassword(...)` — that fires `SIGNED_IN`, `UserProvider` updates the header instantly, then `router.refresh()/push()`. Also made `UserProvider` adopt a changed `initialUser` (`useEffect` keyed on id/role/avatar/email) so a `router.refresh()` after a server-action auth flow still updates the header. Signup stays a server action (it writes `public.users` via admin + needs verify-state), and it navigates away so the header refreshes naturally.

### Don't classify auth errors with broad `message.includes('email')`
**Problem:** `signUp`'s error handler did `if (msg.includes('email')) return 'invalid_email'`. Supabase's built-in mailer returns **"Error sending confirmation email"** and **"Email rate limit exceeded"** — both contain "email", so a perfectly valid address got flagged "enter a valid email" (shown under the email field). The real cause was the throttled mailer.
**Fix:** Classify precisely and in order: `already registered` → exists/google; `429`/`rate limit` → `rate_limit`; `sending`/`confirmation email`/`smtp` → `email_send`; `captcha`; password; only `invalid && email` → `invalid_email`; else surface the **raw** message. **Supabase's built-in email is rate-limited to ~2–4/hour** on the free tier — exhaust it during testing and signups appear "broken". Use Resend SMTP, or temporarily disable "Confirm email" for local testing.

### Google-only accounts on the password form — detect via admin listUsers
**Pattern:** `getAuthMethod(email)` (server action) uses `admin.auth.admin.listUsers()` and checks `app_metadata.providers` + `identities` to return `'google' | 'email' | 'none'`. Called only **after** a failed password login or a duplicate signup, to show "this account was created with Google — use Continue with Google". Mild user-enumeration tradeoff, acceptable for a friendly UX; don't call it as an open probe.

### Supabase email-confirmation links: handle both `?code=` and `?token_hash=`
**Pattern:** `/api/auth/callback` originally only did `exchangeCodeForSession(code)`. Depending on the project's flow, the built-in confirmation email can instead redirect with `?token_hash=&type=signup` (needs `verifyOtp`). The callback now handles both, plus `?error=` (expired/used link) → `/login?error=verification` with a localized message. The `…supabase.co/auth/v1/callback` redirect URI in Google Cloud is **Supabase's fixed endpoint** (project-ref based) — never edit it; the app's own domain only goes in Supabase's **Redirect URLs** allow-list.

### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is dual-use (browser + server) — split before restricting
**Problem:** The same key renders maps in the browser (referrer-based) AND is the fallback for **server-side** geocoding in `src/lib/google-maps.ts`. Server calls send no HTTP referrer, so setting the key's Application restriction to **"Websites"** breaks venue create/edit + RFP geocoding with `REQUEST_DENIED`.
**Fix:** Two keys. Public key → Websites + Maps JS/Places. Separate **server** key → Geocoding only, no app restriction, set as `GOOGLE_MAPS_API_KEY` (not `NEXT_PUBLIC_`). The code **already prefers** `GOOGLE_MAPS_API_KEY ?? NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (line 11) — no code change, just add the env var.

### Maps console warnings: `loading=async` and `styles`-with-`mapId`
**Fix (a):** Add `&loading=async` to every Maps JS script URL (best-practice async load). Works with both the poll-for-`window.google` and `&callback=` patterns.
**Fix (b):** A map created with a `mapId` **ignores** an inline `styles` option and warns. Since `AdvancedMarkerElement` requires `mapId`, drop the `styles` array (it was only hiding POI labels, and `clickableIcons:false` already does that). Cloud-console map styling is the `mapId` way.

### Notifications: cross-user rows are written by the admin client only
**Pattern:** A renter's booking request creates a `notifications` row for the **host** (`user_id != auth.uid()`), which an RLS INSERT `WITH CHECK` would block. So `notifications` has **no INSERT policy** by design — `notify()` (`src/lib/notifications.ts`) writes via `createAdminClient()`, fire-and-forget like the email senders. Owners get SELECT/UPDATE/DELETE on their own rows. Same Realtime requirements as messaging (publication + per-subscriber SELECT policy); the feed/count hooks use **unique channel names** so the bell + `/notifications` panel can be alive at once.

### Stripe webhook endpoint URL must include the full `/api/stripe/webhook` path
**Problem:** A production webhook destination was set to just `https://venuecharm.vercel.app` (no path). Stripe POSTed events to the homepage, which returned 200, so Stripe showed "delivered, 0 failed" — but the real handler never ran (telltale: ~2–5s response time = full page render, not the lightweight route). `transfer.created`/`charge.refunded` silently never recorded `stripe_transfer_id`/`refund_amount`. (Capture still worked — it's in the `acceptBooking` action, not the webhook.)
**Fix:** Endpoint URL must be `https://<domain>/api/stripe/webhook`. Editing a destination's URL keeps the same signing secret (no env change).

---

## Testing (Vitest / Playwright — session 18)

### Test DB is a SEPARATE Supabase project, guarded against prod
**Pattern:** Integration/E2E run against a dedicated test project (`.env.test`, gitignored), never prod. `tests/helpers/setup.ts` throws if `NEXT_PUBLIC_SUPABASE_URL` is non-local unless `ALLOW_REAL_SUPABASE_IN_TESTS=true` is set — a deliberate opt-in because the test project is a hosted `*.supabase.co`. Always double-check the test project ref ≠ prod ref before enabling. Unit tests need no DB; integration/E2E `describe.skipIf(!hasTestDb)` so the secret-less CI `verify` job stays green (only the `db-tests` job provides `TEST_*` secrets).

### Shared remote test DB → run test files SERIALLY, or they flake
**Problem:** Vitest defaults to parallel files; Playwright to parallel workers. Both racing on the ONE shared test project (Supabase auth rate limits, connection load, seed collisions) caused intermittent failures that passed on retry.
**Fix:** Vitest `fileParallelism: false` + wider `testTimeout`/`hookTimeout`; Playwright `workers: 1` + `fullyParallel: false`. Reliability over speed for DB-backed suites.

### Point `next dev` at the test DB via Playwright's webServer env (not .env.local)
**Pattern:** `next dev` normally loads `.env.local` (= prod). In Next, **shell/process env takes precedence over `.env` files**, so `playwright.config.ts` loads `.env.test` and passes it as `webServer.env`, on a dedicated port (3100) with `reuseExistingServer: false` so it can never reuse a prod-pointed dev server. Config throws if `.env.test` is absent. In CI the `db-tests` job writes `.env.test` from `TEST_*` secrets so both vitest and Playwright pick it up.

### Vitest and Playwright must not glob each other's files
**Pattern:** Vitest `include` is `tests/unit/**` + `tests/integration/**` only; Playwright `testDir` is `tests/e2e`. Keep E2E specs out of the vitest globs (they import `@playwright/test`, which vitest can't run) and vice-versa.

### Driving the shadcn/react-day-picker calendar in E2E
**Pattern:** Each day button carries `data-day={date.toLocaleDateString()}` (en-US → `"M/D/YYYY"`), and month-nav buttons are `.rdp-button_next`/`.rdp-button_previous` — use these, not fragile aria-label text. **Scope the day click to the popover dialog** (`page.getByRole('dialog')`) because the venue page also renders an inline availability calendar (otherwise strict-mode matches two `data-day` elements). The booking widget's calendar does **not** auto-close on select (no `setOpen` in `onSelect`) — press `Escape` after picking so the popover can't intercept the next click.

### E2E booking journey uses a full-day-only venue to avoid the time-selects
**Pattern:** A venue with `price_per_day` but `price_per_hour: null` makes the booking widget default to full-day mode = date picker only (no Radix `Select` time dropdowns). Seed it that way in `tests/e2e/global-setup.ts` to keep the journey robust. The journey asserts success at the DB (booking row `PENDING`) after landing on `/checkout` — it does not automate Stripe Elements card entry.

### axe color-contrast is excluded from the a11y gate (known debt)
**Note:** `tests/e2e/a11y.spec.ts` gates on no critical/serious WCAG 2 A/AA violations but `disableRules(['color-contrast'])` — real AA contrast failures exist on `/`, `/venues`, `/pricing` (issue #105). The gate still catches every other critical/serious regression. Re-enable the rule after the design fix.
