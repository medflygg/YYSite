#!/usr/bin/env bash
# Backup SQLite + uploads. Safe to run via cron on the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="${DATA_DIR:-$ROOT/data}"
UPLOADS_DIR="${UPLOADS_DIR:-$ROOT/public/uploads}"
OUT_DIR="${BACKUP_DIR:-$ROOT/backups}"
KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$OUT_DIR/yysite-$STAMP.tar.gz"
TMP="$OUT_DIR/.tmp-$STAMP"

mkdir -p "$OUT_DIR" "$TMP/data" "$TMP/uploads"

# Consistent SQLite snapshot when sqlite3 is available
if [ -f "$DATA_DIR/yysite.db" ]; then
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$DATA_DIR/yysite.db" ".backup '$TMP/data/yysite.db'"
  else
    cp -a "$DATA_DIR/yysite.db" "$TMP/data/yysite.db"
    # copy WAL/SHM if present
    [ -f "$DATA_DIR/yysite.db-wal" ] && cp -a "$DATA_DIR/yysite.db-wal" "$TMP/data/" || true
    [ -f "$DATA_DIR/yysite.db-shm" ] && cp -a "$DATA_DIR/yysite.db-shm" "$TMP/data/" || true
  fi
fi

if [ -d "$UPLOADS_DIR" ]; then
  cp -a "$UPLOADS_DIR"/. "$TMP/uploads/" 2>/dev/null || true
fi

tar -czf "$ARCHIVE" -C "$TMP" data uploads
rm -rf "$TMP"

# prune old archives
find "$OUT_DIR" -maxdepth 1 -name 'yysite-*.tar.gz' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true

echo "backup written: $ARCHIVE"
echo "copy this file off the VPS (rclone / scp / S3)."
