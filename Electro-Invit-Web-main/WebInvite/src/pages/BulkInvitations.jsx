import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const SAMPLE_CSV = `statut,full_name,phone,table_number,seats
Couple,Jordache Nzita,+243990000000,Table 1,2
Mr,Jean Dupont,,Table 3,1
Mme,Marie Test,,Afrique du Sud,1
Famille,Famille Kabongo,,VIP,4
`;

export default function BulkInvitations() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState('pdf');
  const [format, setFormat] = useState('portrait');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Modal de progression
  const [progress, setProgress] = useState(0);     // 0..100
  const [phase, setPhase] = useState('');          // upload | generation | download | done | error
  const [phaseLabel, setPhaseLabel] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const xhrRef = useRef(null);
  const genTimerRef = useRef(null);

  useEffect(() => {
    api.listEvents().then((rows) => {
      setEvents(rows);
      if (rows.length && !eventId) setEventId(rows[0].id);
    }).catch((e) => setError(e.message));
  }, []);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'modele-invitations.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const countRows = async (f) => {
    try {
      const text = await f.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      return Math.max(0, lines.length - 1);
    } catch { return 0; }
  };

  const closeModal = () => {
    if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
    setBusy(false);
    setProgress(0);
    setPhase('');
    setPhaseLabel('');
  };

  const cancel = () => {
    if (xhrRef.current) { try { xhrRef.current.abort(); } catch {/*noop*/} }
    closeModal();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!file) return setError('Sélectionnez un fichier CSV');
    if (!eventId) return setError('Choisissez un événement');

    const total = await countRows(file);
    setRowCount(total);
    setBusy(true);
    setProgress(0);
    setPhase('upload');
    setPhaseLabel('Envoi du fichier CSV…');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('event_id', eventId);
    fd.append('kind', kind);
    fd.append('format', format);

    const token = localStorage.getItem('biso_token');
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', `${api.url}/api/invitations/bulk`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.responseType = 'blob';

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const p = Math.round((ev.loaded / ev.total) * 15); // upload = 0..15%
        setProgress(p);
      }
    };

    xhr.upload.onload = () => {
      setPhase('generation');
      setProgress(15);
      // Estimation: ~1.2s par invitation (PDF puppeteer). Progresse de 15 → 90%.
      const perRowMs = kind === 'pdf' ? 1400 : 900;
      const estimatedMs = Math.max(3000, total * perRowMs);
      const startedAt = Date.now();
      genTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        const ratio = Math.min(1, elapsed / estimatedMs);
        const pct = 15 + Math.round(ratio * 75); // jusqu'à 90
        const done = Math.min(total, Math.round(ratio * total));
        setProgress(pct);
        setPhaseLabel(`Génération des invitations… (${done}/${total})`);
      }, 250);
    };

    xhr.onprogress = (ev) => {
      if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
      setPhase('download');
      if (ev.lengthComputable) {
        const p = 90 + Math.round((ev.loaded / ev.total) * 10);
        setProgress(p);
        const mb = (ev.loaded / 1024 / 1024).toFixed(2);
        setPhaseLabel(`Téléchargement du ZIP… (${mb} Mo)`);
      } else {
        setPhaseLabel('Téléchargement du ZIP…');
      }
    };

    xhr.onerror = () => {
      closeModal();
      setError('Erreur réseau pendant la génération.');
    };

    xhr.onabort = () => {
      setError('Génération annulée.');
    };

    xhr.onload = () => {
      if (genTimerRef.current) { clearInterval(genTimerRef.current); genTimerRef.current = null; }
      if (xhr.status < 200 || xhr.status >= 300) {
        const reader = new FileReader();
        reader.onload = () => {
          let msg = `HTTP ${xhr.status}`;
          try { msg = JSON.parse(reader.result).error || msg; } catch {/*noop*/}
          setError(msg);
          closeModal();
        };
        reader.readAsText(xhr.response);
        return;
      }
      setProgress(100);
      setPhase('done');
      setPhaseLabel('Terminé. Téléchargement du fichier…');

      const blob = xhr.response;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const ev = events.find((x) => x.id === eventId);
      const safe = `${ev?.bride_name || 'event'}-${ev?.groom_name || ''}`.replace(/[^a-zA-Z0-9-]+/g, '-');
      a.download = `invitations-${safe}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setInfo(`ZIP téléchargé (${total} invitation${total > 1 ? 's' : ''}). Visibles dans la fiche événement.`);
      setTimeout(() => closeModal(), 1200);
    };

    xhr.send(fd);
  };

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1>Génération en masse</h1>
      <p className="form-hint">
        Importez un fichier CSV avec une ligne par invité. Le serveur crée les invitations
        et renvoie un ZIP contenant tous les fichiers ({kind.toUpperCase()}) + un index CSV.
      </p>

      <form onSubmit={submit} className="card stack">
        <div className="form-group">
          <label className="form-label">Événement</label>
          <select className="form-control" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
            <option value="">— Choisir —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.bride_name} & {ev.groom_name} — {ev.title}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Fichier CSV</label>
          <input type="file" accept=".csv,text/csv" className="form-control" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          <div className="form-hint" style={{ marginTop: 6 }}>
            Colonnes obligatoires : <code>statut</code>, <code>full_name</code>.
            Optionnelles : <code>phone</code>, <code>table_number</code> (emplacement libre, ex. « Table 1 » ou « Afrique du Sud »), <code>seats</code>.
            <br/>Statuts acceptés : Mr, Mme, Mlle, Couple, Famille.
            <br/>
            <button type="button" className="btn btn-sm btn-ghost" onClick={downloadSample}>Télécharger un modèle</button>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Format de sortie</label>
            <select className="form-control" value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="pdf">PDF (imprimable)</option>
              <option value="jpg">JPEG haute qualité</option>
              <option value="png">PNG sans perte</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Orientation</label>
            <select className="form-control" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="portrait">Portrait (5×7")</option>
              <option value="landscape">Paysage (7×5")</option>
            </select>
          </div>
        </div>

        {error && <div className="card" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>{error}</div>}
        {info && <div className="card" style={{ borderColor: 'var(--success, #2a8b4f)', color: 'var(--success, #2a8b4f)' }}>{info}</div>}

        <div className="cluster" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? '⏳ Génération en cours…' : '📦 Générer le ZIP'}
          </button>
        </div>
      </form>

      {busy && (
        <div className="bulk-modal-backdrop">
          <div className="bulk-modal">
            <div className="bulk-modal-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h3 className="bulk-modal-title">Génération des invitations</h3>
            <p className="bulk-modal-sub">{phaseLabel}</p>

            <div className="bulk-progress">
              <div className="bulk-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="bulk-progress-meta">
              <span>{progress}%</span>
              <span>
                {phase === 'upload' && 'Étape 1/3 · Envoi'}
                {phase === 'generation' && 'Étape 2/3 · Rendu'}
                {phase === 'download' && 'Étape 3/3 · Téléchargement'}
                {phase === 'done' && 'Terminé'}
              </span>
            </div>

            <div className="bulk-modal-stats">
              <div><span className="lbl">Invitations</span><span className="val">{rowCount}</span></div>
              <div><span className="lbl">Format</span><span className="val">{kind.toUpperCase()}</span></div>
              <div><span className="lbl">Orientation</span><span className="val">{format === 'portrait' ? 'Portrait' : 'Paysage'}</span></div>
            </div>

            <button type="button" className="bulk-modal-cancel" onClick={cancel} disabled={phase === 'done'}>
              {phase === 'done' ? 'Fermeture…' : 'Annuler'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

