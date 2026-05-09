import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <header className="navbar">
        <Link to="/" className="brand">BisoInvit<small>électronique</small></Link>
        <nav className="nav-links">
          <NavLink to="/" end>Accueil</NavLink>
          {user && <NavLink to="/admin">Tableau de bord</NavLink>}
          {user && <NavLink to="/admin/bulk">Génération masse</NavLink>}
          {user && <NavLink to="/admin/controllers">Contrôleurs</NavLink>}
          {user ? (
            <>
              <span className="badge badge-muted">{user.username}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/'); }}>Déconnexion</button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary btn-sm">Connexion</NavLink>
          )}
        </nav>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>
        © {new Date().getFullYear()} BisoInvit · Système d'invitations électroniques
      </footer>
    </div>
  );
}
