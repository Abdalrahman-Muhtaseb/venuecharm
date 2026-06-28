-- ─── 022_notifications.sql ─────────────────────────────────────────────────────
-- In-app notification feed powering the navbar bell. One row per event aimed at a
-- single recipient (user_id). We store the event `type` + a small `data` payload
-- (venue title, actor name, …) rather than rendered copy, so the bell renders the
-- title/body in the VIEWER's current locale (he/en, RTL-aware) — not the actor's.
--
-- Inserts are cross-user (a renter's booking request creates a row for the HOST),
-- which an RLS INSERT WITH CHECK on user_id would block. So there is intentionally
-- NO insert policy: notifications are written only server-side via the service-role
-- admin client (same pattern as the messaging cross-user lookups). Each user can
-- only read / update / delete their own rows.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  data       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  link       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ── policies ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Notifications: owner read"   ON notifications;
DROP POLICY IF EXISTS "Notifications: owner update" ON notifications;
DROP POLICY IF EXISTS "Notifications: owner delete" ON notifications;

CREATE POLICY "Notifications: owner read" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Mark-as-read. (No insert policy by design — see header.)
CREATE POLICY "Notifications: owner update" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Notifications: owner delete" ON notifications
  FOR DELETE USING (user_id = auth.uid());

-- ── indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id) WHERE is_read = false;

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Register `notifications` with the Realtime publication (idempotent via catalog
-- check). RLS SELECT is applied per-subscriber, so each user streams only their own.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
