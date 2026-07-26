#!/bin/sh
set -e

mkdir -p /app/data /app/public/uploads

# First boot: copy seeded SQLite into the persistent volume
if [ ! -f /app/data/yysite.db ] && [ -d /app/data-init ]; then
  echo "[yysite] initializing database from seed..."
  cp -a /app/data-init/. /app/data/
fi

# Ensure project seed images exist under /uploads (DB paths use /uploads/<slug>/...)
if [ -d /app/public/projects ]; then
  for dir in /app/public/projects/*; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    target="/app/public/uploads/$name"
    if [ ! -d "$target" ]; then
      echo "[yysite] seeding uploads/$name"
      mkdir -p "$target"
      cp -a "$dir"/. "$target"/
    fi
  done
fi

# Astro Node serves static files from dist/client/, while uploads are written to
# the persistent volume at public/uploads. Point client assets at the volume.
if [ -d /app/dist/client ]; then
  rm -rf /app/dist/client/uploads
  ln -sfn /app/public/uploads /app/dist/client/uploads
  echo "[yysite] linked dist/client/uploads -> public/uploads"
fi

if [ -z "$ADMIN_PASSWORD" ] || [ "$ADMIN_PASSWORD" = "changeme" ]; then
  echo "[yysite] WARNING: set a strong ADMIN_PASSWORD in .env before going public"
fi

exec node ./dist/server/entry.mjs
