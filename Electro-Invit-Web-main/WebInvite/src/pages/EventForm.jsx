import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, fileUrl } from '../lib/api';
import { useTemplates } from '../lib/useTemplates';
import TemplateGallery from '../components/TemplateGallery';
import AccentColorPicker from '../components/AccentColorPicker';

const empty = {
  title: 'Mariage',
  bride_name: '',
  groom_name: '',
  venue_name: '',
  venue_address: '',
  venue_reference: '',
  dates: [{ date: '', start_time: '19:00', end_time: '', label: 'Cérémonie' }],
  dress_code: '',
  description: '',
  contact_phone: '',
  contact_email: '',
  rsvp_deadline: '',
  template_id: 'heart',
  accent_color: '',
  program: [],
};

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const templates = useTemplates();

  const [form, setForm] = useState(empty);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getEvent(id).then((e) => {
      setForm({
        ...empty, ...e,
        dates: e.dates?.length ? e.dates : empty.dates,
        program: e.program || [],
      });
      if (e.couple_photo) setPhotoPreview(fileUrl(e.couple_photo));
    }).catch((err) => setError(err.message));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setDate = (i, k, v) =>
    setForm((f) => ({ ...f, dates: f.dates.map((d, j) => (j === i ? { ...d, [k]: v } : d)) }));

  const addDate = () => set('dates', [...form.dates, { date: '', start_time: '', end_time: '', label: '' }]);
  const removeDate = (i) => set('dates', form.dates.filter((_, j) => j !== i));

  const setProgram = (i, k, v) =>
    set('program', form.program.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  const addProgram = () => set('program', [...form.program, { time: '', title: '' }]);
  const removeProgram = (i) => set('program', form.program.filter((_, j) => j !== i));

  const onPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'dates' || k === 'program') fd.append(k, JSON.stringify(v));
        else fd.append(k, v ?? '');
      });
      if (photoFile) fd.append('couple_photo', photoFile);
      const saved = id ? await api.updateEvent(id, fd) : await api.createEvent(fd);
      navigate(`/admin/events/${saved.id}`);
    } catch (err) {
      setError(err.message + (err.details ? ' — ' + JSON.stringify(err.details.fieldErrors) : ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 920 }}>
      <h1>{id ? 'Modifier l\'événement' : 'Nouvel événement'}</h1>

      <form onSubmit={submit} className="stack">
        <div className="card stack">
          <h3>Informations principales</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Titre</label>
              <input className="form-control" value={form.title} onChange={(e) => set('title', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Photo des mariés</label>
              <label className="photo-uploader">
                {photoPreview ? <img src={photoPreview} alt="" /> : <span className="photo-uploader-placeholder">Cliquer pour ajouter une photo</span>}
                <input type="file" accept="image/*" onChange={onPhoto} />
              </label>
            </div>
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Mariée</label>
              <input className="form-control" value={form.bride_name} onChange={(e) => set('bride_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Marié</label>
              <input className="form-control" value={form.groom_name} onChange={(e) => set('groom_name', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description / mot d'accueil</label>
            <textarea className="form-control" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <div className="card stack">
          <h3>Lieu</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Nom du lieu</label>
              <input className="form-control" value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Référence (rond-point, repère)</label>
              <input className="form-control" value={form.venue_reference} onChange={(e) => set('venue_reference', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Adresse complète</label>
            <input className="form-control" value={form.venue_address} onChange={(e) => set('venue_address', e.target.value)} />
          </div>
        </div>

        <div className="card stack">
          <div className="row-between">
            <h3 style={{ margin: 0 }}>Dates de l'événement</h3>
            <button type="button" className="btn btn-sm btn-ghost" onClick={addDate}>+ Ajouter une date</button>
          </div>
          <p className="form-hint" style={{ margin: 0 }}>Idéal pour mariages sur plusieurs jours (ex : civil le lundi, religieux le mardi).</p>
          {form.dates.map((d, i) => (
            <div key={i} className="date-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={d.date} onChange={(e) => setDate(i, 'date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Début</label>
                <input type="time" className="form-control" value={d.start_time} onChange={(e) => setDate(i, 'start_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fin</label>
                <input type="time" className="form-control" value={d.end_time} onChange={(e) => setDate(i, 'end_time', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Libellé</label>
                <input className="form-control" placeholder="Cérémonie, Réception…" value={d.label} onChange={(e) => setDate(i, 'label', e.target.value)} />
              </div>
              {form.dates.length > 1 && (
                <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeDate(i)}>×</button>
              )}
            </div>
          ))}
        </div>

        <div className="card stack">
          <h3>Détails</h3>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Dress code</label>
              <input className="form-control" value={form.dress_code} onChange={(e) => set('dress_code', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">RSVP avant le</label>
              <input type="date" className="form-control" value={form.rsvp_deadline} onChange={(e) => set('rsvp_deadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Téléphone contact</label>
              <input className="form-control" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email contact</label>
              <input type="email" className="form-control" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card stack">
          <div className="row-between">
            <h3 style={{ margin: 0 }}>Programme (facultatif)</h3>
            <button type="button" className="btn btn-sm btn-ghost" onClick={addProgram}>+ Ajouter</button>
          </div>
          {form.program.map((p, i) => (
            <div key={i} className="cluster">
              <input className="form-control" style={{ maxWidth: 110 }} placeholder="18:00" value={p.time} onChange={(e) => setProgram(i, 'time', e.target.value)} />
              <input className="form-control" style={{ flex: 1 }} placeholder="Titre" value={p.title} onChange={(e) => setProgram(i, 'title', e.target.value)} />
              <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeProgram(i)}>×</button>
            </div>
          ))}
        </div>

        <div className="card stack">
          <h3>Template par défaut</h3>
          <p className="form-hint" style={{ margin: 0 }}>Style appliqué à toutes les invitations de cet événement (modifiable individuellement).</p>
          {templates.length > 0 && (
            <TemplateGallery value={form.template_id} onChange={(v) => set('template_id', v)} templates={templates} accent={form.accent_color} />
          )}
        </div>

        <div className="card stack">
          <h3>Couleur d'accent</h3>
          <p className="form-hint" style={{ margin: 0 }}>
            Choisissez une teinte qui s'appliquera au template (script, divider, ornements). Vous pouvez aussi extraire les teintes dominantes de votre photo.
          </p>
          <AccentColorPicker
            value={form.accent_color}
            onChange={(v) => set('accent_color', v)}
            photoFile={photoFile}
            photoUrl={!photoFile && form.couple_photo ? fileUrl(form.couple_photo) : null}
          />
        </div>

        {error && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}

        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Annuler</button>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'Enregistrement…' : id ? 'Mettre à jour' : 'Créer l\'événement'}
          </button>
        </div>
      </form>
    </div>
  );
}
