import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function ControllersPage() {
  const [list, setList] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  // form
  const [editing, setEditing] = useState(null); // null | { id?, username, name, password, event_ids }
  const empty = { username: '', name: '', password: '', event_ids: [] };

  const load = () => {
    api.listControllers().then(setList).catch((e) => setError(e.message));
    api.listEvents().then(setEvents).catch(() => {/*noop*/});
  };
  useEffect(load, []);

  const startNew = () => setEditing({ ...empty });
  const startEdit = (c) => setEditing({
    id: c.id, username: c.username, name: c.name || '', password: '',
    event_ids: c.events.map((e) => e.id),
  });
  const cancel = () => setEditing(null);

  const toggleEvent = (eid) => {
    setEditing((prev) => ({
      ...prev,
      event_ids: prev.event_ids.includes(eid)
        ? prev.event_ids.filter((x) => x !== eid)
        : [...prev.event_ids, eid],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing.id) {
        const body = { name: editing.name, event_ids: editing.event_ids };
        if (editing.password) body.password = editing.password;
        await api.updateController(editing.id, body);
      } else {
        await api.createController({
          username: editing.username,
          password: editing.password,
          name: editing.name,
          event_ids: editing.event_ids,
        });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce contrôleur ?')) return;
    await api.deleteController(id);
    load();
  };

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <h1>Contrôleurs (agents de scan)</h1>
        {!editing && <button className="btn btn-primary" onClick={startNew}>+ Nouveau contrôleur</button>}
      </div>
      <p className="form-hint">
        Créez des comptes utilisés sur l'application mobile pour scanner les QR codes.
        Chaque contrôleur ne peut scanner que les événements qui lui ont été affectés.
      </p>

      {error && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}

      {editing && (
        <form onSubmit={save} className="card stack">
          <h3>{editing.id ? 'Modifier le contrôleur' : 'Nouveau contrôleur'}</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur</label>
              <input className="form-control" value={editing.username}
                disabled={!!editing.id}
                onChange={(e) => setEditing({ ...editing, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="form-control" value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              {editing.id ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
            </label>
            <input type="password" className="form-control" value={editing.password}
              onChange={(e) => setEditing({ ...editing, password: e.target.value })}
              required={!editing.id} minLength={4} />
          </div>
          <div className="form-group">
            <label className="form-label">Événements affectés</label>
            <div className="cluster" style={{ flexWrap: 'wrap', gap: 8 }}>
              {events.length === 0 && <span className="form-hint">Aucun événement disponible.</span>}
              {events.map((ev) => (
                <label key={ev.id} className={`chip ${editing.event_ids.includes(ev.id) ? 'chip-active' : ''}`}>
                  <input type="checkbox"
                    style={{ display: 'none' }}
                    checked={editing.event_ids.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)} />
                  {ev.bride_name} & {ev.groom_name}
                </label>
              ))}
            </div>
          </div>
          <div className="cluster" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={cancel}>Annuler</button>
            <button className="btn btn-primary">{editing.id ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      )}

      <div className="card">
        {list.length === 0 ? (
          <div className="form-hint">Aucun contrôleur enregistré.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Nom d'utilisateur</th><th>Nom</th><th>Événements</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td><code>{c.username}</code></td>
                  <td>{c.name || <span style={{ opacity: 0.5 }}>—</span>}</td>
                  <td>
                    {c.events.length === 0
                      ? <span style={{ opacity: 0.5 }}>aucun</span>
                      : c.events.map((e) => `${e.bride_name} & ${e.groom_name}`).join(', ')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => startEdit(c)}>Modifier</button>
                    <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(c.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
