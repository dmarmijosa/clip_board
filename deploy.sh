#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$REPO_ROOT"

SSH_PORT="${SSH_PORT:-22}"
ENV_FILE="${ENV_FILE:-.env.production}"
COMPOSE_FILE="docker-compose.prod.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[deploy] No existe $ENV_FILE. Crea el archivo a partir de .env.production.example antes de desplegar." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

: "${SSH_USER:?Define SSH_USER en tu entorno o en $ENV_FILE}"
: "${SSH_HOST:?Define SSH_HOST en tu entorno o en $ENV_FILE}"
: "${REMOTE_DIR:?Define REMOTE_DIR en tu entorno o en $ENV_FILE}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "[deploy] rsync es requerido en la máquina local." >&2
  exit 1
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "[deploy] ssh es requerido en la máquina local." >&2
  exit 1
fi

# Sincroniza los archivos del repositorio con el servidor remoto.
# Excluye artefactos que no son necesarios en producción.
RSYNC_EXCLUDES=(
  "--exclude" ".git/"
  "--exclude" "node_modules/"
  "--exclude" "frontend/node_modules/"
  "--exclude" "backend/node_modules/"
  "--exclude" "frontend/dist/"
  "--exclude" "backend/dist/"
  "--exclude" "*.log"
)

echo "[deploy] Subiendo archivos al servidor ${SSH_HOST}:${REMOTE_DIR}"
rsync -az --delete "${RSYNC_EXCLUDES[@]}" ./ "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}"

REMOTE_COMMANDS=$(cat <<'EOF'
set -euo pipefail
cd "__REMOTE_DIR__"

if [[ ! -f "__ENV_FILE__" ]]; then
  echo "[deploy] ⚠️  Falta __ENV_FILE__ en el servidor" >&2
  exit 1
fi

set -a
. "__ENV_FILE__"
set +a

if ! command -v docker >/dev/null 2>&1; then
  echo "[deploy] ⚠️  Docker no está instalado en el servidor" >&2
  exit 1
fi

if ! command -v docker compose >/dev/null 2>&1; then
  echo "[deploy] ⚠️  docker compose plugin no está disponible en el servidor" >&2
  exit 1
fi

docker compose -f "__COMPOSE_FILE__" pull
docker compose -f "__COMPOSE_FILE__" up -d --build
EOF
)

REMOTE_COMMANDS=${REMOTE_COMMANDS//__REMOTE_DIR__/$REMOTE_DIR}
REMOTE_COMMANDS=${REMOTE_COMMANDS//__ENV_FILE__/$ENV_FILE}
REMOTE_COMMANDS=${REMOTE_COMMANDS//__COMPOSE_FILE__/$COMPOSE_FILE}

ssh -p "$SSH_PORT" "${SSH_USER}@${SSH_HOST}" "bash -se" <<< "$REMOTE_COMMANDS"

echo "[deploy] Despliegue completado."
