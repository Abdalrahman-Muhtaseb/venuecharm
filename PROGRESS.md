# VenueCharm — Session Progress

_Last updated: 2026-06-28 (session 13)_

---

## ✅ Fully Working

### Infrastructure
- Next.js 14 App Router with TypeScript strict mode — `npx tsc --noEmit` is clean
- Supabase auth (email/password + Google OAuth), middleware route protection
- Cloudinary image upload for venue photos (`/api/upload-venue-photos`)
- shadcn/ui design system (22 Radix components), Tailwind RTL, Hebrew/English locale switcher
- Cookie-based locale persistence (Hebrew default, `venuecharm-locale` cookie)

### Auth Flow
- Register → role selection (visual Renter/Host cards) → verify email → login
- **Google OAuth with role selection** — `RegisterForm` (Client Component) holds `role` state; both email and Google paths read from it; role stored in short-lived `venuecharm-pending-role` cookie through the redirect; callback upserts into `public.users` with `ignoreDuplicates: true`
- `POST /api/auth/signout` route handler — fixes 404 on sign-out
- **Redesigned profile page** (session 10) — 3-card layout: identity with Cloudinary **avatar upload**, inline name/phone edit, and account & security (**change email** with Supabase re-verification, **change password**). Backed by `src/actions/profile.ts`.
- **Post-login redirect** (session 10) — middleware/login/OAuth callback carry a safe `?redirect=` target (`isSafeRedirectPath` guard); default `/` not `/dashboard`. Renters no longer bounce to `/profile`.
- Middleware protects: `/dashboard`, `/listings`, `/host/*`, `/profile`, `/bookings`, `/admin`, `/messages`, `/favorites`, `/rfp`

### Host Side
- `(host)/layout.tsx` — role guard (non-HOST → redirect to `/profile`)
- `/dashboard` — 4 KPI cards (active listings, pending requests, upcoming bookings, **real revenue from CONFIRMED+COMPLETED bookings**) + recent activity feed + Stripe Connect onboarding banner when not onboarded
- `/listings` — table of all host venues with status badges, edit links, soft-delete (confirm dialog)
- `/listings/new` — redesigned venue creation form: Google Maps picker with **Places Autocomplete search box** (address/city auto-filled by pin drop or search, lat/lng hidden), scroll-to-zoom via `gestureHandling: 'greedy'`, **AmenitiesPicker** (24 toggle buttons in 5 categories: Core, AV & Events, Food & Drink, Outdoor & Spaces, Facilities), **WeekdayPicker** for default availability (pre-populates `availability` table for next 90 days), cancellation policy picker, Cloudinary photo upload
- `/listings/[id]/edit` — prefilled edit form with AmenitiesPicker (pre-selected), existing photo management, cancellation policy; lat/lng visible inputs removed; **HostAvailabilityEditor** — 2-month calendar where hosts can click to block/unblock dates; booked dates (PENDING/CONFIRMED) are read-only disabled
- `/host/bookings` — Pending / Upcoming / Past tabs with booking count badge
- `/host/bookings/[id]` — full booking detail (renter info, dates, price breakdown) with Accept/Decline buttons; Accept gated behind `stripe_charges_enabled` check
- `/host/calendar` — 2-month availability calendar with click-to-toggle (blocked=rose, booked=violet)
- `/host/payouts` — 3-state Stripe Connect UI: not started / in progress / complete; payout history list
- Server actions: `createVenue` (saves amenities + seeds 90-day availability), `updateVenue` (saves amenities + **calls `update_venue_location` RPC to update PostGIS geography**), `deleteVenue`, `acceptBooking`, `declineBooking`, `cancelOwnBooking`, `setAvailability`
- `src/actions/reviews.ts` — `submitReview` (auth check, booking ownership verify, allows COMPLETED or CONFIRMED+past, handles duplicate 23505 error)

### Stripe Connect (Host Onboarding)
- `src/lib/stripe-connect.ts` — `createConnectAccount()`, `createOnboardingLink()`, `fetchConnectStatus()`, `splitChargeAmount()`
- `src/actions/stripe-connect.ts` — `startStripeOnboarding()`, `refreshStripeStatus()`
- `POST /api/stripe/connect/onboard` — initiates Connect Express onboarding, returns redirect URL
- `GET /api/stripe/connect/return` — Stripe return URL; syncs DB then redirects to `/host/payouts`
- `GET /api/stripe/connect/refresh` — Stripe refresh URL (expired link); generates new link
- `ConnectOnboardingCard` — Client Component with `useTransition` + toast; redirects to Stripe's hosted flow
- Webhook `account.updated` handler — auto-syncs `stripe_charges_enabled` when Stripe confirms onboarding

