# 🚀 Déploiement BisoInvit sur VPS — `invite.bisofood.com`

Guide complet pour publier l'application sur un VPS Ubuntu/Debian où tournent
déjà d'autres apps (React + Python). Tout est confiné dans `/var/www/bisoinvit`
et le port `4000` (Node) reste interne ; nginx fait le reverse-proxy HTTPS.

> **Architecture cible**
> - **Frontend** : Vite/React buildé en statique → `/var/www/bisoinvit/web` servi par nginx
> - **Backend** : Node.js/Express (port `4000` localhost uniquement) → `pm2`
> - **DB** : SQLite (fichier) dans `/var/www/bisoinvit/backend/data/bisoinvit.db`
> - **Fichiers** : photos couples dans `/var/www/bisoinvit/backend/uploads/`
> - **Reverse proxy** : nginx + Let's Encrypt (certbot)
> - **Génération PDF/JPG** : Chromium système via `puppeteer-core`

---

## 1. Pré-requis VPS (one-shot)

```bash
# Node 20 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential git rsync

# Chromium pour la génération PDF/JPG/PNG
sudo apt-get install -y chromium \
  ca-certificates fonts-liberation libnss3 libxss1 libasound2 libxshmfence1 \
  libgbm1 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libpango-1.0-0 libcairo2

# PM2 (process manager)
sudo npm install -g pm2

# Vérifier
which chromium      # → /usr/bin/chromium
node --version      # → v20.x
```

Logs PM2 :

```bash
sudo mkdir -p /var/log/bisoinvit
sudo chown -R $USER:$USER /var/log/bisoinvit
```

---

## 2. Récupérer le code

```bash
sudo mkdir -p /var/www/bisoinvit/{repo,backend,web}
sudo chown -R $USER:$USER /var/www/bisoinvit
cd /var/www/bisoinvit

# Cloner ton repo (remplace l'URL)
git clone <URL_REPO_GIT> repo
```

> Si tu déploies par `scp` plutôt que `git`, copie tout le dossier dans `repo/`.

---

## 3. Configurer le backend

```bash
cd /var/www/bisoinvit/repo/backend
cp .env.production.example .env

# Générer 2 secrets aléatoires
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(48).toString('hex'))" >> .env
node -e "console.log('QR_HMAC_SECRET=' + require('crypto').randomBytes(48).toString('hex'))" >> .env

# Éditer .env :
nano .env
```

Vérifier dans `.env` :
- `PUBLIC_URL=https://invite.bisofood.com`
- `WEB_URL=https://invite.bisofood.com`
- `CORS_ORIGIN=https://invite.bisofood.com`
- `CHROME_PATH=/usr/bin/chromium`
- `ADMIN_DEFAULT_PASSWORD=<mot de passe fort>`

> ⚠️ **Ne pas committer `.env`**. Garde-le sur le serveur uniquement.

Installer les dépendances :

```bash
cd /var/www/bisoinvit/repo/backend
npm ci --omit=dev
```

---

## 4. Builder le frontend

```bash
cd /var/www/bisoinvit/repo/Electro-Invit-Web-main/WebInvite
cp .env.production.example .env.production
# Vérifier : VITE_API_URL=https://invite.bisofood.com

npm ci
npm run build

# Publier dist/ dans /var/www/bisoinvit/web
rm -rf /var/www/bisoinvit/web/*
cp -r dist/* /var/www/bisoinvit/web/
```

---

## 5. Synchroniser le backend dans son emplacement final

```bash
rsync -a --delete \
  --exclude='node_modules' --exclude='data' --exclude='uploads' --exclude='.env' \
  /var/www/bisoinvit/repo/backend/ /var/www/bisoinvit/backend/

cp -r /var/www/bisoinvit/repo/backend/node_modules /var/www/bisoinvit/backend/
cp /var/www/bisoinvit/repo/backend/.env /var/www/bisoinvit/backend/.env
cp /var/www/bisoinvit/repo/backend/ecosystem.config.cjs /var/www/bisoinvit/backend/
```

---

## 6. Lancer l'API avec PM2

```bash
cd /var/www/bisoinvit/backend
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u $USER --hp $HOME    # copier-coller la commande sudo retournée
```

Vérifier :

```bash
pm2 status
pm2 logs bisoinvit-api --lines 50
curl http://127.0.0.1:4000/                # → {"name":"BisoInvit API",...}
```

---

## 7. Configurer nginx

```bash
sudo cp /var/www/bisoinvit/repo/deploy/nginx-invite.bisofood.com.conf \
  /etc/nginx/sites-available/invite.bisofood.com

sudo ln -s /etc/nginx/sites-available/invite.bisofood.com \
  /etc/nginx/sites-enabled/invite.bisofood.com

sudo nginx -t
sudo systemctl reload nginx
```

