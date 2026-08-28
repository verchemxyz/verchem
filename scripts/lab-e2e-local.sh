#!/usr/bin/env bash
# Drive the whole Lab-QC lifecycle over HTTP against a local dev server and the
# local Supabase stack — the combination a customer actually uses, and the one
# neither the contract tests (handlers + fake database) nor the integration gate
# (repository + real Postgres) exercise.
#
#   npx supabase start        # first time: also applies supabase/migrations
#   npm run gate:lab:e2e
#
# Production must never be used: the walk writes records and append-only audit
# events, and `lab_events` cannot be cleaned up afterwards.
set -euo pipefail

PORT="${LAB_E2E_PORT:-3131}"
CONTAINER="supabase_kong_$(node -e "process.stdout.write(require('fs').readFileSync('supabase/config.toml','utf8').match(/project_id\s*=\s*\"([^\"]+)\"/)[1])")"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Local Supabase stack is not running. Start it with: npx supabase start" >&2
  exit 2
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Set LAB_E2E_PORT to a free port." >&2
  exit 2
fi

KEY="$(docker exec "$CONTAINER" sh -c "grep -o 'sb_secret_[A-Za-z0-9_-]*' /home/kong/kong.yml | head -1")"
if [ -z "$KEY" ]; then
  echo "Could not read the local service key from $CONTAINER." >&2
  exit 2
fi
# The walkthrough mints the same signed cookie pair the OAuth callback writes,
# so it needs the secret the server verifies with — never a production secret.
SECRET="${SESSION_SECRET:-$(grep -E '^SESSION_SECRET=' .env.local 2>/dev/null | cut -d= -f2- || true)}"
if [ -z "$SECRET" ]; then
  echo "SESSION_SECRET is not set and .env.local does not define one." >&2
  exit 2
fi

# Every Supabase variable points at the local stack, so an accidental import of
# the app's own client cannot reach the production project.
export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY="$KEY"
export SESSION_SECRET="$SECRET"

LOG="$(mktemp -t verchem-lab-e2e)"
DIST_DIR=".next-lab-e2e"
export NEXT_DIST_DIR="$DIST_DIR"
export WATCHPACK_POLLING=true
set -m
PORT="$PORT" ./node_modules/.bin/next dev --webpack -p "$PORT" >"$LOG" 2>&1 &
SERVER_PID=$!
set +m
cleanup() {
  # next dev forks a compiler child; terminate only the process group this
  # script created so no watcher survives the gate.
  kill -- "-$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
  node -e "require('fs').rmSync(process.argv[1], { recursive: true, force: true })" "$DIST_DIR"
  rm -f "$LOG"
}
trap cleanup EXIT

for _ in $(seq 1 90); do
  if curl --max-time 5 -sf -o /dev/null "http://localhost:$PORT/"; then break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then echo "Dev server exited early:" >&2; cat "$LOG" >&2; exit 1; fi
  sleep 1
done
if ! curl --max-time 5 -sf -o /dev/null "http://localhost:$PORT/"; then
  echo "Dev server did not become ready on port $PORT:" >&2; cat "$LOG" >&2; exit 1
fi

# localhost, not 127.0.0.1: the dev server reports its own origin as localhost
# and the CSRF check compares against it.
LAB_E2E_BASE_URL="http://localhost:$PORT" \
  node --conditions=react-server --import tsx scripts/lab-e2e-http.ts
