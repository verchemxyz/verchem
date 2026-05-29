# VerChem — Supabase Recovery / Fresh Setup Runbook

**Why this exists:** the original Supabase project (`verchemxyz's Project`) was on
the **free tier**, auto-paused after inactivity, and has now been paused **> 90
days** (since 24 Jun 2024) → it can no longer be restored from the dashboard.
Because VerChem auth is **AIVerID OAuth + HMAC cookie** (not Supabase Auth),
login kept working — so the dead DB went unnoticed. But every DB-backed feature
(save molecule, **W1 library**, **W3 verified-answer save/share**) has been
silently failing since then.

Decision (พี่จ๊อบ, 2026-05-29): **download the backup, then set up a fresh project.**

The code only touches **3 tables** — `users`, `molecules`, `answer_cards` — each
defined by a repo migration using the service-role-only pattern. (The other
tables in `DATABASE_SCHEMA.md` — saved_calculations / favorites /
user_preferences / calculation_history / subscriptions — are NOT used by current
code; skip them unless you wire those features.)

---

## Steps (พี่จ๊อบ does 1, 2, 4, 5, 6; SQL in step 3 is ready in this repo)

### 1. Download the backup (no-regret — do this first)
On the paused project dashboard → **Download backups** → keep the dump safe.
(Supabase may eventually delete a long-paused project; this preserves the data.)

### 2. Create a new Supabase project
Same org is fine. Suggested name `verchem`. Pick a region close to users.
> ⚠️ Free tier pauses again after ~7 days of inactivity. For a live product,
> set an uptime ping or move to Pro so this doesn't recur.

### 3. Run the schema (SQL Editor → paste each, in order)
Run these repo files **in order** (each is idempotent — safe to re-run):
1. `supabase/migrations/000_users_table.sql`
2. `supabase/migrations/001_molecules_table.sql`
3. `supabase/migrations/002_answer_cards_table.sql`

> Do **NOT** run `supabase/enable-rls.sql` — it's superseded (it references the
> unused saved_calculations/favorites/user_preferences tables and would error).

### 4. Copy the new credentials
Project Settings → **API**:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Update environment variables
**Vercel** (Production + Preview) and local **`.env.local`** — set the 3 above.
While there, confirm W3 vars are also set in Vercel:
- `ANSWER_CARD_SECRET` (or reuse `SESSION_SECRET`) — signs verified answer cards
- `ANTHROPIC_API_KEY` — the verified-answer orchestrator
- `SESSION_SECRET` — HMAC session cookies

### 6. Redeploy + smoke test
- Redeploy on Vercel so the new env vars apply.
- Manual: `/draw` → save → `/account/molecules`; `/tools/verified-answer` → ask →
  Save → make public → open `/verified/[id]`.
- Orchestrator: `ANTHROPIC_API_KEY=… npm run test:smoke`.

---

## Restoring old data (optional, later)
If the downloaded backup holds real rows worth keeping: the `users` / `molecules`
/ `answer_cards` shapes match `000/001/002` here, so you can `COPY`/`INSERT` those
rows into the new project. (Given the DB was paused since before the app's public
push, expect little-to-no production data.)
