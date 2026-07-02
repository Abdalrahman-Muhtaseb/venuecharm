# VenueCharm — Testing Plan

**Project:** VenueCharm — two-sided venue marketplace (Renters ↔ Hosts)
**Author:** Abdalrahman Muhtaseb · **Advisor:** Dr. Yehuda Hassin
**Institution:** Azrieli College of Engineering, Jerusalem
**Status:** Living document — update as coverage grows.

---

## 1. Purpose & Scope

This document defines the testing strategy for VenueCharm: what we test, how we test
it, the tooling, and the quality gates that must pass before code ships to
`https://venuecharm.com`.

### Current state

The project ships today behind a **static CI gate only**:
`.github/workflows/ci.yml` runs `next lint` + `tsc --noEmit` + `next build` on
every push/PR to `main`. There is **no automated test suite yet**. This plan
introduces one incrementally so it can be adopted without stalling feature work.

### Goals

1. Protect the money path (Stripe Connect: charge, capture, transfer, refund).
2. Protect data-access boundaries (Supabase RLS / admin-client separation).
3. Protect booking correctness (no double-bookings, availability, turnaround buffers, cancellation math).
4. Prevent regressions in i18n/RTL, and the multi-role routing model (Renter / Host / Admin).
5. Keep the pipeline fast enough that developers actually run it.

### Out of scope (for now)

- Load / stress testing (k6/Artillery) — noisy against free-tier Supabase/Vercel; deferred. Front-end **performance** IS covered via Lighthouse CI (§9).
- Penetration testing beyond RLS verification.
- Native mobile (the app is responsive web only).

---

## 2. Test Pyramid & Targets

```
             ╱╲          E2E (Playwright)        ~10–15 flows   ← slow, high-value
            ╱  ╲         Critical journeys only
           ╱────╲
          ╱      ╲       Integration              ~40–60 tests  ← Server Actions,
         ╱────────╲      (Supabase + Stripe mock)   API routes, RLS
        ╱          ╲
       ╱────────────╲    Unit (Vitest)            ~120+ tests   ← pure logic,
      ╱______________╲   fast, deterministic         fast feedback

      Static analysis (already live): tsc --noEmit + ESLint + next build
```

| Layer | Tool | What it covers | Target coverage |
|---|---|---|---|
| Static | `tsc`, ESLint | Types, lint rules (already enforced in CI) | 100% (build must pass) |
| Unit | Vitest | Pure functions in `src/lib/**` | ≥ 85% of `src/lib` logic modules |
| Component | Vitest + React Testing Library | Form validation, conditional UI, RTL rendering | Key interactive components |
| Integration | Vitest + Supabase (test project) + Stripe mock | Server Actions, API routes, RLS policies | All money/booking actions |
| E2E | Playwright | Full user journeys across roles | ~12 critical paths |

**Priority principle:** coverage percentage is secondary to **covering the
high-risk modules listed in §5 first**. A 90%-covered UI helper is worth less
than a fully-covered refund calculator.

---

## 3. Tooling Setup

Chosen to match the existing Next.js 14 / TypeScript / Vercel stack with minimal
friction.

| Concern | Choice | Rationale |
|---|---|---|
| Unit / integration runner | **Vitest** | Native ESM + TS, fast, Jest-compatible API, works well with Next 14 |
| Component testing | **@testing-library/react** + **jsdom** | Standard, accessibility-oriented queries |
| E2E | **Playwright** | Multi-browser, first-class Next.js support, trace viewer, runs in CI |
| Stripe | **stripe-mock** (or fixture-based stubs) | Never hit live Stripe in tests |
| Supabase | Dedicated **Supabase test project** (or local `supabase start`) | Real RLS behavior; never the prod DB |
| Coverage | **c8 / vitest --coverage** | Built into Vitest |

### Proposed `package.json` scripts

