import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db.js';
import routes from './routes.js';
import { uploadsDir } from './upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// CORS : en prod, restreindre via CORS_ORIGIN (séparés par virgules).
// Vide ou "*" => tout autoriser (dev).
const corsOrigin = (process.env.CORS_ORIGIN || '*').trim();
if (corsOrigin === '*' || corsOrigin === '') {
  app.use(cors());
} else {
  const allowed = corsOrigin.split(',').map((s) => s.trim()).filter(Boolean);
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // requêtes server-to-server / curl
      cb(null, allowed.includes(origin));
    },
    credentials: false,
  }));
}

app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

app.get('/', (_req, res) => res.json({ name: 'BisoInvit API', version: '1.0.0', status: 'ok' }));
app.use('/api', routes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✔ BisoInvit API sur http://localhost:${PORT}`);
});
