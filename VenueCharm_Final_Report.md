# **­המחלקה להנדסת תוכנה**

# **דוח סופי פרויקט גמר – ה'תשפ"ו**

## **VenueCharm**

## **פלטפורמה חכמה לאיתור והזמנת מקומות**

## **Intelligent Venue Sourcing & Booking Platform**

**חיבור זה מהווה חלק מהדרישות לקבלת תואר ראשון בהנדסה**

### 

**Student Name:** Abdalrahman Muhtaseb

**ID:** 212425730

**Academic Advisor:** Dr. Yehuda Hassin

**Institution:** Azrieli College of Engineering, Jerusalem — Software Engineering Department

**Date:** [FINAL REPORT DATE — e.g., July 2026]

### 

## **Project Management Systems**

| \# | System | Location |
| :---- | :---- | :---- |
| 1 | Code Repository | https://github.com/Abdalrahman-Muhtaseb/venuecharm |
| 2 | Project Journal | https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues |
| 3 | Live Deployment | https://venuecharm.com |
| 4 | Final Report Video | [FINAL REPORT VIDEO LINK — ≤ 4 minutes] |

**Note on repository access:** The repository is private. Reviewers may request access by contacting the student at abed.muhtaseb02@gmail.com with their GitHub username.

### 

## **Additional Information**

| Project Type | Student Initiative |
| :---- | :---- |
| Continuing Project | New Project |

### 

## **הצהרה**

העבודה נעשתה בהנחיית ד"ר יהודה חסין, עזריאלי – המכללה האקדמית להנדסה ירושלים, המחלקה להנדסת תוכנה.

החיבור מציג את עבודתי האישית ומהווה חלק מהדרישות לקבלת תואר ראשון בהנדסה.

### 

## **תקציר**

VenueCharm היא פלטפורמת שוק דו-צדדית (two-sided marketplace) המחברת בין מארגני אירועים המחפשים חללים ייחודיים לבין בעלי מקומות המעוניינים להפיק הכנסה מנכסים המנוצלים בתת-תפוקה. הפרויקט מתמקד בשוק הישראלי, עם תמיכה מלאה בעברית ובכיווניות מימין-לשמאל (RTL), מטבע שקלי (₪), וחיפוש גאוגרפי מבוסס מיקום.

הבעיה שהפרויקט פותר היא "חיכוך הגילוי" (discovery friction) בתעשיית האירועים: מידע על מקומות מפוזר על פני רשתות חברתיות, לוחות מודעות ומדריכים לא מעודכנים; התמחור אינו שקוף; וזמינות אמת אינה נגישה ללא פנייה ישירה לבעל המקום. מנגד, בעלי מקומות מתקשים לשווק חללים ייחודיים ולנהל הזמנות ותשלומים ביעילות.

הפתרון הוא אפליקציית רשת מלאה (full-stack) שנבנתה על Next.js 14, Supabase (PostgreSQL + PostGIS + RLS + Realtime) ו-Stripe Connect. המערכת מממשת: חיפוש גאו-מרחבי בזמן תת-שנייה באמצעות PostGIS ואינדקסי GiST; מנוע התאמה חכם (Smart RFP) המדרג מקומות בציון 0–100 על פני חמישה מדדים משוקללים; מניעת הזמנות כפולות ברמת בסיס הנתונים באמצעות אילוץ `EXCLUDE` מסוג GIST; עיבוד תשלומים מאובטח עם פיצול עמלה (15%) והעברה אוטומטית למארח דרך Stripe Connect; מערכת הודעות והתראות בזמן אמת; סנכרון יומן Google לכל מקום; לוח ניהול למארחים ולמנהלי מערכת; ותמיכה דו-לשונית מלאה. הפרויקט פרוס בענן (Vercel) על דומיין ייעודי, עם צנרת CI המריצה בדיקות טיפוסים, לינטינג ובנייה בכל דחיפת קוד.

הדוח מתאר את הארכיטקטורה, מודל הנתונים, האתגרים ההנדסיים שנפתרו, המסקנות והלקחים מהפיתוח, ואת מערך הבדיקות שבוצע.

### 

## **Table of Contents**

1. Elevator Pitch
2. Introduction
3. Problem Description
   - 3.1 Requirements & Characterization
   - 3.2 Primary User Personas
   - 3.3 The Problem from a Software Engineering Perspective
4. Similar Works
5. Solution Description & Architecture
   - 5.1 Architecture Overview
   - 5.2 Core Data Model
   - 5.3 Key Feature Implementations
