#!/usr/bin/env bash
set -u -o pipefail

ROOT_DIR="${BUILDPAIR_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BRANCH="${BUILDPAIR_DEPLOY_BRANCH:-main}"
ENV_FILE="${BUILDPAIR_ENV_FILE:-$ROOT_DIR/.env.local}"
PORT="${PORT:-3000}"
CHECK_INTERVAL="${BUILDPAIR_CHECK_INTERVAL_SECONDS:-120}"
STATE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/buildpair-host"
APP_LOG="$STATE_DIR/app.log"
TUNNEL_LOG="$STATE_DIR/cloudflared.log"
PUBLIC_URL_FILE="$STATE_DIR/public-url"
DEPLOYED_SHA_FILE="$STATE_DIR/deployed-sha"
FAILED_SHA_FILE="$STATE_DIR/failed-sha"
LOCK_FILE="$STATE_DIR/deploy.lock"

APP_PID=""
TUNNEL_PID=""
PUBLIC_URL=""

log() {
  printf '[%s] %s\n' "$(date -Is)" "$*"
}

cleanup() {
  set +e
  [[ -z "$APP_PID" ]] || kill "$APP_PID" 2>/dev/null
  [[ -z "$TUNNEL_PID" ]] || kill "$TUNNEL_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

require_commands() {
  local missing=0
  for name in git node npm curl cloudflared flock; do
    if ! command -v "$name" >/dev/null 2>&1; then
      log "Missing required command: $name"
      missing=1
    fi
  done
  return "$missing"
}

validate_environment() {
  if [[ ! -f "$ENV_FILE" ]]; then
    log "Environment file missing: $ENV_FILE"
    return 1
  fi

  local missing
  missing="$({ node --env-file="$ENV_FILE" - <<'NODE'
const required = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'INVOICE_FROM_EMAIL',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
const missing = required.filter((name) => !process.env[name]?.trim());
process.stdout.write(missing.join('\n'));
NODE
} 2>/dev/null || true)"

  if [[ -n "$missing" ]]; then
    log "Required environment values are missing from $ENV_FILE:"
    printf '%s\n' "$missing"
    return 1
  fi
  return 0
}

start_tunnel() {
  : > "$TUNNEL_LOG"
  rm -f "$PUBLIC_URL_FILE"
  log "Starting Cloudflare Quick Tunnel..."
  cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >"$TUNNEL_LOG" 2>&1 &
  TUNNEL_PID=$!

  PUBLIC_URL=""
  for _ in $(seq 1 45); do
    PUBLIC_URL="$(grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)"
    [[ -z "$PUBLIC_URL" ]] || break
    if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
      log "Cloudflare tunnel stopped unexpectedly."
      cat "$TUNNEL_LOG"
      return 1
    fi
    sleep 1
  done

  if [[ -z "$PUBLIC_URL" ]]; then
    log "Cloudflare did not provide a public URL in time."
    cat "$TUNNEL_LOG"
    return 1
  fi

  printf '%s\n' "$PUBLIC_URL" > "$PUBLIC_URL_FILE"
  log "Public test URL: $PUBLIC_URL"
}

stop_app() {
  if [[ -n "$APP_PID" ]] && kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  APP_PID=""
}

start_app() {
  stop_app
  : > "$APP_LOG"
  local clerk_publishable_key
  local build_sha
  clerk_publishable_key="$(node --env-file="$ENV_FILE" -e 'process.stdout.write(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "")')"
  build_sha="$(git rev-parse HEAD)"

  log "Starting BuildPair application at ${build_sha:0:12}..."
  NODE_ENV=production \
  EXPO_PUBLIC_API_URL="$PUBLIC_URL" \
  APP_URL="$PUBLIC_URL" \
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$clerk_publishable_key" \
  BUILDPAIR_BUILD_SHA="$build_sha" \
  BUILDPAIR_PREVIEW_DATA_ENABLED=false \
  BUILDPAIR_NOINDEX=true \
  PORT="$PORT" \
  node --env-file="$ENV_FILE" server.mjs >"$APP_LOG" 2>&1 &
  APP_PID=$!
}

wait_for_url() {
  local url="$1"
  local label="$2"
  for attempt in $(seq 1 40); do
    if curl -fsS --connect-timeout 2 --max-time 6 "$url" >/dev/null 2>&1; then
      log "$label passed on attempt $attempt."
      return 0
    fi
    if [[ "$label" == "Local health" ]] && [[ -n "$APP_PID" ]] && ! kill -0 "$APP_PID" 2>/dev/null; then
      log "Application stopped before becoming healthy."
      tail -n 80 "$APP_LOG" || true
      return 1
    fi
    sleep 2
  done
  log "$label failed: $url"
  return 1
}

build_current_revision() {
  local clerk_publishable_key
  local build_sha
  clerk_publishable_key="$(node --env-file="$ENV_FILE" -e 'process.stdout.write(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "")')"
  build_sha="$(git rev-parse HEAD)"

  log "Running TypeScript checks..."
  npm run typecheck || return 1
  log "Running unit tests..."
  npm test || return 1
  log "Building web output for $PUBLIC_URL..."
  EXPO_PUBLIC_API_URL="$PUBLIC_URL" \
  APP_URL="$PUBLIC_URL" \
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="$clerk_publishable_key" \
  BUILDPAIR_BUILD_SHA="$build_sha" \
  BUILDPAIR_PREVIEW_DATA_ENABLED=false \
  npm run build:web || return 1
}

