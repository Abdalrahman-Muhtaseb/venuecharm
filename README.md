# VenueCharm 📍

> **Intelligent Venue Sourcing & Booking Platform**

[![Project Status](https://img.shields.io/badge/Status-Alpha-orange)](https://github.com/Abdalrahman-Muhtaseb/venuecharm)
[![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20|%20Supabase%20|%20Stripe-blue)](https://nextjs.org/)

**VenueCharm** is a localized, two-sided marketplace designed to bridge the gap between event organizers and venue owners. By treating venue time as a commoditized asset, we reduce "discovery friction" and allow organizers to find unique spaces—like rooftops, lofts, and studios—with real-time availability and transparent pricing.

---

## 📖 Table of Contents
- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
- [Contact & Acknowledgements](#-contact--acknowledgements)

---

## 🚩 The Problem
The event planning lifecycle is currently plagued by **fragmentation and uncertainty**:
* **Fragmented Discovery:** Venue data is scattered across social media and outdated directories.
* **Opaque Pricing:** Organizers waste hours waiting for quotes ("Call for Price").
* **Availability Uncertainty:** No centralized calendar means high rejection rates.
* **Inefficient Search:** Finding venues with specific amenities (e.g., AV gear, Accessibility) is a manual process.

## 💡 The Solution
VenueCharm provides a **Unified Platform** that offers:
* **Centralized Search:** Filter by date, capacity, price, and amenities.
* **Real-Time Availability:** Instant booking confirmation using Optimistic Locking to prevent double-bookings.
* **Secure Payments:** Integrated financial processing via Stripe.
* **Smart Matching:** An RFP engine that scores venues against organizer requirements.

---

## 🚀 Key Features

### 1. Geospatial Venue Discovery
Utilizes **PostGIS** to perform efficient radius searches (e.g., "Venues within 5km") and spatial filtering, ensuring users find relevant local options in under 2 seconds.

### 2. Smart RFP Engine (Reverse Marketplace)
Allows Renters to post requirements (budget, event type, date). The system asynchronously calculates a **compatibility score (0-100)** to match them with the perfect venues.

### 3. Real-Time Concurrency Control
Implements **Optimistic Locking** and database-level `EXCLUDE` constraints to mathematically prevent race conditions, ensuring no two users can book the same slot simultaneously.

---

## 🛠 Architecture & Tech Stack

**VenueCharm** is architected as a modular, cloud-native application.

### Frontend
* **Framework:** [Next.js 14](https://nextjs.org/) (React)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Responsive UI)
* **Rendering:** Server-Side Rendering (SSR) for SEO optimization.

### Backend & Data
* **BaaS:** [Supabase](https://supabase.com/)
* **Database:** PostgreSQL with **PostGIS** extension.
* **Realtime:** Supabase WebSockets for live updates (messages, booking status).

### Services
* **Payments:** [Stripe](https://stripe.com/) (PCI-compliant processing & commission splits).
* **Media:** [Cloudinary](https://cloudinary.com/) (Image optimization & transformation).
* **Testing:** Jest (Unit) & Cypress (E2E).

![System Architecture](./docs/architecture_diagram.png)
*(Note: Add your architecture image from the report to a /docs folder)*

---

## ⚡ Getting Started

### Prerequisites
* Node.js 18+
* npm / yarn / pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/Abdalrahman-Muhtaseb/venuecharm.git](https://github.com/Abdalrahman-Muhtaseb/venuecharm.git)
    cd venuecharm
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env.local` file and add your keys:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    STRIPE_SECRET_KEY=your_stripe_key
    CLOUDINARY_URL=your_cloudinary_url
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🎓 Contact & Acknowledgements
Developer: Abdalrahman Muhtaseb

Academic Advisor: Dr. Yehuda Hassin
