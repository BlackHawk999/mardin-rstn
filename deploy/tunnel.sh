#!/usr/bin/env bash
# HTTPS for the whole app via a Cloudflare quick tunnel → API on :3000 (runs under pm2 as "mardin-tunnel").
# A quick tunnel gets a new random URL on every start, so the URL is written to MINIAPP_URL in
# apps/api/.env and the API is restarted: the bot's menu button then points at the new address.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/api/.env"
CLOUDFLARED="${CLOUDFLARED:-$HOME/.local/bin/cloudflared}"

updated=""
"$CLOUDFLARED" tunnel --no-autoupdate --url http://localhost:3000 2>&1 | while IFS= read -r line; do
  echo "$line"
  [ -n "$updated" ] && continue
  url=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' <<<"$line" || true)
  [ -z "$url" ] && continue
  updated=1
  if grep -q '^MINIAPP_URL=' "$ENV_FILE"; then
    sed -i "s#^MINIAPP_URL=.*#MINIAPP_URL=$url#" "$ENV_FILE"
  else
    echo "MINIAPP_URL=$url" >> "$ENV_FILE"
  fi
  echo "$url" > "$HOME/tunnel-url.txt"
  pm2 restart mardin-api >/dev/null
  echo "MINIAPP_URL set to $url"
done
