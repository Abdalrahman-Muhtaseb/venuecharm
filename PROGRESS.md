# VenueCharm — Session Progress

_Last updated: 2026-04-30_

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
- Google OAuth with callback at `/api/auth/callback`
- Profile page with edit (first/last name, phone)
- Middleware protects: `/dashboard`, `/listings`, `/host/*`, `/profile`, `/bookings`, `/admin`

### Host Side
- `(host)/layout.tsx` — role guard (non-HOST → redirect to `/profile`)
- `/dashboard` — 4 KPI cards (active listings, pending requests, upcoming bookings, revenue placeholder) + recent activity feed
- `/listings` — table of all host venues with status badges, edit links, soft-delete (confirm dialog)
- `/listings/new` — venue creation form with Google Maps picker + Cloudinary photo upload
- `/listings/[id]/edit` — prefilled edit form with existing photo management
- `/host/bookings` — Pending / Upcoming / Past tabs with booking count badge
- `/host/bookings/[id]` — full booking detail (renter info, dates, price breakdown) with Accept/Decline buttons
- `/host/calendar` — 2-month availability calendar with click-to-toggle (blocked=rose, booked=violet)
- Server actions: `createVenue`, `updateVenue`, `deleteVenue`, `acceptBooking`, `declineBooking`, `setAvailability`

### Renter / Discovery Side
- `/` — homepage with hero, highlights, featured venues grid (up to 100 from DB), CTA
- `/venues` — split-view search (collapsible filter sidebar + venue list + sticky Google Map)
  - SearchBar updates URL params; FilterPanel (sort, price slider, amenity checkboxes); FilterSidebar (collapse toggle)
  - MapView with synced pins, selected-pin highlight, scroll-to-card on pin click
  - PostGIS `search_venues_nearby` RPC for geo search; city ilike fallback; 100-venue default limit
- `/venues/[id]` — full detail page: VenuePhotoGallery (lightbox), VenueAmenityList (icon chips), AvailabilityCalendar (read-only, disabled dates from availability + bookings), BookingWidget (sticky sidebar)
- `/venues/[id]/book` — BookingForm with Hourly (date + 30-min time selects) and Full Day tabs, live PriceBreakdown (subtotal + 15% fee)
- `/venues/[id]/checkout` — order summary + Stripe Elements (or placeholder if Stripe not configured)
- `/venues/[id]/booking-confirmed` — success page (Stripe return URL)

### Marketing
- `/how-it-works` — 3-step explainer
- `/pricing` — commission model (15% renter, 0% host listing fee)

### Global
- `not-found.tsx`, `error.tsx`, `loading.tsx` boundaries
- `<Toaster />` (sonner) in root layout — toast notifications throughout

---

## ⚠️ Partially Working / Needs Configuration

### Stripe Payments
- **All code is written** — `src/lib/stripe.ts`, `src/actions/bookings.ts` (requestBooking/acceptBooking/declineBooking), `src/app/api/stripe/create-payment-intent/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/components/booking/StripePaymentForm.tsx`
- **Blocked by:** `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` not yet added to `.env.local`
- **Current behaviour:** Checkout page shows a "Stripe coming soon" placeholder. Bookings still create correctly in DB.
- **To activate:** Add Stripe test keys to `.env.local`. For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI, Windows: download from stripe.com/docs/stripe-cli)

### Google Maps (Geo Search + Map)
- **All code is written** — geocoding in `/api/venues/search`, MapView component, venue map picker
- **Blocked by:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` not yet added to `.env.local`
- **Current behaviour:** Map panel shows "Map not configured". Search falls back to city-name ilike filter (still works but no distance sort). Venue creation uses manual lat/lng inputs.
- **To activate:** Add key to `.env.local`. Requires: Maps JavaScript API + Geocoding API enabled in Google Cloud Console.

### PostGIS Search Function
- Migration `003_search_venues_function.sql` creates `search_venues_nearby()` RPC.
- **If not yet applied:** Search falls back to city ilike. Apply by pasting `003_search_venues_function.sql` in Supabase SQL Editor.
- **Note:** The initial apply used DEFAULT 24 limit. Re-run the updated version (DEFAULT 100) for full results.

### Migration 004 (Booking Policies)
- `004_booking_policies.sql` adds the `notes` column to bookings and all RLS INSERT/UPDATE policies.
- **If not yet applied:** `requestBooking` will fail with "column notes does not exist". Apply in Supabase SQL Editor.

---

## ❌ Not Yet Built

- **Admin panel** — no moderation UI (venue approve/reject, user management, analytics). Venues currently go to `PENDING_APPROVAL` status and stay there until manually changed in Supabase dashboard.
- **Reviews** — schema exists (`reviews` table), no UI to submit or display ratings
- **In-app messaging** — schema exists (`conversations`, `messages`), no UI
- **Email notifications** — Resend key in `.env.example` but no email sending code written
- **Renter bookings list** — renters have no `/bookings` page to see their past/upcoming bookings
- **RFP (Smart Matching)** — schema exists (`rfps`, `rfp_matches`), no UI (GitHub issue #11 still open)
- **Vercel deployment** — not yet deployed to production
- **CI/CD** — `.github/workflows/ci.yml` planned but not created yet

---

## 🔧 Immediate Next Steps (Priority Order)

1. **Apply migration 004** in Supabase SQL Editor (`004_booking_policies.sql`) — unblocks booking flow
2. **Add Stripe test keys** to `.env.local` — activates full payment flow
3. **Add Google Maps API key** to `.env.local` — activates geo search + map
4. **Add amenities to seeded venues** — currently JSONB amenities array is empty for most venues, making the amenity filter useless
5. **Admin moderation panel** — at minimum a way to approve PENDING_APPROVAL venues so they appear in search
6. **Renter bookings page** — `/bookings` or `/profile/bookings` so renters can see their requests
7. **Deploy to Vercel** — add all env vars, connect domain
8. **Write CI/CD workflow** — `.github/workflows/ci.yml`