> Cette config **n'entre pas en conflit** avec tes apps existantes : c'est un
> nouveau `server` block sur un nouveau `server_name`. Tes ports Python/React
> actuels restent intacts (le port 4000 est uniquement écouté en `127.0.0.1`,
> donc invisible depuis l'extérieur).

---

## 8. DNS + HTTPS

1. Ajouter un enregistrement DNS chez ton registrar :

   | Type | Nom    | Valeur          | TTL |
   |------|--------|-----------------|-----|
   | A    | invite | `<IP du VPS>`   | 300 |

2. Attendre que `invite.bisofood.com` résolve (`dig invite.bisofood.com +short`).

3. Émettre le certificat Let's Encrypt :

   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d invite.bisofood.com \
     --redirect --agree-tos -m admin@bisofood.com --no-eff-email
   ```

   Certbot ajoute automatiquement la redirection HTTP→HTTPS et le renouvellement
   auto via `systemctl status certbot.timer`.

---

## 9. Vérifications finales

```bash
# Frontend
curl -I https://invite.bisofood.com/

# API (via nginx)
curl https://invite.bisofood.com/api/                   # 404 ok (route non listée)
curl -X POST https://invite.bisofood.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"user":"admin","password":"<PWD>"}'              # → { token, user }

# Logs en temps réel
pm2 logs bisoinvit-api
sudo tail -f /var/log/nginx/invite.bisofood.com.error.log
```

Ouvrir https://invite.bisofood.com/ dans le navigateur, se connecter avec
`admin` / le mot de passe choisi, créer un événement, importer un CSV.

---

## 10. Mise à jour ultérieure

Le script `deploy/update.sh` automatise les étapes 4–6 :

```bash
cd /var/www/bisoinvit
bash repo/deploy/update.sh
```

Ou manuellement après un `git pull` :

```bash
cd /var/www/bisoinvit/repo && git pull
cd Electro-Invit-Web-main/WebInvite && npm ci && npm run build && \
  rm -rf /var/www/bisoinvit/web/* && cp -r dist/* /var/www/bisoinvit/web/
cd ../../backend && npm ci --omit=dev
rsync -a --delete --exclude=node_modules --exclude=data --exclude=uploads --exclude=.env \
  /var/www/bisoinvit/repo/backend/ /var/www/bisoinvit/backend/
cp -r /var/www/bisoinvit/repo/backend/node_modules /var/www/bisoinvit/backend/
pm2 reload bisoinvit-api --update-env
```

---

## 11. Sauvegardes (recommandé)

La base SQLite + les uploads sont les seules données critiques :

```bash
# /etc/cron.daily/bisoinvit-backup
#!/bin/bash
DEST=/var/backups/bisoinvit
mkdir -p "$DEST"
TS=$(date +%Y%m%d-%H%M)
cp /var/www/bisoinvit/backend/data/bisoinvit.db "$DEST/bisoinvit-$TS.db"
tar czf "$DEST/uploads-$TS.tar.gz" -C /var/www/bisoinvit/backend uploads
find "$DEST" -mtime +14 -delete
```

```bash
sudo chmod +x /etc/cron.daily/bisoinvit-backup
```

---

## 12. App mobile (Expo)

Modifier dans le repo mobile **avant de builder l'APK** :

`Electro-Invite-Scan-main/config.js` :

```js
export const config = {
  API_URL: 'https://invite.bisofood.com',
  SCANNER_LABEL: 'mobile',
};
```

Puis :

```bash
cd Electro-Invite-Scan-main
eas build -p android --profile production
```

---

## 13. Sécurité — checklist

- [x] Port 4000 lié à `127.0.0.1` uniquement (jamais exposé directement)
- [x] CORS restreint à `https://invite.bisofood.com` via `CORS_ORIGIN`
- [x] HTTPS forcé par certbot (HSTS via certbot par défaut)
- [x] `JWT_SECRET` et `QR_HMAC_SECRET` ≥ 64 chars aléatoires
- [x] `ADMIN_DEFAULT_PASSWORD` changé immédiatement après le 1er login
- [x] Headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- [x] Rate-limit nginx sur `/api/auth/login` (5 req/s, burst 10)
- [x] `.env` jamais committé
- [ ] Firewall : `sudo ufw allow 'Nginx Full' && sudo ufw enable`

---

## 14. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `502 Bad Gateway` sur `/api/...` | API non démarrée | `pm2 logs bisoinvit-api` |
| `Aucun navigateur Chrome/Edge trouvé` lors d'une génération | `CHROME_PATH` mal défini | `which chromium` puis ajuster `.env` |
| Génération PDF en masse coupée à 60s | Timeout nginx trop court | Déjà à 300s dans la conf, augmenter si plus de 200 invités |
| `EADDRINUSE :::4000` | Ancienne instance | `pm2 delete bisoinvit-api && pm2 start ecosystem.config.cjs` |
| QR codes pointent vers `localhost` | `WEB_URL` mal défini dans `.env` | Corriger puis `pm2 reload bisoinvit-api --update-env` |
| Caméra mobile ne se relance pas | Non lié au déploiement (cf. `useFocusEffect` dans `ScanInvitaion.js`) | Déjà fixé côté code |

---

## 15. Récap des chemins sur le VPS

```
/var/www/bisoinvit/
├── repo/           ← clone Git (read-only après build)
├── backend/        ← code Node + node_modules + data/ + uploads/ + .env
├── web/            ← dist Vite (servi par nginx)
└── deploy/         ← scripts (update.sh, nginx conf)

/etc/nginx/sites-available/invite.bisofood.com
/var/log/bisoinvit/api.{out,err}.log
/var/log/nginx/invite.bisofood.com.{access,error}.log
/var/backups/bisoinvit/
```
