# VenueCharm — Full Project Roadmap & Zero-to-Hero Setup Guide

> **Student:** Abdalrahman Muhtaseb · **Advisor:** Dr. Yehuda Hassin · **Stack:** Next.js 14 · Supabase · Stripe · PostGIS · Cloudinary

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Architecture at a Glance](#2-architecture-at-a-glance)
3. [Full Development Roadmap (16 Weeks)](#3-full-development-roadmap-16-weeks)
4. [Zero-to-Hero Setup Guide](#4-zero-to-hero-setup-guide)
   - 4.1 [Prerequisites](#41-prerequisites)
   - 4.2 [Repository Bootstrap](#42-repository-bootstrap)
   - 4.3 [Environment Variables](#43-environment-variables)
   - 4.4 [Supabase Setup](#44-supabase-setup)
   - 4.5 [Database Schema & PostGIS](#45-database-schema--postgis)
   - 4.6 [Authentication](#46-authentication)
   - 4.7 [Cloudinary (Image Uploads)](#47-cloudinary-image-uploads)
   - 4.8 [Stripe (Payments)](#48-stripe-payments)
   - 4.9 [CI/CD with GitHub Actions](#49-cicd-with-github-actions)
   - 4.10 [Vercel Deployment](#410-vercel-deployment)
5. [Feature Implementation Checklist](#5-feature-implementation-checklist)
6. [Testing Strategy](#6-testing-strategy)
7. [MVP Launch Criteria](#7-mvp-launch-criteria)
8. [Post-MVP Roadmap (v1.1+)](#8-post-mvp-roadmap-v11)
9. [Key Engineering Decisions](#9-key-engineering-decisions)

---

## 1. Project Vision

VenueCharm is a **two-sided marketplace** connecting **Event Organizers (Renters)** with **Venue Owners (Hosts)**. It targets the underserved Israeli market with Hebrew/RTL support, ILS currency, and local tax compliance — features that global competitors like Peerspace, Giggster, and Splacer all lack.

```
Core Loop:
  Host lists a space  ──►  Renter searches & discovers  ──►  Renter books & pays
       ▲                                                              │
       └────────────── Host confirms, receives payout ◄──────────────┘
```

**Differentiators vs. competition:**

| Feature | Peerspace | Giggster | Splacer | VenueCharm |
|---|---|---|---|---|
| Hebrew / RTL | ✗ | ✗ | ✗ | ✅ |
| ILS Currency | ✗ | ✗ | ✗ | ✅ |
| Commission | 20% | ~20% | ~20% | **15%** |
| Smart RFP Engine | ✗ | ✗ | ✗ | ✅ |
| Real-time Calendar Sync | Partial | ✗ | ✗ | ✅ |
| Free Host Listing | ✗ | ✗ | ✗ | ✅ |

---

## 2. Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND CLIENT                          │
│          Next.js 14  ·  React  ·  Tailwind CSS               │
│          Server-Side Rendering (SEO) · RTL Support            │
└───────────────────────┬─────────────────────────────────────┘
                        │  API Routes / Server Actions
┌───────────────────────▼─────────────────────────────────────┐
│                      SUPABASE BaaS                           │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL │  │ PostGIS Ext  │  │  Realtime WebSockets │ │
│  │  (Core DB) │  │ (Geo Queries)│  │  (Live Updates)      │ │
│  └────────────┘  └──────────────┘  └──────────────────────┘ │
└──────────┬──────────────────────────────────────────────────┘
           │
    ┌──────┴──────┬─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌───────────┐
│ Stripe │  │Cloudinary│  │  Resend   │
│Payments│  │  Media   │  │  Emails   │
└────────┘  └──────────┘  └───────────┘
```

---

## 3. Full Development Roadmap (16 Weeks)

### Phase 0 — Pre-Development (Before Week 1)
- [x] Finalize project scope and personas
- [x] Complete market analysis (Israeli event space gap)
- [x] Draft ERD and architecture diagrams
- [x] Set up GitHub repository
- [x] Generate 50 seed venue profiles for testing

---

### Phase 1 — Foundation (Weeks 1–4)

#### Weeks 1–2 · Core Infrastructure

**Goal:** A working dev environment with auth and CI/CD.

| Task | Priority | Notes |
|---|---|---|
| Initialize Next.js 14 monorepo | 🔴 Critical | `npx create-next-app@latest` |
| Configure TypeScript & ESLint | 🔴 Critical | Strict mode |
| Install Tailwind CSS + RTL plugin | 🔴 Critical | `tailwindcss-rtl` |
| Create Supabase project | 🔴 Critical | Enable PostGIS extension |
| Set up `.env.local` secrets | 🔴 Critical | See §4.3 |
| Configure GitHub Actions CI/CD | 🟡 High | Lint + test on every PR |
| Connect Vercel for preview deploys | 🟡 High | Auto-deploy on merge to `main` |
| Define folder structure | 🟡 High | See §4.2 |

#### Weeks 3–4 · Authentication & User Management

**Goal:** Users can register, log in, and own a role (Renter / Host / Admin).

| Task | Priority | Notes |
|---|---|---|
| Supabase Auth — Email/password | 🔴 Critical | |
| Supabase Auth — Google OAuth | 🔴 Critical | |
| `users` table with `role` enum | 🔴 Critical | RENTER · HOST · ADMIN |
| User profile page | 🟡 High | Avatar upload via Cloudinary |
| Onboarding flow (role selection) | 🟡 High | |
| Email verification | 🟡 High | Resend integration |
| RLS policies for user data | 🔴 Critical | Row-Level Security |

---

### Phase 2 — Core Marketplace (Weeks 5–8)

#### Weeks 5–6 · Venue Listings

**Goal:** Hosts can create, edit, and manage venue listings.

| Task | Priority | Notes |
|---|---|---|
| Venue creation multi-step form | 🔴 Critical | Title · Description · Capacity |
| Address validation (Google Maps API) | 🔴 Critical | Geocode to `GEOGRAPHY` point |
| Image upload to Cloudinary (5+ photos) | 🔴 Critical | Auto-optimize & resize |
| JSONB amenities tagging | 🟡 High | e.g., WiFi, AV, Parking |
| Hourly & daily pricing fields | 🔴 Critical | |
| Cancellation policy selection | 🟡 High | Flexible · Moderate · Strict |
| Listing status: `PENDING_APPROVAL` | 🔴 Critical | Admin must approve |
| Host availability calendar (hybrid pattern) | 🔴 Critical | Recurring + date overrides |

#### Weeks 7–8 · Discovery & Search Engine

**Goal:** Renters can find venues with sub-2s search results.

| Task | Priority | Notes |
|---|---|---|
| Search page UI with filters | 🔴 Critical | Date · Location · Capacity · Price |
| PostGIS `ST_DWithin` radius query | 🔴 Critical | "Within 5 km" filter |
| GiST spatial index on `venues.location` | 🔴 Critical | Performance optimization |
| Text geocoding → coordinates | 🔴 Critical | Google Maps Geocoding API |
| Map view (Mapbox/Google Maps) | 🟡 High | Venue pins on map |
| Sort by: distance · price · rating | 🟡 High | |
| Filter by: amenities · event type | 🟡 High | |
| Saved / favourited venues | 🟢 Medium | |
| Search results page < 2s (p95) | 🔴 Critical | Add Postgres query index |

---

### Phase 3 — Transactions (Weeks 9–12)

#### Weeks 9–10 · Booking System

**Goal:** End-to-end booking with double-booking prevention.

| Task | Priority | Notes |
|---|---|---|
| Booking inquiry flow (Renter side) | 🔴 Critical | Select date + time range |
| Real-time availability check (< 500ms) | 🔴 Critical | Supabase Realtime |
| `EXCLUDE` constraint on `bookings` table | 🔴 Critical | Prevents race conditions |
| Booking state machine | 🔴 Critical | PENDING → CONFIRMED → COMPLETED |
| Host accept / decline flow | 🔴 Critical | Dashboard notification |
| Stripe Payment Intent creation (hold) | 🔴 Critical | Funds held, not captured |
| Stripe capture on host confirm | 🔴 Critical | |
| Stripe release on host decline | 🔴 Critical | |
| Booking confirmation emails | 🟡 High | Resend / SendGrid |
| SMS notifications (optional) | 🟢 Medium | Twilio |

#### Weeks 11–12 · Reviews & In-App Messaging

**Goal:** Trust-building layer for both sides of the marketplace.

| Task | Priority | Notes |
|---|---|---|
| Post-booking review form (1–5 stars) | 🔴 Critical | Only after COMPLETED status |
| Bi-directional reviews (Host ↔ Renter) | 🟡 High | |
| Review moderation (Admin) | 🟡 High | |
| In-app messaging (Supabase Realtime) | 🔴 Critical | WebSocket channel per booking |
| Unread message badge | 🟡 High | |
| Email notification on new message | 🟡 High | |

---

### Phase 4 — Intelligence & Admin (Weeks 13–16)

#### Weeks 13–14 · Monetization & Smart RFP

**Goal:** Revenue engine + AI-assisted matching for complex events.

| Task | Priority | Notes |
|---|---|---|
| 15% service fee calculation on booking | 🔴 Critical | Charged to Renter |
| Stripe Connect — Host payouts | 🔴 Critical | Platform keeps commission |
| Stripe webhooks (payment events) | 🔴 Critical | Idempotent handler |
| Smart RFP — Renter posts requirements | 🟡 High | Event type · budget · capacity |
| RFP matching engine (score 0–100) | 🟡 High | Background job queue |
| RFP proposals — Host responds | 🟡 High | |
| Side-by-side proposal comparison | 🟢 Medium | |

#### Weeks 15–16 · Admin Panel, QA & Launch

**Goal:** Moderation tools, final hardening, production deploy.

| Task | Priority | Notes |
|---|---|---|
| Admin moderation panel | 🔴 Critical | Approve/reject venue listings |
| Admin analytics dashboard | 🟡 High | GMV · Bookings · Users |
| OWASP ZAP security scan | 🔴 Critical | SQL injection · RBAC check |
| Cypress E2E — Happy path | 🔴 Critical | Search → Book → Pay |
| Cypress E2E — Concurrency lock test | 🔴 Critical | Two users, same slot |
| Hebrew RTL layout QA | 🔴 Critical | Full RTL pass |
| ILS currency & date localization | 🔴 Critical | `Intl.NumberFormat` |
| Performance audit (Lighthouse) | 🟡 High | Score > 85 |
| Final deployment & domain config | 🔴 Critical | |
| Seed 50 venues with real photos | 🔴 Critical | Beta launch requirement |

---

## 4. Zero-to-Hero Setup Guide

### 4.1 Prerequisites

Install these before anything else:

```bash
# Check versions — these are the minimum required
node --version   # >= 18.17.0
npm --version    # >= 9.x
git --version    # >= 2.x

# Install Supabase CLI globally
npm install -g supabase

# Install Vercel CLI globally
npm install -g vercel
```

Accounts you need to create:
- [github.com](https://github.com) — Code repository
- [supabase.com](https://supabase.com) — Database + Auth + Realtime
- [stripe.com](https://stripe.com) — Payments (also create a **test mode** key)
- [cloudinary.com](https://cloudinary.com) — Image hosting
- [resend.com](https://resend.com) — Transactional email
- [vercel.com](https://vercel.com) — Deployment
- [console.cloud.google.com](https://console.cloud.google.com) — Maps API (Geocoding + Maps JS)

---

### 4.2 Repository Bootstrap

```bash
# 1. Create the Next.js app
npx create-next-app@14 venuecharm \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd venuecharm

# 2. Install core dependencies
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  @stripe/stripe-js \
  stripe \
  cloudinary \
  next-cloudinary \
  zod \
  react-hook-form \
  @hookform/resolvers \
  date-fns \
  lucide-react \
  clsx \
  tailwind-merge

# 3. Install RTL support for Tailwind
npm install -D tailwindcss-rtl

# 4. Install dev/test tools
npm install -D \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  cypress \
  pg-mem \
  @types/jest

# 5. Create the project folder structure
mkdir -p src/{app,components,lib,hooks,types,utils,actions}
mkdir -p src/app/{auth,venues,bookings,dashboard,admin,api}
mkdir -p src/components/{ui,venue,booking,search,layout,forms}
```

**Recommended folder structure:**

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, Register, Verify
│   ├── (main)/             # Public-facing pages
│   │   ├── venues/         # Search + Detail pages
│   │   └── page.tsx        # Landing page
│   ├── dashboard/          # Host dashboard (protected)
│   ├── admin/              # Admin panel (protected)
│   └── api/                # API routes
│       ├── stripe/         # Webhooks
│       └── venues/         # Venue CRUD
├── components/
│   ├── ui/                 # Reusable design system
│   ├── venue/              # VenueCard, VenueMap, etc.
│   ├── booking/            # BookingForm, Calendar, etc.
│   └── search/             # SearchBar, FilterPanel, etc.
├── lib/
│   ├── supabase/           # Client & server helpers
│   ├── stripe.ts           # Stripe instance
│   └── cloudinary.ts       # Cloudinary config
├── actions/                # Next.js Server Actions
│   ├── venues.ts
│   ├── bookings.ts
│   └── auth.ts
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript types/interfaces
└── utils/                  # Helpers (formatPrice, etc.)
```

---

### 4.3 Environment Variables

Create `.env.local` in the project root:

```env
# ─── Supabase ────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # NEVER expose to client

# ─── Stripe ──────────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ─── Cloudinary ──────────────────────────────────────────────
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ─── Google Maps ─────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key

# ─── Resend (Email) ──────────────────────────────────────────
RESEND_API_KEY=re_...

# ─── App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_COMMISSION_RATE=0.15   # 15%
```

Add `.env.local` to `.gitignore` — **never commit secrets**.

---

### 4.4 Supabase Setup

```bash
# 1. Log in to Supabase CLI
supabase login

# 2. Link your project (get the project ref from your Supabase dashboard URL)
supabase link --project-ref your-project-ref

# 3. Enable PostGIS extension (run in Supabase SQL Editor OR via migration)
# Go to: Dashboard → Database → Extensions → Enable "PostGIS"
```

Create the Supabase client helpers:

```typescript
// src/lib/supabase/client.ts  — for use in Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts  — for use in Server Components & Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

### 4.5 Database Schema & PostGIS

Run this full SQL migration in the **Supabase SQL Editor** (or save as `supabase/migrations/001_initial_schema.sql`):

```sql
-- ─── Enable Extensions ────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ─── USERS ────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('RENTER', 'HOST', 'ADMIN');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  first_name    TEXT,
  last_name     TEXT,
  phone_number  TEXT,
  avatar_url    TEXT,
  role          user_role NOT NULL DEFAULT 'RENTER',
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENUES ───────────────────────────────────────────────────
CREATE TYPE venue_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED');

CREATE TABLE venues (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  location          GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS column
  address           TEXT NOT NULL,
  city              TEXT NOT NULL,
  price_per_hour    NUMERIC(10, 2),
  price_per_day     NUMERIC(10, 2),
  capacity          INTEGER NOT NULL,
  amenities         JSONB DEFAULT '[]',
  photos            TEXT[] DEFAULT '{}',
  recurring_pattern JSONB DEFAULT '{}',               -- e.g., {"closed_days": [0]}
  status            venue_status DEFAULT 'PENDING_APPROVAL',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- GiST spatial index for fast radius queries
CREATE INDEX idx_venues_location ON venues USING GIST (location);

-- ─── AVAILABILITY (date-level overrides) ──────────────────────
CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id     UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  reason       TEXT,
  UNIQUE (venue_id, date)
);

-- ─── BOOKINGS ─────────────────────────────────────────────────
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED');

CREATE TABLE bookings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id    UUID NOT NULL REFERENCES venues(id),
  renter_id   UUID NOT NULL REFERENCES users(id),
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  status      booking_status DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  -- CRITICAL: Prevent double-bookings at the database level
  EXCLUDE USING GIST (
    venue_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED'))
);

-- ─── PAYMENTS ─────────────────────────────────────────────────
CREATE TYPE payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'FAILED');

CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id              UUID NOT NULL REFERENCES bookings(id),
  renter_id               UUID NOT NULL REFERENCES users(id),
  amount                  NUMERIC(10, 2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'ILS',
  stripe_payment_intent_id TEXT UNIQUE,
  status                  payment_status DEFAULT 'PENDING',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REVIEWS ──────────────────────────────────────────────────
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id  UUID NOT NULL REFERENCES bookings(id),
  venue_id    UUID NOT NULL REFERENCES venues(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, reviewer_id)   -- one review per booking per user
);

-- ─── CONVERSATIONS & MESSAGES ─────────────────────────────────
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id   UUID REFERENCES venues(id),
  booking_id UUID REFERENCES bookings(id),
  renter_id  UUID NOT NULL REFERENCES users(id),
  host_id    UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SMART RFP ────────────────────────────────────────────────
CREATE TABLE rfps (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  renter_id   UUID NOT NULL REFERENCES users(id),
  event_type  TEXT,
  event_date  DATE,
  capacity    INTEGER,
  budget      NUMERIC(10, 2),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfp_matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfp_id        UUID NOT NULL REFERENCES rfps(id),
  venue_id      UUID NOT NULL REFERENCES venues(id),
  score         INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "Users: read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users: update own" ON users FOR UPDATE USING (auth.uid() = id);

-- Anyone can view active venues
CREATE POLICY "Venues: public read" ON venues FOR SELECT USING (status = 'ACTIVE');
-- Hosts manage their own venues
CREATE POLICY "Venues: host manage" ON venues FOR ALL USING (auth.uid() = host_id);

-- Renters see their own bookings; Hosts see bookings for their venues
CREATE POLICY "Bookings: renter read" ON bookings FOR SELECT USING (auth.uid() = renter_id);
CREATE POLICY "Bookings: host read" ON bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND host_id = auth.uid()));
```

**Apply via CLI:**

```bash
supabase db push
# or for local development:
supabase start
supabase db reset
```

---

### 4.6 Authentication

Enable in Supabase dashboard: **Authentication → Providers → Email + Google**

For Google: create OAuth credentials in Google Cloud Console, then paste Client ID & Secret into Supabase.

```typescript
// src/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(email: string, password: string, role: 'RENTER' | 'HOST') {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)

  // Insert user row with role
  await supabase.from('users').insert({
    id: data.user!.id,
    email,
    role,
  })

  redirect('/auth/verify-email')
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

Protect routes with middleware:

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(),
                  setAll: (c) => c.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)) } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedPaths = ['/dashboard', '/admin', '/bookings']
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

### 4.7 Cloudinary (Image Uploads)

```typescript
// src/lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadVenueImage(file: File, venueId: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `venuecharm/venues/${venueId}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'fill', quality: 'auto:good' }
        ],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result!.secure_url)
      }
    ).end(buffer)
  })
}
```

---

### 4.8 Stripe (Payments)

```bash
# Install Stripe CLI for local webhook testing
brew install stripe/stripe-cli/stripe    # macOS
# or download from: https://stripe.com/docs/stripe-cli

# Forward webhooks to your local dev server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Create a payment intent (holds funds, not charged until host confirms)
export async function createBookingPaymentIntent(
  amountILS: number,
  bookingId: string,
  renterId: string,
) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountILS * 100),   // Stripe works in agorot (cents)
    currency: 'ils',
    capture_method: 'manual',              // Important: hold, don't capture
    metadata: { bookingId, renterId },
  })
}

// Called when host accepts — actually charges the card
export async function captureBookingPayment(paymentIntentId: string) {
  return stripe.paymentIntents.capture(paymentIntentId)
}

// Called when host declines — releases the hold
export async function cancelBookingPayment(paymentIntentId: string) {
  return stripe.paymentIntents.cancel(paymentIntentId)
}
```

```typescript
// src/app/api/stripe/webhook/route.ts
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = headers().get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const supabase = createClient()

  switch (event.type) {
    case 'payment_intent.amount_capturable_updated':
      // Funds authorized — update payment status
      const intent = event.data.object as Stripe.PaymentIntent
      await supabase.from('payments')
        .update({ status: 'AUTHORIZED' })
        .eq('stripe_payment_intent_id', intent.id)
      break

    case 'payment_intent.succeeded':
      // Funds captured — finalize booking
      const captured = event.data.object as Stripe.PaymentIntent
      await supabase.from('payments')
        .update({ status: 'CAPTURED' })
        .eq('stripe_payment_intent_id', captured.id)
      break
  }

  return new Response('OK', { status: 200 })
}
```

---

### 4.9 CI/CD with GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm test -- --coverage --passWithNoTests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  e2e:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PK }}

      - name: Cypress E2E
        uses: cypress-io/github-action@v6
        with:
          start: npm start
          wait-on: 'http://localhost:3000'
```

