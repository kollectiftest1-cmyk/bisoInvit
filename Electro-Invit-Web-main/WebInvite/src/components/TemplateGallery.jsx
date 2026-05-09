import TemplateRenderer from './TemplateRenderer';

const SAMPLE_EVENT = {
  bride_name: 'Grace',
  groom_name: 'Davina',
  title: 'Mariage',
  venue_name: 'Salle Victoria',
  venue_reference: 'Avenue de la Paix',
  dates: [{ date: '2026-06-14', start_time: '19:00' }],
};

export default function TemplateGallery({ value, onChange, templates, accent }) {
  return (
    <div className="grid grid-4 template-gallery">
      {templates.map((t) => (
        <button
          type="button"
          key={t.id}
          className={`template-card ${value === t.id ? 'selected' : ''}`}
          onClick={() => onChange(t.id)}
        >
          <div className="template-card-thumb">
            <TemplateRenderer template={t.id} event={SAMPLE_EVENT} preview accentOverride={accent} />
          </div>
          <div className="template-card-meta">
            <div className="name">{t.name}</div>
            <div className="desc">{t.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
