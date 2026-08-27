-- Lab-QC Stage 2: Controlled Standard Preparation → Review → Release
-- Spec: .ai-memory/SPEC_LABQC_PREP_RELEASE.md §4.1
--
-- Trust model:
--   * All app access goes through the server (AIVerID OAuth + HMAC session);
--     tables are service-role-only like users/molecules/answer_cards.
--   * lab_events is APPEND-ONLY. Even service_role cannot UPDATE/DELETE rows:
--     privileges are revoked AND a trigger raises. Corrections are new events.
--   * prep_records.signed_payload/signature hold the released evidence pack
--     (Ed25519 JWS over canonical JSON — same kernel as answer_cards). They are
--     write-once: a trigger refuses any change after release except voided_at.
--   * Member-id column is `aiverid` TEXT (Identity Standard v2.2 Part C.4).
-- Idempotent: safe to re-apply.

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$'),
  country TEXT CHECK (country IS NULL OR country ~ '^[A-Z]{2}$'),
  -- Accreditation identity printed on every evidence pack (e.g. "ทดสอบ-0123").
  accreditation_ref TEXT CHECK (accreditation_ref IS NULL OR char_length(accreditation_ref) <= 120),
  created_by TEXT NOT NULL,                       -- aiverid
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  aiverid TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'reviewer', 'analyst', 'viewer')),
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  invited_email TEXT,                             -- pending invite matched on first login
  invited_by TEXT NOT NULL,                       -- aiverid
  joined_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, aiverid)
);
CREATE INDEX IF NOT EXISTS idx_org_members_aiverid ON org_members(aiverid) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS prep_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  key TEXT NOT NULL CHECK (key ~ '^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$'),
  version INTEGER NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'retired')),
  spec JSONB NOT NULL,                            -- PrepTemplateSpec (immutable once approved)
  spec_hash TEXT NOT NULL CHECK (spec_hash ~ '^sha256:[0-9a-f]{64}$'),
  created_by TEXT NOT NULL,                       -- aiverid
  approved_by TEXT,                               -- aiverid, must differ from created_by (app + trigger)
  approved_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, key, version),
  -- Composite targets so records can reference (org_id, template_id, template_version) atomically.
  UNIQUE (org_id, id),
  UNIQUE (org_id, id, version),
  CHECK (status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (approved_by IS NULL OR approved_by <> created_by)
);
CREATE INDEX IF NOT EXISTS idx_prep_templates_org_key ON prep_templates(org_id, key, version DESC);