Add all secrets to **GitHub → Settings → Secrets and variables → Actions**.

---

### 4.10 Vercel Deployment

```bash
# 1. Link project to Vercel
vercel link

# 2. Add all env vars (or do it in the Vercel dashboard)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... repeat for all vars in §4.3

# 3. Deploy
vercel --prod
```

**Branch strategy:**
- `main` → Auto-deploy to **production** on Vercel
- `develop` → Auto-deploy to **preview** URL
- Feature branches → PR preview URLs

---

## 5. Feature Implementation Checklist

Use this as your weekly progress tracker:

### Authentication & Users
- [ ] Email/password sign-up and login
- [ ] Google OAuth
- [ ] Email verification flow
- [ ] Role selection on onboarding (Renter / Host)
- [ ] Profile page with avatar upload
- [ ] Route protection via middleware

### Venue Listings
- [ ] Multi-step venue creation form
- [ ] Address geocoding → PostGIS point
- [ ] Cloudinary image upload (minimum 5 photos)
- [ ] JSONB amenities tagging
- [ ] Recurring availability pattern
- [ ] Date-specific availability overrides
- [ ] Admin approval workflow

### Search & Discovery
- [ ] PostGIS radius search (`ST_DWithin`)
- [ ] Filter by: date, capacity, price, amenities, event type
- [ ] Map view with venue pins
- [ ] Sort: distance / price / rating
- [ ] Search result cards with photos

