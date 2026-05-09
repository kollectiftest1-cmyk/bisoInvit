import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function AdminsPage() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const empty = { username: '', password: '', role: 'admin' };

  const load = () => {
    api.listAdmins().then(setList).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  const startNew = () => setEditing({ ...empty });
  const startEdit = (a) => setEditing({ id: a.id, username: a.username, role: a.role, password: '' });
  const cancel = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing.id) {
        const body = { role: editing.role };
        if (editing.password) body.password = editing.password;
        await api.updateAdmin(editing.id, body);
      } else {
        await api.createAdmin({
          username: editing.username,
          password: editing.password,
          role: editing.role,
        });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer ce compte admin ?')) return;
    try {
      await api.deleteAdmin(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== 'super_admin') {
    return <div className="container"><div className="card">Réservé au super admin.</div></div>;
  }

  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="row-between" style={{ alignItems: 'baseline' }}>
        <h1>Administrateurs</h1>
        {!editing && <button className="btn btn-primary" onClick={startNew}>+ Nouvel admin</button>}
      </div>
      <p className="form-hint">
        Créez des comptes <strong>admin</strong> (organisateurs d'évènements) ou <strong>super admin</strong> (gestion globale).
        Chaque admin ne voit que ses propres évènements et contrôleurs.
      </p>

      {error && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}

      {editing && (
        <form onSubmit={save} className="card stack">
          <h3>{editing.id ? 'Modifier l\'admin' : 'Nouvel admin'}</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur</label>
              <input className="form-control" value={editing.username}
                disabled={!!editing.id}
                onChange={(e) => setEditing({ ...editing, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Rôle</label>
              <select className="form-control" value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
                <option value="admin">admin (organisateur)</option>
                <option value="super_admin">super_admin (gestion globale)</option>
              </select>
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
          <div className="cluster" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={cancel}>Annuler</button>
            <button className="btn btn-primary">{editing.id ? 'Enregistrer' : 'Créer'}</button>
          </div>
        </form>
      )}

      <div className="card">
        {list.length === 0 ? (
          <div className="form-hint">Aucun admin enregistré.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Nom d'utilisateur</th><th>Rôle</th><th>Créé le</th><th></th></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td><code>{a.username}</code> {a.id === user.id && <span className="badge">vous</span>}</td>
                  <td>
                    <span className={`badge ${a.role === 'super_admin' ? 'badge-primary' : ''}`}>
                      {a.role}
                    </span>
                  </td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => startEdit(a)}>Modifier</button>
                    {a.id !== user.id && (
                      <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => remove(a.id)}>×</button>
                    )}
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
