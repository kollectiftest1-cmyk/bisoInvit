import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from './db.js';

const TEMPLATES = [
  { id: 'heart',   name: 'Heart Gold',   description: 'Photo en cœur doré sur fond marine, écriture cursive', preview_color: '#0e1535', accent_color: '#d4af37' },
  { id: 'damask',  name: 'Vintage Damask', description: 'Photo plein cadre + ornement damas blanc',           preview_color: '#1a1a1a', accent_color: '#c9a14a' },
  { id: 'elegant', name: 'Silver Lace',  description: 'Volutes argentées, fond pêche romantique',             preview_color: '#fde9df', accent_color: '#9a9a9a' },
  { id: 'royal',   name: 'Royal Gold',   description: 'Cadre circulaire doré, fleurs noires & or',            preview_color: '#fffdf7', accent_color: '#c9a14a' },
  { id: 'floral',  name: 'Blush Floral', description: 'Roses aquarelle, eucalyptus, rose poudré',             preview_color: '#fef0f4', accent_color: '#d4748b' },
  { id: 'modern',  name: 'Ivory Modern', description: 'Lignes fines dorées, ivoire minimaliste',              preview_color: '#fbf8f1', accent_color: '#c9a14a' },
];

const insertTpl = db.prepare(`
  INSERT INTO templates (id, name, description, preview_color, accent_color)
  VALUES (@id, @name, @description, @preview_color, @accent_color)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, description=excluded.description,
    preview_color=excluded.preview_color, accent_color=excluded.accent_color
`);
TEMPLATES.forEach((t) => insertTpl.run(t));
console.log(`✔ Templates : ${TEMPLATES.length}`);

const username = process.env.ADMIN_DEFAULT_USER || 'admin';
const password = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
const exists = db.prepare('SELECT id, role FROM admins WHERE username = ?').get(username);
const totalAdmins = db.prepare('SELECT COUNT(*) AS n FROM admins').get().n;

if (!exists) {
  // Premier admin du système → super_admin
  const role = totalAdmins === 0 ? 'super_admin' : 'admin';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)').run(username, hash, role);
  console.log(`✔ ${role} créé : ${username} / ${password}`);
} else {
  // Si pas de super_admin du tout, promouvoir celui-ci (cas de migration)
  const hasSuper = db.prepare("SELECT id FROM admins WHERE role = 'super_admin' LIMIT 1").get();
  if (!hasSuper) {
    db.prepare("UPDATE admins SET role = 'super_admin' WHERE id = ?").run(exists.id);
    console.log(`✔ ${username} promu super_admin`);
  } else {
    console.log(`✔ Admin déjà existant : ${username} (role=${exists.role})`);
  }
}
