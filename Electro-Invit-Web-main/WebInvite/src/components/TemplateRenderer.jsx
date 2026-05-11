import QRCode from 'qrcode.react';
import { fileUrl } from '../lib/api';
import {
  SilverLaceOrnament, RoyalOrnament, FloralOrnament, ModernOrnament,
  HeartFrameOrnament, DamaskOrnament,
} from './Ornaments';
import '../styles/templates.css';

const TPL = {
  heart:   { cls: 'tpl-heart',   layout: 'side',  Ornament: HeartFrameOrnament },
  damask:  { cls: 'tpl-damask',  layout: 'photo-top', Ornament: DamaskOrnament },
  elegant: { cls: 'tpl-silver',  layout: 'classic', Ornament: SilverLaceOrnament },
  royal:   { cls: 'tpl-royal',   layout: 'classic', Ornament: RoyalOrnament },
  floral:  { cls: 'tpl-floral',  layout: 'classic', Ornament: FloralOrnament },
  modern:  { cls: 'tpl-modern',  layout: 'classic', Ornament: ModernOrnament },
};

const MONTHS_FR = ['JANV','FÉVR','MARS','AVRIL','MAI','JUIN','JUIL','AOÛT','SEPT','OCT','NOV','DÉC'];

function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
function fmtDateLong(d) {
  const dt = parseDate(d);
  if (!dt) return d || '';
  return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDateShort(d) {
  const dt = parseDate(d);
  if (!dt) return '';
  return `${MONTHS_FR[dt.getMonth()]} | ${String(dt.getDate()).padStart(2,'0')} | ${dt.getFullYear()}`;
}
function fmtDayMonthYear(d) {
  const dt = parseDate(d);
  if (!dt) return ['', '', ''];
  return [String(dt.getDate()).padStart(2,'0'), String(dt.getMonth()+1).padStart(2,'0'), String(dt.getFullYear())];
}

/** Salutation personnalisée : Hey, {statut} {nom}, vous êtes invité(e/s) ... */
function renderGreeting(invitation) {
  if (!invitation) return null;
  const statut = invitation.statut;
  const isFemale = statut === 'Mme' || statut === 'Mlle';
  const isMulti = statut === 'Couple' || statut === 'Famille';
  const verb = isMulti ? 'êtes cordialement invités' : `êtes cordialement invité${isFemale ? 'e' : ''}`;
  const label = statut === 'Couple' ? 'Couple'
              : statut === 'Famille' ? 'Famille'
              : statut === 'Mr' ? 'Monsieur'
              : statut === 'Mme' ? 'Madame'
              : statut === 'Mlle' ? 'Mademoiselle'
              : statut;
  return { hi: 'Hey,', label, name: invitation.full_name, verb };
}

export default function TemplateRenderer({
  template = 'heart',
  event,
  invitation,
  qrPayload,
  captureRef,
  preview = false,
  accentOverride,
}) {
  const t = TPL[template] || TPL.heart;
  const Ornament = t.Ornament;
  const photo = fileUrl(event?.couple_photo);
  const dates = event?.dates || [];
  const qrValue = qrPayload ? JSON.stringify(qrPayload) : '';
  const firstDate = dates[0]?.date;
  const isPlural = dates.length > 1;
  const greeting = renderGreeting(invitation);
  const accent = accentOverride || event?.accent_color;

  const styleVars = accent ? { '--accent-override': accent } : undefined;

  // -------- LAYOUT : "side" (heart) – photo à droite, texte à gauche --------
  if (t.layout === 'side') {
    const [dd, mm, yyyy] = fmtDayMonthYear(firstDate);
    return (
      <div ref={captureRef} className={`invitation-card ${t.cls} ${preview ? 'is-preview' : ''}`} style={styleVars}>
        <div className="ic-paper ic-side">
          <div className="ic-side-text">
            {!preview && greeting ? (
              <div className="ic-greeting ic-greeting-top">
                <strong>{greeting.hi}</strong> {greeting.label}{' '}
                <span className="ic-greet-name">{greeting.name}</span>, vous {greeting.verb} au mariage de :
              </div>
            ) : (
              <div className="ic-overline-single">VOUS ÊTES INVITÉ AU MARIAGE DE</div>
            )}
            <h1 className="ic-couple ic-couple-script">
              {event?.bride_name || 'Bride'}
              <span className="ic-amp-heart">
                <svg viewBox="0 0 40 40" width="34" height="34"><path d="M20 34 c -10 -8, -18 -14, -18 -22 c 0 -8, 12 -10, 18 -2 c 6 -8, 18 -6, 18 2 c 0 8, -8 14, -18 22 z" fill="currentColor"/></svg>
                <em>&amp;</em>
              </span>
              {event?.groom_name || 'Groom'}
            </h1>
            <div className="ic-side-subtitle">WEDDING</div>
            {firstDate && (
              <div className="ic-side-date">
                {parseDate(firstDate)?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {dates[0]?.start_time && (
              <div className="ic-side-time">
                <span className="hh">♥</span> {dates[0].start_time} <span className="hh">♥</span>
              </div>
            )}
          </div>

          <div className="ic-heart-zone">
            <Ornament accent={accent || '#d4af37'} />
            <div className="ic-heart-clip">
              {photo ? (
                <img src={photo} alt="" crossOrigin="anonymous" />
              ) : (
                <div className="ic-photo-placeholder">Photo des mariés</div>
              )}
            </div>
          </div>

          {!preview && qrValue && (
            <div className="ic-qr ic-qr-centered">
              <QRCode value={qrValue} size={96} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#0e1535" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------- LAYOUT : "photo-top" (damask) – photo plein cadre + ornement bandeau --------
  if (t.layout === 'photo-top') {
    const [dd, mm, yyyy] = fmtDayMonthYear(firstDate);
    return (
      <div ref={captureRef} className={`invitation-card ${t.cls} ${preview ? 'is-preview' : ''}`} style={styleVars}>
        <div className="ic-paper">
          <div className="ic-damask-photo">
            {photo ? (
              <img src={photo} alt="" crossOrigin="anonymous" />
            ) : (
              <div className="ic-photo-placeholder">Photo des mariés</div>
            )}
            <div className="ic-damask-frame" />
            <div className="ic-damask-band"><Ornament color={accent || '#ffffff'} /></div>
          </div>

          <div className="ic-body ic-damask-body">
            {!preview && greeting ? (
              <div className="ic-greeting ic-greeting-top">
                <strong>{greeting.hi}</strong> {greeting.label}{' '}
                <span className="ic-greet-name">{greeting.name}</span>, vous {greeting.verb} au mariage de :
              </div>
            ) : (
              <div className="ic-overline-single">VOUS ÊTES INVITÉ AU MARIAGE DE</div>
            )}
            <h1 className="ic-couple ic-couple-script">
              {event?.bride_name || 'Bride'}<span className="ic-amp-script">&amp;</span>{event?.groom_name || 'Groom'}
            </h1>
            {firstDate && (
              <div className="ic-damask-date">
                <span>{dd}</span><i>|</i><span>{mm}</span><i>|</i><span>{yyyy}</span>
              </div>
            )}
            {dates[0]?.start_time && (
              <div className="ic-damask-detail">{dates[0].start_time} · {event?.venue_name}</div>
            )}
            {!dates[0]?.start_time && event?.venue_name && (
              <div className="ic-damask-detail">{event.venue_name}</div>
            )}
            {event?.venue_reference && <div className="ic-damask-detail">{event.venue_reference}</div>}
          </div>

          {!preview && qrValue && (
            <div className="ic-qr ic-qr-centered">
              <QRCode value={qrValue} size={100} level="M" includeMargin={false} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------- LAYOUT : "classic" (silver / royal / floral / modern) --------
  return (
    <div ref={captureRef} className={`invitation-card ${t.cls} ${preview ? 'is-preview' : ''}`} style={styleVars}>
      <div className="ic-paper">
        <div className="ic-photo-zone">
          <div className="ic-photo-frame">
            {photo ? (
              <img src={photo} alt="" crossOrigin="anonymous" />
            ) : (
              <div className="ic-photo-placeholder">Photo des mariés</div>
            )}
          </div>
          <div className="ic-ornament"><Ornament accent={accent} color={accent} /></div>
        </div>

        <div className="ic-body">
          {!preview && greeting ? (
            <div className="ic-greeting ic-greeting-top">
              <strong>{greeting.hi}</strong> {greeting.label}{' '}
              <span className="ic-greet-name">{greeting.name}</span>, vous {greeting.verb} au mariage de :
            </div>
          ) : (
            <div className="ic-overline">
              <span>Vous êtes invité</span>
              <span>au mariage de</span>
            </div>
          )}

          <h1 className="ic-couple">
            {template === 'royal' ? (
              <>
                {event?.groom_name || 'Marié'}
                <span className="ic-amp"> &amp; </span>
                {event?.bride_name || 'Mariée'}
              </>
            ) : (
              <>
                {event?.bride_name || 'Bride'}
                <span className="ic-amp"> &amp; </span>
                {event?.groom_name || 'Groom'}
              </>
            )}
          </h1>

          <div className="ic-divider"><span /></div>

          {firstDate && (
            <div className="ic-date-strip">
              {fmtDateShort(firstDate)}
              {dates[0]?.start_time && <> &nbsp;·&nbsp; {dates[0].start_time}</>}
            </div>
          )}

          {isPlural && (
            <div className="ic-multi-dates">
              {dates.map((d, i) => (
                <div key={i} className="ic-date-row">
                  <span>{fmtDateLong(d.date)}</span>
                  {d.start_time && <em>{d.start_time}{d.end_time ? ` – ${d.end_time}` : ''}</em>}
                  {d.label && <small>{d.label}</small>}
                </div>
              ))}
            </div>
          )}

          {event?.venue_name && (
            <div className="ic-venue">
              <div className="ic-venue-label">Cérémonie</div>
              <div className="ic-venue-name">{event.venue_name}</div>
              {event.venue_reference && <div className="ic-venue-ref">{event.venue_reference}</div>}
              {event.venue_address && <div className="ic-venue-addr">{event.venue_address}</div>}
            </div>
          )}

          {event?.dress_code && (
            <div className="ic-meta-line"><strong>Dress code</strong> · {event.dress_code}</div>
          )}
        </div>

        {!preview && qrValue && (
          <div className="ic-qr ic-qr-centered">
            <QRCode value={qrValue} size={100} level="M" includeMargin={false} />
          </div>
        )}
      </div>
    </div>
  );
}
