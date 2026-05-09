import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from './db.js';
import { signAdmin, signController, requireAuth, requireAdminOrController, requireController } from './auth.js';
import { upload, uploadCsv } from './upload.js';
import { signPayload, verifyPayload } from './qrSign.js';
import { renderJpeg, renderPng, renderPdf } from './renderer.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { parse as parseCsv } from 'csv-parse/sync';
import { ZipArchive } from 'archiver';

const router = Router();

// ---------- AUTH ----------
const loginSchema = z.object({
  user: z.string().min(1),
  password: z.string().min(1),
});

router.post('/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Données invalides' });
  const { user, password } = parsed.data;
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(user);
  if (!admin) return res.status(401).json({ error: 'Identifiants incorrects' });
  if (!bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = signAdmin(admin);
  res.json({ token, user: { id: admin.id, username: admin.username } });
});

router.get('/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

// ---------- TEMPLATES ----------
router.get('/templates', (_req, res) => {
  const rows = db.prepare('SELECT * FROM templates ORDER BY name').all();
  res.json(rows);
});

// ---------- EVENTS ----------
const eventSchema = z.object({
  title: z.string().min(1),
  bride_name: z.string().min(1),
  groom_name: z.string().min(1),
  venue_name: z.string().min(1),
  venue_address: z.string().optional().default(''),
  venue_reference: z.string().optional().default(''),
  dates: z.array(
    z.object({
      date: z.string().min(1),
      start_time: z.string().optional().default(''),
      end_time: z.string().optional().default(''),
      label: z.string().optional().default(''),
    })
  ).min(1),
  dress_code: z.string().optional().default(''),
  program: z.array(z.object({ time: z.string(), title: z.string() })).optional().default([]),
  contact_phone: z.string().optional().default(''),
  contact_email: z.string().optional().default(''),
  description: z.string().optional().default(''),
  rsvp_deadline: z.string().optional().default(''),
  template_id: z.string().optional().default('elegant'),
  accent_color: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/).optional().nullable(),
});

function parseEventBody(body) {
  // multipart envoie tout en string ; champs JSON viennent dans 'dates' / 'program'
  const out = { ...body };
  if (typeof out.dates === 'string') {
    try { out.dates = JSON.parse(out.dates); } catch { /* ignore */ }
  }
  if (typeof out.program === 'string') {
    try { out.program = JSON.parse(out.program); } catch { /* ignore */ }
  }
  return out;
}