needs_npm_ci() {
  local base_sha="$1"
  local target_sha="$2"
  if [[ ! -d node_modules ]] || [[ ! -x node_modules/.bin/expo ]] || [[ ! -x node_modules/.bin/tsc ]]; then
    return 0
  fi
  git diff --name-only "$base_sha" "$target_sha" 2>/dev/null | grep -Eq '^(package\.json|package-lock\.json)$'
}

write_marker() {
  local file="$1"
  local value="$2"
  printf '%s\n' "$value" > "$file"
  chmod 600 "$file"
}

deploy_revision() {
  local target_sha="$1"
  local local_sha
  local rollback_sha
  local deployed_sha=""

  local_sha="$(git rev-parse HEAD)"
  rollback_sha="$local_sha"
  if [[ -f "$DEPLOYED_SHA_FILE" ]]; then
    deployed_sha="$(cat "$DEPLOYED_SHA_FILE")"
    if git cat-file -e "$deployed_sha^{commit}" 2>/dev/null; then
      rollback_sha="$deployed_sha"
    fi
  fi

  if [[ "$local_sha" != "$target_sha" ]]; then
    if ! git merge-base --is-ancestor "$local_sha" "$target_sha"; then
      log "Local branch diverged from origin/$BRANCH; refusing automatic update."
      return 2
    fi
    log "Updating ${local_sha:0:12} -> ${target_sha:0:12}..."
    git merge --ff-only "$target_sha" || return 1
  fi

  if needs_npm_ci "$rollback_sha" "$target_sha"; then
    log "Dependencies changed or are missing; running npm ci..."
    npm ci || {
      log "npm ci failed."
      git reset --hard "$rollback_sha" >/dev/null 2>&1 || true
      return 1
    }
  else
    log "Dependencies unchanged; skipping npm ci."
  fi

  if ! build_current_revision; then
    log "Validation/build failed for ${target_sha:0:12}. Rolling back..."
    write_marker "$FAILED_SHA_FILE" "$target_sha"
    git reset --hard "$rollback_sha" || true
    npm ci >/dev/null 2>&1 || true
    build_current_revision >/dev/null 2>&1 || true
    start_app
    wait_for_url "http://127.0.0.1:$PORT/api/health" "Local health" || true
    write_marker "$DEPLOYED_SHA_FILE" "$rollback_sha"
    return 1
  fi

  start_app
  wait_for_url "http://127.0.0.1:$PORT/api/health" "Local health" || return 1
  wait_for_url "$PUBLIC_URL/api/health" "Public health" || return 1
  write_marker "$DEPLOYED_SHA_FILE" "$target_sha"
  rm -f "$FAILED_SHA_FILE"
  log "Deployment complete: ${target_sha:0:12}."
}

main() {
  mkdir -p "$STATE_DIR"
  cd "$ROOT_DIR" || exit 1

  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    log "Another BuildPair Chromebook supervisor is already running."
    exit 0
  fi

  require_commands || exit 1
  validate_environment || exit 1

  if ! git diff --quiet || ! git diff --cached --quiet; then
    log "Tracked local changes detected; refusing automatic hosting until the working tree is clean."
    git status --short
    exit 2
  fi

  start_tunnel || exit 1

  git fetch --quiet origin "$BRANCH" || exit 1
  local initial_sha
  initial_sha="$(git rev-parse "origin/$BRANCH")"

  if ! deploy_revision "$initial_sha"; then
    log "Initial deployment did not complete successfully. The supervisor will keep running and retry when GitHub changes."
  fi

  while true; do
    sleep "$CHECK_INTERVAL"

    if [[ -n "$TUNNEL_PID" ]] && ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
      log "Tunnel stopped. Restarting supervisor so a new public URL can be established."
      exit 1
    fi

    if [[ -n "$APP_PID" ]] && ! kill -0 "$APP_PID" 2>/dev/null; then
      log "Application process stopped. Rebuilding/restarting current revision."
      build_current_revision >/dev/null 2>&1 || true
      start_app
      wait_for_url "http://127.0.0.1:$PORT/api/health" "Local health" || true
    fi

    if ! git fetch --quiet origin "$BRANCH"; then
      log "GitHub check failed; will retry later."
      continue
    fi

    local remote_sha
    local current_sha
    remote_sha="$(git rev-parse "origin/$BRANCH")"
    current_sha="$(git rev-parse HEAD)"

    if [[ -f "$FAILED_SHA_FILE" ]] && [[ "$(cat "$FAILED_SHA_FILE")" == "$remote_sha" ]]; then
      continue
    fi

    if [[ "$current_sha" == "$remote_sha" ]] && [[ -f "$DEPLOYED_SHA_FILE" ]] && [[ "$(cat "$DEPLOYED_SHA_FILE")" == "$remote_sha" ]]; then
      continue
    fi

    deploy_revision "$remote_sha" || true
  done
}

main "$@"