CREATE TABLE IF NOT EXISTS prep_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  template_id UUID NOT NULL,
  template_version INTEGER NOT NULL,
  record_no TEXT NOT NULL CHECK (record_no ~ '^PR-[0-9]{4}-[0-9]{6}$'),  -- org-scoped, allocated by lab_next_record_no()
  state TEXT NOT NULL CHECK (state IN ('draft', 'submitted', 'released', 'rejected', 'voided')),
  draft JSONB,                                    -- ActualMeasurements; NULL after release
  signed_payload TEXT,                            -- evidence pack canonical JSON (released only)
  signature TEXT,                                 -- compact JWS (released only)
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('released', 'released_with_deviation')),
  deviation_reason TEXT,
  supersedes UUID,                                -- same-org only (composite FK below)
  created_by TEXT NOT NULL,                       -- aiverid (preparer)
  released_by TEXT,                               -- aiverid (reviewer), must differ from created_by
  released_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  void_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, record_no),
  UNIQUE (org_id, id),
  -- Tenant integrity: the template must belong to the same org, and the bound version must exist.
  FOREIGN KEY (org_id, template_id, template_version)
    REFERENCES prep_templates(org_id, id, version) ON DELETE RESTRICT,
  FOREIGN KEY (org_id, supersedes) REFERENCES prep_records(org_id, id) ON DELETE RESTRICT,
  CHECK (supersedes IS NULL OR supersedes <> id),
  CHECK (state NOT IN ('released', 'voided') OR (
    signed_payload IS NOT NULL AND signature IS NOT NULL AND released_by IS NOT NULL
    AND released_at IS NOT NULL AND outcome IS NOT NULL AND draft IS NULL)),
  CHECK (state IN ('released', 'voided') OR (
    signed_payload IS NULL AND signature IS NULL AND outcome IS NULL AND released_by IS NULL AND released_at IS NULL)),
  CHECK (state = 'voided' OR (voided_at IS NULL AND void_reason IS NULL)),
  CHECK (released_by IS NULL OR released_by <> created_by),
  CHECK (state <> 'voided' OR (voided_at IS NOT NULL AND void_reason IS NOT NULL)),
  -- deviation_reason exists ONLY on released_with_deviation (two-way).
  -- NULL-safe: outcome IS NULL must NOT make the whole expression NULL (which CHECK would accept).
  CHECK (
    (outcome = 'released_with_deviation' AND deviation_reason IS NOT NULL)
    OR (outcome IS DISTINCT FROM 'released_with_deviation' AND deviation_reason IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_prep_records_org_created ON prep_records(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prep_records_org_state ON prep_records(org_id, state);

CREATE TABLE IF NOT EXISTS lab_events (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  record_id UUID NOT NULL,
  seq INTEGER NOT NULL CHECK (seq >= 1),
  actor TEXT NOT NULL,                            -- aiverid
  actor_level SMALLINT NOT NULL CHECK (actor_level BETWEEN 1 AND 4),
  action TEXT NOT NULL CHECK (action IN ('create', 'edit', 'submit', 'withdraw', 'release', 'reject', 'void', 'view_pack')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash TEXT CHECK (prev_hash IS NULL OR prev_hash ~ '^sha256:[0-9a-f]{64}$'),
  hash TEXT NOT NULL CHECK (hash ~ '^sha256:[0-9a-f]{64}$'),
  -- TEXT, not TIMESTAMPTZ: `at` is covered by the event hash, so it must come
  -- back byte-for-byte. TIMESTAMPTZ does not round-trip — PostgREST renders it
  -- `...T15:35:29.995+00:00` where Date#toISOString() wrote `...995Z`, and
  -- Postgres drops trailing zeros from the fraction (.990 → .99) — which breaks
  -- the chain permanently on an append-only table. COLLATE "C" keeps ordering
  -- byte-wise, so this fixed-width UTC format still sorts chronologically.
  at TEXT COLLATE "C" NOT NULL
    CHECK (at ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3}Z$'),
  UNIQUE (record_id, seq),
  FOREIGN KEY (org_id, record_id) REFERENCES prep_records(org_id, id) ON DELETE RESTRICT,
  CHECK ((seq = 1) = (prev_hash IS NULL))
);

-- Per-(org, year) running-number allocator. Row lock via ON CONFLICT DO UPDATE
-- serialises concurrent creates; the caller runs this in the same transaction
-- as the prep_records INSERT.
CREATE TABLE IF NOT EXISTS lab_record_counters (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 9999),
  last INTEGER NOT NULL DEFAULT 0 CHECK (last BETWEEN 0 AND 999999),
  PRIMARY KEY (org_id, year)
);

CREATE OR REPLACE FUNCTION lab_next_record_no(p_org_id UUID, p_year INTEGER)
RETURNS TEXT AS $$
DECLARE next_seq INTEGER;
BEGIN
  INSERT INTO lab_record_counters (org_id, year, last)
  VALUES (p_org_id, p_year, 1)
  ON CONFLICT (org_id, year) DO UPDATE SET last = lab_record_counters.last + 1
  RETURNING last INTO next_seq;
  RETURN 'PR-' || p_year::TEXT || '-' || lpad(next_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
CREATE INDEX IF NOT EXISTS idx_lab_events_org_at ON lab_events(org_id, at DESC);

-- ---------- privileges: service-role only, lab_events insert/select only ----------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_events    ENABLE ROW LEVEL SECURITY;

ALTER TABLE lab_record_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE organizations, org_members, prep_templates, prep_records, lab_events, lab_record_counters FROM anon, authenticated;
GRANT ALL ON TABLE organizations, org_members, prep_templates, prep_records, lab_record_counters TO service_role;
REVOKE ALL ON FUNCTION lab_next_record_no(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lab_next_record_no(UUID, INTEGER) TO service_role;
REVOKE ALL ON TABLE lab_events FROM service_role;
GRANT SELECT, INSERT ON TABLE lab_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE lab_events_id_seq TO service_role;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations', 'org_members', 'prep_templates', 'prep_records', 'lab_events', 'lab_record_counters'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access to %1$s" ON %1$I', t);
    EXECUTE format('CREATE POLICY "Service role full access to %1$s" ON %1$I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- ---------- immutability triggers (second line of defence behind privileges) ----------
CREATE OR REPLACE FUNCTION lab_events_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'lab_events is append-only (attempted %)', TG_OP
    USING ERRCODE = 'integrity_constraint_violation';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lab_events_append_only_trigger ON lab_events;
CREATE TRIGGER lab_events_append_only_trigger
BEFORE UPDATE OR DELETE ON lab_events
FOR EACH ROW EXECUTE FUNCTION lab_events_append_only();

-- Approved template spec is frozen: only status/retired_at may change afterwards.
CREATE OR REPLACE FUNCTION prep_templates_freeze_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.retired_at IS NOT NULL THEN
      RAISE EXCEPTION 'prep_templates must be inserted as unapproved drafts'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NEW;
  END IF;

  -- Identity columns never change in any state.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.key IS DISTINCT FROM OLD.key
     OR NEW.version IS DISTINCT FROM OLD.version
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'prep_templates identity columns are immutable'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  IF OLD.status = 'draft' THEN
    -- draft → draft (edit) or draft → approved (spec frozen from here on).
    IF NEW.status NOT IN ('draft', 'approved') THEN
      RAISE EXCEPTION 'draft prep_templates may only be edited or approved'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    IF NEW.status = 'draft' AND (NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL OR NEW.retired_at IS NOT NULL) THEN
      RAISE EXCEPTION 'draft prep_templates cannot carry approval or retirement data'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSIF OLD.status = 'approved' THEN
    -- Allow-list: approved → approved (no-op) or approved → retired (sets retired_at only).
    IF NEW.spec IS DISTINCT FROM OLD.spec
       OR NEW.spec_hash IS DISTINCT FROM OLD.spec_hash
       OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
       OR NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
      RAISE EXCEPTION 'approved prep_templates are immutable'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    IF NEW.status = 'approved' THEN
      IF NEW.retired_at IS DISTINCT FROM OLD.retired_at THEN
        RAISE EXCEPTION 'approved prep_templates cannot carry retirement data'
          USING ERRCODE = 'integrity_constraint_violation';
      END IF;
    ELSIF NEW.status = 'retired' THEN
      IF NEW.retired_at IS NULL THEN
        RAISE EXCEPTION 'retiring a prep_template requires retired_at'
          USING ERRCODE = 'integrity_constraint_violation';
      END IF;
    ELSE
      RAISE EXCEPTION 'approved prep_templates may only be retired'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSE
    -- retired is terminal and fully immutable.
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      RAISE EXCEPTION 'retired prep_templates are terminal'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prep_templates_freeze_trigger ON prep_templates;
CREATE TRIGGER prep_templates_freeze_trigger
BEFORE INSERT OR UPDATE ON prep_templates
FOR EACH ROW EXECUTE FUNCTION prep_templates_freeze_approved();

-- Released record is write-once: only released → voided (+voided_at/void_reason/updated_at) allowed.
CREATE OR REPLACE FUNCTION prep_records_state_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- Records are born as drafts; every other state is reached only by transition.
  IF TG_OP = 'INSERT' THEN
    IF NEW.state <> 'draft' THEN
      RAISE EXCEPTION 'prep_records must be inserted in state draft'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    RETURN NEW;
  END IF;

  -- Identity columns never change in any state.
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.template_id IS DISTINCT FROM OLD.template_id
     OR NEW.template_version IS DISTINCT FROM OLD.template_version
     OR NEW.record_no IS DISTINCT FROM OLD.record_no
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.supersedes IS DISTINCT FROM OLD.supersedes THEN
    RAISE EXCEPTION 'prep_records identity columns are immutable'
      USING ERRCODE = 'integrity_constraint_violation';
  END IF;

  -- Transition allow-list (spec §5): draft↔submitted, submitted→released|rejected, released→voided.
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    IF NOT (
      (OLD.state = 'draft' AND NEW.state = 'submitted') OR
      (OLD.state = 'submitted' AND NEW.state IN ('draft', 'released', 'rejected')) OR
      (OLD.state = 'released' AND NEW.state = 'voided')
    ) THEN
      RAISE EXCEPTION 'illegal prep_records transition % -> %', OLD.state, NEW.state
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;

  -- Leaving `submitted`: withdraw/reject may change nothing but the state;
  -- release may only ADD evidence fields and must clear the draft.
  IF OLD.state = 'submitted' AND NEW.state IN ('draft', 'rejected') THEN
    IF NEW.draft IS DISTINCT FROM OLD.draft
       OR NEW.signed_payload IS NOT NULL OR NEW.signature IS NOT NULL OR NEW.outcome IS NOT NULL
       OR NEW.deviation_reason IS DISTINCT FROM OLD.deviation_reason
       OR NEW.released_by IS NOT NULL OR NEW.released_at IS NOT NULL
       OR NEW.voided_at IS NOT NULL OR NEW.void_reason IS NOT NULL THEN
      RAISE EXCEPTION 'withdraw/reject may change only the state'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSIF OLD.state = 'submitted' AND NEW.state = 'released' THEN
    IF NEW.draft IS NOT NULL OR NEW.voided_at IS NOT NULL OR NEW.void_reason IS NOT NULL THEN
      RAISE EXCEPTION 'release must clear the draft and carry no void data'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;

  IF OLD.state = 'released' THEN
    -- released → released must be a no-op; released → voided may set ONLY voided_at + void_reason.
    IF NEW.signed_payload IS DISTINCT FROM OLD.signed_payload
       OR NEW.signature IS DISTINCT FROM OLD.signature
       OR NEW.outcome IS DISTINCT FROM OLD.outcome
       OR NEW.deviation_reason IS DISTINCT FROM OLD.deviation_reason
       OR NEW.released_by IS DISTINCT FROM OLD.released_by
       OR NEW.released_at IS DISTINCT FROM OLD.released_at
       OR NEW.draft IS NOT NULL THEN
      RAISE EXCEPTION 'released prep_records are immutable'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
    IF NEW.state = 'voided' AND (NEW.voided_at IS NULL OR NEW.void_reason IS NULL) THEN
      RAISE EXCEPTION 'voiding a prep_record requires voided_at and void_reason'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSIF OLD.state IN ('voided', 'rejected') THEN
    -- Terminal: no column may change (updated_at is pinned by its trigger).
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      RAISE EXCEPTION '% prep_records are terminal', OLD.state
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSIF OLD.state = 'draft' AND NEW.state = 'draft' THEN
    -- Editing a draft may touch only the draft payload.
    IF NEW.signed_payload IS NOT NULL OR NEW.signature IS NOT NULL OR NEW.outcome IS NOT NULL
       OR NEW.deviation_reason IS DISTINCT FROM OLD.deviation_reason THEN
      RAISE EXCEPTION 'draft prep_records may only change their draft payload'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  ELSIF OLD.state = 'submitted' AND NEW.state = 'submitted' THEN
    IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
      RAISE EXCEPTION 'submitted prep_records are frozen until reviewed or withdrawn'
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prep_records_freeze_trigger ON prep_records;
DROP TRIGGER IF EXISTS prep_records_state_guard_trigger ON prep_records;
CREATE TRIGGER prep_records_state_guard_trigger
BEFORE INSERT OR UPDATE ON prep_records
FOR EACH ROW EXECUTE FUNCTION prep_records_state_guard();

-- updated_at maintenance (same helper pattern as users/molecules)
-- Bumps updated_at only when something actually changed (byte-for-byte
-- immutability for terminal rows; no-op UPDATEs leave the row untouched).
CREATE OR REPLACE FUNCTION update_lab_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = OLD.updated_at;
  IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS organizations_updated_at_trigger ON organizations;
CREATE TRIGGER organizations_updated_at_trigger
BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_lab_updated_at();

DROP TRIGGER IF EXISTS prep_records_updated_at_trigger ON prep_records;
DROP TRIGGER IF EXISTS a_prep_records_updated_at_trigger ON prep_records;
-- Named to sort BEFORE prep_records_state_guard_trigger: pin/bump updated_at first,
-- then the guard compares rows (a caller-supplied timestamp can never trip 'terminal').
CREATE TRIGGER a_prep_records_updated_at_trigger
BEFORE UPDATE ON prep_records FOR EACH ROW EXECUTE FUNCTION update_lab_updated_at();
