# VerChem — Supabase setup

VerChem uses Supabase only as a Postgres database behind the server.

- **No Supabase Auth.** Sign-in is AIVerID OAuth plus a signed session cookie (see [docs/architecture/AIVERID_INTEGRATION.md](../docs/architecture/AIVERID_INTEGRATION.md)).
- **Service role only.** Every table has row-level security enabled, privileges revoked from `anon` and `authenticated`, and a single service-role policy. The browser never talks to Supabase directly, and the anon key is not used.
- **The migrations are the schema.** `supabase/migrations/` is the source of truth. [docs/architecture/DATABASE_SCHEMA.md](../docs/architecture/DATABASE_SCHEMA.md) summarizes it.

## Migrations

Apply in order. Every file is idempotent.

| File | Creates / changes |
|---|---|
| `000_users_table.sql` | `users` — one row per AIVerID member (`aiverid` TEXT is the identity key) |
| `001_molecules_table.sql` | `molecules` — structures saved from `/draw` |
| `002_answer_cards_table.sql` | `answer_cards` — saved signed calculation cards |
| `003_rename_aiverid.sql` | Upgrade only: renames the legacy member-id column to `aiverid` on older databases (no-op on fresh ones) |
| `004_lab_qc.sql` | VerChem Lab tables: `organizations`, `org_members`, `prep_templates`, `prep_records`, `lab_events` (append-only), `lab_record_counters`, with state-guard triggers |
| `005_lab_functions.sql` | VerChem Lab transactional functions: `lab_create_org`, `lab_create_record`, `lab_apply_transition`, and the share-token guard |

`full_setup.sql` is an older combined copy of 000–002 only. It does not include VerChem Lab, so use the individual migration files for a new project.

## New project

1. Create a Supabase project (Postgres 17, matching `supabase/config.toml`).
2. Apply the migrations 000 → 005, either from the SQL Editor or with the Supabase CLI (`npx supabase link` then `npx supabase db push`).
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` into the Vercel project (Production and Preview) and into a local `.env.local`. See `.env.example` for the full variable list.
4. Redeploy so the new variables apply.
5. Smoke test: sign in, save a structure from `/draw` (it should appear at `/account/molecules`), and open `/lab` (it should list organizations without an error). On production, do not create test organizations or records: Lab history cannot be deleted.

## Production safety

- **Never run `npm run gate:lab*` against production.** `lab_events` is append-only, even for `service_role`, so test rows can never be removed. Run the gates against a local stack: `npx supabase start` (applies the migrations), then `npm run gate:lab:local` or `npm run gate:lab:e2e`.
- **Apply schema changes before deploying the code that needs them.** Empty tables waiting for code are harmless; code reaching for missing tables is an outage.
- **Keep backups.** The Free plan has no automatic backups and pauses after about a week of inactivity. A production project holding VerChem Lab records needs either a paid plan with daily backups or scheduled `pg_dump` exports kept outside the repository.
- Never commit dumps, keys, or connection strings. Database exports contain member data.

## History

The first Supabase project was paused for more than 90 days in 2024 and could not be restored. Login kept working because auth does not depend on Supabase, so the outage went unnoticed. It was rebuilt from these migrations in May 2026. `enable-rls.sql` and the `auth.uid()` policies from that era are gone: they never matched production.
