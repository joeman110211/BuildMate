#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/production/docker-compose.yml"
ENV_FILE="$ROOT_DIR/.env.production"

cd "$ROOT_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  echo "Create it from .env.example and fill in the production values before deploying."
  exit 1
fi

mkdir -p downloads

echo "[BuildPair] Updating source..."
git fetch origin main
git checkout main
git pull --ff-only origin main

echo "[BuildPair] Building production containers..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull

echo "[BuildPair] Starting production stack..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[BuildPair] Checking application health inside the server..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T app \
  node -e "fetch('http://127.0.0.1:3000/api/health').then(async r=>{console.log(await r.text());if(!r.ok)process.exit(1)}).catch(e=>{console.error(e);process.exit(1)})"

echo "[BuildPair] Deployment complete."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