6. Business Model & Monetization
7. Success Metrics & MVP Criteria
8. Conclusions & Lessons Learned
9. How We Used AI
10. Testing
    - 10.1 Continuous Integration Gates
    - 10.2 Manual & Functional Testing
    - 10.3 Payment & Security Verification
    - 10.4 Planned Automated Testing
11. Appendices
    - Risk Management Table
    - Functional Requirements
    - Project Planning
    - Main Use Case Specifications
    - Bibliography
12. Abstract (English)

---

## **1. Elevator Pitch**

VenueCharm is an intelligent venue sourcing and booking platform designed to bridge the significant gap between event organizers seeking unique spaces and venue owners looking to monetize underutilized real estate. Similar to the disruption Airbnb caused in the hospitality sector, VenueCharm eliminates venue fragmentation in the events industry by providing a unified search engine equipped with intelligent filtering — by date, capacity, price, amenities, event type, and location — alongside seamless, payment-integrated booking workflows.

The product specifically targets the underserved Israeli market, focusing on high-demand verticals including corporate offsites, weddings, and creative productions. Built on a modern stack comprising Next.js 14, Supabase, and Stripe Connect, the platform demonstrates mastery of complex full-stack architecture, featuring real-time availability management, geospatial venue discovery, an escrow-style payment flow with automatic commission splitting, real-time messaging and notifications, and a reverse-marketplace "Smart Matching" engine.

---

## **2. Introduction**

The global peer-to-peer venue rental market has grown into a multi-billion-dollar industry, driven by a dual demand: venue owners seeking alternative revenue streams and event organizers demanding flexible, transparent pricing. However, despite this growth, the venue-sourcing experience remains outdated and fragmented. Organizers are often forced to navigate multiple disjointed platforms, rely on word-of-mouth recommendations, or consult outdated directories that lack real-time availability.

The specific problem this project addresses is the **"discovery friction"** in the event-planning lifecycle. An organizer needing a space for 80 people on a specific date often faces opaque pricing models (e.g., "call for a quote") and has no way to compare options side-by-side. This inefficiency results in dozens of wasted hours on manual outreach. Conversely, venue owners struggle to market unique spaces such as rooftops, lofts, and studios effectively, leading to significant inventory spoilage — unsold time that can never be recovered.

VenueCharm solves this by creating a localized, two-sided marketplace optimized for the Israeli market. By treating venue time as a commoditized, perishable asset — similar to how ride-sharing treats car seats — the platform creates liquidity in a market that previously had none. The project serves two distinct beneficiaries: the **Event Organizer (Renter)**, who gains risk reduction through verified reviews, transparent pricing, and secure payments; and the **Venue Owner (Host)**, who gains predictable revenue and automated administrative tools that reduce the burden of managing bookings, calendars, and payouts.

Over the course of the project, the scope evolved from a minimal "search and book" MVP into a substantially complete marketplace. Beyond the core booking loop, the delivered system includes real-time messaging, a notification system, a reverse-marketplace matching engine, external calendar synchronization, an administrative moderation panel, and a full host operations portal. This report documents the delivered system, the engineering decisions behind it, and the lessons learned.

---

## **3. Problem Description**

### **3.1 Requirements & Characterization**

The system is designed to address four critical market failures in the current event-planning landscape:

1. **Fragmentation:** Venue data is scattered across social media, general classifieds, and niche directories, making comprehensive search impossible.
2. **Lack of Transparency:** Most venues do not publish pricing, forcing organizers into lengthy negotiation cycles for even simple inquiries.
3. **Availability Uncertainty:** Without a centralized calendar system, organizers cannot know whether a venue is free without contacting the owner, leading to high rejection rates and wasted effort.
4. **Inefficient Discovery:** Finding venues with specific technical amenities (e.g., AV gear, accessibility features) or niche architectural styles (e.g., "industrial loft") is currently a manual, error-prone process.

### **3.2 Primary User Personas**

The application caters to three actors. Two are primary and have opposing but complementary needs; the third is operational.

- **Event Organizer (Renter):** Requires a powerful search interface to filter many options in seconds. Their goal is to find a venue that fits their budget, capacity, and date constraints quickly, with transparent pricing and no hidden fees, and to pay securely with the assurance that funds are only captured once the host confirms.
- **Venue Owner (Host):** Requires a "set it and forget it" management system to monetize underutilized assets with minimal administrative burden. Their goals are maximizing occupancy, controlling availability, communicating with prospective renters, and receiving reliable, automated payouts.
- **Administrator:** Requires moderation tools to approve new listings, manage users and roles, verify accounts, and intervene in bookings when necessary, along with visibility into platform activity.

### **3.3 The Problem from a Software Engineering Perspective**

