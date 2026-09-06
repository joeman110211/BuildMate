#!/usr/bin/env bash
set -u

REPO_DIR="${BUILDPAIR_REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
ENV_FILE="${BUILDPAIR_ENV_FILE:-$REPO_DIR/.env.local}"
STATE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/buildpair-host"
PUBLIC_URL_FILE="$STATE_DIR/public-url"
DEPLOYED_SHA_FILE="$STATE_DIR/deployed-sha"
FAILED_SHA_FILE="$STATE_DIR/failed-sha"
APP_LOG="$STATE_DIR/app.log"
TUNNEL_LOG="$STATE_DIR/cloudflared.log"

section() {
  printf '\n== %s ==\n' "$1"
}

safe_curl() {
  local url="$1"
  curl --silent --show-error --connect-timeout 3 --max-time 10 "$url" 2>&1 || true
  printf '\n'
}

section "BuildPair repository"
cd "$REPO_DIR" 2>/dev/null || {
  echo "Repository not found: $REPO_DIR"
  exit 1
}

echo "Path: $REPO_DIR"
echo "Branch: $(git branch --show-current 2>/dev/null || echo unknown)"
echo "Local HEAD: $(git rev-parse HEAD 2>/dev/null || echo unknown)"
git fetch --quiet origin main 2>/dev/null || true
echo "Origin main: $(git rev-parse origin/main 2>/dev/null || echo unavailable)"
echo "Working tree:"
git status --short 2>/dev/null || true

section "Automatic host service"
if command -v systemctl >/dev/null 2>&1; then
  systemctl --user --no-pager --full status buildpair-host.service 2>&1 | sed -n '1,28p' || true
else
  echo "systemctl not available"
fi

section "Current public test URL"
PUBLIC_URL=""
if [[ -f "$PUBLIC_URL_FILE" ]]; then
  PUBLIC_URL="$(cat "$PUBLIC_URL_FILE")"
  echo "$PUBLIC_URL"
else
  echo "No public URL has been recorded yet."
fi

section "Deployment markers"
if [[ -f "$DEPLOYED_SHA_FILE" ]]; then
  echo "Last deployed: $(cat "$DEPLOYED_SHA_FILE")"
else
  echo "Last deployed: marker missing"
fi
if [[ -f "$FAILED_SHA_FILE" ]]; then
  echo "Last failed: $(cat "$FAILED_SHA_FILE")"
else
  echo "Last failed: none recorded"
fi

section "Runtime configuration presence"
if [[ -f "$ENV_FILE" ]]; then
  echo "Environment file: $ENV_FILE"
  node --env-file="$ENV_FILE" - <<'NODE' 2>/dev/null || true
const names = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'DATABASE_URL',
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'INVOICE_FROM_EMAIL',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];
for (const name of names) {
  console.log(`${name}: ${process.env[name]?.trim() ? 'configured' : 'MISSING'}`);
}
NODE
else
  echo "Environment file missing: $ENV_FILE"
fi

section "Local health"
safe_curl "http://127.0.0.1:3000/api/health"

section "Local readiness"
safe_curl "http://127.0.0.1:3000/api/readiness"

if [[ -n "$PUBLIC_URL" ]]; then
  section "Public health"
  safe_curl "$PUBLIC_URL/api/health"

  section "Public readiness"
  safe_curl "$PUBLIC_URL/api/readiness"
fi

section "Recent application log"
if [[ -f "$APP_LOG" ]]; then
  tail -n 20 "$APP_LOG"
else
  echo "No application log yet."
fi

section "Recent tunnel log"
if [[ -f "$TUNNEL_LOG" ]]; then
  tail -n 12 "$TUNNEL_LOG"
else
  echo "No tunnel log yet."
fi
