#!/usr/bin/env bash
# =============================================================================
#  BisoInvit — Bootstrap VPS (Ubuntu 24.04)
#  Installation/déploiement complet et idempotent.
#  Paliers : PM2 → Dirs → Repo → .env → Backend → Web → PM2 → nginx → HTTPS
#
#  Usage (en root ou avec sudo) :
#    sudo bash deploy/bootstrap.sh
#
#  Variables d'environnement optionnelles :
#    ADMIN_PASSWORD   Mot de passe admin (sinon généré aléatoirement)
#    LE_EMAIL         Email Let's Encrypt (def: admin@bisofood.com)
#    DOMAIN           Domaine (def: invite.bisofood.com)
#    SKIP_HTTPS=1     Saute certbot (utile si DNS pas encore propagé)
# =============================================================================
set -euo pipefail

# --------------------------- Paramètres ---------------------------------------
DOMAIN="${DOMAIN:-invite.bisofood.com}"
LE_EMAIL="${LE_EMAIL:-admin@bisofood.com}"
ROOT="/var/www/bisoinvit"
REPO_DIR="$ROOT/repo"
API_DIR="$ROOT/backend"
WEB_DIR="$ROOT/web"
LOG_DIR="/var/log/bisoinvit"
REPO_URL="https://github.com/kollectiftest1-cmyk/bisoInvit.git"
DEPLOY_USER="${SUDO_USER:-$USER}"

# --------------------------- Helpers ------------------------------------------
c_blue()  { printf "\033[1;34m%s\033[0m\n" "$*"; }
c_green() { printf "\033[1;32m%s\033[0m\n" "$*"; }
c_yellow(){ printf "\033[1;33m%s\033[0m\n" "$*"; }
c_red()   { printf "\033[1;31m%s\033[0m\n" "$*"; }
step()    { echo; c_blue "▸ $*"; }
ok()      { c_green "  ✔ $*"; }

require_root() {
  if [ "$EUID" -ne 0 ]; then
    c_red "Ce script doit être lancé en root (sudo bash $0)"
    exit 1
  fi
}
require_root

# --------------------------- 1. PM2 -------------------------------------------
step "Palier 1 — PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  npm i -g pm2
fi
ok "pm2 $(pm2 -v)"

# --------------------------- 2. Dossiers --------------------------------------
step "Palier 2 — Arborescence"
mkdir -p "$REPO_DIR" "$API_DIR" "$WEB_DIR" "$LOG_DIR"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$ROOT" "$LOG_DIR"
ok "$ROOT prêt"

# --------------------------- 3. Repo ------------------------------------------
step "Palier 3 — Code source"
if [ -d "$REPO_DIR/.git" ]; then
  sudo -u "$DEPLOY_USER" git -C "$REPO_DIR" fetch --all --prune
  sudo -u "$DEPLOY_USER" git -C "$REPO_DIR" reset --hard origin/main
else
  sudo -u "$DEPLOY_USER" git clone "$REPO_URL" "$REPO_DIR"
fi
ok "Repo @ $(git -C "$REPO_DIR" rev-parse --short HEAD)"

# --------------------------- 4. Chromium --------------------------------------
step "Palier 4 — Chromium (snap)"
if [ -x /snap/bin/chromium ]; then
  ok "/snap/bin/chromium présent"
elif command -v snap >/dev/null 2>&1; then
  snap install chromium || c_yellow "  snap install chromium a échoué — installer manuellement"
else
  c_yellow "  snap absent : installer Chromium manuellement"
fi

# --------------------------- 5. Backend .env ----------------------------------
step "Palier 5 — Configuration backend (.env)"
ENV_FILE="$API_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  ok ".env déjà présent ($ENV_FILE) — non écrasé"
else
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  QR_HMAC_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  ADMIN_PWD="${ADMIN_PASSWORD:-$(node -e "console.log(require('crypto').randomBytes(12).toString('base64url'))")}"
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=4000

JWT_SECRET=$JWT_SECRET
QR_HMAC_SECRET=$QR_HMAC_SECRET

ADMIN_DEFAULT_USER=admin
ADMIN_DEFAULT_PASSWORD=$ADMIN_PWD

PUBLIC_URL=https://$DOMAIN
WEB_URL=https://$DOMAIN
CORS_ORIGIN=https://$DOMAIN

CHROME_PATH=/snap/bin/chromium
EOF
  chown "$DEPLOY_USER":"$DEPLOY_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  ok ".env généré"
  c_yellow "  ──────────────────────────────────────────────────────"
  c_yellow "  ADMIN_DEFAULT_PASSWORD = $ADMIN_PWD"
  c_yellow "  (notez-le maintenant, il est dans $ENV_FILE)"
  c_yellow "  ──────────────────────────────────────────────────────"
