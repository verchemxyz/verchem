# VerChem — Database schema

This is a summary. The schema itself is `supabase/migrations/000`–`005`. If this page and a migration disagree, the migration is right. Setup steps are in [supabase/SETUP.md](../../supabase/SETUP.md).

The 2025 planning draft (saved calculations, favorites, preferences and subscriptions tables, plus `auth.uid()` policies) was never built and is kept at [history/DATABASE_SCHEMA_PLAN_2025-11.md](../history/DATABASE_SCHEMA_PLAN_2025-11.md).

## Access model

- Postgres on Supabase, reached **only from the server** with the service-role key.
- Every table enables row-level security, revokes all privileges from `anon` and `authenticated`, and has one `FOR ALL TO service_role` policy.
- The member identity column is always `aiverid TEXT`. It is the opaque AIVerID member identifier: never parse it or derive anything from it. Migration 003 renames the legacy member-id column on older databases.
- User preferences, calculator history and the offline cache live in the browser, not in this database.

## Account features (000–002)

| Table | Purpose | Key columns |
|---|---|---|
| `users` | One row per AIVerID member, created at first sign-in | `aiverid` (unique), `email` (not unique on purpose), `name`, `avatar_url`, `role`, `last_login` |
| `molecules` | Structures saved from `/draw` | `aiverid`, `name`, `smiles`, `mol_block`, `inchi`, `inchi_key`, `tags[]`, `notes`, `is_public` |
| `answer_cards` | Saved signed calculation cards | `aiverid`, `question`, `status` (`verified`/`partial`/`unverified`/`error`), `signed_payload` (canonical JSON, source of truth), `signature`, `is_public` |

`answer_cards.signature` holds an Ed25519 compact JWS for current cards. Cards are re-verified against `signed_payload` every time they are read, so a stored row that no longer matches its signature is shown as invalid, not as verified.

## VerChem Lab (004–005)

Controlled standard preparation → review → release, scoped to an organization.

| Table | Purpose |
|---|---|
| `organizations` | A lab: `name`, `slug` (unique), `country`, `accreditation_ref` |
| `org_members` | Membership per `(org_id, aiverid)` with `role` ∈ `owner`/`reviewer`/`analyst`/`viewer`; invites, `revoked_at`, `revoked_by` |
| `prep_templates` | Versioned preparation templates (`key`, `version`, `status` draft/approved/retired, `spec` JSONB, `spec_hash`). An approved version is frozen, and the approver must differ from the creator |
| `prep_records` | One preparation (`record_no` `PR-YYYY-NNNNNN`, `state` draft/submitted/released/rejected/voided, `draft` JSONB). On release it stores the signed evidence pack (`signed_payload` + compact JWS `signature`) and the reviewer, who must differ from the preparer. `share_token_hash` backs one-time verification links |
| `lab_events` | **Append-only** hash-chained audit trail (`seq`, `actor`, `actor_level`, `action`, `payload`, `prev_hash`, `hash`, `at`) |
| `lab_record_counters` | Per-organization, per-year counter behind `record_no` |

### Integrity rules enforced in the database

- `lab_events`: `service_role` has only `SELECT` and `INSERT`, and a trigger rejects `UPDATE`/`DELETE` as a second line of defence. Corrections are new events. `at` is stored as fixed-width UTC **TEXT**, not `TIMESTAMPTZ`, because it is covered by the event hash and has to round-trip byte for byte.
- `prep_records`: CHECK constraints tie each state to the fields it must or must not have. After release, a trigger refuses every change except voiding. `supersedes` and the template reference must belong to the same organization (composite foreign keys).
- `prep_templates`: approved specs cannot change.
- Functions executable by `service_role` only: `lab_create_org`, `lab_create_record` and `lab_apply_transition` (`SECURITY DEFINER`, fixed `search_path`) run multi-row changes inside one transaction, and `lab_next_record_no` allocates record numbers with an atomic `INSERT … ON CONFLICT DO UPDATE`.

Because `lab_events` cannot be cleaned up, integration gates (`npm run gate:lab*`) run only against a local Supabase stack, never against production.