### Payments (Destination Charges + Refunds)
- PaymentIntent created with `transfer_data.destination` (host's Connect account) + `application_fee_amount` (15%)
- On host accept → `paymentIntents.capture()` → Stripe auto-transfers 85% to host
- Webhook `transfer.created` → stores `stripe_transfer_id` on payment row
- Webhook `charge.refunded` → syncs `refund_amount` on payment row
- `cancelOwnBooking` PENDING path → cancels held PI (no capture, no refund needed)
- `cancelOwnBooking` CONFIRMED path → `stripe.refunds.create()` with `reverse_transfer: true` + `refund_application_fee: true` **only when `stripe_transfer_id` exists** (safe for pre-Connect bookings)

### Cancellation Policies
- `src/lib/cancellation.ts` — pure `computeDeadline()` + `refundPercent()` helpers
- 3 tiers: FLEXIBLE (24h / 100%|0%), MODERATE (7d/24h / 100%|50%|0%), STRICT (7d / 50%|0%)
- `cancellation_deadline` stored on booking row at creation time
- Refund preview shown on renter booking detail page (`/bookings/[id]`) — "If you cancel now: ₪X"
- `CancellationPolicyPicker` component in venue creation/edit forms
- Policy displayed on venue detail page so renters see it before booking

### Admin Panel
- `(admin)/layout.tsx` — ADMIN role guard + `AdminSubNav` with Queue ↔ Dev Tools tab links
- `/admin` — tabbed table: PENDING_APPROVAL / ACTIVE / SUSPENDED venues (uses `createAdminClient()` so all statuses are visible)
- `/admin/[id]` — read-only venue detail page for review (uses `createAdminClient()`)
- `AdminActionButtons` — approve (→ ACTIVE) / suspend (→ SUSPENDED) using `createAdminClient()` to bypass RLS
- `/admin/dev` — **Dev Tools page** with 4 tabs:
  - **Stats** — Users (total + by role), Venues (total + by status), Bookings (total + by status), Revenue (confirmed + completed)
  - **Users** — all users table with per-row role dropdown (RENTER/HOST/ADMIN) + verify/unverify toggle button, Stripe status badge
  - **Bookings** — all bookings with venue, renter, dates, amount, status; Cancel button for PENDING/CONFIRMED rows
  - **Tools** — Seed Data (create 5 test venues in Israeli cities + 3 test users) + Danger Zone (reset to pending, cancel all pending, delete [TEST] venues, delete all bookings — all behind Dialog confirmations)
- `src/actions/admin.ts` — all dev-tools server actions, guarded by `requireAdmin()`

### Renter Side
- `/` — homepage with hero, highlights, featured venues grid (up to 8 from DB) with **avg rating + review count** per card, CTA
- `/venues` — **Airbnb-style split-view search**: venue list + sticky map (40% width desktop), pagination
  - **MapView** — `AdvancedMarkerElement` price bubble markers (₪X/hr white pill → purple on select, light purple on card hover), InfoWindow popup card (photo, title, city, capacity, **avg rating + review count**, price, link to detail), "Search as I move the map" checkbox (fetches `/api/venues/search` on map `idle` event), `searchKey` prevents fitBounds on pan-only updates, scroll-to-zoom via `gestureHandling: 'greedy'`
  - **SearchBarAutocomplete** — Airbnb-style 3-field pill (Where / When / Add guests) embedded in the navbar second row (only visible on `/venues`); Google Places dropdown; pushes `?lat=&lng=&radius=30&q=` to URL; syncs state from URL params when navigating
  - **FilterDialogButton** — modal-based filter trigger (sort, price, amenities) with active-count badge; `clearAll` resets filter params; shows result count in confirm button
  - **VenuePagination** — URL-based pagination (`?page=N`), `buildPages()` with `…` gap markers, hidden when in map-drag search mode
  - **Mobile**: floating "Show map / Show list" pill toggle, map goes fullscreen on mobile
  - `SearchResults` tracks `liveVenues`, `hoveredId`, `isMapSearch` state — updates from URL or bounds search; card hover passes `hoveredId` to MapView; pagination shown only for URL-driven results
  - Default view (no query, no coords): Israel center (31.5, 34.85) with 500 km radius via PostGIS RPC
  - **Pagination**: 14 venues per page, server-side slice; ratings fetched only for visible page; `<Image priority>` for first 4 cards
  - **Grid**: 2 columns (sm:grid-cols-2), removed xl:grid-cols-3
  - **Venue cards open in a new tab** (`target="_blank"`)
  - FilterPanel (sort, price slider, amenity checkboxes)
- `/venues/[id]` — full detail page: VenuePhotoGallery (lightbox), VenueAmenityList (icon chips), AvailabilityCalendar (read-only), BookingWidget (sticky sidebar), **cancellation policy display**, **ReviewList** (reviewer avatar+initials, name, stars, date, comment with newline preservation)
- `/venues/[id]/book` — BookingForm with Hourly/Full Day tabs, live PriceBreakdown (subtotal + 15% fee)
- `/venues/[id]/checkout` — order summary + Stripe Elements (or placeholder if Stripe not configured)
- `/venues/[id]/booking-confirmed` — success page (Stripe return URL)
- `/bookings` — renter's own bookings: Pending / Upcoming / Past tabs
- `/bookings/[id]` — booking detail with venue card, **date+time display** (`formatDateTimeLocalized`), price, status; refund preview; cancel button gated by `isOver` (hides for past events); **ReviewForm** (1–5 stars + comment) shown on COMPLETED bookings or CONFIRMED+past; "already reviewed" message if duplicate

### Marketing
- `/how-it-works` — 3-step explainer
- `/pricing` — commission model (15% renter, 0% host listing fee)

### Navbar (PublicNavbar)
- **Redesigned (session 10)**: single **"Log in"** button (merged the old Sign in + Join), full-width header (no max-w cap). `ThemeToggle` switches light/dark on click (no dropdown). "Become a host" calls the `becomeHost()` action (RENTER→HOST upgrade then `/listings/new`).
- Hamburger menu holds: role-specific links (Admin panel / Host dashboard / My bookings / Smart matching) + favourites + profile + **footer pages (Find venues, How it works, Pricing)** + a **language toggle** + Sign out; logged-out shows Log in / Become a host + the same explore links and language toggle.
- Second row on `/venues` only: `SearchRow` (SearchBarAutocomplete + FilterDialogButton) wrapped in `<Suspense>` with animated skeleton fallback to prevent layout shift during hydration

### Logo & Brand Assets
- `src/components/ui/LogoIcon.tsx` — `LogoFull` component: inline SVG of the full horizontal lockup (icon mark + "VenueCharm" wordmark as vector paths) traced from `logo/file.svg`; purple gradient `#3b0764 → #7e22ce → #a855f7`; `viewBox="135 178 740 200"`; `h-11 w-auto` in navbar/auth/footer, `h-10 w-auto` in host sidebar
- Used in all four layout files: `PublicNavbar`, `AuthShell`, `Footer`, `HostSidebar` — replacing the previous placeholder `MapPin` icon
- `src/app/icon.png` (256×256) — Next.js App Router auto-detects as favicon
- `src/app/apple-icon.png` (180×180, white bg) — auto-detects as Apple touch icon
- `src/app/opengraph-image.png` (1200×630) — OG share image
- `src/app/twitter-image.png` (1200×630) — Twitter card image

### Global
- `not-found.tsx`, `error.tsx`, `loading.tsx` boundaries
- `<Toaster />` (sonner) in root layout — toast notifications throughout
- 50 seeded venues with amenities (WiFi, Parking, AV, etc.) populated via SQL update

---

### Email Notifications (Resend) · [#37](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/37)
- `src/lib/email.ts` — Resend client with `isResendConfigured()` guard, bilingual (he/en) HTML templates, RTL-aware, purple gradient branding matching the logo, `icon.png` embedded in header
- `getEmailLocale()` reads `venuecharm-locale` cookie so emails match the user's selected language
- Fire-and-forget pattern — email failures never block the booking flow
- 5 lifecycle emails: booking requested (→ renter + → host in parallel), booking accepted, booking declined, booking cancelled (→ host)
- Wired into `src/actions/bookings.ts` — `requestBooking`, `acceptBooking`, `declineBooking`, `cancelOwnBooking`
- Test mode limitation: Resend only delivers to the account owner email until a sending domain is verified

### Production Deployment · [#54](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/54)
- Live at **https://venuecharm.vercel.app**
- All env vars set in Vercel dashboard; `RESEND_API_KEY` synced via Resend × Vercel integration
- `metadataBase` set in root layout to `NEXT_PUBLIC_APP_URL` (fixes OG/Twitter image URLs)
- `.npmrc` with `legacy-peer-deps=true` committed (required due to `@stripe/react-stripe-js` peer dep conflict)
- Supabase Auth → Site URL + Redirect URLs updated to production domain (both `https://venuecharm.vercel.app/**` and `http://localhost:3000/**`)
- **Two** Stripe webhook destinations on production: "Your account" scope (`payment_intent.amount_capturable_updated`, `transfer.created`, `charge.refunded`) and "Connected accounts" scope (`account.updated`, auto-syncs host onboarding). Their two signing secrets are stored as `STRIPE_WEBHOOK_SECRET` + `STRIPE_WEBHOOK_SECRET_CONNECT`; the handler verifies the payload against each secret in turn.
- Stripe Connect uses Account Links (not OAuth) — no redirect URI registration needed in Stripe Dashboard
- `src/lib/supabase/server.ts` `setAll` wrapped in try/catch — silences the "Cookies can only be modified in a Server Action or Route Handler" error thrown when Supabase tries to refresh the session during RSC rendering (middleware handles the real refresh)

---

### In-app Messaging (Supabase Realtime) · [#56](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/56)
- **Migration `013_messaging_rls.sql`** ✅ applied 2026-06-15 — `conversations`/`messages` had RLS enabled in 001 but **no policies** (all access denied). Adds participant-scoped SELECT/INSERT on both, a read-receipt UPDATE policy on `messages`, indexes, and registers `messages` with the `supabase_realtime` publication (idempotent catalog check).
- `src/actions/messages.ts` — `startVenueConversation` (renter pre-booking inquiry), `startBookingConversation` (either party, tied to a booking), `sendMessage` (returns the inserted row for optimistic append), `markConversationRead`. Find-or-create dedupes threads by `renter_id+host_id+booking_id` (or `+venue_id` with null booking).
- `/messages` — unified inbox shared by hosts and renters (PublicNavbar layout like `/bookings`); conversation rows with other-party initials, venue title, last-message preview, unread badge. Uses `createAdminClient()` for the cross-user name/venue lookups (RLS-safe, server-only).
- `/messages/[id]` — thread page; `MessageThread` client component subscribes to Realtime `postgres_changes` INSERT filtered by `conversation_id`, dedupes by message id, Enter-to-send (Shift+Enter newline), marks inbound read on mount + on each incoming message.
- Entry points: "Contact host" on `/venues/[id]` (logged-in non-owner), "Message host" on `/bookings/[id]`, "Message guest" on `/host/bookings/[id]` — all via `StartConversationButton` (useTransition + NEXT_REDIRECT re-throw).
- Live unread badge in **PublicNavbar** (MessageCircle icon) and **HostSidebar** (Messages link) via the shared `useUnreadMessages()` hook (`src/hooks/`), which counts inbound unread and re-counts on any Realtime `messages` change.
- `/messages` added to `middleware.ts` auth protection; bilingual `messages` namespace added to `i18n.ts`.

### RFP Smart Matching · [#11](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/11)
- **Migration `014_rfp.sql`** ✅ applied 2026-06-15 — adds an `amenities` wishlist column to `rfps`, **enables RLS** on `rfps`/`rfp_matches` (they had RLS disabled entirely since 001 — fully exposed), owner-scoped SELECT/INSERT/DELETE policies, and `ON DELETE CASCADE` from `rfp_matches` to `rfps`.
- `src/lib/rfp-matching.ts` — pure, unit-testable scoring. **Rebalanced in session 10 to five weighted axes** summing to 100: **capacity (25)**, **price (25)**, **amenities (15)**, **location (20)** (PostGIS distance from the RFP's geocoded city; full ≤10 km, zero ≥80 km), **event-type (15)** (venue advertises the requested type). Unconstrained dimensions (no location / event type OTHER / no amenities) award full marks so they don't skew the ranking. `estimatedCost()`, `matchedAmenities()`, `scoreVenue()`, `rankVenues()`.
- `src/actions/rfp.ts` — `createRfp` (insert request → score every ACTIVE venue → persist top 20 to `rfp_matches` → redirect to results), `deleteRfp`.
- `/rfp` — renter's request list (PublicNavbar layout) with per-request match counts + "New request". `/rfp/new` — `RfpForm` (event type, date, guests, budget, AmenitiesPicker, description) with a `useFormStatus` pending button. `/rfp/[id]` — request summary + venues ranked by score, each with a colored `%` badge and "why it matched" pills (fits capacity / within budget / X-of-Y amenities), linking to the venue in a new tab.
- `src/types/rfp.ts` — `eventTypes` + `createRfpSchema` (zod). `DeleteRfpButton` client component.
- `/rfp` added to `middleware.ts` auth protection; bilingual `rfp` namespace in `i18n.ts`; "Smart matching" entry in the navbar hamburger for renters.

### Google Calendar Integration (Host) · [#58](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/58)
- **Migration `015_host_calendar.sql`** ✅ applied 2026-06-17 — creates `host_calendar_connections` table (one row per host: `host_id`, `provider`, `refresh_token`, `calendar_id`, `sync_enabled`, `last_synced_at`). RLS **enabled with no policies** — all access via service-role admin client only (the refresh token is a secret). Adds `google_event_id TEXT` column to `bookings`.
- `src/lib/google-calendar.ts` — `isGoogleCalendarConfigured()` guard, `getAuthUrl()` (offline access + consent prompt → refresh token), `exchangeCodeForRefreshToken()`, `createEvent()`, `deleteEvent()` via `googleapis` v173.
- `src/lib/calendar-sync.ts` — `syncConfirmedBooking(bookingId)` / `removeBookingEvent(bookingId)`, each fully wrapped in try/catch so a Calendar outage never blocks the booking flow. Reads the OAuth token via `createAdminClient()`.
- `src/actions/google-calendar.ts` — `startCalendarConnect()` (returns OAuth URL), `disconnectCalendar()` (deletes row from `host_calendar_connections`).
- `GET /api/google/calendar/callback` — validates `state` vs `auth.uid()`, calls `exchangeCodeForRefreshToken`, upserts into `host_calendar_connections`, redirects to `/host/calendar?calendar=connected|error|noToken`.
- Wired into `src/actions/bookings.ts`: `acceptBooking` → `syncConfirmedBooking`, `declineBooking` / `cancelOwnBooking` → `removeBookingEvent` (all fire-and-forget).
- `HostCalendarConnectCard` on `/host/calendar` — 3-state card (not configured / connected / not connected), useTransition + toast, "Connect" → OAuth redirect, "Disconnect" → server action + router.refresh.
- Bilingual `calendarSync` namespace in `i18n.ts` (he/en). Three new env vars: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`.
- Degrades gracefully — with no credentials, the card shows "not configured" and the app runs normally.

### CI/CD (GitHub Actions) · [#55](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/55)
- `.github/workflows/ci.yml` — runs on every push/PR to `main`: `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm run build` (Node 20, npm cache, concurrency cancel-in-progress).
- Build step uses placeholder Supabase env with `secrets.*` fallback, so CI is green without secrets (all pages are dynamic — nothing fetches at build time). Real `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` repo secrets added for building against the real project.
- `.eslintrc.json` added (`next/core-web-vitals`) — none existed, so `next lint` would have prompted interactively and hung CI. Fixed 4 pre-existing `react/no-unescaped-entities` lint errors so the lint gate passes.

---

### UX Overhaul · Image Performance · Venue Types · Location Matching (session 10)
Branch `fix/ux-batch-and-image-perf` (merged to `main`). **Migrations 016, 017, 018 applied 2026-06-24.**
- **Bug fixes** — post-login redirect to prior page / homepage (`isSafeRedirectPath`, `?redirect=` through middleware + OAuth callback); self-service **Become a host** via `becomeHost()` (the old link 404'd because the `(host)` route group doesn't add a `/host` prefix — real path is `/listings/new`).
- **Navbar / layout** — single "Log in" button, footer pages + language toggle in the hamburger, instant theme toggle, full-width header/footer.
- **Search / filters** — amenity filter is now a wrapping **chip grid** (shared `FilterPanel`); dragging the map updates the navbar "Where" field to **"Map area"** via a `venuecharm:mapsearch` window event.
- **Venue UX** — venue-card photos are **swipeable on touch** (single-image swap kept for perf + swipe-vs-tap guard); **location map** on the detail page (`VenueLocationMap` + `get_venue_coordinates` RPC, migration 016, with a geocode fallback); removed the "Back to search" link; per-tab counts on `/bookings`; **event-type badges** on the detail page.
- **Image performance (#6)** — `src/lib/image.ts` `BLUR_DATA_URL` + `placeholder="blur"` on card/gallery/homepage images; `seeds/migrate-images-to-cloudinary.ts` (`npm run migrate:images`) dedupes & moves the Unsplash seed photos into Cloudinary with `f_auto,q_auto`. Seed photos are external Unsplash hotlinks **by design** until migrated.
- **Venue event types (#7)** — multi-select chip picker (`EventTypesPicker`) on the create/edit forms, stored in `venues.event_types` (migration 017); shared vocabulary in `src/types/event-types.ts`.
- **Location-aware RFP matching (#18)** — optional geocoded city on the RFP (migration 018: `rfps.city/latitude/longitude`); matching adds location + event-type dimensions.

---

### Auth Modal · Onboarding · Smart-Match Search · Chat App · Admin Analytics (session 11)
All uncommitted on `main` as of 2026-06-25. **No new migrations** — every feature works against the existing schema.

- **Auth as a modal** — login/signup is now a global modal (`AuthModalProvider` in the root layout + `AuthModal`), opened from the navbar "Log in" / "Become a host". The `/login` & `/register` pages are kept as fallbacks (middleware redirects, email-verify links, direct URLs). Role selection removed from signup — **everyone starts RENTER**; `signUpWithGoogle` collapsed to `signInWithGoogle`. Modal closes reliably on success via `isRedirectError` (checks `digest`, not just `message`) + a route-change effect in the provider.
- **Onboarding** — new signups land on a skippable **`/onboarding` "About me"** step (`OnboardingForm` + `src/actions/onboarding.ts`, `venuecharm-onboarded` cookie so it doesn't re-nag). `signIn`/OAuth callback route incomplete-profile users there. **Become a host** now routes to a **`/host/onboarding` checklist** (profile → Stripe required → first listing gated on `stripe_charges_enabled`).
- **Best-match search (#68)** — "Best match" sort on `/venues` reuses `rankVenues()`; match-% badge on `VenueCard`. `rfp-matching.ts` capacity/price dimensions now award full marks when unconstrained.
- **Event type in search (#7 follow-up)** — a "Why" segment in the search pill + an Event-type filter in `FilterPanel`; `event_type` URL param filtered on the venues page and the bounds API (via a secondary `event_types` lookup, no RPC change).
- **Filter modal overhaul** — staged (applies only on "Show results"), wider, lighter overlay (`bg-black/40`), **dynamic max price** (highest active-venue hourly price, not hardcoded), Sort beside Event type. **Map-drag now keeps filters** (bounds search carries + applies capacity/price/sort/amenities/event_type).
- **Search form compact mode** — the navbar (results-page) search pill is shorter with labels hidden; collapsed search button resized so it isn't clipped. DatePanel flex pills moved to the bottom + fixed the ±N-day selection not showing on the calendar.
- **Messages → chat app** — two-pane layout (conversation list left, thread right) in `messages/layout.tsx` (footer removed, full-height); `ConversationList` is **realtime** (live last message, unread bump-to-top, reset on open) and **sorted by recency**; `MessageThread` has avatars, day separators, message grouping, an **emoji picker**, **optimistic send** (instant bubble + sending/sent status), and the page-scroll-to-bottom bug is fixed (scrolls the container, not the window).
- **Landing page** — auto-rotating hero collage (`HeroCollage`), 5th feature card ("Smart matching"), "View more" button that resolves nearby/Tel-Aviv like an empty search, and the **bookings-completed stat fixed to the overall total** (was RLS-scoped per-user) + rounded for social proof (`approxCount`).
- **Venue detail** — Share button (`ShareVenueButton`, Web Share + clipboard), "About the host" section, 2-month availability calendar, cancellation policy moved to the bottom, and the map's "ctrl+scroll" overlay removed (`gestureHandling: 'greedy'`).
- **Admin analytics** — new **Analytics tab** on `/admin/dev`: revenue/GMV-over-time + registrations bar charts (`MonthlyBarChart`, dependency-free) and top-venues-by-bookings, backed by pure helpers in `src/lib/admin-analytics.ts`.

---

### UX Batch · Time-slot Availability · Turnaround Buffer (session 12)
All on `main` (about to be committed). **Migrations 019, 020, 021 applied 2026-06-27.**

**17-item UX batch**
- **Auth**: Google brand icon on all "Continue with Google" buttons (`GoogleIcon`); reusable themed `BrandBackground` (purple gradient + blobs) behind the auth modal, onboarding, hero. **Auth-modal "not appearing" regression fixed** — `relative` on a `fixed` `DialogContent` was dropped by tailwind-merge (see MEMORY).
- **Navbar**: bordered icon buttons; menu items now carry icons; **host↔guest mode switch** — hosts/admins see traveler links + "Switch to hosting", host sidebar + admin get an explicit exit; **per-navigation auth flicker fixed** via a root-layout `UserProvider` (server-seeded `useCurrentUser`, no per-mount refetch).
- **Search**: "Nearby" now fills the Where field instantly (cached geolocation); **date filtering implemented** ("any free day in range" — was collected but ignored) in `src/lib/availability-filter.ts`, wired into the venues page + bounds API; one-click **"Best match"** pill in the results toolbar; bigger/crisper match badge.
- **Venue detail**: reordered (photos → about → amenities → availability → reviews → location → host) with reviews/location/host **full-width**; **interactive sticky booking widget** (date + hour/day + live price → checkout); **"Things to know"** (house rules + cancellation, each with a Learn-more modal, rules line-by-line).
- **Listing form**: **house rules** field (migration 019 `venues.rules`); explicit **reservation-system** toggle (per hour / per day / both).
- **Content/data**: refreshed `adminSeedVenues` (11 venues, photos, catalog amenity keys, event types, rules, mixed modes); **Help Center** at `/help` + `/help/[slug]` (booking/hosting/payments/trust-safety/faq) linked from footer + menu.
- **Messaging**: **lazy conversation creation** — "Contact host" opens a `/messages/new` composer; the conversation row + first message are created together via `sendFirstMessage`, so an accidental click no longer leaves an empty thread in both inboxes. Contact-host button moved into the host section.

**Map / venue-detail fixes**
- Map markers show price for day-only venues (`price_per_hour ?? price_per_day`); marker popup link opens in a new tab; hovering a marker raises it above overlapping neighbours; venue-detail map taller + higher zoom (fullscreen control later removed per request).
- Availability month calendar: strikethrough on unavailable days (the v8 `day_disabled` class was a no-op under v9 — use `disabled`), wider/no-border, month-nav arrows restored (`relative` on `months`), legend removed.

**Time-slot (week-view) availability** · migration 020
- `venues.opening_time`/`closing_time` + new `availability_blocks` table (per-hour host blocks; public read, host-manage RLS).
- `src/lib/availability-slots.ts` (hourly slots, week helpers, slot-state, taken-ranges, buffer expansion); reusable `WeekAvailabilityGrid` (host: click slots / day headers to block-free; renter: click to select a start→checkout range or a whole day).
- **Month/Week toggle** on both the renter venue page (`AvailabilitySection`) and the host dashboard (`HostAvailabilityManager`, `/host/calendar`).
- **Booking flow is now time-slot aware** — the widget no longer blocks a whole day after one partial booking; Start/End dropdowns filter against bookings + host blocks + operating hours; the EXCLUDE constraint stays the safety net. Whole-day grid selection resolves to the **day rate** when one exists (not hours × hourly).

**Turnaround buffer** · migration 021
- `venues.buffer_minutes` + a "Turnaround between bookings" selector in the listing form. Enforced in `requestBooking` (admin-client clash check, since RLS hides other renters' bookings) and reflected in availability (bookings padded by the buffer in the renter grid + widget dropdowns).

**Final navbar tweaks**
- Header: removed theme + chat buttons, added a **placeholder notification bell** (system not built yet); menu trimmed (removed Find venues / How it works / Pricing, kept Help center); host/admin exit links relabeled "Exit hosting" / kept "Back to site" and now redirect to `/`.

---

### Notification System · Auth Overhaul · Maps Fixes · Custom Domain + SEO (session 13)
On `feat/notifications`. **Migration 022 applied.** No other migrations.

**Notification system** · [#73](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/73) — replaces the placeholder navbar bell with a real Realtime feed (modeled on the messaging pattern).
- **Migration `022_notifications.sql`** — `notifications` table (`user_id, type, data jsonb, link, is_read, created_at`), owner-scoped RLS (read/update/delete; **no INSERT policy** — cross-user rows are written only via the service-role admin client), registered with the `supabase_realtime` publication.
- `src/lib/notifications.ts` — `notify()` server helper (admin client, fire-and-forget like the email senders). `src/lib/notification-copy.ts` — shared types + bilingual (he/en) title/body renderer so text matches the **viewer's** locale, not the actor's.
- Wired into 6 lifecycle events next to the email sends: booking requested→host, accepted→renter, declined→renter, cancelled→host (`bookings.ts`), new message→other party (`messages.ts`), new review→host (`reviews.ts`).
- `useNotifications()` (feed) + `useUnreadNotifications()` (count) hooks — Realtime, unique channel names so the bell + panel can co-mount. `NotificationBell` (navbar dropdown, unread badge, mark-read, deep-links) replaces the placeholder; `NotificationsPanel` + `/notifications` page (in `middleware.ts`); host sidebar gets a Notifications link with badge. `src/actions/notifications.ts` — `markAllNotificationsRead`, `markNotificationRead`.

**Auth overhaul** (login/signup pages + modal) — addresses 7 reported issues.
- **Login is now client-side** (browser Supabase client) so `onAuthStateChange` fires and the navbar + modal update **instantly** — fixes the "authenticated in the background but UI stale until refresh" bug. `UserProvider` also adopts a refreshed `initialUser`.
- **Register rewritten** — first/last name, **confirm password**, **password show/hide eye** (`PasswordInput`), inline per-field red errors, and an email-verification **"check your inbox"** state. `signUp` returns typed error codes (no throws) incl. `rate_limit` / `email_send` so Supabase mailer failures aren't mislabeled as "invalid email".
- Logged-out **"Become a host" → login modal** (may already have a renter account). **Google-only accounts** get a friendly "use Continue with Google" message (`getAuthMethod`). **hCaptcha** scaffolded (`HCaptchaWidget`, no-op without `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`). Callback handles both `?code=` and `?token_hash=` verification links + expired-link errors. New shared `LoginForm`/`RegisterForm` used by both the modal and the `/login`+`/register` pages.

**Google Maps console-warning fixes** — added `&loading=async` to all four Maps JS loaders; removed the inline `styles` from the two maps that also set `mapId` (ignored when a `mapId` is present).

**Custom domain `venuecharm.com` + SEO** — domain purchased via Vercel. Code is fully env-driven (no hardcoded URLs), so production is driven by Vercel env. Added `src/app/robots.ts` + `src/app/sitemap.ts` (static + Help articles + all ACTIVE venues, all via `NEXT_PUBLIC_APP_URL`). Synced `.env.example` (added `GOOGLE_MAPS_API_KEY`, `STRIPE_WEBHOOK_SECRET_CONNECT`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`). Dashboard config (Supabase URLs, Stripe webhooks, Google OAuth/Maps, Resend domain + Supabase SMTP) done outside the repo.

---

## ❌ Not Yet Built

- **(none of the previously-listed items remain unbuilt — notification system shipped this session)**

---

## 🔧 Immediate Next Steps (Priority Order)

_✅ Migration **022** applied, **Vercel env** updated for `venuecharm.com` (`NEXT_PUBLIC_APP_URL`, `GOOGLE_OAUTH_REDIRECT_URI`, `GOOGLE_MAPS_API_KEY`, `EMAIL_FROM`), and `.env.local` updated (2026-06-29). The notification bell is live. Verify in a browser on production: signup→confirmation email, login updates the header instantly, "Become a host" (logged out) opens login, the bell receives a live booking/message/review event._

_Also done 2026-06-29: ✅ Resend domain verified + Supabase SMTP, "Confirm email" on ([#57](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/57)); ✅ hCaptcha activated on signup/login ([#75](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/75))._

1. **Merge `feat/notifications` → `main`** ([PR #76](https://github.com/Abdalrahman-Muhtaseb/venuecharm/pull/76) → CI → Vercel deploy), then production smoke test.
2. **Submit sitemap** to Google Search Console now that the domain is live.
3. **Google Maps key hardening** — split the public (Maps JS/Places, referrer-locked) vs server (`GOOGLE_MAPS_API_KEY`, Geocoding-only) keys.