fi

# --------------------------- 6. Backend deps + sync ---------------------------
step "Palier 6 — Backend (npm ci + sync)"
sudo -u "$DEPLOY_USER" bash -c "cd '$REPO_DIR/backend' && npm ci --omit=dev"

rsync -a --delete \
  --exclude='node_modules' \
  --exclude='data' \
  --exclude='uploads' \
  --exclude='.env' \
  "$REPO_DIR/backend/" "$API_DIR/"
# Lien node_modules (gain de place + plus rapide qu'une copie)
rm -rf "$API_DIR/node_modules"
ln -s "$REPO_DIR/backend/node_modules" "$API_DIR/node_modules"
mkdir -p "$API_DIR/data" "$API_DIR/uploads"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$API_DIR"
ok "Backend déployé"

# --------------------------- 7. Web (Vite build) ------------------------------
step "Palier 7 — Frontend (Vite build)"
WEB_SRC="$REPO_DIR/Electro-Invit-Web-main/WebInvite"
if [ ! -f "$WEB_SRC/.env.production" ]; then
  cp "$WEB_SRC/.env.production.example" "$WEB_SRC/.env.production"
  sudo -u "$DEPLOY_USER" sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://$DOMAIN|" "$WEB_SRC/.env.production"
fi
sudo -u "$DEPLOY_USER" bash -c "cd '$WEB_SRC' && npm ci && npm run build"
rm -rf "$WEB_DIR"/*
cp -r "$WEB_SRC/dist/." "$WEB_DIR/"
chown -R "$DEPLOY_USER":"$DEPLOY_USER" "$WEB_DIR"
ok "Web buildé → $WEB_DIR"

# --------------------------- 8. PM2 -------------------------------------------
step "Palier 8 — PM2 (start/reload)"
sudo -u "$DEPLOY_USER" bash -c "cd '$API_DIR' && pm2 startOrReload ecosystem.config.cjs --update-env"
sudo -u "$DEPLOY_USER" pm2 save
# Auto-start au boot
env PATH="$PATH:/usr/bin" pm2 startup systemd -u "$DEPLOY_USER" --hp "/home/$DEPLOY_USER" >/dev/null 2>&1 || true
sleep 2
if curl -fsS http://127.0.0.1:4000/ >/dev/null; then
  ok "API répond sur 127.0.0.1:4000"
else
  c_red "  ✘ API ne répond pas — vérifier : pm2 logs bisoinvit-api"
fi

# --------------------------- 9. nginx -----------------------------------------
step "Palier 9 — nginx"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ ! -f "$NGINX_CONF" ]; then
  cp "$REPO_DIR/deploy/nginx-invite.bisofood.com.conf" "$NGINX_CONF"
  if [ "$DOMAIN" != "invite.bisofood.com" ]; then
    sed -i "s/invite\.bisofood\.com/$DOMAIN/g" "$NGINX_CONF"
  fi
fi
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"
nginx -t
systemctl reload nginx
ok "nginx rechargé"

# --------------------------- 10. HTTPS ----------------------------------------
step "Palier 10 — HTTPS (certbot)"
if [ "${SKIP_HTTPS:-0}" = "1" ]; then
  c_yellow "  SKIP_HTTPS=1 → certbot ignoré"
elif [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  ok "Certificat déjà émis pour $DOMAIN"
else
  if ! command -v certbot >/dev/null 2>&1; then
    apt-get update -qq && apt-get install -y certbot python3-certbot-nginx
  fi
  certbot --nginx -d "$DOMAIN" --redirect --agree-tos -m "$LE_EMAIL" --no-eff-email --non-interactive \
    || c_yellow "  certbot a échoué — vérifier DNS puis : sudo certbot --nginx -d $DOMAIN"
fi

# --------------------------- Done ---------------------------------------------
echo
c_green "════════════════════════════════════════════════════════════"
c_green "  ✔ BisoInvit déployé"
c_green "════════════════════════════════════════════════════════════"
echo "  URL        : https://$DOMAIN"
echo "  API health : curl -I https://$DOMAIN/api/"
echo "  PM2        : pm2 status ; pm2 logs bisoinvit-api"
echo "  Update     : sudo bash $REPO_DIR/deploy/update.sh"
echo "  Admin pwd  : voir $ENV_FILE (ADMIN_DEFAULT_PASSWORD)"
echo
