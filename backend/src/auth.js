import jwt from 'jsonwebtoken';
import db from './db.js';

const SECRET = process.env.JWT_SECRET || 'dev-jwt';

export function signAdmin(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username, role: admin.role || 'admin' },
    SECRET,
    { expiresIn: '7d' }
  );
}

export function signController(c) {
  return jwt.sign({ sub: c.id, username: c.username, name: c.name, role: 'controller' }, SECRET, {
    expiresIn: '30d',
  });
}

function readToken(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

const ADMIN_ROLES = new Set(['admin', 'super_admin']);

/** Admin OU super_admin */
export function requireAuth(req, res, next) {
  const u = readToken(req);
  if (!u || !ADMIN_ROLES.has(u.role)) return res.status(401).json({ error: 'Token admin requis' });
  req.user = u;
  next();
}

/** Super admin uniquement */
export function requireSuperAdmin(req, res, next) {
  const u = readToken(req);
  if (!u || u.role !== 'super_admin') return res.status(403).json({ error: 'Réservé au super admin' });
  req.user = u;
  next();
}

export function requireController(req, res, next) {
  const u = readToken(req);
  if (!u || u.role !== 'controller') return res.status(401).json({ error: 'Token contrôleur requis' });
  req.controller = u;
  next();
}

/** Admin / super_admin / controller (pour /scan). Si controller, attache la liste des events autorisés. */
export function requireAdminOrController(req, res, next) {
  const u = readToken(req);
  if (!u) return res.status(401).json({ error: 'Token requis' });
  if (ADMIN_ROLES.has(u.role)) {
    req.user = u;
    return next();
  }
  if (u.role === 'controller') {
    const events = db.prepare('SELECT event_id FROM controller_events WHERE controller_id = ?')
      .all(u.sub).map((r) => r.event_id);
    req.controller = u;
    req.controllerEvents = events;
    return next();
  }
  return res.status(401).json({ error: 'Token invalide' });
}

/** Vérifie qu'un admin (non super) est bien propriétaire d'un évènement. */
export function canAccessEvent(user, eventId) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role !== 'admin') return false;
  const ev = db.prepare('SELECT created_by FROM events WHERE id = ?').get(eventId);
  if (!ev) return false;
  return ev.created_by === user.sub;
}
