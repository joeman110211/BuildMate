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
export BUILDPAIR_BUILD_SHA="$(git rev-parse HEAD)"
echo "[BuildPair] Release SHA: $BUILDPAIR_BUILD_SHA"

echo "[BuildPair] Building production containers..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull

echo "[BuildPair] Applying database migrations before switching application traffic..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm --no-deps app node scripts/migrate.mjs

echo "[BuildPair] Starting production stack..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

echo "[BuildPair] Checking application health and exact release SHA inside the server..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T app \
  node -e "fetch('http://127.0.0.1:3000/api/health').then(async r=>{const body=await r.json();console.log(JSON.stringify(body));if(!r.ok||body.releaseSha!==process.env.BUILDPAIR_BUILD_SHA)process.exit(1)}).catch(e=>{console.error(e);process.exit(1)})"

echo "[BuildPair] Deployment complete: $BUILDPAIR_BUILD_SHA"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
