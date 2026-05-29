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
