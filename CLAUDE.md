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
| Payments | Stripe (manual capture, ILS currency) |
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
├── venues/          → /venues, /venues/[id]/**           [PublicNavbar + Footer]
├── profile/         → /profile                           [PublicNavbar + Footer, shared by all roles]
└── page.tsx         → / (homepage)
```

**Critical routing rule:** Route groups `(host)` don't affect URLs. To get URL `/host/bookings`, the file lives at `src/app/(host)/host/bookings/page.tsx`. This is intentional — it gets the HostSidebar from `(host)/layout.tsx` AND the `/host/` URL prefix.

### Key Directories
```
src/
├── actions/         # Next.js Server Actions (auth, venues, bookings, availability)
├── components/
│   ├── ui/          # shadcn/ui generated primitives — DO NOT hand-edit
│   ├── layout/      # PublicNavbar, HostSidebar, Footer, AuthShell
│   ├── booking/     # BookingForm, BookingWidget, AvailabilityCalendar, StripePaymentForm, etc.
│   ├── search/      # SearchBar, FilterPanel, FilterSidebar, MapView, SearchResults
│   └── venue/       # VenueCard, VenueGrid, VenuePhotoGallery, VenueAmenityList, etc.
├── lib/
│   ├── supabase/    # client.ts (browser), server.ts (RSC/actions), admin.ts (service role)
│   ├── stripe.ts    # Stripe instance + toChargeAmount() + isStripeConfigured()
│   ├── google-maps.ts  # geocodeAddress(), reverseGeocodeCoordinates()
│   └── i18n.ts      # translations (he/en), formatCurrencyILS(), formatDateLocalized()
└── middleware.ts    # Protects: /dashboard, /listings, /host, /admin, /bookings, /profile
```

---

## Database (Supabase / PostgreSQL + PostGIS)

### Tables
- `users` — id, email, first_name, last_name, phone_number, avatar_url, role (RENTER/HOST/ADMIN), is_verified
- `venues` — id, host_id, title, description, location (GEOGRAPHY), address, city, price_per_hour, price_per_day, capacity, amenities (JSONB), photos (TEXT[]), status (DRAFT/PENDING_APPROVAL/ACTIVE/SUSPENDED)
- `bookings` — id, venue_id, renter_id, start_at, end_at, total_price, status, notes, created_at. Has EXCLUDE GIST constraint preventing double-bookings.
- `payments` — id, booking_id, renter_id, amount, currency, stripe_payment_intent_id, status
- `availability` — id, venue_id, date, is_available (UNIQUE venue_id+date)
- `reviews`, `conversations`, `messages`, `rfps`, `rfp_matches` — schema exists, UI not built

### Migrations (apply in order in Supabase SQL Editor)
1. `001_initial_schema.sql` — all tables + RLS enable
2. `002_create_venue_listing_function.sql` — `create_venue_listing()` RPC (used by venue creation form)
3. `003_search_venues_function.sql` — `search_venues_nearby()` PostGIS RPC (must be applied for geo search to work)
4. `004_booking_policies.sql` — `notes` column on bookings + RLS INSERT/UPDATE policies for bookings/payments + availability RLS

### RPC Functions
- `create_venue_listing(...)` — creates venue with PostGIS geography point, returns UUID
- `search_venues_nearby(lat, lng, radius_km, capacity_min, price_max, limit, offset)` — PostGIS ST_DWithin query, returns venues with distance_km

### Important RLS Notes
- Venues: public SELECT only for ACTIVE venues. Hosts manage their own.
- Bookings: renters INSERT (for themselves), renters/hosts SELECT (own records). Hosts UPDATE (accept/decline).
- The admin client (`src/lib/supabase/admin.ts`) bypasses RLS — only use in trusted server-side code.

---

## Payments (Stripe)

**Flow:** Renter submits BookingForm → `requestBooking` creates PENDING booking + Stripe PaymentIntent (capture_method: manual) + payment row → redirected to /checkout → Stripe Elements capture card → PaymentIntent status = `requires_capture` (webhook fires: `payment_intent.amount_capturable_updated`) → Host accepts → `acceptBooking` captures PI → Host declines → `declineBooking` cancels PI.

**Commission:** `PLATFORM_COMMISSION_RATE=0.15` (15%). `toChargeAmount(baseILS)` = `base × 1.15 × 100` agorot. `total_price` stored in bookings = base price (before fee). Stripe charges base × 1.15.

**Guard:** All Stripe calls are wrapped in `isStripeConfigured()` check — the app works without Stripe keys configured (checkout shows a placeholder).

---

## i18n / Localization

- **Default locale:** Hebrew (`he`) with RTL direction
- **Languages:** `he` (Hebrew, RTL) and `en` (English, LTR)
- **Locale storage:** Cookie `venuecharm-locale`
- **Currency:** ILS via `formatCurrencyILS(value, locale)` from `src/lib/i18n.ts`
- **Dates:** `formatDateLocalized(isoString, locale)` from `src/lib/i18n.ts`
- **RTL:** `tailwindcss-rtl` plugin — use `ms-*`/`me-*`/`ps-*`/`pe-*` instead of `ml-*`/`mr-*`/`pl-*`/`pr-*` for RTL-safe spacing
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
```
