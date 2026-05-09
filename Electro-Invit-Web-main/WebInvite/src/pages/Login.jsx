import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(user, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <div className="card" style={{ marginTop: '3rem' }}>
        <h2>Connexion administrateur</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', margin: '0 0 1.5rem' }}>
          Démo : admin / admin123
        </p>
        <form onSubmit={onSubmit} className="stack">
          <div className="form-group">
            <label className="form-label">Identifiant</label>
            <input className="form-control" value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="field-error">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
