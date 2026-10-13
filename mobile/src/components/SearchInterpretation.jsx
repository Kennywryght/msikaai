// mobile/src/components/SearchInterpretation.jsx
// Shows how the server understood a Chichewa / English / mixed search
// (interpretation comes from GET /listings/search), plus example sentences.
import React from 'react';
import { useTranslation } from '../context/TranslationContext';

const L = {
  en: {
    understood: 'We understood',
    lang: { ny: 'Chichewa', en: 'English', mixed: 'Chichewa + English', unknown: '' },
    under: (n) => `Up to MK${n}`,
    over: (n) => `From MK${n}`,
    between: (a, b) => `MK${a} – MK${b}`,
    cheap: 'Cheapest first',
    delivery: 'Delivery available',
    near: (p) => `Near ${p}`,
    ai: 'AI-assisted',
    nothing: "We couldn't pick out a product or service from that. Try naming the item, e.g. \"chimanga\" or \"plumber\".",
    tryLabel: 'Try a sentence in Chichewa or English:',
  },
  ny: {
    understood: 'Tamva kuti mukufuna',
    lang: { ny: 'Chichewa', en: 'Chingerezi', mixed: 'Chichewa + Chingerezi', unknown: '' },
    under: (n) => `Mpaka MK${n}`,
    over: (n) => `Kuyambira MK${n}`,
    between: (a, b) => `MK${a} – MK${b}`,
    cheap: 'Zotsika mtengo poyamba',
    delivery: 'Akhoza kubweretsa',
    near: (p) => `Pafupi ndi ${p}`,
    ai: 'Mothandizidwa ndi AI',
    nothing: 'Sitinapeze katundu kapena ntchito m\'mawu amenewo. Yesani kutchula chinthucho, mwachitsanzo "chimanga" kapena "plumber".',
    tryLabel: 'Yesani chiganizo mu Chichewa kapena Chingerezi:',
  },
};

export const SEARCH_EXAMPLES = [
  'Ndikufuna chimanga cha mtengo wotsika',
  'I need a plumber pafupi ndi Mitundu',
  'nsapato za akazi pansi pa 5000',
  'Kodi pali wokonza magetsi?',
  'cheap tomatoes with delivery',
  'zovala za ana',
];

const fmt = (n) => Number(n).toLocaleString();
const titleCase = (s) => String(s || '').replace(/\b\p{L}/gu, (c) => c.toUpperCase());

const SearchInterpretation = ({ interpretation }) => {
  const { language } = useTranslation();
  const t = L[language] || L.en;
  if (!interpretation) return null;

  const { concepts = [], minPrice, maxPrice, sort, deliveryOnly, location, aiUsed } = interpretation;
  const chips = [];
  for (const c of concepts) {
    const showFrom = c.matched && c.matched.toLowerCase() !== String(c.label).toLowerCase();
    chips.push({ key: `c-${c.label}`, text: c.label, from: showFrom ? c.matched : null, kind: 'concept' });
  }
  if (minPrice && maxPrice) chips.push({ key: 'p', text: t.between(fmt(minPrice), fmt(maxPrice)), kind: 'filter' });
  else if (maxPrice) chips.push({ key: 'p', text: t.under(fmt(maxPrice)), kind: 'filter' });
  else if (minPrice) chips.push({ key: 'p', text: t.over(fmt(minPrice)), kind: 'filter' });
  if (sort === 'price_asc') chips.push({ key: 's', text: t.cheap, kind: 'filter' });
  if (deliveryOnly) chips.push({ key: 'd', text: t.delivery, kind: 'filter' });
  if (location) chips.push({ key: 'l', text: t.near(titleCase(location)), kind: 'filter' });

  const langLabel = t.lang[interpretation.language] || '';

  return (
    <div className="si" role="status" aria-live="polite">
      {chips.length === 0 ? (
        <p className="si-nothing">{t.nothing}</p>
      ) : (
        <>
          <div className="si-head">
            <span>{t.understood}</span>
            {langLabel && <span className="si-lang">{langLabel}</span>}
            {aiUsed && <span className="si-lang si-ai">{t.ai}</span>}
          </div>
          <div className="si-chips">
            {chips.map((c) => (
              <span key={c.key} className={`si-chip si-${c.kind}`}>
                {c.text}
                {c.from && <span className="si-from"> ← {c.from}</span>}
              </span>
            ))}
          </div>
        </>
      )}
      <style jsx>{`
        .si {
          margin-top: 10px; padding: 10px 12px; border-radius: 12px;
          background: var(--color-info-bg, #EFF6FF); border: 1px solid var(--color-border, #DBEAFE);
          font-size: 13px; color: var(--color-text, #1E293B);
        }
        .si-head { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-weight: 600; margin-bottom: 6px; }
        .si-lang {
          font-size: 11px; font-weight: 600; padding: 1px 8px; border-radius: 999px;
          background: var(--color-surface, #fff); color: var(--color-text-secondary, #475569);
          border: 1px solid var(--color-border, #E2E8F0);
        }
        .si-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .si-chip {
          padding: 4px 10px; border-radius: 999px; font-size: 12.5px; font-weight: 600;
          background: var(--color-surface, #fff); border: 1px solid var(--color-border, #E2E8F0);
        }
        .si-concept { color: var(--color-primary, #1E40AF); text-transform: capitalize; }
        .si-filter { color: var(--color-text-secondary, #475569); }
        .si-from { font-weight: 400; font-style: italic; opacity: 0.8; text-transform: none; }
        .si-nothing { margin: 0; color: var(--color-text-secondary, #475569); }
      `}</style>
    </div>
  );
};

export const SearchExamples = ({ onPick }) => {
  const { language } = useTranslation();
  const t = L[language] || L.en;
  return (
    <div className="sx">
      <p className="sx-label">{t.tryLabel}</p>
      <div className="sx-list">
        {SEARCH_EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="sx-btn" onClick={() => onPick(ex)}>
            “{ex}”
          </button>
        ))}
      </div>
      <style jsx>{`
        .sx { margin-top: 14px; text-align: left; }
        .sx-label { font-size: 12.5px; color: var(--color-text-muted, #64748B); margin: 0 0 8px; }
        .sx-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .sx-btn {
          padding: 7px 12px; border-radius: 999px; border: 1px dashed var(--color-border-strong, #CBD5E1);
          background: var(--color-surface, #fff); color: var(--color-text, #1E293B);
          font: inherit; font-size: 12.5px; cursor: pointer;
        }
        .sx-btn:hover { border-style: solid; border-color: var(--color-primary, #1E40AF); }
      `}</style>
    </div>
  );
};

export default SearchInterpretation;
