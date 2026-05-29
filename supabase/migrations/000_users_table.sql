-- Users table for VerChem (synced from AIVerID OAuth on login)
-- Backfilled as a migration 2026-05-29: the original `users` table was created
-- via the dashboard (DATABASE_SCHEMA.md) and had no migration file. This is the
-- canonical definition for a fresh project — using the SAME service-role-only
-- pattern as molecules/answer_cards (NOT the auth.uid() pattern in the old doc,
-- which never matched production: VerChem auth is AIVerID OAuth + HMAC cookie,
-- and all DB access goes through the server's service role).
--
-- Code that depends on this (app/oauth/callback/route.ts) only reads/writes:
--   select id, aiverid_id, email, name  where aiverid_id = ?
--   insert { aiverid_id, name, email, avatar_url? }
-- The lookup key is aiverid_id (TEXT). `email` is NOT UNIQUE so an OAuth email
-- collision can never break login; aiverid_id is the real identity key.

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aiverid_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_aiverid ON users(aiverid_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Defense in depth: only the server's service role can touch the table.
REVOKE ALL ON TABLE users FROM anon, authenticated;
GRANT ALL ON TABLE users TO service_role;

DROP POLICY IF EXISTS "Service role full access to users" ON users;
DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;

CREATE POLICY "Service role full access to users"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();