### Booking System
- [ ] Date/time selection with real-time availability
- [ ] `EXCLUDE` constraint preventing double-bookings
- [ ] Booking state machine (PENDING → CONFIRMED → COMPLETED)
- [ ] Host accept/decline with Stripe capture/release
- [ ] Booking confirmation email

### Payments
- [ ] Stripe Payment Intent with `capture_method: manual`
- [ ] Stripe Connect for host payouts
- [ ] 15% commission split
- [ ] Webhook handler (idempotent)
- [ ] Refund flow on cancellation

### Reviews & Messaging
- [ ] Post-completion review form (1–5 stars)
- [ ] In-app messaging (Supabase Realtime channels)
- [ ] Unread badge counter
- [ ] Email notification on new message

### Smart RFP Engine
- [ ] Renter posts RFP (event type, date, capacity, budget)
- [ ] Background scoring job (0–100 compatibility score)
- [ ] Matched venues notification to Renter
- [ ] Host proposal submission

### Admin Panel
- [ ] Venue listing moderation (approve/reject)
- [ ] User management (ban/unban)
- [ ] Platform analytics: GMV, bookings, users, revenue

### Localization
- [ ] Hebrew RTL layout (`dir="rtl"`)
- [ ] ILS currency formatting (`Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' })`)
- [ ] Hebrew date formatting (`Intl.DateTimeFormat('he-IL')`)

