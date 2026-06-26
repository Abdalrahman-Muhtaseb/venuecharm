# VenueCharm — Remaining TODO

_GitHub issues #10–#54 are closed or in review. Production is live at https://venuecharm.vercel.app. These are the remaining milestones._

---

## ✅ Done (session 10 deploy)

### Apply session-10 migrations
- [x] Ran `016_venue_coordinates.sql`, `017_venue_event_types.sql`, `018_rfp_location.sql` in the Supabase SQL Editor (applied 2026-06-24)
- [x] Ran `npm run migrate:images` — Unsplash seed photos moved into Cloudinary
- [x] Merged `fix/ux-batch-and-image-perf` → `main` (Vercel production deploy)

---

## ✅ Done (session 11 — uncommitted, no migrations)

- [x] Auth as a **modal** (login/signup) + role selection removed (default RENTER); modal closes on success
- [x] **Onboarding**: skippable `/onboarding` "About me" after signup; `/host/onboarding` checklist (Stripe required) on Become a host
- [x] **Best match** sort + match-% badges on `/venues` · [#68](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/68)
- [x] Event type in search (pill "Why" segment + filter); **map-drag now keeps active filters**
- [x] Filter modal: staged (apply on Show results), wider, lighter overlay, **dynamic max price**, Sort beside Event type
- [x] Messages **two-pane chat** (list + thread, no footer), realtime list, recency sort, emoji picker, optimistic send, scroll-bug fix
- [x] Landing: rotating hero, 5th feature card, "View more" search button, **overall** bookings-completed stat (was per-user) rounded
- [x] Venue detail: Share button, "About the host", 2-month availability, cancellation policy at bottom, no ctrl+scroll overlay
- [x] **Admin analytics** tab on `/admin/dev` (GMV over time, registrations, top venues)
- [x] Deleted dropped issues #69 (docked chat) and #70 (RFP free-text LLM)

---

## 🟡 Important (MVP Quality)

### Resend sending domain
- [ ] Booking emails currently deliver only to the Resend account owner (default `onboarding@resend.dev` sender)
- [ ] Verify a real domain in the Resend dashboard (a `vercel.app` subdomain cannot be verified — requires an owned domain)
- [ ] Set `EMAIL_FROM` in Vercel to an address on that domain to unlock sending to all users

---

## 🟢 Enhancement (Post-MVP / v1.1)

### In-app messaging — follow-ups · [#56](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/56)
- [x] Inbox + thread UI, Realtime, unread badges, entry points (shipped this session — unified `/messages` route)
- [ ] Optional: typing indicators / presence
- [ ] Optional: email notification on new message when recipient is offline

### RFP Smart Matching — follow-ups · [#11](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/11)
- [x] Requirements form (`/rfp/new`), weighted scoring, ranked results (`/rfp/[id]`)
- [x] Location-aware + event-type matching (5 weighted dimensions) — shipped session 10
- [ ] Optional: factor `event_date` availability into the score (penalize venues blocked/booked that day)
- [ ] Optional: notify hosts of top matches (currently renter-facing only)
- [x] ~~Use the "more details" free text in matching (LLM)~~ — dropped (issue #70 deleted)

### Smart-matching-as-default search (discussion)
- [x] "Best match" sort on `/venues` reusing `rankVenues()` + match-% badge — done session 11 (#68)
- [ ] Eventually: default the search to soft fit-scoring instead of hard filters

### Admin analytics — extended reporting
- [x] Top venues by booking count — done session 11
- [x] Revenue breakdown over time (monthly GMV chart) — done session 11
- [x] New user registrations over time — done session 11

### Auth / onboarding — follow-ups (session 11)
- [ ] Forgot-password flow for logged-out users (Supabase `resetPasswordForEmail` "Reset password" template) — offered, not built
- [ ] Email OTP / magic-link sign-in option — only after a sending domain is verified (depends on #57); SMS auth intentionally skipped
- [ ] Conversation-list unread count can be stale until reload (layout-fetched); optional: re-fetch or fully realtime
- [ ] Region-scoped filter max price (currently the global max across active venues)

### Israel Stripe Connect (production)
- [ ] Stripe Connect with Israel as country requires Atlas (Stripe's incorporation service) or a different payout architecture
- [ ] Deferred to v1.1 — dev/academic demo uses US test account

### Google Calendar sync — Phase 2 (pull external → availability)
- [x] OAuth2 connect flow + push confirmed bookings to host's Google Calendar ✅ shipped session 9
- [ ] Pull host's external busy times from Google Calendar into the `availability` table (reverse direction)
- [ ] Webhook/poll to keep availability in sync when host blocks dates externally

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
