# BisoInvit — Backend

API REST pour la gestion d'invitations électroniques de mariage.

## Stack
- Node.js + Express
- SQLite (better-sqlite3) — zéro configuration
- JWT pour l'authentification admin
- Multer pour l'upload d'images
- HMAC-SHA256 pour signer les QR codes (anti-fraude)
- Zod pour la validation des entrées

## Démarrage

```bash
cd backend
npm install
cp .env.example .env   # puis éditer les secrets
npm run seed           # crée admin par défaut + templates
npm run dev
```

API disponible sur `http://localhost:4000`.

## Endpoints principaux

### Auth
- `POST /api/auth/login` → `{ user, password }` → `{ token }`

### Events (mariage / cérémonie)
- `GET /api/events` (public, liste limitée)
- `GET /api/events/:id` (public)
- `POST /api/events` 🔒 (admin, multipart : couple_photo)
- `PATCH /api/events/:id` 🔒
- `DELETE /api/events/:id` 🔒

### Invitations
- `GET /api/invitations` 🔒 (filtre par event_id)
- `GET /api/invitations/:code` (public, pour rendu carte)
- `POST /api/invitations` 🔒
- `DELETE /api/invitations/:id` 🔒

### Scans (entrée le jour J)
- `POST /api/scan` → `{ payload }` → vérifie signature + marque comme scanné
- `GET /api/scan/stats?event_id=...`

### Templates
- `GET /api/templates` (public)

### Uploads
- Static : `GET /uploads/<filename>`

## Sécurité QR
Chaque invitation contient un payload JSON signé HMAC-SHA256 :
```json
{ "code": "abc123", "event_id": "...", "guest_id": "...", "sig": "<hex>" }
```
Le mobile peut vérifier offline avec le secret partagé OU online via `/api/scan`.
