#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${BUILDPAIR_REPO_DIR:-/home/jloveridge1102/BuildPair}"
BRANCH="${BUILDPAIR_DEPLOY_BRANCH:-main}"
HEALTH_URL="${BUILDPAIR_HEALTH_URL:-https://staging.buildpair.co.uk/api/health}"
LOCK_FILE="${BUILDPAIR_DEPLOY_LOCK:-/tmp/buildpair-deploy.lock}"
FAILED_SHA_FILE="${BUILDPAIR_FAILED_SHA_FILE:-/home/jloveridge1102/.buildpair-last-failed-sha}"

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

wait_for_health() {
  local url="$1"
  local label="$2"
  local response=""

  for attempt in $(seq 1 30); do
    response="$(curl --fail --silent --show-error --connect-timeout 2 --max-time 5 "$url" 2>/dev/null || true)"
    if [[ "$response" == *'"status":"ok"'* && "$response" == *'"database":"ok"'* ]]; then
      log "$label health check passed on attempt $attempt."
      return 0
    fi
    sleep 2
  done

  log "$label health check failed after 60 seconds. Last response: ${response:-<no response>}"
  return 1
}

cd "$REPO_DIR"

# Never run two deploys at once.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment is already running; exiting."
  exit 0
fi

# Refuse to overwrite tracked local work. Ignored local files such as .env are fine.
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "Tracked local changes detected; refusing automatic deployment."
  git status --short
  exit 2
fi

log "Checking origin/$BRANCH for changes..."
git fetch --quiet origin "$BRANCH"

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/$BRANCH")"

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
  log "Already current at ${LOCAL_SHA:0:12}."
  exit 0
fi

if [[ -f "$FAILED_SHA_FILE" ]] && [[ "$(cat "$FAILED_SHA_FILE")" == "$REMOTE_SHA" ]]; then
  log "Skipping ${REMOTE_SHA:0:12}; this revision previously failed deployment. Waiting for a newer commit."
  exit 0
fi

# Only accept a fast-forward from the deployed checkout.
if ! git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA"; then
  log "Local branch has diverged from origin/$BRANCH; refusing automatic deployment."
  exit 3
fi

CHANGED_FILES="$(git diff --name-only "$LOCAL_SHA" "$REMOTE_SHA")"
NEEDS_NPM_CI=false
if [[ ! -d node_modules ]] || grep -Eq '^(package\.json|package-lock\.json)$' <<<"$CHANGED_FILES"; then
  NEEDS_NPM_CI=true
fi

rollback() {
  log "Deployment failed after switching revisions. Marking ${REMOTE_SHA:0:12} as failed and rolling back to ${LOCAL_SHA:0:12}..."
  printf '%s\n' "$REMOTE_SHA" > "$FAILED_SHA_FILE"
  chmod 600 "$FAILED_SHA_FILE"
  git reset --hard "$LOCAL_SHA"
  npm ci
  npm run build:web
  pm2 restart buildpair --update-env >/dev/null || true
  pm2 save >/dev/null || true
  wait_for_health "http://localhost:3000/api/health" "Rollback local API" || true
  log "Rollback completed. This failed revision will not be retried unless GitHub changes again."
}

DEPLOY_SWITCHED=false
on_error() {
  code=$?
  if [[ "$DEPLOY_SWITCHED" == true ]]; then
    trap - ERR
    rollback || true
  fi
  exit "$code"
}
trap on_error ERR

log "Deploying ${LOCAL_SHA:0:12} -> ${REMOTE_SHA:0:12}..."
git merge --ff-only "$REMOTE_SHA"
DEPLOY_SWITCHED=true

if [[ "$NEEDS_NPM_CI" == true ]]; then
  log "Dependency files changed; installing locked dependencies..."
  npm ci
else
  log "Dependencies unchanged; skipping npm ci."
fi

log "Running TypeScript checks..."
npm run typecheck

log "Building web production output..."
npm run build:web

log "Restarting BuildPair..."
pm2 restart buildpair --update-env >/dev/null
pm2 save >/dev/null

log "Waiting for local API health..."
wait_for_health "http://localhost:3000/api/health" "Local API"

log "Waiting for public staging health..."
wait_for_health "$HEALTH_URL" "Public staging"

rm -f "$FAILED_SHA_FILE"
DEPLOY_SWITCHED=false
trap - ERR
log "Deployment complete: ${REMOTE_SHA:0:12} is live."