Developing a real-time, two-sided marketplace introduces specific engineering complexities that go well beyond a standard CRUD application. The system must ensure data integrity, high availability, security across trust boundaries, and efficient processing of spatial data. The four defining challenges below were identified during design and were all addressed in the delivered system.

**Challenge 1: Concurrency Control (Double-Booking Prevention).** The critical failure mode for any booking platform is allowing two users to reserve the same venue for overlapping times. Rather than relying on application-level locking — which is fragile under concurrent load and depends on correct client behavior — the delivered system enforces correctness **declaratively at the database level**. The `bookings` table carries a PostgreSQL `EXCLUDE USING GIST` constraint over `(venue_id, tstzrange(start_at, end_at))`, active only where `status IN ('PENDING', 'CONFIRMED')`. Any attempt to insert an overlapping reservation for the same venue is rejected by the database itself, atomically, regardless of how many requests arrive simultaneously. This moves the guarantee from best-effort application code to a mathematically enforced invariant. (This is a deliberate correction of the alpha report, which proposed optimistic locking; the final implementation uses a stronger, declarative constraint.)

**Challenge 2: Geospatial Venue Discovery.** Querying many venues by distance from a user's location is computationally expensive if done naïvely. The system must convert a text location to coordinates, then filter venues within a radius in under two seconds. This is solved with **PostGIS**: venue locations are stored as `GEOGRAPHY(POINT, 4326)`, indexed with a **GiST** index, and queried through a `search_venues_nearby()` RPC that uses `ST_DWithin` for efficient radius search and returns each venue's distance. The same scoring machinery is reused for the "best match" sort on the general search page.

**Challenge 3: External State Synchronization.** Hosts frequently manage availability on personal calendars. If the platform's database drifts from those external sources, double-bookings across systems become possible. The delivered system implements **OAuth 2.0** against the Google Calendar API and, on the first confirmed booking for a venue, provisions a dedicated Google Calendar for that venue, persisting its ID. Subsequent confirmed bookings create calendar events and cancellations remove them, keeping "platform time" and "external calendar time" aligned. The refresh token is treated as a secret and stored in a table reachable only through the service-role client.

**Challenge 4: Smart Matching (Reverse Marketplace).** A simple filter is often insufficient for complex event requirements. The system includes a **"Smart RFP" (Request for Proposal)** engine: a renter posts their requirements, and the system scores every active venue on a 0–100 scale across five weighted dimensions — capacity fit (25), price fit (25), amenities fit (15), location fit (20), and event-type fit (15). The scorer is a **pure function with no I/O**, which makes it deterministic and directly unit-testable, and it degrades gracefully — any unconstrained dimension awards full marks so it does not distort the ranking. The top matches are persisted for the renter to review.

---

## **4. Similar Works**

**Industry Competitors**

- **Peerspace:** The global leader in hourly venue rentals. While it dominates the US market, it lacks localization for Israel (Hebrew language, RTL, ILS currency, local tax context) and charges a comparatively high commission (~15–20%).
- **Giggster:** Focuses heavily on filming and production locations. Its inventory is priced for commercial production budgets, leaving a gap for affordable social and corporate event spaces.
- **Splacer:** Operates primarily in major US cities such as New York. Its platform lacks the real-time calendar synchronization and reverse-matching features that modern organizers increasingly expect.

**Positioning.** VenueCharm differentiates on three axes that none of the incumbents fully address for this market: (1) deep localization (Hebrew/RTL, ILS, Israeli geography), (2) a lower commission (15%) with a 0% host listing fee to accelerate supply-side adoption, and (3) a reverse-marketplace "Smart Matching" engine that lets organizers describe their event and receive scored recommendations rather than only performing manual filtering.

---

## **5. Solution Description & Architecture**

### **5.1 Architecture Overview**

VenueCharm is architected as a modular, cloud-native application designed for scalability and maintainability. *(Figure 1 — the high-level architecture diagram — illustrates the three layers described below and the flow of requests between them.)*

- **Frontend / Application Layer:** Built with **Next.js 14 (App Router)** and React 18 in TypeScript strict mode. It uses **Server Components** and **Server Actions** for data mutations, and server-side rendering for SEO — critical for a marketplace that relies on organic search traffic. The UI is built with **Tailwind CSS** (with `tailwindcss-rtl` for right-to-left support) and **shadcn/ui** components over Radix primitives. Route groups organize the application into distinct shells for renters, hosts, admins, authentication, and marketing.
- **Backend & Data Layer:** **Supabase** provides a managed **PostgreSQL** database extended with **PostGIS** for spatial queries. Security is enforced through **Row Level Security (RLS)** policies at the database level, so authorization is not merely an application concern. **Supabase Realtime** (WebSockets) pushes instant updates — new messages, notifications, booking-status changes — to connected clients.
- **Service Layer:** Critical functions are offloaded to specialized services. **Stripe Connect** handles PCI-compliant payments and commission splits; **Cloudinary** manages image transformation and optimization; the **Google Maps** APIs handle geocoding and map rendering; **Google Calendar** provides external calendar synchronization; and **Resend** delivers transactional lifecycle emails.

