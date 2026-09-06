#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${BUILDPAIR_REPO_DIR:-/home/jloveridge1102/BuildPair}"
BRANCH="${BUILDPAIR_DEPLOY_BRANCH:-main}"
HEALTH_URL="${BUILDPAIR_HEALTH_URL:-https://staging.buildpair.co.uk/api/health}"
LOCK_FILE="${BUILDPAIR_DEPLOY_LOCK:-/tmp/buildpair-deploy.lock}"
FAILED_SHA_FILE="${BUILDPAIR_FAILED_SHA_FILE:-/home/jloveridge1102/.buildpair-last-failed-sha}"
DEPLOYED_SHA_FILE="${BUILDPAIR_DEPLOYED_SHA_FILE:-/home/jloveridge1102/.buildpair-last-deployed-sha}"

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

health_response_ok() {
  local response="$1"
  node -e '
    try {
      const data = JSON.parse(process.argv[1]);
      process.exit(data.status === "ok" && data.database === "ok" ? 0 : 1);
    } catch {
      process.exit(1);
    }
  ' "$response" >/dev/null 2>&1
}

wait_for_health() {
  local url="$1"
  local label="$2"
  local response=""

  for attempt in $(seq 1 30); do
    response="$(curl --fail --silent --show-error --connect-timeout 2 --max-time 5 "$url" 2>/dev/null || true)"
    if [[ -n "$response" ]] && health_response_ok "$response"; then
      log "$label health check passed on attempt $attempt."
      return 0
    fi
    sleep 2
  done

  log "$label health check failed after 60 seconds. Last response: ${response:-<no response>}"
  return 1
}

write_deployed_sha() {
  printf '%s\n' "$1" > "$DEPLOYED_SHA_FILE"
  chmod 600 "$DEPLOYED_SHA_FILE"
}

cd "$REPO_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment is already running; exiting."
  exit 0
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  log "Tracked local changes detected; refusing automatic deployment."
  git status --short
  exit 2
fi

log "Checking origin/$BRANCH for changes..."
git fetch --quiet origin "$BRANCH"

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/$BRANCH")"
DEPLOYED_SHA=""
if [[ -f "$DEPLOYED_SHA_FILE" ]]; then
  DEPLOYED_SHA="$(cat "$DEPLOYED_SHA_FILE")"
fi

if [[ "$LOCAL_SHA" == "$REMOTE_SHA" && "$DEPLOYED_SHA" == "$REMOTE_SHA" ]]; then
  log "Already deployed at ${REMOTE_SHA:0:12}."
  exit 0
fi

if [[ -f "$FAILED_SHA_FILE" ]] && [[ "$(cat "$FAILED_SHA_FILE")" == "$REMOTE_SHA" ]]; then
  log "Skipping ${REMOTE_SHA:0:12}; this revision previously failed deployment. Waiting for a newer commit."
  exit 0
fi

if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]] && ! git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA"; then
  log "Local branch has diverged from origin/$BRANCH; refusing automatic deployment."
  exit 3
fi

ROLLBACK_SHA="$LOCAL_SHA"
if [[ -n "$DEPLOYED_SHA" ]] && git cat-file -e "$DEPLOYED_SHA^{commit}" 2>/dev/null; then
  ROLLBACK_SHA="$DEPLOYED_SHA"
fi

BASE_SHA="$ROLLBACK_SHA"
CHANGED_FILES="$(git diff --name-only "$BASE_SHA" "$REMOTE_SHA" 2>/dev/null || true)"
NEEDS_NPM_CI=false
if [[ ! -d node_modules ]] \
  || [[ ! -x node_modules/.bin/tsc ]] \
  || [[ ! -x node_modules/.bin/expo ]] \
  || grep -Eq '^(package\.json|package-lock\.json)$' <<<"$CHANGED_FILES"; then
  NEEDS_NPM_CI=true
fi

rollback() {
  log "Deployment failed. Marking ${REMOTE_SHA:0:12} as failed and rolling back to ${ROLLBACK_SHA:0:12}..."
  printf '%s\n' "$REMOTE_SHA" > "$FAILED_SHA_FILE"
  chmod 600 "$FAILED_SHA_FILE"
  git reset --hard "$ROLLBACK_SHA"
  npm ci
  npm run build:web
  pm2 restart buildpair --update-env >/dev/null || true
  pm2 save >/dev/null || true
  if wait_for_health "http://localhost:3000/api/health" "Rollback local API"; then
    write_deployed_sha "$ROLLBACK_SHA"
  else
    log "Rollback process finished, but local API health could not be confirmed."
  fi
  log "Rollback completed. This failed revision will not be retried unless GitHub changes again."
}

DEPLOY_ACTIVE=false
on_error() {
  code=$?
  if [[ "$DEPLOY_ACTIVE" == true ]]; then
    trap - ERR
    rollback || true
  fi
  exit "$code"
}
trap on_error ERR

if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
  log "Deploying ${LOCAL_SHA:0:12} -> ${REMOTE_SHA:0:12}..."
  git merge --ff-only "$REMOTE_SHA"
else
  log "Repository is at ${REMOTE_SHA:0:12}, but that revision is not marked successfully deployed. Resuming deployment..."
fi
DEPLOY_ACTIVE=true

if [[ "$NEEDS_NPM_CI" == true ]]; then
  log "Dependencies missing or changed; installing locked dependencies..."
  npm ci
else
  log "Dependencies unchanged and toolchain present; skipping npm ci."
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

write_deployed_sha "$REMOTE_SHA"
rm -f "$FAILED_SHA_FILE"
DEPLOY_ACTIVE=false
trap - ERR
log "Deployment complete: ${REMOTE_SHA:0:12} is live."
