-- Stores which weekdays (0=Sun … 6=Sat) a venue is normally open.
-- Used to auto-block/unblock future dates whenever the host saves the listing.
-- Defaults to every day so existing venues remain fully open until the host
-- explicitly changes the setting.
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS default_available_days INT[] DEFAULT '{0,1,2,3,4,5,6}';