The application is deployed on **Vercel** under the custom domain `venuecharm.com`, with a **GitHub Actions** CI pipeline that runs linting, type-checking, and a production build on every push and pull request to `main`.

### **5.2 Core Data Model**

The database is a normalized relational schema on PostgreSQL, enhanced with PostGIS for spatial operations and `JSONB` columns where schema flexibility is valuable (amenities, event types, per-field privacy settings). *(Figure 2 — the Entity-Relationship Diagram — shows the full schema and the relationships described below.)* The schema grew across 27 sequential migrations as features were added; the key entities are:

- **Users (`users`):** A single table manages Renters, Hosts, and Admins via a `role` enum. This unifies authentication and allows a user to switch roles (a Renter "becoming a host") without a second account. The table also holds Stripe Connect status flags, profile fields (bio, birth date, avatar), and a `visibility` JSONB map for per-field privacy.
- **Venues (`venues`):** Uses **PostGIS** (`GEOGRAPHY(POINT, 4326)`, GiST-indexed) for location queries and **JSONB** for amenity and event-type tagging. It carries a rich set of host-controlled attributes: pricing (per hour and/or per day), capacity, cancellation policy, house rules, operating hours, a turnaround buffer between bookings, default open weekdays, and a status enum (`DRAFT → PENDING_APPROVAL → ACTIVE → SUSPENDED`) that drives the moderation workflow.
- **Bookings (`bookings`):** The central state machine controlling the reservation lifecycle (`PENDING → CONFIRMED → COMPLETED`, with `CANCELLED`/`REJECTED` branches). It enforces the double-booking guarantee through the database-level `EXCLUDE` constraint described in §3.3, and stores the cancellation deadline, cancellation timestamp, and linked Google Calendar event ID.
- **Payments (`payments`):** Decoupled from bookings to handle refunds and complex financial states. Rows reference Stripe identifiers directly (payment intent, transfer, refund) and record the platform fee and host payout split for auditability.
- **Availability (`availability` and `availability_blocks`):** Two complementary tables — whole-day availability and per-hour blocks — power a hybrid month/week availability system.
- **Messaging (`conversations`, `messages`):** Participant-scoped conversations with real-time message delivery and read receipts, registered with the Realtime publication.
- **Notifications (`notifications`):** Cross-user notification rows written only through the service-role client, streamed to the recipient via Realtime.
- **Smart Matching (`rfps`, `rfp_matches`):** Support the reverse-marketplace feature; the compatibility score (0–100) is computed and the top matches persisted.
- **Favorites, Reviews, Amenities catalog, Host calendar connections:** Supporting tables for saved venues, post-stay reviews (with visibility-aware anonymization), the single-source-of-truth amenities catalog, and secure storage of Google OAuth refresh tokens.

### **5.3 Key Feature Implementations**

Beyond the data model, the following subsystems were designed and delivered. *(Figure 3 — the primary user-flow diagram — traces the renter "search → book → pay" happy path and the host "list → receive → accept → get paid" loop.)*

- **Authentication:** Email/password and Google OAuth, presented through a global in-app modal. Sign-up always creates a Renter; "Become a host" upgrades the role and routes the user into a Stripe-gated onboarding checklist. Email verification is delivered via Resend SMTP, and an optional hCaptcha guard can be enabled.
- **Discovery:** An autocomplete search bar (Where / When / Why / Who), a staged filter dialog (date, capacity, price, amenities, event type), a draggable map view, pagination, and a "best match" sort that reuses the RFP scorer.
- **Listing management:** A six-step venue creation wizard and a matching edit wizard, with Cloudinary image upload, a 24-item amenities picker across five categories, cancellation-policy and house-rules editors, operating hours, and per-weekday availability seeding.
- **Booking & payments:** An interactive, slot-aware booking widget with live pricing; an escrow-style flow using Stripe Connect destination charges with **manual capture** — funds are authorized at request time and only captured when the host accepts, at which point Stripe automatically transfers 85% to the host and retains the 15% platform fee. Cancellations issue policy-appropriate refunds. A daily cron auto-expires stale pending requests, and a `pg_cron` job auto-completes past confirmed bookings.
- **Messaging & notifications:** Real-time chat threads with optimistic sending, emoji support, avatars, and read receipts; and a real-time notification bell with unread badges, deep links, and bilingual copy rendered in each viewer's own locale.
- **Smart Matching (RFP):** A renter submits an event brief; the system geocodes the requested area, scores all active venues via the pure scoring engine, and persists the top matches with a per-dimension breakdown for "why it matched" explanations.
- **External calendar sync:** Per-venue Google Calendars provisioned on first confirmed booking, kept in sync as bookings are confirmed or cancelled.
- **Host portal & admin panel:** A dedicated host shell (dashboard with live updates, listings, bookings, calendar, a Recharts payouts chart with KPI cards, onboarding, messages, notifications) and an admin panel for moderation, role management, account verification, booking intervention, analytics, and data tooling.
- **Localization:** Full Hebrew/English support with RTL layout, ILS currency formatting, and localized dates throughout the UI and transactional emails.

