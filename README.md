# BisoInvit — Système d'invitations & scan QR

Plateforme de gestion d'invitations pour mariages : génération en masse de QR codes
signés, app web admin, app mobile contrôleur.

## Structure

```
bisoInvit/
├── backend/                       # API Node.js / Express / SQLite
├── Electro-Invit-Web-main/        # Frontend Vite/React (admin web)
│   └── WebInvite/
├── Electro-Invite-Scan-main/      # App mobile Expo (scan QR contrôleur)
├── deploy/                        # Scripts & configs nginx pour le VPS
└── DEPLOY.md                      # Guide de déploiement complet
```

## Démarrage rapide (dev local)

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm start                          # http://localhost:4000

# Web admin (autre terminal)
cd Electro-Invit-Web-main/WebInvite
npm install
npm run dev                        # http://localhost:5173

# Mobile (autre terminal)
cd Electro-Invite-Scan-main
npm install
npm start                          # ouvrir avec Expo Go
```

## Production

Voir [DEPLOY.md](DEPLOY.md) pour le déploiement sur VPS Ubuntu (nginx + PM2 + certbot).

## Licence

Propriétaire — tous droits réservés.
