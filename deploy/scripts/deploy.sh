#!/usr/bin/env bash
set -euo pipefail

# Deploy dari root repo di VM Proxmox.
git pull --ff-only
docker compose build
docker compose up -d
docker image prune -f

echo "Deploy selesai. Cek status dengan: docker compose ps"
