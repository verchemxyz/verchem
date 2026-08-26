-- Lab-QC API support. Migration 004 is intentionally left untouched.
-- These helpers keep multi-row creation and per-org record-number allocation
-- inside PostgreSQL, where row locks and constraints apply atomically.

ALTER TABLE org_members
  ADD COLUMN IF NOT EXISTS revoked_by TEXT;

ALTER TABLE prep_records
  ADD COLUMN IF NOT EXISTS share_token_hash TEXT
    CHECK (share_token_hash IS NULL OR share_token_hash ~ '^[0-9a-f]{64}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_prep_records_share_token_hash
  ON prep_records(share_token_hash) WHERE share_token_hash IS NOT NULL;

-- The bearer token is issued exactly once with the signed release record. It
-- is operational metadata (not a claim inside the JWS), so prevent later
-- replacement/revocation from silently changing an auditor's public URL.
CREATE OR REPLACE FUNCTION prep_records_share_token_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.state = 'draft' AND NEW.share_token_hash IS DISTINCT FROM OLD.share_token_hash THEN
    RAISE EXCEPTION 'draft prep_records cannot carry a share token'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.state = 'submitted' AND NEW.state <> 'released'
     AND NEW.share_token_hash IS DISTINCT FROM OLD.share_token_hash THEN
    RAISE EXCEPTION 'share token may only be issued during release'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.state IN ('released', 'voided') AND NEW.share_token_hash IS DISTINCT FROM OLD.share_token_hash THEN
    RAISE EXCEPTION 'released prep_records share token is immutable'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;
  IF OLD.state = 'submitted' AND NEW.state = 'released' AND NEW.share_token_hash IS NULL THEN
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
  p_year INTEGER,
  p_record_id UUID,
  p_event JSONB
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
    id, org_id, template_id, template_version, record_no, state, draft, created_by
  ) VALUES (
    p_record_id, p_org_id, bound_template.id, bound_template.version, allocated_record_no,
    'draft', '{}'::jsonb, p_created_by
  )
  RETURNING * INTO created_record;

  IF p_event->>'record_id' IS DISTINCT FROM created_record.id::TEXT
     OR p_event->>'prev_hash' IS NOT NULL
     OR p_event->>'seq' IS DISTINCT FROM '1'
     OR p_event->>'actor' IS DISTINCT FROM p_created_by
     OR p_event->>'action' IS DISTINCT FROM 'create'
     OR p_event->'payload'->>'template_id' IS DISTINCT FROM bound_template.id::TEXT
     OR p_event->'payload'->>'template_version' IS DISTINCT FROM bound_template.version::TEXT THEN
    RAISE EXCEPTION 'invalid create event'
      USING ERRCODE = 'P4C09';
  END IF;

  INSERT INTO lab_events (
    org_id, record_id, seq, actor, actor_level, action, payload, prev_hash, hash, at
  ) VALUES (
    p_org_id,
    (p_event->>'record_id')::UUID,
    (p_event->>'seq')::INTEGER,
    p_event->>'actor',
    (p_event->>'actor_level')::SMALLINT,
    p_event->>'action',
    COALESCE(p_event->'payload', '{}'::jsonb),
    p_event->>'prev_hash',
    p_event->>'hash',
    (p_event->>'at')::TIMESTAMPTZ
  );

  RETURN created_record;
END;
$$;

-- Applies a state transition and its audit event atomically.  `P4C09` is a
-- deliberate compare-and-swap conflict code mapped to HTTP 409 by the app.
CREATE OR REPLACE FUNCTION lab_apply_transition(
  p_org_id UUID,
  p_record_id UUID,
  p_from TEXT,
  p_to TEXT,
  p_patch JSONB,
  p_event JSONB
)
RETURNS prep_records
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_record prep_records;
  updated_record prep_records;
  current_hash TEXT;
  current_seq INTEGER;
  patch_key TEXT;