---

## 6. Testing Strategy

### Unit Tests (Jest)

```bash
npm test                        # Run all unit tests
npm test -- --watch             # Watch mode
npm test -- --coverage          # Coverage report
```

| Test ID | Suite | Focus |
|---|---|---|
| UT-01 | RFP Matching Engine | Scoring algorithm returns 0-100 for 5 test cases |
| UT-02 | Geospatial Queries | `ST_DWithin` returns correct venues within 5km |
| UT-03 | Data Validation | Zod schemas reject invalid input (negative prices, end < start) |
| UT-04 | Commission Calc | 15% fee calculated correctly on various prices |
| UT-05 | Booking State Machine | Only valid transitions are allowed |

### E2E Tests (Cypress)

```bash
npx cypress open     # Interactive mode
npx cypress run      # Headless CI mode
```

| Test ID | Scenario | Priority |
|---|---|---|
| FT-01 | Guest Booking Loop | Search → Filter → View → Book → Pay | 🔴 Critical |
| FT-02 | Host Listing Flow | Create listing → Upload images → Publish | 🔴 Critical |
| FT-03 | Concurrency Lock | Two users book same slot simultaneously | 🔴 Critical |
| FT-04 | Hebrew RTL UI | Full RTL layout passes visual check | 🔴 Critical |
| FT-05 | Review Submission | Post-completion review saved correctly | 🟡 High |

