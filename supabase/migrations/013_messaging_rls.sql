-- ─── 013_messaging_rls.sql ────────────────────────────────────────────────────
-- conversations + messages had RLS ENABLED in 001 but no policies, so every
-- access was denied. Add participant-scoped policies and register the messages
-- table with the Realtime publication so the in-app chat can stream inserts.
--
-- Idempotent: safe to re-run. DROP POLICY guards repeated runs; the publication
-- ADD is wrapped so an already-registered table does not abort the transaction.

-- ── conversations ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Conversations: participant read"   ON conversations;
DROP POLICY IF EXISTS "Conversations: participant insert" ON conversations;

CREATE POLICY "Conversations: participant read" ON conversations
  FOR SELECT USING (
    auth.uid() = renter_id OR auth.uid() = host_id
  );

CREATE POLICY "Conversations: participant insert" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = renter_id OR auth.uid() = host_id
  );

-- ── messages ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Messages: participant read"   ON messages;
DROP POLICY IF EXISTS "Messages: participant insert" ON messages;
DROP POLICY IF EXISTS "Messages: participant update" ON messages;

CREATE POLICY "Messages: participant read" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.renter_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

CREATE POLICY "Messages: participant insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.renter_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

-- Read receipts: a participant may flip is_read on the other party's messages.
CREATE POLICY "Messages: participant update" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.renter_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

-- ── indexes for the inbox / thread queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
  ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS conversations_renter_idx ON conversations (renter_id);
CREATE INDEX IF NOT EXISTS conversations_host_idx   ON conversations (host_id);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Register `messages` with the Realtime publication (idempotent via catalog check).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
