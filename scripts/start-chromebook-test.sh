#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$ROOT_DIR/scripts/start-chromebook-test.sh"
SESSION_NAME="buildpair-test"
ENV_FILE="$ROOT_DIR/.env.local"
PORT="${PORT:-3000}"
STATE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/buildpair-test"
TUNNEL_LOG="$STATE_DIR/cloudflared.log"
APP_LOG="$STATE_DIR/app.log"
PUBLIC_URL_FILE="$STATE_DIR/public-url"

if [[ "${1:-}" != "--inside-tmux" ]] && command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "BuildPair test host is already running. Attaching to it..."
    exec tmux attach-session -t "$SESSION_NAME"
  fi

  exec tmux new-session -s "$SESSION_NAME" "cd '$ROOT_DIR' && bash '$SCRIPT_PATH' --inside-tmux"
fi

cd "$ROOT_DIR"
mkdir -p "$STATE_DIR"
: > "$TUNNEL_LOG"
: > "$APP_LOG"
rm -f "$PUBLIC_URL_FILE"

for command_name in node npm cloudflared curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name"
    exit 1
  fi
done

if [[ ! -f "$ENV_FILE" ]]; then
  cp .env.example "$ENV_FILE"
  echo "Created $ENV_FILE from .env.example."
  echo "Fill in the existing BuildPair development/test credentials, then run this script again."
  exit 1
fi

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
  echo "The following required values are still missing from .env.local:"
  printf '%s\n' "$missing"
  echo
  echo "Stripe values can remain blank during the current test phase."
  exit 1
fi

TUNNEL_PID=""
APP_PID=""
cleanup() {
  set +e
  [[ -z "$APP_PID" ]] || kill "$APP_PID" 2>/dev/null
  [[ -z "$TUNNEL_PID" ]] || kill "$TUNNEL_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "[BuildPair] Starting free Cloudflare Quick Tunnel..."
cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

PUBLIC_URL=""
for _ in $(seq 1 30); do
  PUBLIC_URL="$(grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -n 1 || true)"
  [[ -z "$PUBLIC_URL" ]] || break
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "Cloudflare Tunnel stopped unexpectedly:"
    cat "$TUNNEL_LOG"
    exit 1
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "Cloudflare did not provide a Quick Tunnel URL within 30 seconds."
  cat "$TUNNEL_LOG"
  exit 1
fi

printf '%s\n' "$PUBLIC_URL" > "$PUBLIC_URL_FILE"

echo "[BuildPair] Test URL: $PUBLIC_URL"
echo "[BuildPair] Building the web app for this temporary URL..."
EXPO_PUBLIC_API_URL="$PUBLIC_URL" \
APP_URL="$PUBLIC_URL" \
BUILDPAIR_PREVIEW_DATA_ENABLED=false \
npm run build:web

echo "[BuildPair] Starting application server on port $PORT..."
EXPO_PUBLIC_API_URL="$PUBLIC_URL" \
APP_URL="$PUBLIC_URL" \
BUILDPAIR_PREVIEW_DATA_ENABLED=false \
PORT="$PORT" \
node --env-file="$ENV_FILE" server.mjs >"$APP_LOG" 2>&1 &
APP_PID=$!

for _ in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    echo "BuildPair server stopped unexpectedly:"
    cat "$APP_LOG"
    exit 1
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
  echo "BuildPair did not become healthy in time."
  cat "$APP_LOG"
  exit 1
fi

echo
echo "============================================================"
echo " BuildPair test host is LIVE"
echo " $PUBLIC_URL"
echo "============================================================"
echo
echo "Local health:"
curl -fsS "http://127.0.0.1:$PORT/api/health" || true
echo
echo
echo "Readiness:"
curl -sS "http://127.0.0.1:$PORT/api/readiness" || true
echo
echo
echo "Leave the Chromebook powered on, awake, online, and Linux running."
echo "Detach from tmux with Ctrl+B then D."
echo "Reattach later with: tmux attach -t $SESSION_NAME"
echo "Show the public URL with: cat '$PUBLIC_URL_FILE'"
echo "Stop the test host with: tmux kill-session -t $SESSION_NAME"
echo
echo "App log: $APP_LOG"
echo "Tunnel log: $TUNNEL_LOG"
echo

wait "$APP_PID"
