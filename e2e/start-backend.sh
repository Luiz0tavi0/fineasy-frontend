#!/usr/bin/env bash
set -eu

backend_dir="${E2E_BACKEND_DIR:-../fineasy-backend}"
database_url="${E2E_DATABASE_URL:-postgresql+psycopg://fineasy_e2e:fineasy_e2e@127.0.0.1:55432/fineasy_e2e}"
api_port="${E2E_API_PORT:-8000}"

case "$database_url" in
  postgresql+psycopg://fineasy_e2e:*@localhost:*/fineasy_e2e|postgresql+psycopg://fineasy_e2e:*@127.0.0.1:*/fineasy_e2e) ;;
  *)
    printf 'Refusing E2E startup: E2E_DATABASE_URL must target the dedicated local fineasy_e2e database.\\n' >&2
    exit 64
    ;;
esac

cd "$backend_dir"
export DATABASE_URL="$database_url"
export SECRET_KEY="${E2E_SECRET_KEY:-fineasy-e2e-only-development-key-012345}"

uv run --no-sync alembic upgrade head
exec uv run --no-sync uvicorn app.main:app --host 127.0.0.1 --port "$api_port"
