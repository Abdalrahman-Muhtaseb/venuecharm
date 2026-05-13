# VenueCharm

**Intelligent Venue Sourcing & Booking Platform**

A two-sided marketplace connecting event organizers with venue owners in Israel. Built as a final-year software engineering project at Azrieli College of Engineering, Jerusalem.

---

## Features

- **Venue discovery** — PostGIS-powered geospatial search with radius filtering, price/capacity/amenity filters, and a split list + map view
- **Booking flow** — Hourly and full-day bookings, real-time availability calendar, double-booking prevention via PostgreSQL `EXCLUDE` constraint
- **Payments** — Stripe integration with manual capture (funds held until host confirms)
- **Host tools** — Listings management, bookings inbox (Accept / Decline), availability calendar
- **Localization** — Hebrew (RTL, default) and English with ILS currency formatting

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Database | Supabase (PostgreSQL + PostGIS + RLS) |
| UI | shadcn/ui · Tailwind CSS · tailwindcss-rtl |
| Payments | Stripe (PaymentIntents, manual capture) |
| Images | Cloudinary |
| Maps | Google Maps JS API + Geocoding |

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in all keys
npm run dev
```

Required environment variables — see `.env.example`:
- Supabase URL + anon key + service role key
- Stripe publishable + secret key + webhook secret
- Cloudinary cloud name + API key + secret
- Google Maps API key (Maps JS + Geocoding enabled)

**Database setup** — run each file in the Supabase SQL Editor in order:
```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_create_venue_listing_function.sql
supabase/migrations/003_search_venues_function.sql
supabase/migrations/004_booking_policies.sql
```

## Project Links

- **Repository:** https://github.com/Abdalrahman-Muhtaseb/venuecharm
- **Issue tracker:** https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues

## Academic

**Student:** Abdalrahman Muhtaseb (212425730)  
**Advisor:** Dr. Yehuda Hassin  
**Program:** Software Engineering, Azrieli College of Engineering, Jerusalem  
**Year:** 2025–2026