---

## **6. Business Model & Monetization**

To ensure sustainability and demonstrate commercial viability, VenueCharm employs a transaction-based revenue model, implemented end-to-end in the payment flow.

- **Commission Structure:** The platform charges a **15% service fee** on every confirmed booking (`PLATFORM_COMMISSION_RATE = 0.15`). This is enforced technically as a Stripe Connect `application_fee_amount`, so the split is executed automatically by Stripe rather than reconciled manually. It is strategically set at or below the industry standard to capture market share in the launch phase.
- **Host Acquisition Strategy:** A **0% listing fee** for venue owners removes the barrier to entry and encourages rapid, diverse supply — directly addressing the "chicken-and-egg" problem inherent to two-sided marketplaces, where neither side is valuable without the other.

---

## **7. Success Metrics & MVP Criteria**

The following criteria define a release-ready MVP; their status in the delivered system is noted.

- **Functional Completeness:** The "happy path" (Search → View → Book → Pay) must function without critical errors on desktop and mobile web. **Delivered** — the full loop, including host acceptance and automatic payout, is implemented and exercised via Stripe test mode.
- **Content Density:** The marketplace must launch with a meaningful catalog of venues, each with photos. **Delivered** — a seeded dataset of venue profiles supports realistic testing of search and matching.
- **Technical Performance:** Search queries should return in **< 2 seconds** and availability checks quickly, achieved through PostGIS GiST indexing and server-side rendering.
- **Localization:** Full RTL support for Hebrew with localized date and currency formats. **Delivered** across the UI and transactional emails.
- **Trust & Safety:** Row Level Security enforced at the database layer; secrets isolated to the service-role client; PCI scope delegated to Stripe. **Delivered.**

---

## **8. Conclusions & Lessons Learned**

This section replaces the alpha report's "What We Have Done So Far" and expands on the conclusions and lessons drawn from building the system.

**What worked well.** Three architectural bets paid off clearly:

1. **Pushing authorization into the database (RLS).** Enforcing access control with Row Level Security rather than only in application code produced a system that is secure by default: a forgotten check in a Server Action cannot silently expose another user's data, because the database itself refuses the query. This inverts the usual risk model, where security depends on remembering to guard every endpoint.
2. **Declarative correctness for the hardest invariant.** Preventing double-booking with an `EXCLUDE` GIST constraint, rather than application-level locking, removed an entire class of concurrency bugs at the source. The correctness guarantee is expressed once, in the schema, and holds under any load.
3. **PostGIS for geospatial search.** Using a purpose-built spatial index (GiST) and `ST_DWithin` made "venues near a location" fast and simple, avoiding the need for a separate search service at this scale.

**What was harder than expected.** Several issues consumed disproportionate time and became the project's most durable lessons:

- **RLS is a double-edged sword.** The same policies that protect renters silently hid `PENDING_APPROVAL` and `SUSPENDED` venues from admin queries, because the public policy only exposes `ACTIVE` rows. The lesson — now a project rule — is that **admin and cross-user reads must deliberately use the service-role client**, and that "empty results" under RLS are often an authorization artifact rather than missing data.
- **The ORM cannot serialize PostGIS geography.** Standard `.update()` calls could not write the `GEOGRAPHY` column, which forced a dedicated `update_venue_location` RPC. The general lesson is that a BaaS abstraction leaks at the edges of specialized database features, and those edges must be handled explicitly.
- **Realtime and integration quirks.** Co-mounting two subscriptions with the same channel name crashed the client; Google Maps' `AdvancedMarkerElement` silently failed to render without a registered Map ID; and the async-loaded Maps geocoder silently ignored callback-style calls. None of these produced errors — they produced *nothing* — which taught the value of verifying third-party integrations by observed behavior, not just absence of exceptions.
- **Platform constraints shape design.** The Vercel Hobby plan caps cron frequency at once per day, which directly shaped the design of the pending-booking auto-expiry job. Real deployment limits are design inputs, not afterthoughts.

