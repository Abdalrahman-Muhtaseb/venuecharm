# **­המחלקה להנדסת תוכנה**

# **דוח אלפה פרויקט גמר – ה'תשפ"ו**

## **VenueCharm**

## **פלטפורמה חכמה לאיתור והזמנת מקומות**

## **Intelligent Venue Sourcing & Booking Platform**

### 

### 

### 

### 

### 

### 

### 

**Student Name:** Abdalrahman Muhtaseb

**ID:** 212425730

**Academic Advisor:** Dr. Yehuda Hassin

**Date:** January 26, 2026

### 

### 

### 

### 

### 

## **Project Management Systems**

| \# | System | Location |
| :---- | :---- | :---- |
| 1 | Code Repository | https://github.com/Abdalrahman-Muhtaseb/venuecharm |
| 2 | Project Journal | https://github.com/Abdalrahman-Muhtaseb/venuecharm/issues |
| 3 | Alpha Report Video | https://share.synthesia.io/e53b8924-e691-4b62-8cde-f217bdcdc9da |

### 

## **Additional Information**

| Project Type | Student Initiative |
| :---- | :---- |
| Status | New Project |

### 

### 

### 

### 

### 

### 

### 

## **Table of Contents:**

[1\. Elevator Pitch	4](#heading=)

[2\. Introduction	5](#heading=)

[3\. Problem Description	5](#heading=)

[3.1 Requirements & Characterization	5](#heading=)

[3.2 Primary User Personas	6](#heading=)

[3.3 The Problem from a Software Engineering Perspective	6](#3.3-the-problem-from-a-software-engineering-perspective)

[4\. Similar Works	7](#heading=)

[5\. Solution Description & Architecture	7](#heading=)

[5.1 Architecture Overview	7](#heading=)

[5.2 Core Data Model	8](#5.2-core-data-model)

[6\. Business Model & Monetization	9](#heading=)

[7\. Success Metrics & MVP Criteria	10](#heading=)

[8\. What We Have Done So Far	10](#heading=)

[9\. How We Used AI	10](#heading=)

[10\. Test Plan	11](#heading=)

[10.1 Unit Testing Strategy	11](#10.1-unit-testing-strategy)

[10.2 Functional & End-to-End Testing	11](#10.2-functional-&-end-to-end-testing)

[10.3 Security & Compliance Testing	12](#10.3-security-&-compliance-testing)

[11\. Appendices	13](#heading=)

[Risk Management Table	13](#heading=)

[Functional Requirements	13](#heading=)

[Project Planning – Two-Week Resolution	14](#heading=)

[Main 3 Use Cases Specification:	14](#main-3-use-cases-specification:)

[1\. Use Case: Search & Discover Venues	14](#1.-use-case:-search-&-discover-venues)

[2\. Use Case: Create Venue Listing	15](#2.-use-case:-create-venue-listing)

[3\. Use Case: Manage Booking Request	16](#3.-use-case:-manage-booking-request)

[Bibliography	18](#bibliography)

### 

### 

### 

### **1\. Elevator Pitch**

VenueCharm is an intelligent venue sourcing and booking platform designed to bridge the significant gap between event organizers seeking unique spaces and venue owners looking to monetize underutilized real estate. Similar to the disruption Airbnb caused in the hospitality sector, VenueCharm eliminates venue fragmentation in the events industry by providing a unified search engine equipped with intelligent filtering—such as date, capacity, price, amenities, and location—alongside seamless booking workflows.

The Minimum Viable Product (MVP) specifically targets the underserved Israeli market, focusing on high-demand verticals including corporate offsites, weddings, and creative productions. Built on a modern tech stack comprising Next.js, Supabase, and Stripe, the platform demonstrates mastery of complex full-stack architecture, featuring real-time availability management, geospatial venue discovery, and integrated financial processing.

### **![][image1]**

### 

### 

### 

### **2\. Introduction**

The global peer-to-peer venue rental market has grown into an $8.2 billion industry, driven by a dual demand: venue owners seeking alternative revenue streams and event organizers demanding flexible, transparent pricing. However, despite this growth, the venue sourcing experience remains outdated and fragmented. Organizers are often forced to navigate multiple disjointed platforms, rely on word-of-mouth recommendations, or consult outdated directories that lack real-time availability.

The specific problem this project addresses is the "discovery friction" in the event planning lifecycle. An organizer needing a space for 80 people on a specific date often faces opaque pricing models (e.g., "call for quote") and has no way to compare options side-by-side. This inefficiency results in dozens of wasted hours on manual outreach. Conversely, venue owners struggle to market unique spaces like rooftops, lofts, or studios effectively, leading to significant inventory spoilage.

VenueCharm aims to solve this by creating a localized, two-sided marketplace optimized for the Israeli market. By treating venue time as a commoditized asset—similar to how ride-sharing treats car seats—we can create liquidity in the market. The project serves two distinct beneficiaries: the **Event Organizer**, who gains risk reduction through verified reviews and instant booking, and the **Venue Owner**, who gains predictable revenue and automated administrative tools.

### 

### **3\. Problem Description**

#### **3.1 Requirements & Characterization**

The system is designed to address four critical market failures in the current event planning landscape:

1. **Fragmentation:** Venue data is scattered across social media, general classifieds, and niche directories, making comprehensive search impossible.  
2. **Lack of Transparency:** Most venues do not publish pricing, forcing organizers to engage in lengthy negotiation cycles for simple inquiries.  
3. **Availability Uncertainty:** Without a centralized calendar system, organizers cannot know if a venue is free without contacting the owner, leading to high rejection rates.  
4. **Inefficient Discovery:** Finding venues with specific technical amenities (e.g., specific AV gear, accessibility features) or niche architectural styles (e.g., "industrial loft") is currently a manual, error-prone process.

#### **3.2 Primary User Personas**

The application caters to two primary actors with opposing but complementary needs:

* **Event Organizer (Renter):** This user requires a powerful search interface to filter thousands of options in seconds. Their primary goal is to find a venue that fits their budget, capacity, and date constraints in under 15 minutes, with the assurance of transparent pricing and no hidden fees.  
* **Venue Owner (Host):** This user requires a "set it and forget it" management system. They need to monetize underutilized assets (offices, gardens, studios) with minimal administrative burden. Their primary goals are maximizing occupancy rates and ensuring payment security.

### 

#### **3.3 The Problem from a Software Engineering Perspective** {#3.3-the-problem-from-a-software-engineering-perspective}

Developing a real-time, two-sided marketplace introduces specific engineering complexities that go beyond standard CRUD applications. The system must ensure data integrity, high availability, and efficient processing of spatial data.

**Challenge 1: Concurrency Control (Double-Booking Prevention)**

The critical failure mode for any booking platform is allowing two users to book the same venue for the same time slot. This "race condition" requires sophisticated database transaction management. We address this using **Optimistic Locking**. When a user attempts to book, the system checks for a unique constraint violation on the (venue\_id, time\_slot) index. If a conflict is detected, the transaction rolls back, and the user is notified immediately, ensuring data consistency without the performance penalty of pessimistic locking.

**Challenge 2: Geospatial Venue Discovery**

Querying thousands of venues based on distance from a user's location is computationally expensive if not optimized. The system must calculate distances (e.g., "venues within 5km") and filter results in under 2 seconds. To solve this, we utilize **PostGIS** within our PostgreSQL database, employing GEOGRAPHY data types and GiST (Generalized Search Tree) indexes. This allows for efficient ST\_DWithin queries that scale to tens of thousands of locations without performance degradation.

**Challenge 3: State Synchronization**

Venue owners often manage their availability on personal calendars (Google Calendar, Outlook). If the platform's database is not in sync with these external sources, bookings will be rejected. The engineering challenge involves implementing OAuth2 for secure access and managing webhooks to listen for external updates, resolving conflicts between "platform time" and "external calendar time" in real-time.

**Challenge 4: Smart Matching Algorithms**

A simple filter is often insufficient for complex event requirements. We are developing a "Smart RFP" (Request for Proposal) engine that asynchronously matches organizer criteria against venue attributes, scoring them based on capacity fit, price, amenities, and historical response rates. This requires background processing (using job queues) to avoid blocking the main user interface during complex calculations.

### 

### **4\. Similar Works**

**Industry Competitors**

* **Peerspace:** The global leader in hourly venue rentals. While they dominate the US market, they lack localization for Israel (Hebrew language, local currency, tax integration) and charge a high 20% commission.  
* **Giggster:** Focuses heavily on filming and production locations. Their inventory is priced for commercial budgets, leaving a gap for affordable social and corporate event spaces.  
* **Splacer:** Operates primarily in major US cities like New York. Their platform lacks the real-time calendar synchronization features that modern organizers expect.

### **5\. Solution Description & Architecture**

#### **5.1 Architecture Overview**

VenueCharm is architected as a modular, cloud-native application designed for scalability and maintainability.

* **Frontend Layer:** Built with **Next.js 14**, utilizing server-side rendering (SSR) for SEO optimization—critical for a marketplace relying on search traffic. The UI is constructed with Tailwind CSS for responsiveness across mobile and desktop devices.  
* **Backend & Data Layer:** We utilize **Supabase** (Backend-as-a-Service) which provides a managed PostgreSQL database. This allows us to leverage robust relational data modeling while using Supabase Realtime (WebSockets) to push instant updates (e.g., new messages, booking status changes) to the client.  
* **Service Layer:** Critical functions are offloaded to specialized APIs. **Stripe** handles PCI-compliant payment processing and commission splits. **Cloudinary** manages image transformation and optimization, ensuring that high-resolution venue photos do not slow down page load times.

#### 

#### **![][image2]**

#### **5.2 Core Data Model** {#5.2-core-data-model}

The database architecture is built on a relational PostgreSQL foundation, enhanced with PostGIS for spatial operations. The schema is normalized to ensure data integrity while utilizing `JSONB` columns for flexible data structures where schema evolution is expected.

**Key Entities & Design Decisions:**

* **Users & Authentication (`users`):** Instead of separate tables, a single table manages Renters, Hosts, and Admins using role enums. This simplifies authentication and allows users to switch roles (e.g., a Renter becoming a Host) without needing multiple accounts.  
* **Venues & Inventory (`venues`):** This table uses **PostGIS** for high-performance location queries (e.g., "within 5km") and **JSONB** columns for flexible amenity tagging. It employs a hybrid availability system that combines recurring patterns (like "Closed Sundays") with specific date overrides for maximum efficiency.  
* **Transactional Core (`bookings`):** Serving as the central state machine, this table strictly controls reservation lifecycles (`PENDING` to `CONFIRMED`). Crucially, it uses a **database-level `EXCLUDE` constraint** to mathematically prevent double-bookings by ensuring no two confirmed time ranges can overlap.  
* **Financial Ledger (`payments`):** Payment records are decoupled from bookings to handle complex scenarios like refunds. They reference **Stripe** IDs directly for security compliance (PCI) and use Row Level Security (RLS) to allow Hosts to verify payment status without accessing the Renter's sensitive financial data.  
* **Smart Matching (`rfps` & `rfp_matches`):** These tables support a reverse-marketplace feature where Renters post requirements. The system calculates a **compatibility score (0-100)** between the request and venues, enabling asynchronous, high-quality recommendations.

### **![][image3]**

### **6\. Business Model & Monetization**

To ensure the platform's sustainability and demonstrate commercial viability, VenueCharm employs a transaction-based revenue model.

* **Commission Structure:** The platform charges a **15% service fee** on every confirmed booking, paid by the renter. This pricing is strategically set lower than the industry standard (typically 20%) to aggressively capture market share in the initial launch phase.  
* **Host Acquisition Strategy:** We apply a **0% listing fee** for venue owners. By removing the financial barrier to entry, we encourage a rapid supply of diverse venues, solving the "chicken and egg" problem inherent in two-sided marketplaces.

### 

### **7\. Success Metrics & MVP Criteria**

We have defined strict criteria to determine when the Alpha version is ready for public release:

* **Functional Completeness:** The "Happy Path" (Search → View → Book → Pay) must function without critical errors on both desktop and mobile web.  
* **Content Density:** The marketplace must launch with at least **50 seeded venues**, each containing 3-5 high-quality photos, to ensure users find relevant results.  
* **Technical Performance:** Search queries must return results in **\<2 seconds** (p95), and availability checks must complete in \<500ms to prevent user churn.  
* **Localization:** Full Right-to-Left (RTL) layout support for Hebrew and complete localization of date/currency formats.

### 

### **8\. What We Have Done So Far**

The project is currently proceeding according to the development roadmap:

* **Planning & Research (Completed):** We have finalized the project scope, created detailed personas for Renters and Hosts, and mapped the entire user journey. Market analysis confirmed the opportunity gap in Israel.  
* **Design & Prototyping (Completed):** High-fidelity UI/UX mockups have been created by google stitch for all core screens. The Entity-Relationship Diagram (ERD) and system architecture diagrams are finalized.  
* **Technical Infrastructure (Completed):** The development environment is fully operational. We have initialized the Next.js repository, configured the Supabase PostgreSQL database with PostGIS extensions, and set up a CI/CD pipeline via GitHub Actions.  
* **Content Generation (Completed):** A dataset of 50 venue profiles has been generated and seeded into the database to facilitate realistic testing of search algorithms.

### 

### **9\. How We Used AI**

| Tool | Usage |
| :---- | :---- |
| **Gemini** | Used as architectural advisors to refine the two-sided marketplace logic, design the database schema, and plan the "Smart RFP" matching algorithm. |
| **Perplexity** | Utilized for deep-dive technical research on PostGIS query optimization, payment gateway integration patterns, and competitor analysis. |
| **Google Stitch** | Accelerated the design process by generating initial layout components and creating consistent iconography for the design system. |
| **Synthesia** | Created Alpha-Report video |

### 

### **10\. Test Plan**

#### **10.1 Unit Testing Strategy** {#10.1-unit-testing-strategy}

*Focus: Isolating and verifying individual logic components using **Jest**.*

| ID | Test Suite | Description | Tool | Success Criteria |
| :---- | :---- | :---- | :---- | :---- |
| **UT-01** | **RFP Matching Engine** | Verify that the weighted scoring algorithm correctly ranks venues based on capacity, budget, and amenities. | Jest | Algorithm returns correct score (0-100) for 5 standard test scenarios. |
| **UT-02** | **Geospatial Queries** | Test PostGIS query builders to ensure ST\_DWithin accurately filters points within a specific radius. | Jest \+ pg-mem | Query returns 100% accurate venues within 5km radius bounds. |
| **UT-03** | **Data Validation** | Ensure Zod schemas reject invalid inputs (e.g., negative prices, end\_time before start\_time). | Jest | Invalid inputs throw specific, readable error messages. |

#### 

#### 

#### **10.2 Functional & End-to-End Testing** {#10.2-functional-&-end-to-end-testing}

*Focus: Verifying complete user flows and real-world scenarios using **Cypress**.*

| ID | Test Scenario | Description | Priority | Critical Path |
| :---- | :---- | :---- | :---- | :---- |
| **FT-01** | **Guest Booking Loop** | Validate the full lifecycle: **Search** → **Filter** → **View Details** → **Request** → **Confirm Payment**. | High | **Happy Path** |
| **FT-02** | **Host Listing Flow** | Verify a Host can create a listing, upload images via Cloudinary, and see it published. | High | **Supply Side** |
| **FT-03** | **Concurrency Lock** | Simulate 2 users booking the same slot simultaneously to ensure the database EXCLUDE constraint triggers. | Medium | **Edge Case** |

#### 

#### **10.3 Security & Compliance Testing** {#10.3-security-&-compliance-testing}

*Focus: Vulnerability scanning and access control using **OWASP ZAP**.*

| ID | Security Check | Methodology | Expected Outcome |
| :---- | :---- | :---- | :---- |
| **SEC-01** | **SQL Injection** | Attempt injection attacks on search filters (e.g., ' OR 1=1 \--) to bypass input sanitization. | Input must be sanitized; query must fail safely without leaking data. |
| **SEC-02** | **RBAC Boundaries** | Verify that a user with ROLE: RENTER receives 403 Forbidden when accessing Host Dashboard routes. | API rejects request; UI redirects to 403/404 page. |

### 

### **11\. Appendices**

#### **Risk Management Table**

| Risk | Impact | Probability | Mitigation Strategy |
| :---- | :---- | :---- | :---- |
| **Double-booking (Race Conditions)** | High | Medium | Implement Optimistic Locking on the database level; extensively test with concurrent scripts. |
| **Geospatial Performance Issues** | High | Medium | Utilize PostGIS spatial indexes; implement caching layers for frequent search queries. |
| **Scope Creep** | High | High | Adhere strictly to the defined MVP feature list; move all "nice-to-have" features to v1.1 backlog. |
| **Insufficient Host Supply** | High | Medium | Begin host recruitment in Week 2 using "beta partner" incentives (free premium placement). |
| **Learning Curve (PostGIS/Socket.io)** | Medium | Medium | Allocate Weeks 1-2 specifically for prototyping with these technologies before core development. |

#### **Functional Requirements**

| ID | Description |
| :---- | :---- |
| FR-1 | The system shall allow users to register and authenticate via Email or Google OAuth. |
| FR-2 | The system shall provide a search interface filtering by date, location, capacity, and price. |
| FR-3 | The system shall display real-time availability for venues on an interactive calendar. |
| FR-4 | The system shall process secure payments and handle commission splits via Stripe. |
| FR-5 | The system shall provide a dashboard for Hosts to manage listings and view analytics. |

#### **Project Planning – Two-Week Resolution**

| Week | Milestone |
| :---- | :---- |
| 1-2 | **Core Infrastructure:** Project setup, Auth integration, GitHub CI/CD pipeline |
| 3-4 | **Data Layer:** Database schema migration, venue seeding, PostGIS configuration |
| 5-6 | **Discovery Engine:** Search frontend, geospatial query implementation, filtering logic |
| 7-8 | **Venue Experience:** Detail page UI, image carousel, interactive map integration |
| 9-10 | **Booking System:** Booking state machine, inquiry flow, database locking logic |
| 11-12 | **Host Tools:** Dashboard development, analytics visualization, messaging UI |
| 13-14 | **Monetization:** Stripe integration, payment webhooks, "Smart RFP" matching engine |
| 15-16 | **Launch Prep:** Admin moderation panel, final QA, documentation, deployment |

#### 

#### **Main 3 Use Cases Specification:** {#main-3-use-cases-specification:}

##### **1\. Use Case: Search & Discover Venues** {#1.-use-case:-search-&-discover-venues}

*The entry point for Renters to find inventory.*

| Field | Description |
| :---- | :---- |
| Use Case Name | Search Venues (Geospatial) |
| Actors | Event Organizer (Renter) |
| Brief Description | User searches for venues by location, date, and capacity, applying filters to narrow results. |
| Preconditions | 1\. User is on the landing page (Login not required). 2\. Database contains active venues. |
| Basic Flow | 1\. User enters "Location" (e.g., Tel Aviv) and "Event Date". 2\. System converts text location to coordinates via Geocoding API. 3\. System executes PostGIS query to find venues within radius. 4\. System filters out venues blocked in Availability table. 5\. User applies advanced filters (e.g., "Rooftop", "Under ₪500/hr"). 6\. System updates result list dynamically. 7\. User clicks a result card to view details. |
| Post Conditions | User is presented with a list of available, matching venues. |

### 

##### **2\. Use Case: Create Venue Listing** {#2.-use-case:-create-venue-listing}

*The entry point for Hosts to add supply.*

| Field | Description |
| :---- | :---- |
| Use Case Name | Create Venue Listing |
| Actors | Venue Owner (Host) |
| Brief Description | Host inputs venue details, uploads photos, and publishes a new listing to the marketplace. |
| Preconditions | 1\. User is logged in. 2\. User has completed identity verification (Stripe Identity). |
| Basic Flow | 1\. Host clicks "List Your Space". 2\. Host enters Title, Description, and Capacity. 3\. Host sets Address (System validates via Maps API). 4\. Host uploads 5+ images (System uploads to Cloudinary and returns URLs). 5\. Host sets hourly price and cancellation policy. 6\. Host clicks "Publish Listing". 7\. System saves record with status PENDING\_APPROVAL. |
| Post Conditions | Venue is saved in database; Admin notified for moderation. |

### 

##### **3\. Use Case: Manage Booking Request** {#3.-use-case:-manage-booking-request}

*The completion of the transaction loop by the Host.*

| Field | Description |
| :---- | :---- |
| Use Case Name | Accept/Decline Booking |
| Actors | Venue Owner (Host) |
| Brief Description | Host reviews a pending booking request and decides whether to accept the revenue or reject it. |
| Preconditions | 1\. A booking exists with status PENDING. 2\. Host is logged in. |
| Basic Flow | 1\. Host receives notification (Email/SMS) of new request. 2\. Host navigates to "Host Dashboard". 3\. Host reviews Renter's profile, message, and past reviews. 4\. Host clicks "Accept Booking". 5\. System triggers Stripe to capture the pre-authorized payment. 6\. System updates booking status to CONFIRMED. 7\. System reveals full contact details to both parties. |
| Alternate Flow | 4a. Host Declinse: Host clicks "Decline". 5a. System releases Stripe payment hold. 6a. Booking status updates to REJECTED. |
| Post Conditions | Transaction is finalized (money moved) or voided. |

#### 

#### 

#### **![][image4]**

#### **Bibliography** {#bibliography}

1. Evans, D. S., & Schmalensee, R. (2016). *Matchmakers: The New Economics of Multisided Platforms*. Harvard Business Review Press.  
2. Tomlinson, B. (2013). "Understanding Geospatial Database Performance." *PostGIS Journal*.  
3. Lamport, L. (1978). "Time, Clocks, and the Ordering of Events in a Distributed System." *Communications of the ACM*.  
4. Documentation: Next.js 14, Supabase, Stripe API, PostGIS.