### Security Tests (OWASP ZAP)

| Test ID | Check | Expected |
|---|---|---|
| SEC-01 | SQL Injection on search filters | Query fails safely, no data leaked |
| SEC-02 | RBAC — Renter accessing Host routes | 403 Forbidden |
| SEC-03 | Unauthenticated access to booking API | 401 Unauthorized |
| SEC-04 | XSS in venue description | Input sanitized |

---

## 7. MVP Launch Criteria

All of the following must pass before beta launch:

| Criterion | Target | Test Method |
|---|---|---|
| Happy path (Search → Pay) | Zero critical errors | Cypress FT-01 |
| Search response time | < 2 seconds (p95) | k6 load test |
| Availability check | < 500ms | Cypress timing assertion |
| Seeded venues | ≥ 50 active, each with 3–5 photos | DB query |
| Hebrew RTL support | Full layout passes | Manual + Cypress |
| Double-booking prevention | 0 overlap in concurrency test | Cypress FT-03 |
| Security scan | No critical OWASP findings | OWASP ZAP |
| Mobile responsiveness | Passes Lighthouse on mobile | Lighthouse CI |
| Lighthouse score | ≥ 85 (Performance + Accessibility) | Lighthouse CI |

---

## 8. Post-MVP Roadmap (v1.1+)