router.post('/events', requireAuth, upload.single('couple_photo'), (req, res) => {
  const parsed = eventSchema.safeParse(parseEventBody(req.body));
  if (!parsed.success) {
    return res.status(400).json({ error: 'Validation échouée', details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const id = nanoid(12);
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  db.prepare(`
    INSERT INTO events (id, title, bride_name, groom_name, couple_photo, venue_name,
      venue_address, venue_reference, dates_json, dress_code, program_json,
      contact_phone, contact_email, description, rsvp_deadline, template_id, accent_color, created_by)
    VALUES (@id, @title, @bride_name, @groom_name, @couple_photo, @venue_name,
      @venue_address, @venue_reference, @dates_json, @dress_code, @program_json,
      @contact_phone, @contact_email, @description, @rsvp_deadline, @template_id, @accent_color, @created_by)
  `).run({
    id,
    title: data.title,
    bride_name: data.bride_name,
    groom_name: data.groom_name,
    couple_photo: photo,
    venue_name: data.venue_name,
    venue_address: data.venue_address,
    venue_reference: data.venue_reference,
    dates_json: JSON.stringify(data.dates),
    dress_code: data.dress_code,
    program_json: JSON.stringify(data.program),
    contact_phone: data.contact_phone,
    contact_email: data.contact_email,
    description: data.description,
    rsvp_deadline: data.rsvp_deadline,
    template_id: data.template_id,
    accent_color: data.accent_color || null,
    created_by: req.user.sub,
  });

  res.status(201).json(getEventById(id));
});

function getEventById(id) {
  const row = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    dates: JSON.parse(row.dates_json || '[]'),
    program: JSON.parse(row.program_json || '[]'),
  };
}

router.get('/events', (_req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY created_at DESC').all();
  res.json(rows.map((r) => ({
    ...r,
    dates: JSON.parse(r.dates_json || '[]'),
    program: JSON.parse(r.program_json || '[]'),
  })));
});

router.get('/events/:id', (req, res) => {
  const ev = getEventById(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Événement introuvable' });
  res.json(ev);
});

router.patch('/events/:id', requireAuth, upload.single('couple_photo'), (req, res) => {
  const ev = getEventById(req.params.id);
  if (!ev) return res.status(404).json({ error: 'Événement introuvable' });
  const data = parseEventBody(req.body);
  const photo = req.file ? `/uploads/${req.file.filename}` : ev.couple_photo;
  const merged = {
    ...ev,
    ...data,
    couple_photo: photo,
    dates_json: JSON.stringify(data.dates ?? ev.dates),
    program_json: JSON.stringify(data.program ?? ev.program),
  };
  db.prepare(`
    UPDATE events SET title=@title, bride_name=@bride_name, groom_name=@groom_name,
      couple_photo=@couple_photo, venue_name=@venue_name, venue_address=@venue_address,
      venue_reference=@venue_reference, dates_json=@dates_json, dress_code=@dress_code,
      program_json=@program_json, contact_phone=@contact_phone, contact_email=@contact_email,
      description=@description, rsvp_deadline=@rsvp_deadline, template_id=@template_id,
      accent_color=@accent_color,
      updated_at=datetime('now')
    WHERE id=@id
  `).run({ ...merged, id: req.params.id });
  res.json(getEventById(req.params.id));
});

router.delete('/events/:id', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Introuvable' });
  res.status(204).end();
});

// ---------- INVITATIONS ----------
const invitationSchema = z.object({
  event_id: z.string().min(1),
  statut: z.enum(['Mr', 'Mme', 'Mlle', 'Couple', 'Famille']),
  full_name: z.string().min(1),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  table_number: z.string().optional().default(''),
  seats: z.coerce.number().int().min(1).max(20).default(1),
  comment: z.string().optional().default(''),
  template_id: z.string().optional(),
});

router.post('/invitations', requireAuth, (req, res) => {
  const parsed = invitationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation échouée', details: parsed.error.flatten() });
  const data = parsed.data;
  const ev = getEventById(data.event_id);
  if (!ev) return res.status(404).json({ error: 'Événement introuvable' });
  const id = nanoid(12);
  const code = nanoid(16);
  db.prepare(`
    INSERT INTO invitations (id, code, event_id, statut, full_name, phone, email,
      table_number, seats, comment, template_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, code, data.event_id, data.statut, data.full_name, data.phone, data.email,
    data.table_number, data.seats, data.comment, data.template_id || ev.template_id
  );
  res.status(201).json(buildInvitationResponse(id));
});

function buildInvitationResponse(id) {
  const inv = db.prepare('SELECT * FROM invitations WHERE id = ?').get(id);
  if (!inv) return null;
  const ev = getEventById(inv.event_id);
  const qrPayload = signPayload({
    code: inv.code,
    event_id: inv.event_id,
    invitation_id: inv.id,
    seats: inv.seats,
  });
  return { invitation: inv, event: ev, qr_payload: qrPayload };
}

router.get('/invitations', requireAuth, (req, res) => {
  const { event_id } = req.query;
  let rows;
  if (event_id) {
    rows = db.prepare('SELECT i.*, s.scanned_at FROM invitations i LEFT JOIN scans s ON s.invitation_id = i.id WHERE i.event_id = ? ORDER BY i.created_at DESC').all(event_id);
  } else {
    rows = db.prepare('SELECT i.*, s.scanned_at FROM invitations i LEFT JOIN scans s ON s.invitation_id = i.id ORDER BY i.created_at DESC').all();
  }
  res.json(rows);
});

router.get('/invitations/code/:code', (req, res) => {
  const inv = db.prepare('SELECT * FROM invitations WHERE code = ?').get(req.params.code);
  if (!inv) return res.status(404).json({ error: 'Invitation introuvable' });
  res.json(buildInvitationResponse(inv.id));
});

// ---------- EXPORT (PDF / JPEG / PNG) ----------
const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

function safeName(inv) {
  return (inv?.full_name || 'invitation')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function exportInvitation(req, res, kind) {
  try {
    const inv = db.prepare('SELECT * FROM invitations WHERE code = ?').get(req.params.code);
    if (!inv) return res.status(404).json({ error: 'Invitation introuvable' });
    const format = req.query.format === 'landscape' ? 'landscape'
                 : req.query.format === 'a5' ? 'a5' : 'portrait';
    const filename = `invitation-${safeName(inv)}`;

    if (kind === 'pdf') {
      const buf = await renderPdf({ webUrl: WEB_URL, code: inv.code, format });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
      return res.send(buf);
    }
    if (kind === 'png') {
      const buf = await renderPng({ webUrl: WEB_URL, code: inv.code, format });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.png"`);
      return res.send(buf);
    }
    // jpeg
    const quality = Math.max(60, Math.min(100, Number(req.query.q) || 95));
    const buf = await renderJpeg({ webUrl: WEB_URL, code: inv.code, format, quality });
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.jpg"`);
    return res.send(buf);
  } catch (err) {
    console.error('[export]', err);
    res.status(500).json({ error: 'Échec export', detail: String(err.message || err) });
  }
}

router.get('/invitations/code/:code/export.pdf',  (req, res) => exportInvitation(req, res, 'pdf'));
router.get('/invitations/code/:code/export.jpg',  (req, res) => exportInvitation(req, res, 'jpeg'));
router.get('/invitations/code/:code/export.jpeg', (req, res) => exportInvitation(req, res, 'jpeg'));
router.get('/invitations/code/:code/export.png',  (req, res) => exportInvitation(req, res, 'png'));

router.delete('/invitations/:id', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM invitations WHERE id = ?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'Introuvable' });
  res.status(204).end();
});

