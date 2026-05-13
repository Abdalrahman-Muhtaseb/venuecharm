# VenueCharm — Remaining TODO

_All GitHub issues #10–#23 are closed. These are the remaining milestones._

---

## 🔴 Critical (Blocks Demo / MVP)

### Apply pending database migrations
Run in Supabase SQL Editor in this order:
- [ ] `supabase/migrations/003_search_venues_function.sql` — re-run to update DEFAULT 100 limit (if already applied with old DEFAULT 24)
- [ ] `supabase/migrations/004_booking_policies.sql` — adds `notes` column + all missing RLS policies

### Configure environment variables
- [ ] Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env.local` (use US test account, test mode keys)
- [ ] Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env.local` (enable Maps JS API + Geocoding API in Google Cloud Console)
- [ ] Add `STRIPE_WEBHOOK_SECRET` — run `stripe listen --forward-to localhost:3000/api/stripe/webhook` (download Stripe CLI for Windows from stripe.com/docs/stripe-cli)

### Admin venue moderation (minimum viable)
- [ ] Create `src/app/admin/page.tsx` with a table of PENDING_APPROVAL venues
- [ ] "Approve" button sets `status = 'ACTIVE'`, "Reject" button sets `status = 'SUSPENDED'`
- [ ] Protect with ADMIN role check (same pattern as `(host)/layout.tsx`)
- Without this, new listings created by hosts are stuck at PENDING_APPROVAL and never appear in search

### Renter bookings page
- [ ] Create `src/app/(renter)/bookings/page.tsx` or `src/app/profile/bookings/page.tsx`
- [ ] List the logged-in renter's PENDING/CONFIRMED/COMPLETED bookings
- [ ] Link from profile page or navbar

---

## 🟡 Important (MVP Quality)

### Add amenities to seeded venues
- [ ] Many seeded venues have `amenities: []` — the amenity filter in search does nothing
- [ ] Update venue data in Supabase directly or re-seed with amenities like `["WiFi", "Parking", "AV"]`

### Fix `updateVenue` — location not updating
- [ ] Currently editing a venue does NOT update its PostGIS geography column
- [ ] Create a new SQL function `update_venue_location(p_venue_id, p_latitude, p_longitude)` or use the admin client with a raw ST_SetSRID call
- [ ] Wire into `updateVenue` server action in `src/actions/venues.ts`

### Reviews system
- [ ] Create `ReviewForm` component (1–5 star rating + comment)
- [ ] Only shown on bookings with `status = 'COMPLETED'`
- [ ] Display average rating on venue detail page
- [ ] Schema already exists (`reviews` table, migration 001)

### Email notifications (Resend)
- [ ] `RESEND_API_KEY` is in `.env.example` but no email code exists
- [ ] Send booking confirmation email to renter on `requestBooking`
- [ ] Send new booking notification to host
- [ ] Send acceptance/rejection email to renter

---

## 🟢 Enhancement (Post-MVP / v1.1)

### In-app messaging
- [ ] Schema exists (`conversations`, `messages` tables)
- [ ] Build `src/app/(renter)/messages/` and `src/app/(host)/host/messages/` with Supabase Realtime WebSocket channels
- [ ] Unread message badge in navbar

### Vercel deployment
- [ ] `vercel link` → `vercel --prod`
- [ ] Add all env vars in Vercel dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain (needed for Stripe return_url)
- [ ] Add production domain to Supabase Auth → Site URL and Redirect URLs

### CI/CD (GitHub Actions)
- [ ] Create `.github/workflows/ci.yml` — lint + type check + build on every PR
- [ ] Add Supabase URL/key as GitHub secrets

### RFP Smart Matching (GitHub issue #11 still open)
- [ ] Form for renter to post requirements (event type, date, capacity, budget)
- [ ] Background scoring job: `rfp_matches` table, score 0–100 based on capacity/price/amenities fit
- [ ] Results page showing matched venues ranked by score
- [ ] Schema already exists (`rfps`, `rfp_matches` tables)

### Admin analytics dashboard
- [ ] GMV (total confirmed booking value)
- [ ] Active users, new registrations
- [ ] Top venues by booking count
- [ ] Revenue (platform commission = GMV × 0.15)

### Google Calendar / Outlook sync
- [ ] OAuth2 flow to connect external calendars
- [ ] Webhook listener to pull blocked dates into `availability` table
- [ ] Documented as v1.1 in roadmap

---

## 📋 Launch Checklist (from VenueCharm_Roadmap_Setup.md §7)

- [ ] Happy path (Search → View → Book → Pay) zero critical errors on desktop + mobile
- [ ] ≥ 50 active seeded venues with 3–5 photos each
- [ ] Search results < 2 seconds (p95)
- [ ] Hebrew RTL layout QA pass on all pages
- [ ] Double-booking: concurrent booking test passes (DB EXCLUDE constraint)
- [ ] Security scan: no SQL injection via search filters
- [ ] RBAC: RENTER role cannot access host dashboard routes
- [ ] Lighthouse performance score ≥ 85
- [ ] ILS currency + Hebrew date formatting on all pages
- [ ] Stripe webhook test: payment_intent lifecycle from hold → capture → confirmed
