# VenueCharm — Session Progress

_Last updated: 2026-06-15 (session 6)_

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
- **Redesigned**: removed nav links (Find Venues, How It Works) and language switcher
- Logo → left; right cluster: "Become a host" (hidden on mobile) → Avatar→/profile (or Sign in + Join) → hamburger DropdownMenu
- Hamburger holds all profile actions: role-specific links (Admin panel / Host dashboard / My bookings) + Sign out; or Sign in / Join when logged out
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

## ❌ Not Yet Built

- **In-app messaging** — schema exists (`conversations`, `messages`), no UI · [#56](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/56)
- **RFP (Smart Matching)** — schema exists (`rfps`, `rfp_matches`), no UI · [#11](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/11)
- **CI/CD** — `.github/workflows/ci.yml` planned but not created · [#55](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/55)
- **Resend sending domain** — emails currently only deliver to the Resend account owner; verify a domain in Resend dashboard + set `EMAIL_FROM` in Vercel to unlock sending to all users

---

## 🔧 Immediate Next Steps (Priority Order)

1. **CI/CD pipeline** — `.github/workflows/ci.yml` with lint + type-check + build · [#55](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/55)
2. **Resend domain verification** — verify sending domain so booking emails reach all users (requires owning a domain; not a `vercel.app` subdomain)
3. **In-app messaging** — build renter + host UI over Supabase Realtime · [#56](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/56)
