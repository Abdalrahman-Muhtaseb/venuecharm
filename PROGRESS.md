# VenueCharm — Session Progress

_Last updated: 2026-06-04_

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
- Profile page with edit (first/last name, phone)
- Middleware protects: `/dashboard`, `/listings`, `/host/*`, `/profile`, `/bookings`, `/admin`

### Host Side
- `(host)/layout.tsx` — role guard (non-HOST → redirect to `/profile`)
- `/dashboard` — 4 KPI cards (active listings, pending requests, upcoming bookings, **real revenue from CONFIRMED+COMPLETED bookings**) + recent activity feed + Stripe Connect onboarding banner when not onboarded
- `/listings` — table of all host venues with status badges, edit links, soft-delete (confirm dialog)
- `/listings/new` — redesigned venue creation form: Google Maps picker (address/city auto-filled by pin drop, lat/lng hidden), **AmenitiesPicker** (12 toggle buttons: WiFi, Parking, AV, Kitchen, Outdoor, Accessible, AC, Projector, Shower, Coffee, Gym, Music), **WeekdayPicker** for default availability (pre-populates `availability` table for next 90 days), cancellation policy picker, Cloudinary photo upload
- `/listings/[id]/edit` — prefilled edit form with AmenitiesPicker (pre-selected), existing photo management, cancellation policy; lat/lng visible inputs removed
- `/host/bookings` — Pending / Upcoming / Past tabs with booking count badge
- `/host/bookings/[id]` — full booking detail (renter info, dates, price breakdown) with Accept/Decline buttons; Accept gated behind `stripe_charges_enabled` check
- `/host/calendar` — 2-month availability calendar with click-to-toggle (blocked=rose, booked=violet)
- `/host/payouts` — 3-state Stripe Connect UI: not started / in progress / complete; payout history list
- Server actions: `createVenue` (saves amenities + seeds 90-day availability), `updateVenue` (saves amenities), `deleteVenue`, `acceptBooking`, `declineBooking`, `cancelOwnBooking`, `setAvailability`

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
- `/` — homepage with hero, highlights, featured venues grid (up to 100 from DB), CTA
- `/venues` — **Airbnb-style split-view search**: collapsible filter sidebar + venue list + sticky map
  - **MapView** — `AdvancedMarkerElement` price bubble markers (₪X/hr white pill → purple on select), InfoWindow popup card (photo, title, city, capacity, price, link to detail), "Search as I move the map" checkbox (fetches `/api/venues/search` on map `idle` event), `searchKey` prevents fitBounds on pan-only updates
  - **Mobile**: floating "Show map / Show list" pill toggle, map goes fullscreen on mobile
  - `SearchResults` tracks `liveVenues` state — updates from both URL-driven server fetch and client-side bounds search
  - Default view (no query, no coords): Israel center (31.5, 34.85) with 500 km radius via PostGIS RPC — all venues get real lat/lng for map pins
  - SearchBar updates URL params; FilterPanel (sort, price slider, amenity checkboxes); FilterSidebar (collapse toggle)
- `/venues/[id]` — full detail page: VenuePhotoGallery (lightbox), VenueAmenityList (icon chips), AvailabilityCalendar (read-only), BookingWidget (sticky sidebar), **cancellation policy display**
- `/venues/[id]/book` — BookingForm with Hourly/Full Day tabs, live PriceBreakdown (subtotal + 15% fee)
- `/venues/[id]/checkout` — order summary + Stripe Elements (or placeholder if Stripe not configured)
- `/venues/[id]/booking-confirmed` — success page (Stripe return URL)
- `/bookings` — renter's own bookings: Pending / Upcoming / Past tabs
- `/bookings/[id]` — booking detail with venue card, dates, price, status; refund preview; cancel button

### Marketing
- `/how-it-works` — 3-step explainer
- `/pricing` — commission model (15% renter, 0% host listing fee)

### Global
- `not-found.tsx`, `error.tsx`, `loading.tsx` boundaries
- `<Toaster />` (sonner) in root layout — toast notifications throughout
- 50 seeded venues with amenities (WiFi, Parking, AV, etc.) populated via SQL update

---

## ⚠️ Partially Working / Needs Configuration

### `updateVenue` Location Not Updating
- Edit form accepts new lat/lng via map picker but `updateVenue` server action skips the PostGIS geography column
- Location stays as the original after edit; map pin doesn't move for edited venues
- Fix requires a new RPC (`update_venue_location`) or raw SQL via admin client — tracked as GitHub issue #35

---

## ❌ Not Yet Built

- **Reviews** — schema exists (`reviews` table), no UI to submit or display ratings · [#36](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/36)
- **In-app messaging** — schema exists (`conversations`, `messages`), no UI
- **Email notifications** — Resend key in `.env.example` but no email sending code written · [#37](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/37)
- **RFP (Smart Matching)** — schema exists (`rfps`, `rfp_matches`), no UI · [#11](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/11)
- **Vercel deployment** — not yet deployed to production
- **CI/CD** — `.github/workflows/ci.yml` planned but not created

---

## 🔧 Immediate Next Steps (Priority Order)

1. **Commit all uncommitted work** — all session changes are untracked
2. **Fix `updateVenue` location** — create `update_venue_location` RPC · [#35](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/35)
3. **Reviews system** — `ReviewForm` on completed bookings, average rating on venue detail · [#36](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/36)
4. **Email notifications** — hook up Resend for booking lifecycle emails · [#37](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/37)
5. **Deploy to Vercel** — add all env vars, connect domain
