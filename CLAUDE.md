# VenueCharm — Claude Code Reference

## Project Overview
Two-sided venue marketplace connecting Event Organizers (Renters) with Venue Owners (Hosts). Targets the Israeli market with Hebrew/RTL support, ILS currency, and PostGIS geospatial search.

**Student:** Abdalrahman Muhtaseb · **Advisor:** Dr. Yehuda Hassin · **Institution:** Azrieli College of Engineering, Jerusalem

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript strict mode |
| Styling | Tailwind CSS + tailwindcss-rtl + shadcn/ui (Radix primitives) |
| Backend/Auth | Supabase (PostgreSQL + PostGIS + RLS + Realtime) |
| Payments | Stripe Connect Express (destination charges, manual capture, ILS currency) |
| Images | Cloudinary |
| Maps | Google Maps JS API + Geocoding API |
| Email | Resend (configured but not yet implemented) |
| Deployment | Vercel (not yet deployed) |

---

## Architecture

### Route Groups (Next.js App Router)
```
src/app/
├── (auth)/          → /login, /register, /verify-email  [AuthShell layout]
├── (marketing)/     → /how-it-works, /pricing           [PublicNavbar + Footer]
├── (host)/          → /dashboard, /listings, /host/*    [HostSidebar layout + HOST role guard]
├── (admin)/         → /admin, /admin/[id], /admin/dev   [ADMIN role guard, PublicNavbar + AdminSubNav + Footer]
├── venues/          → /venues, /venues/[id]/**           [PublicNavbar + Footer]
├── bookings/        → /bookings, /bookings/[id]          [PublicNavbar + Footer, RENTER]
├── profile/         → /profile                           [PublicNavbar + Footer, shared by all roles]
└── page.tsx         → / (homepage)
```

**Critical routing rule:** Route groups `(host)` / `(admin)` don't affect URLs. To get URL `/host/bookings`, the file lives at `src/app/(host)/host/bookings/page.tsx`. To get `/admin`, the file lives at `src/app/(admin)/admin/page.tsx`.

### Key Directories
```
src/
├── actions/         # Next.js Server Actions (auth, venues, bookings, stripe-connect, availability, admin)
│                    # admin.ts — changeUserRole, toggleVerified, cancelBooking, seedVenues, seedTestUsers,
│                    #            resetVenuesToPending, cancelAllPending, deleteTestVenues, deleteAllBookings
├── components/
│   ├── ui/          # shadcn/ui generated primitives — DO NOT hand-edit
│   ├── layout/      # PublicNavbar, HostSidebar, Footer, AuthShell
│   ├── admin/       # AdminActionButtons (approve/suspend), AdminSubNav, UserRoleButton,
│   │                # AdminCancelBookingButton, SeedDataPanel, DangerZonePanel
│   ├── booking/     # BookingForm, BookingWidget, AvailabilityCalendar, StripePaymentForm, CancelBookingButton
│   ├── search/      # SearchBarAutocomplete (Places API dropdown → URL push), SearchBar, FilterPanel, FilterSidebar, MapView, SearchResults
│   ├── stripe/      # ConnectOnboardingCard (host Stripe Connect CTA)
│   └── venue/       # VenueCard, VenueGrid, VenuePhotoGallery, VenueAmenityList, CancellationPolicyPicker,
│                    # AmenitiesPicker (24 toggle buttons, 5 categories), HostAvailabilityEditor, venue-creation-form, venue-edit-form
├── lib/
│   ├── supabase/    # client.ts (browser), server.ts (RSC/actions), admin.ts (service role)
│   ├── stripe.ts    # Stripe instance + toChargeAmount() + isStripeConfigured()
│   ├── stripe-connect.ts  # createConnectAccount(), createOnboardingLink(), splitChargeAmount()
│   ├── cancellation.ts    # computeDeadline(), refundPercent() — pure math, no I/O
│   ├── google-maps.ts  # geocodeAddress(), reverseGeocodeCoordinates()
│   └── i18n.ts      # translations (he/en), formatCurrencyILS(), formatDateLocalized()
└── middleware.ts    # Protects: /dashboard, /listings, /host, /admin, /bookings, /profile
```

---

## Database (Supabase / PostgreSQL + PostGIS)

### Tables
- `users` — id, email, first_name, last_name, phone_number, avatar_url, role (RENTER/HOST/ADMIN), is_verified, **stripe_account_id**, **stripe_charges_enabled**, **stripe_payouts_enabled**, **stripe_details_submitted**
- `venues` — id, host_id, title, description, location (GEOGRAPHY), address, city, price_per_hour, price_per_day, capacity, amenities (JSONB), photos (TEXT[]), status (DRAFT/PENDING_APPROVAL/ACTIVE/SUSPENDED), **cancellation_policy** (FLEXIBLE/MODERATE/STRICT, default MODERATE)
- `bookings` — id, venue_id, renter_id, start_at, end_at, total_price, status, notes, created_at, **cancellation_deadline**, **cancelled_at**. Has EXCLUDE GIST constraint preventing double-bookings.
- `payments` — id, booking_id, renter_id, amount, currency, stripe_payment_intent_id, status, **platform_fee_amount**, **host_payout_amount**, **stripe_transfer_id**, **stripe_refund_id**, **refund_amount**
- `availability` — id, venue_id, date, is_available (UNIQUE venue_id+date)
- `reviews`, `conversations`, `messages`, `rfps`, `rfp_matches` — schema exists, UI not built