// ---------- SCAN ----------
router.post('/scan', requireAdminOrController, (req, res) => {
  const { payload, scanner_label } = req.body || {};
  if (!payload) return res.status(400).json({ error: 'Payload manquant' });
  if (!verifyPayload(payload)) return res.status(400).json({ error: 'Signature invalide' });

  const inv = db.prepare('SELECT * FROM invitations WHERE id = ? AND code = ?').get(payload.invitation_id, payload.code);
  if (!inv) return res.status(404).json({ error: 'Invitation introuvable' });

  // Si contrôleur : vérifier qu'il a accès à l'événement
  if (req.controller) {
    if (!req.controllerEvents.includes(inv.event_id)) {
      return res.status(403).json({ error: 'Cet événement ne vous est pas affecté' });
    }
  }

  const existing = db.prepare('SELECT * FROM scans WHERE invitation_id = ?').get(inv.id);
  if (existing) {
    return res.status(409).json({
      error: 'Déjà scanné',
      scanned_at: existing.scanned_at,
      invitation: inv,
    });
  }

  const label = scanner_label || (req.controller ? req.controller.name || req.controller.username : null);
  db.prepare('INSERT INTO scans (invitation_id, event_id, scanner_label, controller_id) VALUES (?,?,?,?)')
    .run(inv.id, inv.event_id, label, req.controller ? req.controller.sub : null);

  const event = getEventById(inv.event_id);
  res.status(201).json({ ok: true, invitation: inv, event });
});

router.get('/scan/stats', requireAdminOrController, (req, res) => {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: 'event_id requis' });
  if (req.controller && !req.controllerEvents.includes(event_id)) {
    return res.status(403).json({ error: 'Cet événement ne vous est pas affecté' });
  }
  const total = db.prepare('SELECT COUNT(*) c, COALESCE(SUM(seats),0) s FROM invitations WHERE event_id = ?').get(event_id);
  const scanned = db.prepare(`SELECT COUNT(*) c, COALESCE(SUM(i.seats),0) s
                              FROM scans sc JOIN invitations i ON i.id = sc.invitation_id
                              WHERE sc.event_id = ?`).get(event_id);
  res.json({
    invitations_total: total.c,
    invitations_scanned: scanned.c,
    seats_total: total.s,
    seats_present: scanned.s,
  });
});

router.get('/scan/event/:event_id/list', requireAdminOrController, (req, res) => {
  const eventId = req.params.event_id;
  if (req.controller && !req.controllerEvents.includes(eventId)) {
    return res.status(403).json({ error: 'Cet événement ne vous est pas affecté' });
  }
  const rows = db.prepare(`
    SELECT i.*, sc.scanned_at, sc.scanner_label
    FROM scans sc JOIN invitations i ON i.id = sc.invitation_id
    WHERE sc.event_id = ?
    ORDER BY sc.scanned_at DESC
  `).all(eventId);
  res.json(rows);
});

