#!/usr/bin/env bash
# Audit lecture-seule du VPS avant déploiement BisoInvit.
# Aucun changement effectué. Lance avec :  bash deploy/audit-vps.sh
set +e

bar() { echo; echo "═══════════════════════════════════════════════════════════════"; echo "  $1"; echo "═══════════════════════════════════════════════════════════════"; }

bar "1. SYSTÈME"
. /etc/os-release 2>/dev/null && echo "OS         : $PRETTY_NAME"
echo "Kernel     : $(uname -r)"
echo "Uptime     : $(uptime -p)"
echo "Hostname   : $(hostname -f)"
echo "Date       : $(date)"

bar "2. RESSOURCES"
echo "── CPU"
nproc 2>/dev/null && echo "core(s)"
echo "── RAM"
free -h | head -3
echo "── Disque"
df -h / /var /home 2>/dev/null | grep -v tmpfs

bar "3. UTILISATEUR & SUDO"
echo "User       : $(whoami)   uid=$(id -u)"
echo "Groupes    : $(id -nG)"

bar "4. PORTS À L'ÉCOUTE"
echo "(LISTEN seulement)"
if command -v ss >/dev/null; then
  sudo ss -tlnp 2>/dev/null || ss -tln
else
  sudo netstat -tlnp 2>/dev/null || netstat -tln
fi

bar "5. NODE / NPM"
if command -v node >/dev/null; then
  echo "node       : $(node -v)"
  echo "npm        : $(npm -v)"
else
  echo "node       : ABSENT (à installer : Node 20 LTS)"
fi
command -v pm2 >/dev/null && echo "pm2        : $(pm2 -v)" || echo "pm2        : ABSENT"
command -v yarn >/dev/null && echo "yarn       : $(yarn -v)" || true
command -v pnpm >/dev/null && echo "pnpm       : $(pnpm -v)" || true

bar "6. PYTHON (apps existantes)"
command -v python3 >/dev/null && echo "python3    : $(python3 --version 2>&1)" || echo "python3    : ABSENT"
command -v pip3 >/dev/null && echo "pip3       : $(pip3 --version 2>&1 | awk '{print $2}')" || true
command -v gunicorn >/dev/null && echo "gunicorn   : $(gunicorn --version 2>&1)" || true
command -v uwsgi >/dev/null && echo "uwsgi      : $(uwsgi --version 2>&1)" || true

bar "7. NGINX"
if command -v nginx >/dev/null; then
  nginx -v 2>&1
  echo "── Vhosts activés :"
  ls -1 /etc/nginx/sites-enabled/ 2>/dev/null
  echo
  echo "── server_name déjà utilisés (lecture seule) :"
  sudo grep -rhE '^\s*server_name' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | sort -u
  echo
  echo "── listen ports configurés :"
  sudo grep -rhE '^\s*listen' /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | sort -u
else
  echo "nginx      : ABSENT (à installer)"
fi

bar "8. PROCESSUS DE LONGUE DURÉE (top consommateurs RAM)"
ps -eo pid,user,%cpu,%mem,cmd --sort=-%mem | head -15

bar "9. PM2 (si présent)"
if command -v pm2 >/dev/null; then
  pm2 list 2>/dev/null
fi

bar "10. SYSTEMD (services tiers actifs hors système de base)"
systemctl list-units --type=service --state=running --no-pager --no-legend 2>/dev/null \
  | grep -Ev '^(systemd-|cron|rsyslog|networkd|resolved|udev|polkit|dbus|snapd|ssh|cloud-init|getty|user@|fwupd|unattended)' \
  | head -30

bar "11. FIREWALL"
if command -v ufw >/dev/null; then
  sudo ufw status verbose 2>/dev/null
elif command -v firewall-cmd >/dev/null; then
  sudo firewall-cmd --list-all 2>/dev/null
else
  echo "Aucun pare-feu utilisateur (ufw/firewalld) détecté"
fi

bar "12. CHROMIUM / CHROME (pour génération PDF puppeteer)"
for c in chromium chromium-browser google-chrome chrome; do
  if command -v $c >/dev/null; then
    echo "$c : $($c --version 2>/dev/null) ($(command -v $c))"
  fi
done

bar "13. CERTBOT / SSL"
command -v certbot >/dev/null && certbot --version 2>&1 || echo "certbot    : ABSENT"
sudo ls /etc/letsencrypt/live/ 2>/dev/null | grep -v README

bar "14. DNS LOCAL POUR invite.bisofood.com"
host invite.bisofood.com 2>/dev/null \
  || dig +short invite.bisofood.com 2>/dev/null \
  || nslookup invite.bisofood.com 2>/dev/null | grep -E 'Address'

bar "15. ARBORESCENCE /var/www"
ls -la /var/www/ 2>/dev/null

bar "16. CRON ROOT"
sudo crontab -l 2>/dev/null | grep -v '^#' | head -20

echo
echo "═══════════════════════════════════════════════════════════════"
echo "  ✔ Audit terminé. Aucune modification effectuée."
echo "═══════════════════════════════════════════════════════════════"
