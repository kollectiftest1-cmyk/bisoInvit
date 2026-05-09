import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../lib/api';

export default function AdminDashboard() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.listEvents().then(setEvents).catch((e) => setError(e.message));
  };

  useEffect(load, []);

  const onDelete = async (id) => {
    if (!confirm('Supprimer cet événement et toutes ses invitations ?')) return;
    await api.deleteEvent(id);
    load();
  };

  return (
    <div className="container">
      <div className="row-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Vos événements</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Gérez vos mariages, leurs invités et le scan.</p>
        </div>
        <Link to="/admin/events/new" className="btn btn-primary">+ Nouvel événement</Link>
      </div>

      {error && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}

      {events === null ? (
        <div className="center"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="empty-state card">
          <p>Aucun événement pour l'instant.</p>
          <Link to="/admin/events/new" className="btn btn-primary">Créer le premier</Link>
        </div>
      ) : (
        <div className="grid grid-2">
          {events.map((e) => (
            <div key={e.id} className="card card-hover">
              <div style={{ display: 'flex', gap: '1rem' }}>
                {e.couple_photo && (
                  <img src={fileUrl(e.couple_photo)} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0 }}>{e.bride_name} & {e.groom_name}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>{e.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginTop: '.4rem' }}>
                    📍 {e.venue_name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>
                    📅 {(e.dates || []).map((d) => d.date).join(' · ')}
                  </div>
                </div>
              </div>
              <div className="cluster" style={{ marginTop: '1rem' }}>
                <Link to={`/admin/events/${e.id}`} className="btn btn-sm btn-primary">Ouvrir</Link>
                <Link to={`/admin/events/${e.id}/edit`} className="btn btn-sm btn-ghost">Modifier</Link>
                <button onClick={() => onDelete(e.id)} className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