```jsonc
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Directory layout

```
tests/
├── unit/                 # mirrors src/lib/** — pure logic
├── integration/          # server actions + API routes + RLS
│   └── rls/              # policy-boundary tests per table
├── e2e/                  # Playwright specs (by journey)
├── fixtures/             # seed data, Stripe event payloads, sample rows
└── helpers/             # test Supabase client, auth helpers, factories
```

### Environment isolation (critical)

- Tests **must never** run against production Supabase or live Stripe keys.
- A `.env.test` file supplies a **separate Supabase project URL/keys** and
  **Stripe test-mode keys** (or stripe-mock endpoint).
- CI uses GitHub repo **secrets** scoped to a test project.
- Guard rail: a test-setup file asserts `NEXT_PUBLIC_SUPABASE_URL` is **not** the
  prod URL before any suite runs.

---

## 4. Test Data Strategy

- **Factories over fixtures** for dynamic data (users, venues, bookings) — small
  builder functions in `tests/helpers/factories.ts` returning valid rows with
  overridable fields.
- **Static fixtures** for external payloads: Stripe webhook events
  (`payment_intent.amount_capturable_updated`, `transfer.created`,
  `account.updated`), geocoding responses.
- **Seed reset:** each integration suite truncates/reseeds its tables in
  `beforeEach` (or uses transactions rolled back per test) so tests are order-independent.
- **Three canonical users** for role testing: a Renter, a Host (Stripe-enabled),
  and an Admin. Plus a Host **without** Stripe onboarding to test gating.

---

## 5. Priority Modules (test these first)

Ranked by risk × blast-radius. These get coverage before anything else.

### 🔴 P0 — Money & correctness (must be covered before further feature work)

| Module / area | File(s) | Why critical |
|---|---|---|
| Cancellation refund math | `src/lib/cancellation.ts` | Decides how much money is returned — pure, easy to unit test exhaustively |
| Commission split | `src/lib/stripe-connect.ts` (`splitChargeAmount`) | 15% commission added **on top** of base (renter pays base×1.15, host receives full base); rounding to agorot |
| Stripe amount conversion | `src/lib/stripe.ts` (`toChargeAmount`) | ILS→agorot; off-by-100 = charging 100× |
| Booking request/accept/decline/cancel | `src/actions/bookings.ts` | Full PI lifecycle (manual capture, transfer, refund with `reverse_transfer`) |
| Double-booking prevention | DB EXCLUDE GIST constraint + `requestBooking` | Two renters, same slot → exactly one succeeds |
| Turnaround buffer enforcement | `requestBooking` + `src/lib/availability-slots.ts` | `buffer_minutes` gap must block adjacent bookings |
| Booking auto-expiry | `src/lib/booking-expiry.ts` | Race-safe atomic claim; must cancel held PI exactly once |

### 🔴 P0 — Access control (RLS boundaries)

| Boundary | Table(s) | Assertion |
|---|---|---|
| Renter cannot read others' bookings | `bookings` | SELECT scoped to own `renter_id`/host |
| Non-participant cannot read a conversation | `conversations`, `messages` | Participant-only SELECT/INSERT |
| Refresh token is unreachable via anon/user client | `host_calendar_connections` | RLS enabled, **zero policies** — every access denied |
| RFP owner-only visibility | `rfps`, `rfp_matches` | Renter sees only own requests/matches |
| Public sees only ACTIVE venues | `venues` | PENDING/SUSPENDED hidden from anon; visible to admin client only |
| Notifications owner-scoped, no anon INSERT | `notifications` | Cross-user rows only via service role |

### 🟡 P1 — Domain logic

| Module | File | Notes |
|---|---|---|
| RFP scoring | `src/lib/rfp-matching.ts` | Deterministic weights (25/25/15/20/15); unconstrained dims = full marks |
| Availability date-range search | `src/lib/availability-filter.ts` | "any free day in range" |
| Week-grid slot math | `src/lib/availability-slots.ts` | `slotState`, `takenRangesForDate`, `expandBookings` |
| Ratings aggregation | `src/lib/ratings.ts` | `buildRatingsMap` grouping |
| Admin analytics rollups | `src/lib/admin-analytics.ts` | `monthlyBuckets`, `rankVenuesByBookings` |
| Redirect safety | `src/lib/utils.ts` (`isSafeRedirectPath`) | Open-redirect guard — security-sensitive |
| Weekday availability reseed | `applyWeekdayAvailability` | 90-day reseed on venue save |

### 🟢 P2 — Presentation / i18n

| Module | File | Notes |
|---|---|---|
| Currency / date formatting | `src/lib/i18n.ts` | `formatCurrencyILS`, `formatDateLocalized`, `formatDateTimeLocalized` for `he`/`en` |
| Translation completeness | `src/lib/i18n.ts` | Every key present in **both** `he` and `en` (automatable check) |
| Email copy dictionary | `src/lib/email.ts` (`buildCopy`) | Both locales, valid HTML |
| Help Center content | `src/lib/help-content.ts` | Both-locale parity |

---

## 6. Unit Tests

Fast, no I/O, no network. Every function in §5's pure-logic rows.

**Example — cancellation refunds (`src/lib/cancellation.ts`):**

> **Note:** `refundPercent` returns a **fraction** (`1.0` / `0.5` / `0.0`), not a
> percentage. Assert against fractions, as below.

```ts
import { describe, it, expect } from 'vitest';
import { refundPercent } from '@/lib/cancellation';

