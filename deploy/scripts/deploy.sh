#!/usr/bin/env bash
# LEGACY: deploy manual Docker Compose + Caddy.
# Untuk Dokploy, jangan jalankan script ini. Cukup `git push` ke main;
# Dokploy Auto Deploy yang membangun dan redeploy.
set -euo pipefail

# Deploy dari root repo di VM Proxmox.
git pull --ff-only
docker compose build
docker compose up -d
docker image prune -f

echo "Deploy selesai. Cek status dengan: docker compose ps"
