#!/bin/sh
set -e

# схему базы меняем только миграциями
bunx --bun prisma migrate deploy

if [ "$SEED_ON_START" = "true" ]; then
  bun prisma/seed.ts --if-empty
fi

exec "$@"