### Migrations (apply in order in Supabase SQL Editor)
1. `001_initial_schema.sql` — all tables + RLS enable
2. `002_create_venue_listing_function.sql` — `create_venue_listing()` RPC (used by venue creation form)
3. `003_search_venues_function.sql` — `search_venues_nearby()` PostGIS RPC (must be applied for geo search to work)
4. `004_booking_policies.sql` — `notes` column on bookings + RLS INSERT/UPDATE policies for bookings/payments + availability RLS
5. `005_stripe_connect.sql` — cancellation_policy enum, Stripe Connect columns on users, cancellation_deadline/cancelled_at on bookings, payout/refund columns on payments, updated `create_venue_listing()` RPC with cancellation_policy param
6. `006_search_lat_lng.sql` — drops and recreates `search_venues_nearby()` to return `lat` and `lng` columns (extracted from PostGIS `location` via `ST_Y`/`ST_X`). Required DROP because PostgreSQL disallows changing a function's return type via `CREATE OR REPLACE`.

### RPC Functions
- `create_venue_listing(p_title, p_description, p_address, p_city, p_capacity, p_latitude, p_longitude, p_price_per_hour, p_price_per_day, p_cancellation_policy)` — creates venue with PostGIS geography point, returns UUID. **Updated in migration 005** to accept cancellation_policy.
- `search_venues_nearby(lat, lng, radius_km, capacity_min, price_max, limit, offset)` — PostGIS ST_DWithin query, returns venues with `distance_km`, `lat`, `lng` (extracted from geography column). Updated in migration 006.

### Important RLS Notes
- Venues: public SELECT only for ACTIVE venues. Hosts manage their own.
- Bookings: renters INSERT (for themselves), renters/hosts SELECT (own records). Hosts UPDATE (accept/decline).
- The admin client (`src/lib/supabase/admin.ts`) bypasses RLS — only use in trusted server-side code.
- **Admin pages must use `createAdminClient()` for ALL queries** (not just writes). The regular client hides PENDING_APPROVAL and SUSPENDED venues from admin users because RLS only exposes ACTIVE venues publicly. Using the regular client for selects on the admin panel produces silently empty results.

---

## Payments (Stripe Connect)

**Full flow:**
1. Renter submits BookingForm → `requestBooking` inserts PENDING booking with `cancellation_deadline`
2. `requestBooking` creates a Stripe PaymentIntent with `capture_method: manual`, `transfer_data.destination = host.stripe_account_id`, `application_fee_amount = 15%`
3. Renter redirected to `/checkout` → Stripe Elements capture card → PI status = `requires_capture`
4. Webhook fires `payment_intent.amount_capturable_updated`
5. Host accepts → `acceptBooking` captures PI → Stripe automatically transfers 85% to host Connect account
6. Webhook fires `transfer.created` → `payments.stripe_transfer_id` is stored
7. Host declines → `declineBooking` cancels PI (no money moved)
8. Renter cancels PENDING → PI cancelled (no capture)
9. Renter cancels CONFIRMED → `cancelOwnBooking` issues refund via `stripe.refunds.create()` with `reverse_transfer: true` + `refund_application_fee: true` **only when `stripe_transfer_id` exists**

**Commission:** `PLATFORM_COMMISSION_RATE=0.15` (15%). `splitChargeAmount(baseILS)` in `src/lib/stripe-connect.ts` returns `{ grossAgorot, hostPayoutAgorot, applicationFee }`. `total_price` stored in bookings = base price (before fee).

**Stripe Connect gating:** `createVenue` throws if `users.stripe_charges_enabled = false`. Host dashboard shows a banner + CTA to `/host/payouts` when not onboarded.

**Guard:** All Stripe calls wrapped in `isStripeConfigured()` — app works without keys (checkout shows a placeholder).

### Stripe Connect Onboarding Flow
1. Host visits `/host/payouts`
2. Clicks "Connect Stripe account" → `ConnectOnboardingCard` POSTs to `/api/stripe/connect/onboard`
3. API creates/reuses Connect Express account → calls `stripe.accountLinks.create()` → returns `{ url }`
4. Browser redirects to Stripe's hosted onboarding
5. On completion, Stripe redirects to `/api/stripe/connect/return` → `refreshStripeStatus()` syncs DB → redirect to `/host/payouts`
6. If link expires, Stripe redirects to `/api/stripe/connect/refresh` → new link generated → redirect
7. Webhook `account.updated` fires when status changes → syncs `stripe_charges_enabled` automatically