**What I would do differently.** The single clearest lesson is that **automated tests should have been introduced earlier**. The project relied on continuous type-checking, linting, and disciplined manual testing (see §10), which caught a large share of defects but left regression risk higher than ideal as the surface area grew. The pure, I/O-free design of the RFP scoring engine and the cancellation/refund math shows that the codebase was structured to be testable; retrofitting a unit-test suite around those pure functions, plus end-to-end tests for the booking loop, is the natural next step and is now in progress. Second, I would formalize the domain's state machines (booking status, venue status) even more explicitly, as their transitions touch many subsystems (payments, calendar, notifications, email) and are the most error-prone part of the system.

**Overall.** The project met and, in several areas, exceeded its MVP goals, evolving from a search-and-book prototype into a substantially complete marketplace with payments, messaging, matching, and operational tooling for all three user roles.

---

## **9. How We Used AI**

| Tool | Usage |
| :---- | :---- |
| **Claude (Anthropic)** | Primary development assistant — used throughout implementation for architecture discussion, code generation and review, debugging (especially RLS, PostGIS, and third-party integration issues), and documentation. |
| **Gemini** | Architectural advisor for two-sided marketplace logic, database schema design, and the design of the Smart RFP matching algorithm. |
| **Perplexity** | Deep-dive technical research on PostGIS query optimization, payment-gateway integration patterns, and competitor analysis. |
| **Google Stitch** | Accelerated design by generating initial layout components and consistent iconography for the design system. |
| **Synthesia** | Produced the report video walkthrough. |

AI tools were used as accelerators and advisors, not as a substitute for engineering judgment: all generated code was reviewed, adapted to the project's conventions (TypeScript strict mode, RTL-safe styling, RLS-aware data access), and validated against the type checker and manual testing before being committed.

---

## **10. Testing**

This section replaces the alpha report's "Test Plan" and describes the verification actually performed on the delivered system, followed by the automated-testing work now in progress.

### **10.1 Continuous Integration Gates**

Every push and pull request to `main` triggers a GitHub Actions pipeline (`.github/workflows/ci.yml`) that acts as an automated quality gate:

| Gate | Tool | Purpose |
| :---- | :---- | :---- |
| Type safety | `tsc --noEmit` (TypeScript strict mode) | Catches type errors, null-safety issues, and contract mismatches across the entire codebase before merge. |
| Linting | ESLint (`next/core-web-vitals`) | Enforces code quality and Next.js best practices; unescaped-entity and hook-usage rules are errors, not warnings. |
| Build | `next build` | Verifies the production build compiles and all pages render, catching server/client boundary and serialization errors. |

Because the project uses TypeScript in strict mode, the type checker functions as a first line of defense against a broad class of runtime errors — a rule enforced in the project: `tsc --noEmit` must pass before every commit.

### **10.2 Manual & Functional Testing**

The primary verification strategy for user-facing behavior was systematic manual testing of complete flows across both roles, both locales (Hebrew/RTL and English/LTR), and desktop and mobile viewports:

- **Renter happy path:** search (text and map) → filter → view venue → request booking → checkout (Stripe test card) → receive confirmation on host acceptance.
- **Host loop:** onboard (including Stripe Connect), create a listing via the wizard, manage availability, receive and accept/decline requests, and observe the automatic payout split.
- **Concurrency:** attempting overlapping bookings for the same venue to confirm the `EXCLUDE` constraint rejects the second reservation.
- **Real-time features:** messaging (two sessions), notifications, and live dashboard updates verified with concurrent browser sessions.
- **Lifecycle automation:** cancellation-and-refund behavior across all three cancellation policies, auto-expiry of stale pending bookings, and auto-completion of past bookings.
- **Localization:** full UI walkthrough in Hebrew (RTL) and English (LTR), verifying layout mirroring, currency, and date formatting.

### **10.3 Payment & Security Verification**

