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
