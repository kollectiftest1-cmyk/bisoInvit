#!/usr/bin/env bash
# Script de mise à jour BisoInvit (à lancer SUR le VPS, dans /var/www/bisoinvit)
# Usage : sudo bash deploy/update.sh
set -euo pipefail

ROOT="/var/www/bisoinvit"
REPO="$ROOT/repo"
WEB_DIST="$ROOT/web"
API_DIR="$ROOT/backend"

echo "→ git pull"
cd "$REPO"
git pull --ff-only

echo "→ build web (Vite)"
cd "$REPO/Electro-Invit-Web-main/WebInvite"
npm ci
npm run build
rm -rf "$WEB_DIST"
mkdir -p "$WEB_DIST"
cp -r dist/* "$WEB_DIST/"

echo "→ install backend deps"
cd "$REPO/backend"
npm ci --omit=dev

# Synchroniser le code backend dans /var/www/bisoinvit/backend
# (on garde data/ et uploads/ persistants)
rsync -a --delete \
  --exclude='node_modules' \
  --exclude='data' \
  --exclude='uploads' \
  --exclude='.env' \
  "$REPO/backend/" "$API_DIR/"

# Synchroniser node_modules (tolérant si déjà identique / symlink)
if [ "$(readlink -f "$REPO/backend/node_modules" 2>/dev/null || true)" = "$(readlink -f "$API_DIR/node_modules" 2>/dev/null || true)" ] && [ -e "$API_DIR/node_modules" ]; then
  echo "  node_modules déjà partagé — skip"
else
  rsync -a --delete "$REPO/backend/node_modules/" "$API_DIR/node_modules/"
fi

echo "→ reload pm2"
pm2 reload bisoinvit-api --update-env

echo "✔ Déploiement terminé"
