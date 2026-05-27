# VenueCharm — Session Progress

_Last updated: 2026-05-23_

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
- `/listings/new` — venue creation form with Google Maps picker + Cloudinary photo upload + **cancellation policy picker**; redirects to `/host/payouts` when host not onboarded
- `/listings/[id]/edit` — prefilled edit form with existing photo management + cancellation policy
- `/host/bookings` — Pending / Upcoming / Past tabs with booking count badge
- `/host/bookings/[id]` — full booking detail (renter info, dates, price breakdown) with Accept/Decline buttons; Accept gated behind `stripe_charges_enabled` check
- `/host/calendar` — 2-month availability calendar with click-to-toggle (blocked=rose, booked=violet)
- `/host/payouts` — 3-state Stripe Connect UI: not started / in progress / complete; payout history list
- Server actions: `createVenue` (gated by Connect onboarding), `updateVenue`, `deleteVenue`, `acceptBooking`, `declineBooking`, `cancelOwnBooking`, `setAvailability`

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
- `(admin)/layout.tsx` — ADMIN role guard (non-ADMIN → redirect to `/`)
- `/admin` — tabbed table: PENDING_APPROVAL / ACTIVE / SUSPENDED venues
- `/admin/[id]` — read-only venue detail page for review
- `AdminActionButtons` — Client Component: approve (→ ACTIVE) / suspend (→ SUSPENDED)
- `approveVenue()` + `suspendVenue()` server actions in `src/actions/venues.ts`
- Navbar shows "Admin panel" link when `role === 'ADMIN'`

### Renter Side
- `/` — homepage with hero, highlights, featured venues grid (up to 100 from DB), CTA
- `/venues` — split-view search (collapsible filter sidebar + venue list + sticky Google Map)
  - SearchBar updates URL params; FilterPanel (sort, price slider, amenity checkboxes); FilterSidebar (collapse toggle)
  - MapView with synced pins, selected-pin highlight, scroll-to-card on pin click
  - PostGIS `search_venues_nearby` RPC for geo search; city ilike fallback; 100-venue default limit
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

### Stripe Keys Required
- All Stripe code is written and deployed locally. Need live test keys in `.env.local`.
- For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Webhook secret from `stripe listen` output → `STRIPE_WEBHOOK_SECRET`

### Migration 005 Must Be Applied
- `supabase/migrations/005_stripe_connect.sql` adds all Stripe Connect + cancellation columns
- **If not yet applied:** `requestBooking` will fail (missing `cancellation_deadline` column); `createVenue` will fail (missing `cancellation_policy` param); host dashboard Connect banner will error
- Apply by pasting `005_stripe_connect.sql` in Supabase SQL Editor (run entire file at once)

### Google Maps (Geo Search + Map)
- All code written. Blocked by `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` not in `.env.local`
- Map panel shows "Map not configured". Search falls back to city-name ilike (still works, no distance sort)

### `updateVenue` Location Not Updating
- Edit form accepts new lat/lng but `updateVenue` server action skips the PostGIS geography column
- Location stays as the original after edit
- Fix requires a new RPC or raw SQL via admin client

---

## ❌ Not Yet Built

- **Reviews** — schema exists (`reviews` table), no UI to submit or display ratings
- **In-app messaging** — schema exists (`conversations`, `messages`), no UI
- **Email notifications** — Resend key in `.env.example` but no email sending code written
- **RFP (Smart Matching)** — schema exists (`rfps`, `rfp_matches`), no UI (GitHub issue #11 still open)
- **Vercel deployment** — not yet deployed to production
- **CI/CD** — `.github/workflows/ci.yml` planned but not created
- **Admin analytics dashboard** — revenue, GMV, top venues (only venue moderation is built)

---

## 🔧 Immediate Next Steps (Priority Order)

1. **Apply migration 005** in Supabase SQL Editor — unblocks Stripe Connect + cancellation flow
2. **Add Stripe test keys** + run `stripe listen` for webhooks — activates full Connect payment flow
3. **End-to-end Stripe Connect test** — onboard as host, book as renter, accept, refund, verify Stripe Dashboard
4. **Add Google Maps API key** — activates geo search + map view
5. **Fix `updateVenue` location** — create `update_venue_location` RPC
6. **Commit all uncommitted work** — everything from this session is untracked
7. **Reviews system** — UI for leaving + displaying ratings
8. **Email notifications** — hook up Resend for booking confirmation / accept / reject emails
9. **Deploy to Vercel** — add all env vars, connect domain
10. **CI/CD** — `.github/workflows/ci.yml`
