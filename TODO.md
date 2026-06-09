# VenueCharm — Remaining TODO

_GitHub issues #10–#26 are closed or in review. These are the remaining milestones._

---

## 🔴 Critical (Blocks Demo / MVP)

### Commit all session work
- [ ] `git add` + `git commit` — all new + modified files from 2026-06-09 session are uncommitted
- [ ] Key changes: map markers fix (migration 006), SearchBarAutocomplete with Places API, scroll-to-zoom, VenueMapPicker search box, AmenitiesPicker expanded to 24, HostAvailabilityEditor on edit listing page


---

## 🟡 Important (MVP Quality)

### Fix `updateVenue` — location not updating · [#35](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/35)
- [ ] Create a new SQL function `update_venue_location(p_venue_id UUID, p_latitude DOUBLE PRECISION, p_longitude DOUBLE PRECISION)` that calls `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`
- [ ] Wire into `updateVenue` server action in `src/actions/venues.ts`

### Reviews system · [#36](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/36)
- [ ] Create `ReviewForm` component (1–5 star rating + comment)
- [ ] Only shown on bookings with `status = 'COMPLETED'`
- [ ] Display average rating on venue detail page
- [ ] Schema already exists (`reviews` table, migration 001)

### Email notifications (Resend) · [#37](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/37)
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
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain (needed for Stripe return_url and Connect redirect URLs)
- [ ] Add production domain to Supabase Auth → Site URL and Redirect URLs
- [ ] Add production domain to Stripe Connect → Redirect URIs (Settings → Connect → OAuth)

### CI/CD (GitHub Actions)
- [ ] Create `.github/workflows/ci.yml` — lint + type check + build on every PR
- [ ] Add Supabase URL/key as GitHub secrets

### RFP Smart Matching (GitHub issue #11 still open)
- [ ] Form for renter to post requirements (event type, date, capacity, budget)
- [ ] Background scoring job: `rfp_matches` table, score 0–100 based on capacity/price/amenities fit
- [ ] Results page showing matched venues ranked by score
- [ ] Schema already exists (`rfps`, `rfp_matches` tables)

### Admin analytics — extended reporting
- [ ] Top venues by booking count
- [ ] Revenue breakdown over time (monthly GMV chart)
- [ ] New user registrations over time
- [ ] Basic stats card (users/venues/bookings/revenue) already done in `/admin/dev`

### Israel Stripe Connect (production)
- [ ] Stripe Connect with Israel as country requires Atlas (Stripe's incorporation service) or a different payout architecture
- [ ] Deferred to v1.1 — dev/academic demo uses US test account

### Google Calendar / Outlook sync
- [ ] OAuth2 flow to connect external calendars
- [ ] Webhook listener to pull blocked dates into `availability` table
- [ ] Documented as v1.1 in roadmap

---

## 📋 Launch Checklist

- [ ] Happy path (Search → View → Book → Pay) zero critical errors on desktop + mobile
- [ ] ≥ 50 active seeded venues with 3–5 photos each ✅ (amenities added via SQL)
- [ ] Search results < 2 seconds (p95)
- [ ] Hebrew RTL layout QA pass on all pages
- [ ] Double-booking: concurrent booking test passes (DB EXCLUDE constraint)
- [ ] Security scan: no SQL injection via search filters
- [ ] RBAC: RENTER role cannot access host dashboard or admin routes
- [ ] Lighthouse performance score ≥ 85
- [ ] ILS currency + Hebrew date formatting on all pages
- [ ] Stripe webhook test: payment_intent lifecycle from hold → capture → confirmed
- [ ] Stripe Connect test: onboard host → destination charge → transfer visible in Stripe Dashboard
- [ ] Cancellation refund matrix: FLEXIBLE/MODERATE/STRICT × in-window / out-of-window all return correct amounts
