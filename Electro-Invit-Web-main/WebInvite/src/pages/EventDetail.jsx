import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(() => new Set());
  const [kind, setKind] = useState('pdf');
  const [format, setFormat] = useState('portrait');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [onlySelected, setOnlySelected] = useState(false);

  const load = async () => {
    try {
      const [ev, list, st] = await Promise.all([
        api.getEvent(id),
        api.listInvitations(id),
        api.scanStats(id),
      ]);
      setEvent(ev); setInvitations(list); setStats(st);
      setSelected(new Set());
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [id]);

  const onDelete = async (invId) => {
    if (!confirm('Supprimer cette invitation ?')) return;
    await api.deleteInvitation(invId);
    load();
  };

  const toggleOne = (invId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(invId)) next.delete(invId); else next.add(invId);
      return next;
    });
  };
  // Filtre : recherche sur nom / téléphone / emplacement / statut / code
  const filtered = useMemo(() => {
    const q = norm(search.trim());
    let list = invitations;
    if (q) {
      list = list.filter((i) =>
        norm(i.full_name).includes(q)
        || norm(i.table_number).includes(q)
        || norm(i.phone).includes(q)
        || norm(i.statut).includes(q)
        || norm(i.code).includes(q)
      );
    }
    if (onlySelected) list = list.filter((i) => selected.has(i.id));
    return list;
  }, [invitations, search, onlySelected, selected]);

  const toggleAll = () => {
    // Sélectionne / désélectionne tout ce qui est visible (filtré)
    const visibleIds = filtered.map((i) => i.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((vid) => selected.has(vid));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const vid of visibleIds) next.delete(vid);
      } else {
        for (const vid of visibleIds) next.add(vid);
      }
      return next;
    });
  };

  const onBulkReprint = async () => {
    if (!selected.size || busy) return;
    setBusy(true);
    try {
      await api.reprintInvitations(Array.from(selected), kind, format);
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  };
  const onBulkDelete = async () => {
    if (!selected.size || busy) return;
    if (!confirm(`Supprimer ${selected.size} invitation(s) ? Cette action est irréversible.`)) return;
    setBusy(true);
    try {
      const r = await api.bulkDeleteInvitations(Array.from(selected));
      if (r.forbidden || r.missing) {
        alert(`${r.deleted} supprimée(s)${r.forbidden ? `, ${r.forbidden} refusée(s)` : ''}${r.missing ? `, ${r.missing} introuvable(s)` : ''}.`);
      }
      await load();
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="container"><div className="card">{error}</div></div>;
  if (!event) return <div className="center"><div className="spinner" /></div>;

  const visibleIds = filtered.map((i) => i.id);
  const visibleSelectedCount = visibleIds.filter((vid) => selected.has(vid)).length;
  const allChecked = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someChecked = visibleSelectedCount > 0 && !allChecked;

  return (
    <div className="container">
      <div className="row-between">
        <div>
          <h1>{event.bride_name} & {event.groom_name}</h1>
          <div style={{ color: 'var(--text-muted)' }}>{event.title} · {event.venue_name}</div>
        </div>
        <div className="cluster">
          <Link to={`/admin/events/${id}/edit`} className="btn btn-ghost">Modifier l'événement</Link>
          <Link to={`/admin/events/${id}/invitations/new`} className="btn btn-primary">+ Nouvelle invitation</Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-4" style={{ margin: '1.5rem 0' }}>
          <div className="card stat-card">
            <div className="stat-label">Invitations</div>
            <div className="stat-value">{stats.invitations_total}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Scannées</div>
            <div className="stat-value">{stats.invitations_scanned}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Places totales</div>
            <div className="stat-value">{stats.seats_total}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Présents</div>
            <div className="stat-value">{stats.seats_present}</div>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div
        className="card"
        style={{
          display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap',
          padding: '.75rem 1rem', marginBottom: '.75rem',
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, téléphone, emplacement, statut…)"
          style={{ flex: 1, minWidth: 220, padding: '.5rem .75rem', borderRadius: 6, border: '1px solid var(--border, #ddd)' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.9rem' }}>
          <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
          Sélection uniquement
        </label>
        <span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
          {filtered.length} / {invitations.length} affichée(s){selected.size ? ` · ${selected.size} sélectionnée(s)` : ''}
        </span>
      </div>

      {selected.size > 0 && (
        <div
          className="card"
          style={{
            display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap',
            padding: '.75rem 1rem', marginBottom: '.75rem',
            background: 'var(--accent-soft, rgba(184,138,58,0.08))',
            borderColor: 'var(--accent, #b88a3a)',
            position: 'sticky', top: 0, zIndex: 10,
          }}
        >
          <strong>{selected.size} sélectionnée(s)</strong>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginLeft: 'auto' }}>
            Format&nbsp;:
            <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={busy}>
              <option value="pdf">PDF</option>
              <option value="jpg">JPG</option>
              <option value="png">PNG</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            Orientation&nbsp;:
            <select value={format} onChange={(e) => setFormat(e.target.value)} disabled={busy}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Paysage</option>
              <option value="a5">A5</option>
            </select>
          </label>
          <button onClick={onBulkReprint} disabled={busy} className="btn btn-primary btn-sm">
            {busy ? '…' : 'Réimprimer'}
          </button>
          <button onClick={onBulkDelete} disabled={busy} className="btn btn-sm" style={{ color: 'var(--danger)' }}>
            Supprimer
          </button>
          <button onClick={() => setSelected(new Set())} disabled={busy} className="btn btn-ghost btn-sm">
            Annuler
          </button>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = someChecked; }}
                  onChange={toggleAll}
                  aria-label="Tout sélectionner"
                />
              </th>
              <th>Invité</th><th>Statut</th><th>Téléphone</th><th>Emplacement</th><th>Places</th><th>Scanné</th><th></th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune invitation pour l'instant.</td></tr>
            )}
            {invitations.length > 0 && filtered.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun résultat pour « {search} ».</td></tr>
            )}
            {filtered.map((inv) => (
              <tr key={inv.id} style={selected.has(inv.id) ? { background: 'rgba(184,138,58,0.06)' } : undefined}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(inv.id)}
                    onChange={() => toggleOne(inv.id)}
                    aria-label={`Sélectionner ${inv.full_name}`}
                  />
                </td>
                <td><strong>{inv.full_name}</strong><div style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{inv.code.slice(0, 8)}</div></td>
                <td>{inv.statut}</td>
                <td>{inv.phone || '—'}</td>
                <td>{inv.table_number || '—'}</td>
                <td>{inv.seats}</td>
                <td>{inv.scanned_at ? <span className="badge badge-success">✓ {new Date(inv.scanned_at).toLocaleString('fr-FR')}</span> : <span className="badge badge-muted">en attente</span>}</td>
                <td>
                  <div className="cluster">
                    <Link to={`/i/${inv.code}`} target="_blank" className="btn btn-sm btn-ghost">Voir</Link>
                    <button onClick={() => onDelete(inv.id)} className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