- **Payments** were exercised end-to-end using **Stripe test mode**, with the local webhook forwarder (`stripe listen`) driving the manual-capture, transfer, and refund events. This verified the authorize-on-request / capture-on-accept flow, the 15%/85% split, and reverse-transfer refunds.
- **Access control** was verified by attempting cross-role and cross-user access (e.g., a renter reaching host-only routes, or reading another user's bookings), confirming that middleware, route guards, and — most importantly — the database RLS policies reject unauthorized access.
- **Secrets isolation** was verified by confirming that sensitive tables (e.g., Google OAuth refresh tokens) are unreachable through the anon/user client and accessible only via the service-role client.

### **10.4 Planned Automated Testing**

Automated test coverage is the project's clearest area for improvement (see §8) and is now being added. The codebase was deliberately structured to support it — the RFP scoring engine and the cancellation/refund math are **pure, I/O-free functions** that can be unit-tested directly. The planned matrix mirrors the strategy scoped in the alpha report:

| ID | Test Suite | Description | Success Criteria |
| :---- | :---- | :---- | :---- |
| **UT-01** | RFP Matching Engine | Verify the weighted scorer (`scoreVenue`/`rankVenues`) ranks venues correctly and that unconstrained dimensions award full marks. | Correct 0–100 scores across representative scenarios. |
| **UT-02** | Cancellation Math | Verify `computeDeadline` / `refundPercent` for FLEXIBLE, MODERATE, and STRICT policies at key time thresholds. | Correct refund percentages at each boundary. |
| **UT-03** | Availability Helpers | Verify slot expansion, turnaround-buffer padding, and free-range computation. | Accurate available/blocked slots for known inputs. |
| **FT-01** | Guest Booking Loop | End-to-end: search → filter → view → request → pay → confirm. | Full flow completes with correct booking and payment state. |
| **FT-02** | Concurrency Lock | Two simultaneous bookings of the same slot. | Database `EXCLUDE` constraint rejects the second. |
| **SEC-01** | RBAC Boundaries | A RENTER accessing host/admin routes and cross-user data. | Access rejected by RLS/route guards. |

Unit tests will target the pure domain functions first (highest value, lowest cost), followed by end-to-end coverage of the booking loop.

---

## **11. Appendices**

### **Risk Management Table**

| Risk | Impact | Probability | Mitigation (as delivered) |
| :---- | :---- | :---- | :---- |
| Double-booking (race conditions) | High | Medium | Database-level `EXCLUDE` GIST constraint guarantees no overlapping active bookings. **Resolved by design.** |
| Geospatial performance | High | Medium | PostGIS `GEOGRAPHY` + GiST index + `ST_DWithin` radius queries. **Resolved.** |
| Payment security / PCI scope | High | Medium | All card handling delegated to Stripe; manual-capture escrow flow; RLS on payment rows. **Resolved.** |
| Insufficient test automation | Medium | High | Type-checking + linting + manual testing as interim gates; pure functions structured for later unit tests. **Partially mitigated; in progress.** |
| Scope creep | High | High | Feature work sequenced against a roadmap; enhancements deferred where they did not serve the core loops. |
| Third-party integration surprises | Medium | Medium | Behavioral verification of Maps/Calendar/Realtime; documented quirks captured as project rules. |

### **Functional Requirements**

| ID | Description | Status |
| :---- | :---- | :---- |
| FR-1 | Users register and authenticate via Email or Google OAuth. | Delivered |
| FR-2 | Search interface filters by date, location, capacity, price, amenities, and event type. | Delivered |
| FR-3 | Real-time availability displayed on an interactive calendar (month and week). | Delivered |
| FR-4 | Secure payments with automatic commission split via Stripe Connect. | Delivered |
| FR-5 | Host dashboard to manage listings, bookings, availability, and payouts. | Delivered |
| FR-6 | Real-time messaging and notifications between renters and hosts. | Delivered |
| FR-7 | Reverse-marketplace "Smart Matching" (RFP) with scored recommendations. | Delivered |
| FR-8 | Admin moderation panel for listings, users, and bookings. | Delivered |
| FR-9 | Full Hebrew/RTL and English localization. | Delivered |

### **Project Planning**

| Phase | Milestone |
| :---- | :---- |
| Core Infrastructure | Project setup, authentication, GitHub CI/CD pipeline |
| Data Layer | Database schema, PostGIS configuration, venue seeding |
| Discovery Engine | Search frontend, geospatial queries, filtering |
| Venue Experience | Detail page, photo gallery, interactive map |
| Booking System | Booking state machine, availability, database locking |
| Host Tools | Dashboard, payouts chart, messaging, calendar |
| Monetization | Stripe Connect, webhooks, refunds |
| Smart Matching | RFP scoring engine and matches |
| Launch Prep | Admin panel, notifications, calendar sync, QA, deployment |

### **Main Use Case Specifications**

#### **1. Use Case: Search & Discover Venues**

| Field | Description |
| :---- | :---- |
| Use Case Name | Search Venues (Geospatial) |
| Actors | Event Organizer (Renter) |
| Brief Description | User searches venues by location, date, and capacity, applying filters to narrow results. |
| Preconditions | 1. User is on a public page (login not required). 2. Database contains active venues. |
| Basic Flow | 1. User enters a location and date. 2. System geocodes the location to coordinates. 3. System runs a PostGIS `ST_DWithin` query for venues within radius. 4. System filters out unavailable venues. 5. User applies advanced filters (amenities, price, event type). 6. Results update. 7. User opens a result to view details. |
| Post Conditions | User is presented with available, matching venues, optionally sorted by best match. |

#### **2. Use Case: Create Venue Listing**

| Field | Description |
| :---- | :---- |
| Use Case Name | Create Venue Listing |
| Actors | Venue Owner (Host) |
| Brief Description | Host inputs venue details, uploads photos, and publishes a listing. |
| Preconditions | 1. User is logged in as a Host. 2. Stripe Connect onboarding is complete (required before listing). |
| Basic Flow | 1. Host opens the six-step creation wizard. 2. Enters basics, event types, and location (validated via Maps geocoding). 3. Sets capacity and pricing (hourly and/or daily). 4. Uploads photos to Cloudinary. 5. Sets cancellation policy, rules, and availability. 6. Submits for approval. 7. System saves the venue as `PENDING_APPROVAL`. |
| Post Conditions | Venue is saved; admin is able to review and approve it. |

#### **3. Use Case: Manage Booking Request**

| Field | Description |
| :---- | :---- |
| Use Case Name | Accept / Decline Booking |
| Actors | Venue Owner (Host) |
| Brief Description | Host reviews a pending request and accepts or declines it. |
| Preconditions | 1. A booking exists with status `PENDING` (payment authorized, not captured). 2. Host is logged in. |
| Basic Flow | 1. Host receives an email and in-app notification of the request. 2. Host reviews the renter's message and profile. 3. Host clicks "Accept." 4. System captures the pre-authorized Stripe payment. 5. Stripe transfers 85% to the host and retains the 15% fee. 6. Booking status becomes `CONFIRMED`. 7. Calendar event and confirmation email/notification are generated. |
| Alternate Flow | 3a. Host clicks "Decline." 4a. System cancels the payment authorization (no funds captured). 5a. Booking status becomes `REJECTED`; a decline email/notification is sent. |
| Post Conditions | Transaction is finalized (funds moved) or voided. |

### **Bibliography**

1. Evans, D. S., & Schmalensee, R. (2016). *Matchmakers: The New Economics of Multisided Platforms.* Harvard Business Review Press.
2. Obe, R. O., & Hsu, L. S. (2021). *PostGIS in Action* (3rd ed.). Manning Publications.
3. Lamport, L. (1978). "Time, Clocks, and the Ordering of Events in a Distributed System." *Communications of the ACM.*
4. Documentation: Next.js 14, Supabase (PostgreSQL, PostGIS, RLS, Realtime), Stripe Connect API, Google Maps & Calendar APIs.

---

## **12. Abstract**

**Software Engineering Department — Azrieli College of Engineering, Jerusalem**

**VenueCharm — Intelligent Venue Sourcing & Booking Platform**

**by Abdalrahman Muhtaseb — Academic Supervisor: Dr. Yehuda Hassin**

VenueCharm is a two-sided marketplace that connects event organizers seeking unique spaces with venue owners looking to monetize underutilized real estate, localized for the Israeli market with full Hebrew/RTL support and ILS currency. The platform addresses the "discovery friction" of event planning — fragmented listings, opaque pricing, and unknown availability — by unifying search, transparent pricing, real-time availability, and secure payments in one system.

The application is a full-stack solution built on Next.js 14, Supabase (PostgreSQL, PostGIS, Row Level Security, Realtime), and Stripe Connect. It implements sub-second geospatial venue discovery using PostGIS and GiST indexes; a reverse-marketplace "Smart Matching" engine that scores venues 0–100 across five weighted dimensions using a pure, testable function; guaranteed prevention of double-bookings via a database-level `EXCLUDE` GIST constraint; an escrow-style payment flow with automatic 15% commission splitting and host payouts; real-time messaging and notifications; per-venue Google Calendar synchronization; and a full host operations portal and administrative moderation panel. The system is deployed on Vercel behind a continuous-integration pipeline enforcing type safety, linting, and build integrity.

This report presents the system architecture, the relational and geospatial data model, the four core software-engineering challenges and how each was solved, the conclusions and lessons drawn from development — chief among them the value of enforcing correctness and authorization at the database layer, and the importance of introducing automated testing early — and the verification performed on the delivered system.