### Cancellation Policies
Defined in `src/lib/cancellation.ts`:
- **FLEXIBLE** — full refund if cancelled ≥ 24h before start; 0% after
- **MODERATE** — 100% if ≥ 7 days before; 50% if ≥ 24h before; 0% after
- **STRICT** — 50% if ≥ 7 days before; 0% after

`computeDeadline(policy, startAt)` is stored on the booking at creation time.  
`refundPercent(policy, cancelledAt, startAt)` is called at cancellation time to compute the actual refund.

---

## Auth / OAuth

**Email/password:** `signUp` server action → Supabase `auth.signUp()` with `role` in `options.data`

**Google OAuth:**
1. `RegisterForm` (Client Component) holds `role` state — both email form and Google button read from the same state
2. `signUpWithGoogle(role)` stores role in `venuecharm-pending-role` cookie (5-min TTL, httpOnly)
3. Google OAuth redirect → `/api/auth/callback` exchanges code for session
4. Callback upserts into `public.users` reading role from cookie; deletes cookie; `ignoreDuplicates: true` so returning users keep their role
5. `POST /api/auth/signout` route handler calls `supabase.auth.signOut()` then redirects to `/`

---

## i18n / Localization

- **Default locale:** Hebrew (`he`) with RTL direction
- **Languages:** `he` (Hebrew, RTL) and `en` (English, LTR)
- **Locale storage:** Cookie `venuecharm-locale`
- **Currency:** ILS via `formatCurrencyILS(value, locale)` from `src/lib/i18n.ts`
- **Dates:** `formatDateLocalized(isoString, locale)` from `src/lib/i18n.ts`
- **RTL:** `tailwindcss-rtl` plugin — use `ms-*`/`me-*`/`ps-*`/`pe-*` instead of `ml-*`/`mr-*`/`pl-*`/`pr-*` for RTL-safe spacing
- **Namespaces in `i18n.ts`:** `auth`, `admin`, `renterBookings`, `stripeConnect`, `cancellation`, `hostInbox`
- **Adding translations:** Edit `translations` object in `src/lib/i18n.ts` — both `he` and `en` must have matching keys

---

## Coding Rules & Conventions

1. **No comments** unless the WHY is non-obvious.
2. **shadcn/ui components** live in `src/components/ui/` — never hand-edit them beyond first-pass theming.
3. **Server actions** in `src/actions/` — always verify auth at the top, use `createClient()` (not admin) unless bypassing RLS is intentional and safe.
4. **Supabase joins** return either a single object or an array depending on relationship cardinality. Always handle both: `Array.isArray(data.venues) ? data.venues[0] : data.venues`.
5. **Subqueries in `.in()`** don't work in Supabase JS — always fetch IDs first, then pass as an array.
6. **Server action redirects** from client components: re-throw errors containing `NEXT_REDIRECT`.
7. **RTL spacing** — always use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`) not physical (`ml-`, `mr-`, etc.).
8. **TypeScript** — strict mode, `npx tsc --noEmit` must pass before every commit.
9. **Image domains** — Cloudinary and Unsplash domains are whitelisted in `next.config.mjs`. Add new domains there.
10. **Environment** — `NEXT_PUBLIC_*` vars are exposed to the client. Never put secrets in `NEXT_PUBLIC_*`. Use `SUPABASE_SERVICE_ROLE_KEY` only in `src/lib/supabase/admin.ts`.
11. **Stripe RefundCreateParams** — import type as `import Stripe from 'stripe'` and use `Stripe.RefundCreateParams`. Do NOT use `Parameters<typeof stripe.refunds.create>[0]` — that resolves to the wrong overload.
12. **Supabase SQL migrations** — the SQL Editor runs each execution in a single transaction. If any statement fails, ALL prior statements in that run roll back (including `CREATE TYPE`). Fix the error and re-run the entire migration from scratch.

---

## Environment Variables (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # server-only, never NEXT_PUBLIC_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pk_test_...
STRIPE_SECRET_KEY=                   # sk_test_...
STRIPE_WEBHOOK_SECRET=               # whsec_... (from stripe listen)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=     # needs Maps JS API + Geocoding API enabled
RESEND_API_KEY=                      # re_... (not yet wired up)
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_COMMISSION_RATE=0.15
```

---

## Dev Commands

```bash
npm run dev        # starts on localhost:3000
# For network access (other devices on same Wi-Fi):
next dev -H 0.0.0.0    # then use machine's LAN IP, e.g. http://10.116.231.85:3000
npm run build
npx tsc --noEmit   # type check only
# Local Stripe webhook forwarding:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
