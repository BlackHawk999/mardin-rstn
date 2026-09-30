#!/usr/bin/env bash
# Update the server from GitHub and restart: bash ~/restaurant-tma/deploy/deploy.sh
set -euo pipefail
export PATH="$HOME/.local/node/bin:$PATH"
cd "$(dirname "$0")/.."

git pull --ff-only
pnpm install --frozen-lockfile

mkdir -p "$HOME/backups"
[ -f apps/api/prisma/dev.db ] && cp apps/api/prisma/dev.db "$HOME/backups/dev-$(date +%Y%m%d-%H%M%S).db"
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate deploy

# The API serves these builds itself (apps/api/src/static.ts).
pnpm --filter miniapp --filter admin build
pm2 restart mardin-api
