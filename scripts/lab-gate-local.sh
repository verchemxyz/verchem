#!/usr/bin/env bash
# Run the Lab-QC integration gate against a local Supabase stack.
#
# The gate needs a REAL Postgres (triggers, SECURITY DEFINER, JSONB, races) —
# the recording-fake contract tests cannot exercise those. Production must never
# be used: `lab_events` is append-only even for service_role, so gate rows would
# be unremovable, and the gate deliberately writes rejected/negative cases.
#
#   npx supabase start   # first time: also applies supabase/migrations
#   npm run gate:lab:local
#
# The service key is read from the running Kong container rather than stored
# here — it is the CLI's fixed local development key, identical on every machine
# and worthless outside this laptop, but it still does not belong in the repo.
set -euo pipefail

CONTAINER="supabase_kong_$(node -e "process.stdout.write(require('fs').readFileSync('supabase/config.toml','utf8').match(/project_id\s*=\s*\"([^\"]+)\"/)[1])")"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Local Supabase stack is not running. Start it with: npx supabase start" >&2
  exit 2
fi

KEY="$(docker exec "$CONTAINER" sh -c "grep -o 'sb_secret_[A-Za-z0-9_-]*' /home/kong/kong.yml | head -1")"
if [ -z "$KEY" ]; then
  echo "Could not read the local service key from $CONTAINER." >&2
  exit 2
fi

# Point every Supabase variable at the local stack, so an accidental import of
# the app's own client cannot reach the production project.
LAB_GATE_SUPABASE_URL="http://127.0.0.1:54321" \
LAB_GATE_SERVICE_ROLE_KEY="$KEY" \
LAB_GATE_ALLOW_PROJECT_REF="127" \
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
SUPABASE_SERVICE_ROLE_KEY="$KEY" \
  npm run gate:lab
