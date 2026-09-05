#!/usr/bin/env bash
set -Eeuo pipefail

REPO_DIR="${BUILDPAIR_REPO_DIR:-/home/jloveridge1102/BuildPair}"
BRANCH="${BUILDPAIR_DEPLOY_BRANCH:-main}"
HEALTH_URL="${BUILDPAIR_HEALTH_URL:-https://staging.buildpair.co.uk/api/health}"
LOCK_FILE="${BUILDPAIR_DEPLOY_LOCK:-/tmp/buildpair-deploy.lock}"

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

cd "$REPO_DIR"

# Never run two deploys at once.
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "Another deployment is already running; exiting."
  exit 0
fi

# Refuse to overwrite tracked local work. Untracked local-only files such as .env are fine.
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

# Only accept a fast-forward from the deployed checkout.
if ! git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA"; then
  log "Local branch has diverged from origin/$BRANCH; refusing automatic deployment."
  exit 3
fi

log "Deploying ${LOCAL_SHA:0:12} -> ${REMOTE_SHA:0:12}..."
git merge --ff-only "$REMOTE_SHA"

log "Installing locked dependencies..."
npm ci

log "Running TypeScript checks..."
npm run typecheck

log "Building web production output..."
npm run build:web

log "Restarting BuildPair..."
pm2 restart buildpair --update-env >/dev/null
pm2 save >/dev/null

log "Checking local API health..."
LOCAL_HEALTH="$(curl --fail --silent --show-error --retry 5 --retry-delay 2 http://localhost:3000/api/health)"
if [[ "$LOCAL_HEALTH" != *'"status":"ok"'* || "$LOCAL_HEALTH" != *'"database":"ok"'* ]]; then
  log "Local health check returned an unexpected response: $LOCAL_HEALTH"
  exit 4
fi

log "Checking public staging health..."
PUBLIC_HEALTH="$(curl --fail --silent --show-error --retry 5 --retry-delay 2 "$HEALTH_URL")"
if [[ "$PUBLIC_HEALTH" != *'"status":"ok"'* || "$PUBLIC_HEALTH" != *'"database":"ok"'* ]]; then
  log "Public health check returned an unexpected response: $PUBLIC_HEALTH"
  exit 5
fi

log "Deployment complete: ${REMOTE_SHA:0:12} is live."
