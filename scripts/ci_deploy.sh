#!/usr/bin/env bash
# Deploy satu app EventKita ke CapRover memakai CapRover API v2.
#
# Dipakai oleh .github/workflows/deploy.yml di self-hosted runner (VM lab).
# Tidak butuh CapRover CLI / action pihak ketiga; cukup curl, tar, python3.
#
# Env wajib:
#   CAPROVER_URL       contoh: http://127.0.0.1:3000
#   CAPROVER_PASSWORD  password admin CapRover
#   APP_NAME           eventkita-api | eventkita-web
#   DOCKERFILE_PATH    ./apps/api/Dockerfile | ./apps/web/Dockerfile
set -euo pipefail

: "${CAPROVER_URL:?CAPROVER_URL wajib diisi}"
: "${CAPROVER_PASSWORD:?CAPROVER_PASSWORD wajib diisi}"
: "${APP_NAME:?APP_NAME wajib diisi}"
: "${DOCKERFILE_PATH:?DOCKERFILE_PATH wajib diisi}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

STAGE="$TMP/src"
TARBALL="$TMP/$APP_NAME.tar.gz"
mkdir -p "$STAGE"

# Salin repo ke staging tanpa artefak berat / rahasia.
tar -cf - -C "$ROOT" \
  --exclude='./.git' \
  --exclude='./.backup' \
  --exclude='./node_modules' \
  --exclude='*/node_modules' \
  --exclude='./dist' \
  --exclude='*/dist' \
  --exclude='./apps/web/.next' \
  --exclude='./.env' \
  --exclude='*.log' \
  . | tar -xf - -C "$STAGE"

printf '{"schemaVersion":2,"dockerfilePath":"%s"}\n' "$DOCKERFILE_PATH" \
  > "$STAGE/captain-definition"
tar -czf "$TARBALL" -C "$STAGE" .

echo "[ci_deploy] login CapRover $CAPROVER_URL"
LOGIN="$(curl -fsS -X POST "$CAPROVER_URL/api/v2/login" \
  -H 'Content-Type: application/json' \
  --data "$(printf '{"password":"%s"}' "$CAPROVER_PASSWORD")")"
TOKEN="$(printf '%s' "$LOGIN" | python3 -c \
  'import json,sys; print(json.load(sys.stdin)["data"]["token"])')"
[ -n "$TOKEN" ] || { echo "[ci_deploy] login gagal: $LOGIN" >&2; exit 1; }

echo "[ci_deploy] upload $APP_NAME ($(du -h "$TARBALL" | cut -f1))"
curl -fsS -X POST "$CAPROVER_URL/api/v2/user/apps/appData/$APP_NAME/?detached=true" \
  -H "x-captain-auth: $TOKEN" \
  -H 'x-namespace: captain' \
  -F "sourceFile=@$TARBALL;type=application/gzip" \
  -F "gitHash=${GITHUB_SHA:-local-$(date +%s)}" >/dev/null

echo "[ci_deploy] menunggu build $APP_NAME ..."
for _ in $(seq 1 240); do
  STATUS="$(curl -fsS "$CAPROVER_URL/api/v2/user/apps/appData/$APP_NAME/" \
    -H "x-captain-auth: $TOKEN" -H 'x-namespace: captain')"
  BUILDING="$(printf '%s' "$STATUS" | python3 -c \
    'import json,sys; print(str(json.load(sys.stdin).get("data",{}).get("isAppBuilding")).lower())')"
  FAILED="$(printf '%s' "$STATUS" | python3 -c \
    'import json,sys; print(str(json.load(sys.stdin).get("data",{}).get("isBuildFailed")).lower())')"

  if [ "$FAILED" = "true" ]; then
    echo "[ci_deploy] build $APP_NAME GAGAL" >&2
    printf '%s' "$STATUS" | python3 -c \
      'import json,sys; d=json.load(sys.stdin).get("data",{}); print("\n".join((d.get("logs") or {}).get("lines") or []))' \
      >&2 || true
    exit 1
  fi
  if [ "$BUILDING" = "false" ]; then
    echo "[ci_deploy] build $APP_NAME selesai"
    exit 0
  fi
  sleep 10
done

echo "[ci_deploy] timeout menunggu build $APP_NAME" >&2
exit 1
