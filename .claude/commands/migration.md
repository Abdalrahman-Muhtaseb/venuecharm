Create a new Supabase SQL migration file for the VenueCharm project.

The migration is about: $ARGUMENTS

## Steps

1. List the files in `supabase/migrations/` to find the highest existing number (e.g. `005_stripe_connect.sql` → next is `006`).
2. Choose a short snake_case name that describes the change (e.g. `add_reviews_table`, `update_venue_rpc`).
3. Create `supabase/migrations/006_<name>.sql` (with the correct next number).

## Required structure

Every migration must be **fully idempotent** — safe to re-run without errors:

```sql
-- ─── 006_<name>.sql ───────────────────────────────────────────────────────

-- New ENUMs (wrap in DO block to skip if already exists)
DO $$ BEGIN
  CREATE TYPE my_enum AS ENUM ('A', 'B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New columns
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_col TEXT;

-- New tables
CREATE TABLE IF NOT EXISTS my_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
);

-- RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "policy name" ON my_table;
CREATE POLICY "policy name" ON my_table ...;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_my_table_col ON my_table(col);

-- Functions (DROP old signature first to avoid overload conflicts)
DROP FUNCTION IF EXISTS my_func(old_param_types);
CREATE OR REPLACE FUNCTION my_func(...) RETURNS ... AS $$ ... $$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION my_func TO authenticated;
```

## Rules
- Every `ALTER TABLE ... ADD COLUMN` must use `IF NOT EXISTS`.
- Every `CREATE TABLE` must use `IF NOT EXISTS`.
- Every `CREATE INDEX` must use `IF NOT EXISTS`.
- Every `CREATE POLICY` must be preceded by `DROP POLICY IF EXISTS`.
- Every new function must `DROP FUNCTION IF EXISTS` the old signature first (prevents overload conflicts when signature changes).
- Every `CREATE TYPE` must be wrapped in the `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` block.
- Add a comment header line at the top: `-- ─── NNN_name.sql ───`.
- After writing the file, show the full SQL and remind the user to paste it in the Supabase SQL Editor and run it as a single execution (the entire file is one transaction).
