-- ─── 005_stripe_connect.sql ───────────────────────────────────────────────
-- Stripe Connect Express + cancellation policy + refund tracking
-- Safe to re-apply: every CREATE / ALTER uses IF NOT EXISTS or DO $$ guards.

-- A. Cancellation policy enum
DO $$ BEGIN
  CREATE TYPE cancellation_policy AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- B. users: Stripe Connect columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id        TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_charges_enabled   BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payouts_enabled   BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);

-- C. venues: cancellation_policy column (defaults to MODERATE for existing rows)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS cancellation_policy cancellation_policy NOT NULL DEFAULT 'MODERATE';

-- D. bookings: cancellation deadline + when-cancelled timestamp
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at          TIMESTAMPTZ;

-- E. payments: payout / refund tracking columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS host_payout_amount  NUMERIC(10, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_transfer_id  TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_refund_id    TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount       NUMERIC(10, 2) DEFAULT 0;

-- F. Update create_venue_listing RPC to accept cancellation_policy.
-- Adding the p_cancellation_policy parameter changes the signature, so
-- CREATE OR REPLACE would create a SECOND overload rather than replacing the
-- 9-arg version from migration 002. That leaves the name ambiguous and makes
-- the arg-less GRANT below fail with 42725 (function name is not unique). Drop
-- every existing overload first so exactly one function remains.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig FROM pg_proc WHERE proname = 'create_venue_listing'
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION create_venue_listing(
  p_title               TEXT,
  p_description         TEXT,
  p_address             TEXT,
  p_city                TEXT,
  p_capacity            INTEGER,
  p_latitude            DOUBLE PRECISION,
  p_longitude           DOUBLE PRECISION,
  p_price_per_hour      NUMERIC DEFAULT NULL,
  p_price_per_day       NUMERIC DEFAULT NULL,
  p_cancellation_policy cancellation_policy DEFAULT 'MODERATE'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO venues (
    host_id, title, description, address, city, capacity,
    location, price_per_hour, price_per_day, cancellation_policy, status
  ) VALUES (
    auth.uid(), p_title, p_description, p_address, p_city, p_capacity,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_price_per_hour, p_price_per_day, p_cancellation_policy, 'PENDING_APPROVAL'
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION create_venue_listing TO authenticated;
