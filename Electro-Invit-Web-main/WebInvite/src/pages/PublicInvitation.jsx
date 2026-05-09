import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import TemplateRenderer from '../components/TemplateRenderer';

export default function PublicInvitation() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const printMode = params.get('print') === '1';
  const format = params.get('format') === 'landscape' ? 'landscape' : 'portrait';

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.getInvitationByCode(code)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [code]);

  useEffect(() => {
    if (!printMode) return;
    document.documentElement.classList.add('print-mode');
    document.body.classList.add('print-mode');
    return () => {
      document.documentElement.classList.remove('print-mode');
      document.body.classList.remove('print-mode');
    };
  }, [printMode]);

  const downloadFromBackend = async (kind) => {
    setBusy(kind);
    try {
      const url = `${api.url}/api/invitations/code/${encodeURIComponent(code)}/export.${kind}?format=${format}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = kind === 'jpg' ? 'jpg' : kind;
      const safe = (data?.invitation?.full_name || 'invitation')
        .replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `invitation-${safe}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch (e) {
      alert('Échec téléchargement: ' + e.message);
    } finally {
      setBusy('');
    }
  };

  const share = async () => {
    const url = window.location.href.replace(/[?&]print=1/, '');
    if (navigator.share) {
      try { await navigator.share({ title: 'Votre invitation', url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    alert('Lien copié !');
  };

  if (error) return <div className="container"><div className="card">{error}</div></div>;
  if (!data) return <div className="center"><div className="spinner" /></div>;

  return (
    <div
      className={`container public-invitation ${printMode ? 'is-print' : ''}`}
      style={{ maxWidth: 600 }}
      data-format={format}
    >
      <TemplateRenderer
        template={data.invitation.template_id || data.event.template_id}
        event={data.event}
        invitation={data.invitation}
        qrPayload={data.qr_payload}
      />
      {!printMode && (
        <div className="cluster public-actions" style={{ justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={!!busy} onClick={() => downloadFromBackend('jpg')}>
            {busy === 'jpg' ? '⏳ Génération…' : '🖼️ JPEG haute qualité'}
          </button>
          <button className="btn btn-ghost" disabled={!!busy} onClick={() => downloadFromBackend('pdf')}>
            {busy === 'pdf' ? '⏳ Génération…' : '📄 PDF imprimable'}
          </button>
          <button className="btn btn-ghost" disabled={!!busy} onClick={() => downloadFromBackend('png')}>
            {busy === 'png' ? '⏳ Génération…' : '🎨 PNG sans perte'}
          </button>
          <button className="btn btn-ghost" onClick={share}>🔗 Partager</button>
        </div>
      )}
    </div>
  );
}