### v1.1 — Enhanced Host Tools (Month 2–3)
- [ ] Analytics dashboard: occupancy rate, revenue charts, peak days
- [ ] Dynamic pricing recommendations (AI-powered)
- [ ] Bulk availability management (block entire months)
- [ ] Google Calendar / Outlook sync via OAuth2 webhooks

### v1.2 — Discovery Intelligence (Month 3–4)
- [ ] AI-powered venue recommendations
- [ ] Aesthetic/style filtering ("industrial", "modern", "rustic")
- [ ] Curated collections ("Best for corporate offsites", "Creative spaces")
- [ ] Trending venues and recently added sections

### v2.0 — Platform Expansion (Month 5–12)
- [ ] Add-on services marketplace (catering, photography, AV rental)
- [ ] Corporate team/group booking accounts
- [ ] Subscription tier for power-user event planners
- [ ] Geographic expansion (Tel Aviv → Jerusalem → Haifa)
- [ ] Partnership API for event planning agencies

---

## 9. Key Engineering Decisions

| Decision | Chosen Approach | Why |
|---|---|---|
| **Double-booking** | PostgreSQL `EXCLUDE` constraint + Optimistic Locking | Database-enforced, no race condition possible |
| **Geospatial** | PostGIS `GEOGRAPHY` + GiST index | Scales to 100K+ venues, O(log n) queries |
| **Auth** | Supabase Auth (not custom JWT) | Built-in OAuth, session management, RLS integration |
| **Payments** | Stripe with `capture_method: manual` | Funds held until host confirms — protects both sides |
| **Images** | Cloudinary (not S3 directly) | Auto-optimization, responsive resizing, CDN included |
| **Real-time** | Supabase Realtime WebSockets | No extra infrastructure; Postgres changes pushed to client |
| **Roles** | Single `users` table with `role` enum | Users can switch roles without duplicate accounts |
| **Security** | Supabase Row Level Security (RLS) on all tables | No accidental data leakage; enforced at DB level |
| **SSR** | Next.js App Router with Server Components | SEO critical for marketplace (venue pages indexed by Google) |
| **Localization** | RTL via `tailwindcss-rtl` + `Intl` APIs | Native browser formatting for Hebrew dates and ILS currency |

---

> **Repository:** https://github.com/Abdalrahman-Muhtaseb/venuecharm  
> **Project Journal:** https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues  
> **Institution:** Azrieli College of Engineering, Jerusalem
