-- Identity Standard v2.2 Part C.4
-- Upgrade existing VerChem databases from the legacy member-id column name.
-- Fresh databases already use `aiverid` through migrations 000-002.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'aiverid_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'aiverid'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN aiverid_id TO aiverid;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'molecules'
      AND column_name = 'aiverid_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'molecules'
      AND column_name = 'aiverid'
  ) THEN
    ALTER TABLE public.molecules RENAME COLUMN aiverid_id TO aiverid;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'answer_cards'
      AND column_name = 'aiverid_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'answer_cards'
      AND column_name = 'aiverid'
  ) THEN
    ALTER TABLE public.answer_cards RENAME COLUMN aiverid_id TO aiverid;
  END IF;

  -- Older installations may have included the legacy column suffix in index
  -- names. Column renames preserve index definitions, so normalize names too.
  IF to_regclass('public.idx_users_aiverid_id') IS NOT NULL
     AND to_regclass('public.idx_users_aiverid') IS NULL THEN
    ALTER INDEX public.idx_users_aiverid_id RENAME TO idx_users_aiverid;
  END IF;

  IF to_regclass('public.idx_molecules_aiverid_id') IS NOT NULL
     AND to_regclass('public.idx_molecules_aiverid') IS NULL THEN
    ALTER INDEX public.idx_molecules_aiverid_id RENAME TO idx_molecules_aiverid;
  END IF;

  IF to_regclass('public.idx_answer_cards_aiverid_id') IS NOT NULL
     AND to_regclass('public.idx_answer_cards_aiverid') IS NULL THEN
    ALTER INDEX public.idx_answer_cards_aiverid_id RENAME TO idx_answer_cards_aiverid;
  END IF;

  -- The dashboard-era users table carried its UNIQUE constraint under the
  -- legacy column name; renaming the column does not rename the constraint.
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'users'
      AND c.conname = 'users_aiverid_id_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'users'
      AND c.conname = 'users_aiverid_key'
  ) THEN
    ALTER TABLE public.users RENAME CONSTRAINT users_aiverid_id_key TO users_aiverid_key;
  END IF;
END
$$;
