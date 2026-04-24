-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- USERS
CREATE TYPE user_role AS ENUM ('RENTER', 'HOST', 'ADMIN');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- VENUES
CREATE TYPE venue_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED');

CREATE TABLE venues (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  location          GEOGRAPHY(POINT, 4326) NOT NULL,
  address           TEXT NOT NULL,
  city              TEXT NOT NULL,
  price_per_hour    NUMERIC(10, 2),
  price_per_day     NUMERIC(10, 2),
  capacity          INTEGER NOT NULL,
  amenities         JSONB DEFAULT '[]',
  photos            TEXT[] DEFAULT '{}',
  recurring_pattern JSONB DEFAULT '{}',
  status            venue_status DEFAULT 'PENDING_APPROVAL',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_location ON venues USING GIST (location);

-- AVAILABILITY
CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id     UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  reason       TEXT,
  UNIQUE (venue_id, date)
);

-- BOOKINGS
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED');

CREATE TABLE bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id    UUID NOT NULL REFERENCES venues(id),
  renter_id   UUID NOT NULL REFERENCES users(id),
  start_at    TIMESTAMPTZ NOT NULL,
  end_at      TIMESTAMPTZ NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  status      booking_status DEFAULT 'PENDING',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  EXCLUDE USING GIST (
    venue_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  ) WHERE (status IN ('PENDING', 'CONFIRMED'))
);

-- PAYMENTS
CREATE TYPE payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'FAILED');

CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id              UUID NOT NULL REFERENCES bookings(id),
  renter_id               UUID NOT NULL REFERENCES users(id),
  amount                  NUMERIC(10, 2) NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'ILS',
  stripe_payment_intent_id TEXT UNIQUE,
  status                  payment_status DEFAULT 'PENDING',
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id),
  venue_id    UUID NOT NULL REFERENCES venues(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (booking_id, reviewer_id)
);

-- CONVERSATIONS & MESSAGES
CREATE TABLE conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   UUID REFERENCES venues(id),
  booking_id UUID REFERENCES bookings(id),
  renter_id  UUID NOT NULL REFERENCES users(id),
  host_id    UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- SMART RFP
CREATE TABLE rfps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id   UUID NOT NULL REFERENCES users(id),
  event_type  TEXT,
  event_date  DATE,
  capacity    INTEGER,
  budget      NUMERIC(10, 2),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rfp_matches (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id     UUID NOT NULL REFERENCES rfps(id),
  venue_id   UUID NOT NULL REFERENCES venues(id),
  score      INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users: read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users: update own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Venues: public read" ON venues FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Venues: host manage" ON venues FOR ALL USING (auth.uid() = host_id);
CREATE POLICY "Bookings: renter read" ON bookings FOR SELECT USING (auth.uid() = renter_id);
CREATE POLICY "Bookings: host read" ON bookings FOR SELECT
  USING (EXISTS (SELECT 1 FROM venues WHERE id = venue_id AND host_id = auth.uid()));
