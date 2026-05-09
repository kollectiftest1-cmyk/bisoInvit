import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useTemplates } from '../lib/useTemplates';
import TemplateGallery from '../components/TemplateGallery';

const STATUTS = ['Mr', 'Mme', 'Mlle', 'Couple', 'Famille'];

export default function InvitationForm() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const templates = useTemplates();

  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({
    statut: 'Mr', full_name: '', phone: '', email: '',
    table_number: '', seats: 1, comment: '', template_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEvent(eventId).then((e) => {
      setEvent(e);
      setForm((f) => ({ ...f, template_id: f.template_id || e.template_id || 'elegant' }));
    });
  }, [eventId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const seats = form.statut === 'Couple' ? Math.max(2, Number(form.seats) || 2) : Number(form.seats) || 1;
      const res = await api.createInvitation({ ...form, seats, event_id: eventId });
      navigate(`/i/${res.invitation.code}`);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (!event) return <div className="center"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ maxWidth: 820 }}>
      <h1>Nouvelle invitation</h1>
      <p style={{ color: 'var(--text-muted)' }}>{event.bride_name} & {event.groom_name} · {event.venue_name}</p>

      <form onSubmit={submit} className="stack">
        <div className="card stack">
          <h3>Invité(e)</h3>
          <div className="form-group">
            <label className="form-label">Statut</label>
            <div className="radio-group">
              {STATUTS.map((s) => (
                <label key={s} className={`radio-pill ${form.statut === s ? 'checked' : ''}`}>
                  <input type="radio" name="statut" value={s} checked={form.statut === s} onChange={() => set('statut', s)} hidden />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Nom complet</label>
              <input className="form-control" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone</label>
              <input className="form-control" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Emplacement</label>
              <input className="form-control" placeholder="ex: Table 1 ou Afrique du Sud" value={form.table_number} onChange={(e) => set('table_number', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Places</label>
              <input type="number" min="1" max="20" className="form-control" value={form.seats} onChange={(e) => set('seats', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Commentaire</label>
            <textarea className="form-control" value={form.comment} onChange={(e) => set('comment', e.target.value)} />
          </div>
        </div>

        <div className="card stack">
          <h3>Template</h3>
          {templates.length > 0 && (
            <TemplateGallery value={form.template_id} onChange={(v) => set('template_id', v)} templates={templates} />
          )}
        </div>

        {error && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}

        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Création…' : 'Créer et prévisualiser'}
          </button>
        </div>
      </form>
    </div>
  );
}
