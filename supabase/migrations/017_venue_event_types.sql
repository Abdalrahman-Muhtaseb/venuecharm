-- Event types a venue is suited for (wedding, conference, party, …). Mirrors the
-- RFP event-type vocabulary so venue types can power Smart Matching.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS event_types JSONB DEFAULT '[]'::jsonb;