describe('refundPercent', () => {
  const start = new Date('2026-08-01T18:00:00Z');

  it('MODERATE: full refund ≥ 7 days out', () => {
    expect(refundPercent('MODERATE', new Date('2026-07-20T00:00:00Z'), start)).toBe(1.0);
  });

  it('MODERATE: half refund between 24h and 7 days', () => {
    expect(refundPercent('MODERATE', new Date('2026-07-30T00:00:00Z'), start)).toBe(0.5);
  });

  it('MODERATE: no refund inside 24h', () => {
    expect(refundPercent('MODERATE', new Date('2026-08-01T12:00:00Z'), start)).toBe(0.0);
  });

  it('STRICT: never refunds inside 7 days', () => {
    expect(refundPercent('STRICT', new Date('2026-07-30T00:00:00Z'), start)).toBe(0.0);
  });
});
```

**Coverage requirements for P0 pure logic:** boundary conditions
(exactly 24h, exactly 7 days), rounding edges (agorot), and empty/zero inputs.

**Translation-parity test (automatable):**

```ts
it('he and en dictionaries have identical key sets', () => {
  expect(flattenKeys(dict.he)).toEqual(flattenKeys(dict.en));
});
```

---

## 7. Integration Tests

Run against a **real Supabase test project** (RLS is the thing under test) with
Stripe mocked.

### 7.1 Server Actions

Each action in `src/actions/` is tested for: auth guard, happy path, and the
main failure path.

- `bookings.ts` — request → accept → (capture) → cancel/refund; decline; expiry.
- `admin.ts` — role change, verify toggle, cancel booking (admin-client bypass).
- `reviews.ts` — INSERT allowed only when booking is COMPLETED or CONFIRMED+past; UNIQUE prevents duplicates.
- `messages.ts` — lazy conversation creation, `sendFirstMessage`, read receipts, `notify()` side-effect.
- `rfp.ts` — geocode + score + persist top-20 matches.
- `stripe-connect` onboarding — account create/reuse, status sync.

**Example — double-booking is impossible:**

```ts
it('rejects the second concurrent booking for the same slot', async () => {
  const [a, b] = await Promise.allSettled([
    requestBooking(sameVenue, sameSlot, renterA),
    requestBooking(sameVenue, sameSlot, renterB),
  ]);
  const ok = [a, b].filter(r => r.status === 'fulfilled');
  expect(ok).toHaveLength(1); // EXCLUDE GIST constraint holds
});
```

### 7.2 RLS policy boundaries

One suite per table from §5's access-control list. Pattern: use an **anon/user
client authenticated as user X**, attempt to read/write user Y's rows, assert
denial; then assert the legitimate owner succeeds.

```ts
it('renter cannot read another renter’s booking', async () => {
  const client = await signInAs(renterA);
  const { data } = await client.from('bookings').select('*').eq('id', renterBBooking.id);
  expect(data).toHaveLength(0); // RLS filters it out
});

