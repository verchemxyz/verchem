-- =====================================================================
-- VerChem — FRESH SUPABASE PROJECT SETUP (run once, in SQL Editor)
-- Generated from 000_users_table.sql + 001_molecules_table.sql +
-- 002_answer_cards_table.sql. Source of truth = those individual files.
-- Idempotent: safe to re-run. Creates users, molecules, answer_cards.
-- =====================================================================

-- ----- 000: users -----
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


-- ----- 001: molecules -----
-- Molecules table for VerChem structure library
-- Created: W1 Day 3-4 (Wedge Phase 1, Layer 1 data layer)

CREATE TABLE IF NOT EXISTS molecules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aiverid_id TEXT NOT NULL,
  name TEXT NOT NULL,
  smiles TEXT NOT NULL,
  mol_block TEXT,
  inchi TEXT,
  inchi_key TEXT,
  tags TEXT[],
  notes TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_molecules_aiverid ON molecules(aiverid_id);
CREATE INDEX IF NOT EXISTS idx_molecules_inchi_key ON molecules(inchi_key);
CREATE INDEX IF NOT EXISTS idx_molecules_public ON molecules(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_molecules_created_at ON molecules(created_at DESC);

ALTER TABLE molecules ENABLE ROW LEVEL SECURITY;

-- Defense in depth: explicit privilege grants
REVOKE ALL ON TABLE molecules FROM anon, authenticated;
GRANT ALL ON TABLE molecules TO service_role;

-- Idempotent policy/trigger cleanup for re-applies
DROP POLICY IF EXISTS "Service role full access to molecules" ON molecules;
DROP TRIGGER IF EXISTS molecules_updated_at_trigger ON molecules;

-- App-level access via API routes (service role). User scoping enforced in app code.
CREATE POLICY "Service role full access to molecules"
ON molecules FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_molecules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER molecules_updated_at_trigger
BEFORE UPDATE ON molecules
FOR EACH ROW
EXECUTE FUNCTION update_molecules_updated_at();


-- ----- 002: answer_cards -----
-- Answer Cards table for VerChem AI Verified Answer Cards (W3)
-- Created: W3 Day 4 (Wedge Phase 1, Layer 3 — persistence + public share)
--
-- TRUST MODEL: `signed_payload` is the exact canonical JSON string that was
-- HMAC-signed by the orchestrator; `signature` is its base64url HMAC-SHA256.
-- Verification is a pure string operation against signed_payload (see
-- lib/answer-cards/signature.ts#verifyCanonicalSignature) so a TIMESTAMPTZ or
-- JSONB round-trip can never silently break a signature. The `question` and
-- `status` columns are DENORMALIZED copies for cheap listing/filtering only —
-- the detail/share view reconstructs the card from signed_payload.

CREATE TABLE IF NOT EXISTS answer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aiverid_id TEXT NOT NULL,
  question TEXT NOT NULL,                 -- denormalized for listing/search
  status TEXT NOT NULL CHECK (status IN ('verified', 'partial', 'unverified', 'error')),
  signed_payload TEXT NOT NULL,           -- canonical JSON that was signed (source of truth)
  signature TEXT NOT NULL,                -- base64url HMAC-SHA256 of signed_payload
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answer_cards_aiverid ON answer_cards(aiverid_id);
CREATE INDEX IF NOT EXISTS idx_answer_cards_public ON answer_cards(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_answer_cards_created_at ON answer_cards(created_at DESC);

ALTER TABLE answer_cards ENABLE ROW LEVEL SECURITY;

-- Defense in depth: explicit privilege grants (only the server's service role)
REVOKE ALL ON TABLE answer_cards FROM anon, authenticated;
GRANT ALL ON TABLE answer_cards TO service_role;

-- Idempotent policy/trigger cleanup for re-applies
DROP POLICY IF EXISTS "Service role full access to answer_cards" ON answer_cards;
DROP TRIGGER IF EXISTS answer_cards_updated_at_trigger ON answer_cards;

-- App-level access via API routes (service role). User scoping enforced in app code.
CREATE POLICY "Service role full access to answer_cards"
ON answer_cards FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_answer_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER answer_cards_updated_at_trigger
BEFORE UPDATE ON answer_cards
FOR EACH ROW
EXECUTE FUNCTION update_answer_cards_updated_at();