BEGIN
  IF jsonb_typeof(p_patch) IS DISTINCT FROM 'object' OR jsonb_typeof(p_event) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'transition patch and event must be JSON objects'
      USING ERRCODE = '22023';
  END IF;

  FOR patch_key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF patch_key NOT IN (
      'draft', 'signed_payload', 'signature', 'outcome', 'deviation_reason',
      'released_by', 'released_at', 'share_token_hash', 'voided_at', 'void_reason'
    ) THEN
      RAISE EXCEPTION 'transition patch contains forbidden column: %', patch_key
        USING ERRCODE = '22023';
    END IF;
  END LOOP;

  SELECT * INTO locked_record
  FROM prep_records
  WHERE id = p_record_id AND org_id = p_org_id AND state = p_from
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'preparation record state changed before transition'
      USING ERRCODE = 'P4C09';
  END IF;

  SELECT seq, hash INTO current_seq, current_hash
  FROM lab_events
  WHERE record_id = p_record_id
  ORDER BY seq DESC
  LIMIT 1;

  IF p_event->>'record_id' IS DISTINCT FROM p_record_id::TEXT
     OR p_event->>'prev_hash' IS DISTINCT FROM current_hash
     OR p_event->>'seq' IS DISTINCT FROM (COALESCE(current_seq, 0) + 1)::TEXT THEN
    RAISE EXCEPTION 'audit event does not extend the current chain head'
      USING ERRCODE = 'P4C09';
  END IF;

  INSERT INTO lab_events (
    org_id, record_id, seq, actor, actor_level, action, payload, prev_hash, hash, at
  ) VALUES (
    p_org_id,
    (p_event->>'record_id')::UUID,
    (p_event->>'seq')::INTEGER,
    p_event->>'actor',
    (p_event->>'actor_level')::SMALLINT,
    p_event->>'action',
    COALESCE(p_event->'payload', '{}'::jsonb),
    p_event->>'prev_hash',
    p_event->>'hash',
    (p_event->>'at')::TIMESTAMPTZ
  );

  UPDATE prep_records
  SET
    state = p_to,
    -- JSON null must become SQL NULL (release clears the draft; CHECK requires draft IS NULL).
    draft = CASE WHEN p_patch ? 'draft' THEN NULLIF(p_patch->'draft', 'null'::jsonb) ELSE draft END,
    signed_payload = CASE WHEN p_patch ? 'signed_payload' THEN p_patch->>'signed_payload' ELSE signed_payload END,
    signature = CASE WHEN p_patch ? 'signature' THEN p_patch->>'signature' ELSE signature END,
    outcome = CASE WHEN p_patch ? 'outcome' THEN p_patch->>'outcome' ELSE outcome END,
    deviation_reason = CASE WHEN p_patch ? 'deviation_reason' THEN p_patch->>'deviation_reason' ELSE deviation_reason END,
    released_by = CASE WHEN p_patch ? 'released_by' THEN p_patch->>'released_by' ELSE released_by END,
    released_at = CASE WHEN p_patch ? 'released_at' THEN (p_patch->>'released_at')::TIMESTAMPTZ ELSE released_at END,
    share_token_hash = CASE WHEN p_patch ? 'share_token_hash' THEN p_patch->>'share_token_hash' ELSE share_token_hash END,
    voided_at = CASE WHEN p_patch ? 'voided_at' THEN (p_patch->>'voided_at')::TIMESTAMPTZ ELSE voided_at END,
    void_reason = CASE WHEN p_patch ? 'void_reason' THEN p_patch->>'void_reason' ELSE void_reason END
  WHERE id = p_record_id AND org_id = p_org_id AND state = p_from
  RETURNING * INTO updated_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'preparation record state changed before update'
      USING ERRCODE = 'P4C09';
  END IF;

  RETURN updated_record;
END;
$$;

REVOKE ALL ON FUNCTION lab_create_org(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION lab_create_record(UUID, UUID, TEXT, INTEGER, UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION lab_apply_transition(UUID, UUID, TEXT, TEXT, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lab_create_org(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION lab_create_record(UUID, UUID, TEXT, INTEGER, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION lab_apply_transition(UUID, UUID, TEXT, TEXT, JSONB, JSONB) TO service_role;
