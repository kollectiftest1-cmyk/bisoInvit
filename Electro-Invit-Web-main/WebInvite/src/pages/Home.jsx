import { Link } from 'react-router-dom';
import { useTemplates } from '../lib/useTemplates';
import TemplateRenderer from '../components/TemplateRenderer';

const SAMPLE = {
  bride_name: 'Sophia',
  groom_name: 'Lucas',
  title: 'Mariage',
  venue_name: 'Domaine de Villeneuve',
  venue_reference: 'Boulevard des Roses',
  dates: [{ date: '2026-08-18', start_time: '19:00' }],
};

export default function Home() {
  const templates = useTemplates();
  return (
    <>
      <section className="hero">
        <h1>Invitations électroniques d'exception</h1>
        <p className="lead">
          Créez, personnalisez et distribuez vos invitations de mariage avec QR codes
          sécurisés. 4 templates raffinés, gestion multi-dates et scan en temps réel.
        </p>
        <div className="cluster" style={{ justifyContent: 'center' }}>
          <Link to="/admin" className="btn btn-primary">Commencer</Link>
          <a href="#templates" className="btn btn-ghost">Voir les templates</a>
        </div>
      </section>

      <section id="templates" className="container">
        <div className="row-between" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2>4 designs raffinés</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Choisissez le style qui reflète votre histoire d'amour.
            </p>
          </div>
        </div>
        <div className="grid grid-4 template-gallery">
          {templates.map((t) => (
            <div key={t.id} className="template-card template-card-display">
              <div className="template-card-thumb">
                <TemplateRenderer template={t.id} event={SAMPLE} preview />
              </div>
              <div className="template-card-meta-bottom">
                <h3 style={{ margin: 0 }}>{t.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', margin: '.2rem 0 0' }}>{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="grid grid-3">
          <div className="card">
            <h3>🎨 Personnalisation</h3>
            <p style={{ color: 'var(--text-muted)' }}>Photo des mariés, dates multiples, programme détaillé, dress code et plus encore.</p>
          </div>
          <div className="card">
            <h3>🔒 QR sécurisés</h3>
            <p style={{ color: 'var(--text-muted)' }}>Chaque invitation est signée HMAC-SHA256, impossible à falsifier.</p>
          </div>
          <div className="card">
            <h3>📱 Scan temps réel</h3>
            <p style={{ color: 'var(--text-muted)' }}>L'app mobile vérifie en ligne et synchronise tous les portiers.</p>
          </div>
        </div>
      </section>
    </>
  );
}
