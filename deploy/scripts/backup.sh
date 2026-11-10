#!/usr/bin/env bash
set -euo pipefail

# Backup database + uploads. Jalankan dari root repo.
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
POSTGRES_USER="${POSTGRES_USER:-eventkita}"
POSTGRES_DB="${POSTGRES_DB:-eventkita}"

mkdir -p "$BACKUP_DIR"

echo "Backup database..."
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "Backup uploads..."
docker compose exec -T api tar czf - -C /app/uploads . \
  > "$BACKUP_DIR/uploads-$STAMP.tar.gz"

echo "Hapus backup lebih dari 7 hari..."
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "Selesai: $BACKUP_DIR/db-$STAMP.sql.gz"