// ---------- BULK INVITATIONS (CSV → ZIP) ----------
const STATUTS = new Set(['Mr', 'Mme', 'Mlle', 'Couple', 'Famille']);

/**
 * POST /invitations/bulk
 *  multipart : file (csv), event_id, format (portrait|landscape), kind (pdf|jpg|png)
 *  CSV (séparateur , ou ;) entêtes obligatoires : statut,full_name
 *  optionnels : phone, email, table_number, seats, comment, template_id
 */
router.post('/invitations/bulk', requireAuth, uploadCsv.single('file'), async (req, res) => {
  try {
    const event_id = req.body.event_id;
    const kind = ['pdf', 'jpg', 'png'].includes(req.body.kind) ? req.body.kind : 'pdf';
    const format = req.body.format === 'landscape' ? 'landscape' : 'portrait';
    if (!event_id) return res.status(400).json({ error: 'event_id requis' });
    if (!req.file) return res.status(400).json({ error: 'Fichier CSV requis' });
    const ev = getEventById(event_id);
    if (!ev) return res.status(404).json({ error: 'Événement introuvable' });

    // Lire CSV (auto-detect delimiter)
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const raw = await fs.readFile(req.file.path, 'utf8');
    let rows;
    try {
      rows = parseCsv(raw, { columns: true, skip_empty_lines: true, trim: true,
        delimiter: raw.includes(';') && !raw.split('\n')[0].includes(',') ? ';' : ',' });
    } catch (e) {
      return res.status(400).json({ error: 'CSV invalide: ' + e.message });
    }
    if (!rows.length) return res.status(400).json({ error: 'CSV vide' });

    // Création invitations
    const created = [];
    const errors = [];
    const insert = db.prepare(`
      INSERT INTO invitations (id, code, event_id, statut, full_name, phone, email,
        table_number, seats, comment, template_id)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const statut = String(r.statut || r.Statut || '').trim();
      const full_name = String(r.full_name || r.nom || r.name || '').trim();
      if (!STATUTS.has(statut)) { errors.push({ line: i + 2, error: `statut invalide: ${statut}` }); continue; }
      if (!full_name) { errors.push({ line: i + 2, error: 'full_name manquant' }); continue; }
      const id = nanoid(12), code = nanoid(16);
      insert.run(
        id, code, event_id, statut, full_name,
        r.phone || '', r.email || '',
        r.table_number || r.table || '', Math.max(1, Math.min(20, parseInt(r.seats) || 1)),
        r.comment || '', r.template_id || ev.template_id
      );
      created.push({ id, code, full_name, statut });
    }

    // Cleanup uploaded csv
    try { await fs.unlink(req.file.path); } catch { /* ignore */ }

    if (!created.length) {
      return res.status(400).json({ error: 'Aucune ligne valide', errors });
    }

    // Génération ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition',
      `attachment; filename="invitations-${ev.bride_name}-${ev.groom_name}.zip"`
        .replace(/[^\x20-\x7e";=.\-]/g, '_'));

    const archive = new ZipArchive({ zlib: { level: 6 } });
    archive.on('error', (e) => { console.error('[zip]', e); try { res.end(); } catch {/*noop*/} });
    archive.pipe(res);

    const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';
    // index.csv
    const indexLines = ['code,statut,full_name,public_url'];
    for (const c of created) {
      indexLines.push(`${c.code},${c.statut},"${c.full_name.replace(/"/g, '""')}",${WEB_URL}/i/${c.code}`);
    }
    archive.append(indexLines.join('\n'), { name: 'index.csv' });
    if (errors.length) archive.append(JSON.stringify(errors, null, 2), { name: 'errors.json' });

    // Génération séquentielle (puppeteer = 1 page à la fois pour économie mémoire)
    for (const c of created) {
      try {
        let buf, ext;
        if (kind === 'pdf') { buf = await renderPdf({ webUrl: WEB_URL, code: c.code, format }); ext = 'pdf'; }
        else if (kind === 'png') { buf = await renderPng({ webUrl: WEB_URL, code: c.code, format }); ext = 'png'; }
        else { buf = await renderJpeg({ webUrl: WEB_URL, code: c.code, format, quality: 95 }); ext = 'jpg'; }
        const safe = c.full_name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
        archive.append(buf, { name: `${safe || 'invitation'}-${c.code.slice(0, 6)}.${ext}` });
      } catch (e) {
        console.error('[bulk render]', c.code, e.message);
        archive.append(`Erreur génération: ${e.message}`, { name: `ERREUR-${c.code}.txt` });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('[bulk]', err);
    if (!res.headersSent) res.status(500).json({ error: String(err.message || err) });
  }
});

