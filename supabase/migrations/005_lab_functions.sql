-- Lab-QC API support. Migration 004 is intentionally left untouched.
-- These helpers keep multi-row creation and per-org record-number allocation
-- inside PostgreSQL, where row locks and constraints apply atomically.

ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS revoked_by TEXT;

ALTER TABLE prep_records
  ADD COLUMN IF NOT EXISTS share_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_prep_records_share_token
  ON prep_records(share_token) WHERE share_token IS NOT NULL;

-- The bearer token is issued exactly once with the signed release record. It
-- is operational metadata (not a claim inside the JWS), so prevent later
-- replacement/revocation from silently changing an auditor's public URL.
CREATE OR REPLACE FUNCTION prep_records_share_token_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.state IN ('released', 'voided') AND NEW.share_token IS DISTINCT FROM OLD.share_token THEN
    RAISE EXCEPTION 'released prep_records share token is immutable'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.state = 'submitted' AND NEW.state = 'released' AND NEW.share_token IS NULL THEN
    RAISE EXCEPTION 'releasing a prep_record requires a share token'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS b_prep_records_share_token_guard_trigger ON prep_records;
CREATE TRIGGER b_prep_records_share_token_guard_trigger
BEFORE UPDATE ON prep_records
FOR EACH ROW EXECUTE FUNCTION prep_records_share_token_guard();

CREATE OR REPLACE FUNCTION lab_create_org(
  p_name TEXT,
  p_slug TEXT,
  p_country TEXT,
  p_accreditation_ref TEXT,
  p_created_by TEXT,
  p_display_name TEXT
)
RETURNS organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_org organizations;
BEGIN
  INSERT INTO organizations (name, slug, country, accreditation_ref, created_by)
  VALUES (p_name, p_slug, p_country, p_accreditation_ref, p_created_by)
  RETURNING * INTO created_org;

  INSERT INTO org_members (
    org_id, aiverid, role, display_name, invited_email, invited_by, joined_at
  ) VALUES (
    created_org.id, p_created_by, 'owner', p_display_name, NULL, p_created_by, NOW()
  );

  RETURN created_org;
END;
$$;

CREATE OR REPLACE FUNCTION lab_create_record(
  p_org_id UUID,
  p_template_id UUID,
  p_created_by TEXT,
  p_year INTEGER
)
RETURNS prep_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bound_template prep_templates;
  created_record prep_records;
  allocated_record_no TEXT;
BEGIN
  SELECT * INTO bound_template
  FROM prep_templates
  WHERE id = p_template_id AND org_id = p_org_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'approved template not found for organization'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  allocated_record_no := lab_next_record_no(p_org_id, p_year);
  INSERT INTO prep_records (
    org_id, template_id, template_version, record_no, state, draft, created_by
  ) VALUES (
    p_org_id, bound_template.id, bound_template.version, allocated_record_no,
    'draft', '{}'::jsonb, p_created_by
  )
  RETURNING * INTO created_record;

  RETURN created_record;
END;
$$;

REVOKE ALL ON FUNCTION lab_create_org(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION lab_create_record(UUID, UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lab_create_org(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION lab_create_record(UUID, UUID, TEXT, INTEGER) TO service_role;
