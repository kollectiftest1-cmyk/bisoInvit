import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [ev, list, st] = await Promise.all([
        api.getEvent(id),
        api.listInvitations(id),
        api.scanStats(id),
      ]);
      setEvent(ev); setInvitations(list); setStats(st);
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, [id]);

  const onDelete = async (invId) => {
    if (!confirm('Supprimer cette invitation ?')) return;
    await api.deleteInvitation(invId);
    load();
  };

  if (error) return <div className="container"><div className="card">{error}</div></div>;
  if (!event) return <div className="center"><div className="spinner" /></div>;

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

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Invité</th><th>Statut</th><th>Téléphone</th><th>Emplacement</th><th>Places</th><th>Scanné</th><th></th>
            </tr>
          </thead>
          <tbody>
            {invitations.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune invitation pour l'instant.</td></tr>
            )}
            {invitations.map((inv) => (
              <tr key={inv.id}>
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