// ---------- CONTROLLERS (agents de scan) ----------
router.post('/auth/controller/login', (req, res) => {
  const body = req.body || {};
  const user = body.username || body.user;
  const password = body.password;
  if (!user || !password) return res.status(400).json({ error: 'Identifiants requis' });
  const c = db.prepare('SELECT * FROM controllers WHERE username = ?').get(user);
  if (!c || !bcrypt.compareSync(password, c.password_hash)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  const events = db.prepare(`
    SELECT e.id, e.title, e.bride_name, e.groom_name FROM controller_events ce
    JOIN events e ON e.id = ce.event_id
    WHERE ce.controller_id = ?
  `).all(c.id);
  res.json({
    token: signController(c),
    controller: { id: c.id, username: c.username, name: c.name },
    events,
  });
});

router.get('/controller/me', requireController, (req, res) => {
  const u = req.controller;
  const events = db.prepare(`
    SELECT e.id, e.title, e.bride_name, e.groom_name FROM controller_events ce
    JOIN events e ON e.id = ce.event_id WHERE ce.controller_id = ?
  `).all(u.sub);
  res.json({ controller: { id: u.sub, username: u.username, name: u.name }, events });
});

const controllerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4).optional(),
  name: z.string().optional().default(''),
  event_ids: z.array(z.string()).optional().default([]),
});

router.get('/controllers', requireAuth, (_req, res) => {
  const list = db.prepare('SELECT id, username, name, created_at FROM controllers ORDER BY created_at DESC').all();
  for (const c of list) {
    c.events = db.prepare(`SELECT e.id, e.title, e.bride_name, e.groom_name
      FROM controller_events ce JOIN events e ON e.id = ce.event_id WHERE ce.controller_id = ?`).all(c.id);
  }
  res.json(list);
});

router.post('/controllers', requireAuth, (req, res) => {
  const parsed = controllerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation échouée', details: parsed.error.flatten() });
  const { username, password, name, event_ids } = parsed.data;
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });
  const exists = db.prepare('SELECT id FROM controllers WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: 'Nom déjà utilisé' });
  const hash = bcrypt.hashSync(password, 10);
  const r = db.prepare('INSERT INTO controllers (username, password_hash, name) VALUES (?,?,?)')
    .run(username, hash, name);
  const id = r.lastInsertRowid;
  const ins = db.prepare('INSERT OR IGNORE INTO controller_events (controller_id, event_id) VALUES (?,?)');
  for (const eid of event_ids) ins.run(id, eid);
  res.status(201).json({ id, username, name });
});

router.patch('/controllers/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const c = db.prepare('SELECT * FROM controllers WHERE id = ?').get(id);
  if (!c) return res.status(404).json({ error: 'Introuvable' });
  const parsed = controllerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Validation échouée', details: parsed.error.flatten() });
  const { name, password, event_ids } = parsed.data;
  if (name !== undefined) db.prepare('UPDATE controllers SET name = ? WHERE id = ?').run(name, id);
  if (password) db.prepare('UPDATE controllers SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), id);
  if (Array.isArray(event_ids)) {
    db.prepare('DELETE FROM controller_events WHERE controller_id = ?').run(id);
    const ins = db.prepare('INSERT OR IGNORE INTO controller_events (controller_id, event_id) VALUES (?,?)');
    for (const eid of event_ids) ins.run(id, eid);
  }
  res.json({ ok: true });
});

router.delete('/controllers/:id', requireAuth, (req, res) => {
  const r = db.prepare('DELETE FROM controllers WHERE id = ?').run(Number(req.params.id));
  if (!r.changes) return res.status(404).json({ error: 'Introuvable' });
  res.status(204).end();
});

export default router;
