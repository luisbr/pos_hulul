#!/usr/bin/env bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5175}"
RUBY_VERSION="${RUBY_VERSION:-3.4.5}"

backend_pid=""
frontend_pid=""

cleanup() {
  trap - INT TERM EXIT

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill -INT "$backend_pid" 2>/dev/null || true
  fi

  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill -TERM "$frontend_pid" 2>/dev/null || true
  fi

  wait "$backend_pid" 2>/dev/null || true
  wait "$frontend_pid" 2>/dev/null || true
}

fail() {
  echo "Error: $*" >&2
  exit 1
}

port_is_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

command -v rbenv >/dev/null 2>&1 || fail "rbenv no esta instalado."
command -v npm >/dev/null 2>&1 || fail "npm no esta instalado."
command -v lsof >/dev/null 2>&1 || fail "lsof no esta instalado."
[[ -d "$FRONTEND_DIR/node_modules" ]] || fail "Faltan dependencias del frontend. Ejecuta: cd frontend && npm install"

port_is_busy "$BACKEND_PORT" && fail "El puerto $BACKEND_PORT ya esta ocupado."
port_is_busy "$FRONTEND_PORT" && fail "El puerto $FRONTEND_PORT ya esta ocupado."

trap cleanup INT TERM EXIT

echo "Iniciando API en http://127.0.0.1:$BACKEND_PORT"
(
  cd "$BACKEND_DIR" || exit 1
  RBENV_VERSION="$RUBY_VERSION" rbenv exec ruby bin/rails server -b 127.0.0.1 -p "$BACKEND_PORT"
) &
backend_pid=$!

echo "Iniciando frontend en http://localhost:$FRONTEND_PORT"
(
  cd "$FRONTEND_DIR" || exit 1
  npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort
) &
frontend_pid=$!

echo "Hulul esta levantando. Presiona Ctrl+C para detener ambos servicios."

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$backend_pid" 2>/dev/null; then
  wait "$backend_pid"
  exit $?
fi

wait "$frontend_pid"
