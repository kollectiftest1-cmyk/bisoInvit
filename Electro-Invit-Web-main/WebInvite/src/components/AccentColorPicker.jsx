import { useEffect, useRef, useState } from 'react';

/** Quantification rapide — récupère les couleurs dominantes d'une image */
function extractDominantColors(img, maxColors = 5) {
  const canvas = document.createElement('canvas');
  const W = 80, H = Math.round((img.naturalHeight / img.naturalWidth) * 80) || 80;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 200) continue;
    let r = data[i], g = data[i + 1], b = data[i + 2];
    // Skip near-grayscale & near-black/white
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    if (max - min < 12) continue;          // grey
    if (max < 30 || min > 235) continue;   // too dark / too bright
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const ent = buckets.get(key) || { r: 0, g: 0, b: 0, n: 0 };
    ent.r += r; ent.g += g; ent.b += b; ent.n += 1;
    buckets.set(key, ent);
  }
  const palette = Array.from(buckets.values())
    .map((e) => ({
      hex: '#' + [e.r / e.n, e.g / e.n, e.b / e.n]
        .map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''),
      n: e.n,
    }))
    .sort((a, b) => b.n - a.n)
    .slice(0, maxColors)
    .map((p) => p.hex);
  return palette;
}

const PRESETS = [
  '#d4af37', '#c9a14a', '#b8860b', '#9a9a9a',
  '#c2185b', '#d4748b', '#7c9a6e', '#0e1535',
  '#7f1d1d', '#1e3a5f', '#4a2530', '#0a4d3a',
];

/**
 * Color picker avec :
 *  - 12 presets
 *  - input <color>
 *  - bouton « Extraire de la photo » (depuis File ou URL)
 */
export default function AccentColorPicker({ value, onChange, photoFile, photoUrl }) {
  const [extracted, setExtracted] = useState([]);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef();

  // Auto-extract when photo changes
  useEffect(() => {
    if (!photoFile && !photoUrl) { setExtracted([]); return; }
    const src = photoFile ? URL.createObjectURL(photoFile) : photoUrl;
    setLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const palette = extractDominantColors(img, 6);
        setExtracted(palette);
      } catch (e) {
        console.warn('extract failed', e);
      }
      setLoading(false);
      if (photoFile) URL.revokeObjectURL(src);
    };
    img.onerror = () => { setLoading(false); };
    img.src = src;
    imgRef.current = img;
  }, [photoFile, photoUrl]);

  return (
    <div className="color-picker">
      <div className="color-picker-row">
        <label className="color-input">
          <input
            type="color"
            value={value || '#c9a14a'}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="color-swatch" style={{ background: value || 'transparent' }} />
          <span className="color-hex">{value || 'auto'}</span>
        </label>
        {value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
            Réinitialiser
          </button>
        )}
      </div>

      <div className="color-preset-label">Presets</div>
      <div className="color-presets">
        {PRESETS.map((c) => (
          <button
            type="button"
            key={c}
            title={c}
            className={`color-chip ${value === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>

      {(extracted.length > 0 || loading) && (
        <>
          <div className="color-preset-label">
            🎨 Extrait de la photo
            {loading && <span style={{ marginLeft: 8, opacity: 0.6 }}>analyse…</span>}
          </div>
          <div className="color-presets">
            {extracted.map((c) => (
              <button
                type="button"
                key={c}
                title={c}
                className={`color-chip ${value === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
