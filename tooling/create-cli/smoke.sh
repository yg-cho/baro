#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK_DIR="$(mktemp -d /tmp/baro-smoke.XXXXXX)"
APP_NAME="smoke-app"
API_PORT=8200

cleanup() {
  pkill -f "$WORK_DIR" 2>/dev/null || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "==> building cli"
pnpm --filter create-baro build

echo "==> scaffolding into $WORK_DIR"
cd "$WORK_DIR"
CREATE_BARO_TEMPLATE_DIR="$REPO_ROOT" node "$REPO_ROOT/tooling/create-cli/dist/index.js" \
  --name "$APP_NAME" --db pglite --skip-install

cd "$WORK_DIR/$APP_NAME"
test -f apps/api/.env || { echo "FAIL: api .env missing"; exit 1; }
test ! -d tooling || { echo "FAIL: tooling not sanitized"; exit 1; }
test ! -d docs/superpowers || { echo "FAIL: internal docs not sanitized"; exit 1; }
test ! -d node_modules || { echo "FAIL: root node_modules not sanitized"; exit 1; }
test ! -d apps/web/.next || { echo "FAIL: nested .next not sanitized"; exit 1; }
grep -q "\"name\": \"$APP_NAME\"" package.json || { echo "FAIL: root rename"; exit 1; }

echo "==> installing"
pnpm install

echo "==> booting api"
PORT=$API_PORT PGLITE_DATA_DIR="$WORK_DIR/pglite" pnpm --filter @baro/api dev &
API_PID=$!
for i in $(seq 1 30); do
  sleep 1
  if curl -sf "http://localhost:$API_PORT/health" | grep -q '"ok"'; then
    echo "==> health ok"
    kill $API_PID
    echo "SMOKE PASS"
    exit 0
  fi
done
echo "FAIL: api never became healthy"
kill $API_PID 2>/dev/null || true
exit 1