it('host_calendar_connections is unreachable via user client', async () => {
  const client = await signInAs(host);
  const { data, error } = await client.from('host_calendar_connections').select('*');
  expect(data ?? []).toHaveLength(0); // zero-policy table
});
```

### 7.3 Stripe webhook handler

`src/app/api/stripe/webhook/route.ts` verifies against **two** secrets
(account-scope + connect-scope). Test with signed fixture payloads:

- Valid signature (account secret) → handled.
- Valid signature (connect secret) → handled.
- Invalid signature → 400, no side effects.
- `amount_capturable_updated`, `transfer.created`, `account.updated` each drive the right DB update.

### 7.4 API routes

- `GET /api/cron/expire-bookings` — expires overdue PENDING bookings, cancels PI once, idempotent on re-run.
- `/api/auth/callback` — OAuth code exchange + role-from-cookie upsert (`ignoreDuplicates`).
- `/api/stripe/connect/{onboard,return,refresh}` — link generation + status sync.

---

## 8. End-to-End Tests (Playwright)

Cover complete journeys across the three roles. Keep the set small and
high-value; these are the slowest tests.

| # | Journey | Role | Key assertions |
|---|---|---|---|
| E1 | Sign up → verify state → onboarding | Renter | RENTER role created; modal auth flow |
| E2 | Search venues → filters → venue detail | Renter | PostGIS results, pagination, RTL layout |
| E3 | Book venue → checkout (Stripe test card) → confirmation | Renter | PENDING booking, PI `requires_capture` |
| E4 | Host accepts booking → payout reflected | Host | Capture + transfer; status CONFIRMED |
| E5 | Renter cancels CONFIRMED → refund | Renter | Refund % matches policy |
| E6 | Become a host → Stripe onboarding gating | Renter→Host | Cannot list before `stripe_charges_enabled` |
| E7 | Create listing wizard (6 steps) → request approval | Host | DRAFT → PENDING_APPROVAL |
| E8 | Admin approves venue → appears in public search | Admin | Status ACTIVE; RLS now exposes it |
| E9 | Messaging: renter ↔ host realtime thread | Both | Optimistic send, read receipt, notification |
| E10 | RFP smart matching → view ranked matches | Renter | Top matches persisted, scores shown |
| E11 | Language toggle he ↔ en | Any | Direction flips (RTL/LTR), currency/date format |
| E12 | Favorites add/remove | Renter | Persisted, unique per user |

**Stripe in E2E:** use Stripe **test-mode** with the official test card
`4242 4242 4242 4242`; for manual-capture flows, assert PI status transitions.

**Realtime in E2E:** two browser contexts (renter + host) to verify a message
sent in one appears in the other without reload.

---

## 9. Non-Functional Testing

| Area | Approach | Target |
|---|---|---|
| Accessibility | `@axe-core/playwright` on key pages | 0 serious/critical violations |
| RTL correctness | Visual + assert `dir="rtl"` on `he`; check logical spacing (`ms-`/`me-`) | No physical-property regressions |
| Performance | **Lighthouse CI** (`@lhci/cli`) on `/` + `/venues`, against a **production build** (`npm run test:perf`) | ✅ measured: Perf 92, LCP ~1.7s, CLS <0.03 (warn-only budgets in `lighthouserc.cjs`) |
| SEO | Assert `robots.ts` / `sitemap.ts` output includes ACTIVE venues + help articles | Valid sitemap |
| Responsive | Playwright viewports (mobile / tablet / desktop) | Sidebar → Sheet drawer on mobile |

---

## 10. CI/CD Integration

Extend `.github/workflows/ci.yml`:

```yaml
# existing:  lint  →  tsc --noEmit  →  next build
# add stages (fail the pipeline on any failure):
- run: npm run test -- --coverage      # unit + integration (Supabase test project via secrets)
- run: npx playwright install --with-deps
- run: npm run test:e2e                 # against `next build` output / preview
```

**Gates & policy:**

- **PRs to `main`:** unit + integration + affected E2E must pass. Coverage must
  not drop below the ratchet threshold (start at current, raise over time).
- **Pre-release:** full E2E suite + accessibility + Lighthouse.
- **Secrets:** test Supabase URL/keys and Stripe test keys stored as GitHub repo
  secrets, distinct from production. Never expose service-role key to E2E browser context.
- **Flake policy:** an E2E test that flakes twice in a week is quarantined
  (`test.fixme`) with a tracking issue, not left to erode trust in the suite.

---

## 11. Rollout Plan (phased)

Adopt incrementally so feature work continues.

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **0 — Setup** | Vitest + Playwright installed, `.env.test`, test Supabase project, CI wiring, prod-URL guard rail | `npm test` runs green with 1 smoke test in CI |
| **1 — P0 unit** | `cancellation.ts`, `stripe-connect.ts`, `stripe.ts`, `utils.isSafeRedirectPath`, i18n formatters | 100% of P0 pure logic covered |
| **2 — P0 integration** | Booking lifecycle, double-booking, expiry, Stripe webhook | Money path covered end-to-end (mocked Stripe) |
| **3 — RLS** | One suite per §5 access-control boundary | All boundaries assert deny + allow |
| **4 — P1 logic** | RFP scoring, availability, ratings, analytics | ≥ 85% of `src/lib` logic |
| **5 — E2E** | E1–E12 journeys | All green in CI on preview deploys |
| **6 — Non-functional** | a11y + Lighthouse + RTL visual | Gates enforced pre-release |

---

## 12. Definition of Done (per change)

A change is not "done" until:

- [ ] `tsc --noEmit` passes (existing rule).
- [ ] `next lint` passes (existing rule).
- [ ] New/changed **pure logic** has unit tests (incl. boundary cases).
- [ ] New/changed **Server Action or API route** has an integration test (happy + main failure).
- [ ] New/changed **RLS-relevant** table access has a boundary test (deny + allow).
- [ ] If it touches a §8 journey, the relevant **E2E** still passes.
- [ ] i18n: any new user-facing string exists in **both** `he` and `en`.
- [ ] No test hits production Supabase or live Stripe.

---

## Appendix A — Known testing gotchas (from CLAUDE.md)

These project-specific quirks must be respected in tests to avoid false results:

- **Admin queries need `createAdminClient()`** — the regular client silently
  returns empty for PENDING/SUSPENDED venues (RLS). Assert this behavior, don't
  work around it.
- **Supabase joins return object *or* array** depending on cardinality — factories
  and assertions must handle both (`Array.isArray(x) ? x[0] : x`).
- **`.in()` with subqueries doesn't work** in Supabase JS — tests should fetch IDs first.
- **`get_venue_coordinates` / `RETURNS TABLE` RPCs return arrays** even for one row.
- **PostGIS geography updates** go through the `update_venue_location` RPC, not `.update()`.
- **Realtime applies RLS per-subscriber** and subscribers receive their own
  INSERTs — dedupe by row id in optimistic-update tests.
- **Server-action redirects** throw `NEXT_REDIRECT`; integration tests must treat
  that as success, not an error.
- **Reviews + users join requires the admin client** in public-page context.

## Appendix B — Suggested first 10 test files

1. `tests/unit/cancellation.test.ts` — refund %, deadline math (P0)
2. `tests/unit/stripe-connect.test.ts` — `splitChargeAmount` rounding (P0)
3. `tests/unit/stripe-amount.test.ts` — `toChargeAmount` ILS→agorot (P0)
4. `tests/unit/utils-redirect.test.ts` — `isSafeRedirectPath` open-redirect guard (P0)
5. `tests/unit/i18n-parity.test.ts` — he/en key parity + formatters (P2, cheap win)
6. `tests/unit/rfp-matching.test.ts` — scoring weights (P1)
7. `tests/integration/booking-lifecycle.test.ts` — request→accept→cancel (P0)
8. `tests/integration/rls/host-calendar.test.ts` — zero-policy table (P0)
9. `tests/integration/stripe-webhook.test.ts` — dual-secret verification (P0)
10. `tests/e2e/book-and-pay.spec.ts` — E3 renter checkout journey (P0)
