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

## ✅ Done (session 12 — migrations 019, 020, 021 applied)

- [x] 17-item UX batch: Google icon, themed `BrandBackground`, navbar rework + icons, **host↔guest mode switch**, per-navigation **auth flicker fix** (`UserProvider`), "Nearby" fix, **date filtering** (any free day in range), **Best-match** pill + bigger badge
- [x] Venue detail reorder + **interactive sticky booking widget** + **"Things to know"** (rules + cancellation, Learn-more modals)
- [x] **House rules** field (019) + **reservation-system** toggle (per hour / day / both)
- [x] Refreshed venue seed; **Help Center** at `/help`
- [x] **Lazy conversation creation** — no more empty threads from an accidental "Contact host"
- [x] Map fixes: day-only marker price, popup opens new tab, hover-raises overlapping marker
- [x] **Time-slot (week-view) availability** (020): operating hours + per-hour host blocks, Month/Week toggle on both sides, booking flow is slot-aware (same-day multi-booking works), whole-day → day rate
- [x] **Turnaround buffer** (021): `venues.buffer_minutes`, listing-form selector, enforced in `requestBooking` + reflected in availability
- [x] Navbar: removed theme/chat buttons → **placeholder notification bell**; trimmed menu; "Exit hosting"/"Back to site" → `/`
- [x] Auth-modal "not appearing" regression fixed (tailwind-merge `fixed`→`relative`)

---

## ✅ Done (session 13 — migration 022 applied)

- [x] **Notification system** · [#73](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/73) — `notifications` table (migration 022) + Realtime bell/dropdown + `/notifications` page, wired into booking/message/review events (admin-client cross-user inserts, owner-scoped RLS)
- [x] **Auth overhaul** — client-side login (instant header update), register with first/last name + confirm password + show/hide eye + email-verification state, inline field errors, Google-account detection, logged-out "Become a host" → login, hCaptcha scaffold, callback handles `code`+`token_hash`+expired links
- [x] **Google Maps** console warnings fixed (`loading=async` on all loaders; removed `styles` where `mapId` is set)
- [x] **Custom domain `venuecharm.com`** — `robots.ts` + `sitemap.ts` added; `.env.example` synced; dashboard config (Supabase/Stripe/Google/Resend) done
- [x] **Merged `feat/notifications` → `main`** via [PR #76](https://github.com/Abdalrahman-Muhtaseb/venuecharm/pull/76) (2026-06-28)

---

## ✅ Done (session 14 — PR #85, profile/auth/email batch)

- [x] Google sign-in data completion flow, Israeli phone validation, bio + birthday fields
- [x] Privacy visibility controls (e.g. reviewer anonymization); dropped self-service email change
- [x] **Forgot-password flow** (emailed reset via Supabase `resetPasswordForEmail`) + Google-first auth form layout — closes the item previously listed under Enhancement → Auth/onboarding follow-ups
- [x] Branded bilingual auth email templates + happy-birthday cron
- [x] UI polish: search dropdown fix, role-aware CTA, branded scrollbar, footer cleanup

---

## ✅ Done (session 15 — uncommitted on `feat/auto-cancel-pending-and-reviews-grid`)

- [x] **Bug fix**: overdue PENDING bookings (host never responded) now auto-cancel via a daily cron (`src/lib/booking-expiry.ts` + `/api/cron/expire-bookings`) — cancels the held Stripe PI, no refund needed (manual-capture, nothing was captured)
- [x] **Reviews grid + pagination** — venue detail reviews render 2–3 per row with a "Show more" button instead of loading all at once (`loadVenueReviews` server action)
- [x] **Host portal overhaul** — routes moved to `/host/dashboard`, `/host/listings`, `/host/messages(/[id])`, `/host/notifications`, etc.; fixed desktop sidebar + mobile hamburger drawer; "Exit hosting" moved to sidebar bottom; dashboard redesigned (KPI cards, attention/upcoming sections)
- [x] **SVG favicon** (`src/app/icon.svg`) using the `logo/logo.svg` icon mark with the brand gradient
- [x] Docs synced for `logo/file.svg` → `logo/logo-name-horizantal.svg` rename
- [x] **Vercel cron plan** ([#88](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/88), closed) — staying on the Hobby plan, so `expire-bookings` was switched from hourly to daily (`0 5 * * *`); the 7-day host-response window easily tolerates the coarser granularity
- [x] **Google Maps key hardening** ([#89](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/89), closed) — public/server keys split and restricted in Google Cloud Console

---

## 🔴 Critical

### Ship the host-portal + auto-cancel branch
- [ ] Push `feat/auto-cancel-pending-and-reviews-grid`, open a PR, merge after CI passes, then smoke-test in production (overdue-booking auto-cancel, reviews "Show more", host sidebar on desktop + mobile).

---

## ✅ Done (2026-06-29)

### Resend sending domain · [#57](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/57)
- [x] `venuecharm.com` **Verified** in Resend; `EMAIL_FROM=noreply@venuecharm.com`; Supabase Auth SMTP pointed at Resend with "Confirm email" on (no more built-in-mailer rate limit)

### hCaptcha activation · [#75](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/75)
- [x] `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` set (Vercel + `.env.local`) + secret in Supabase Auth → captcha live on signup/login

---

## 🟡 Important (MVP Quality)

_(none open — Google Maps key hardening closed as [#89](https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues/89), see Done below)_

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
- [x] Forgot-password flow for logged-out users — shipped in session 14 (PR #85)
- [ ] Email OTP / magic-link sign-in option — sending domain is verified (#57) so this is now unblocked, but still not built; SMS auth intentionally skipped
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
