import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'bisoinvit.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    preview_color TEXT,
    accent_color TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    bride_name TEXT NOT NULL,
    groom_name TEXT NOT NULL,
    couple_photo TEXT,
    venue_name TEXT NOT NULL,
    venue_address TEXT,
    venue_reference TEXT,
    dates_json TEXT NOT NULL,
    dress_code TEXT,
    program_json TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    description TEXT,
    rsvp_deadline TEXT,
    template_id TEXT REFERENCES templates(id),
    accent_color TEXT,
    created_by INTEGER REFERENCES admins(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    statut TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    table_number TEXT,
    seats INTEGER DEFAULT 1,
    comment TEXT,
    template_id TEXT REFERENCES templates(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_invit_event ON invitations(event_id);
  CREATE INDEX IF NOT EXISTS idx_invit_code ON invitations(code);

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invitation_id TEXT NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL,
    scanned_at TEXT DEFAULT (datetime('now')),
    scanner_label TEXT,
    UNIQUE(invitation_id)
  );

  CREATE INDEX IF NOT EXISTS idx_scans_event ON scans(event_id);
`);

// Migration : add accent_color column if missing
try {
  const cols = db.prepare("PRAGMA table_info(events)").all().map((c) => c.name);
  if (!cols.includes('accent_color')) {
    db.exec("ALTER TABLE events ADD COLUMN accent_color TEXT");
  }
} catch { /* ignore */ }

// ---------- CONTROLLERS (agents de scan) ----------
db.exec(`
  CREATE TABLE IF NOT EXISTS controllers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS controller_events (
    controller_id INTEGER NOT NULL REFERENCES controllers(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    PRIMARY KEY (controller_id, event_id)
  );
`);

// Migration : extend scans.scanner_label avec controller_id
try {
  const cols = db.prepare("PRAGMA table_info(scans)").all().map((c) => c.name);
  if (!cols.includes('controller_id')) {
    db.exec("ALTER TABLE scans ADD COLUMN controller_id INTEGER");
  }
} catch { /* ignore */ }

// Migration : ajout du rôle (super_admin / admin) sur la table admins
try {
  const cols = db.prepare("PRAGMA table_info(admins)").all().map((c) => c.name);
  if (!cols.includes('role')) {
    db.exec("ALTER TABLE admins ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'");
  }
} catch { /* ignore */ }

// Migration : ownership des controllers (qui les a créés)
try {
  const cols = db.prepare("PRAGMA table_info(controllers)").all().map((c) => c.name);
  if (!cols.includes('created_by')) {
    db.exec("ALTER TABLE controllers ADD COLUMN created_by INTEGER REFERENCES admins(id)");
  }
} catch { /* ignore */ }

export default db;
