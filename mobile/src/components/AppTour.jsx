// mobile/src/components/AppTour.jsx
//
// Guided first-run tour of the Landing page, in English or Chichewa.
//  - Auto-starts once per device when `ready` becomes true.
//  - Replay: startAppTour() from anywhere, or open /landing?tour=1.
//  - Steps point at elements marked data-tour="…"; a step whose element
//    isn't on screen is skipped, or shown as a centred card if it has
//    `fallback: 'center'` (e.g. bottom-nav steps on desktop).
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';

const STORAGE_KEY = 'kumsika:tour:v1';
const START_EVENT = 'kumsika:start-tour';

export const startAppTour = () => window.dispatchEvent(new Event(START_EVENT));
export const hasSeenAppTour = () => {
  try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
};
const markSeen = (how) => {
  try { localStorage.setItem(STORAGE_KEY, `${how}:${new Date().toISOString()}`); } catch { /* private mode */ }
};

const UI = {
  en: { next: 'Next', back: 'Back', skip: 'Skip tour', finish: 'Finish', step: (i, n) => `Step ${i} of ${n}`, startSearch: 'Start searching' },
  ny: { next: 'Pitirizani', back: 'Bwererani', skip: 'Dumphani', finish: 'Malizani', step: (i, n) => `Gawo ${i} mwa ${n}`, startSearch: 'Yambani kusaka' },
};

const STEPS = [
  {
    id: 'welcome',
    en: { title: 'Welcome to Kumsika 👋', body: 'Buy, sell and find local services in Mitundu. This quick tour shows you around — it takes about a minute.' },
    ny: { title: 'Takulandirani ku Kumsika 👋', body: "Gulani, gulitsani ndi kupeza ntchito za m'dera lanu ku Mitundu. Ulendo wachiduleyu ukuonetsani zonse — utenga pafupifupi mphindi imodzi." },
  },
  {
    id: 'role', target: 'role-choice',
    en: { title: "Tell us how you'll use Kumsika", body: "Choose “I'm here to buy” or “I want to sell”. Buyers can browse and message sellers straight away." },
    ny: { title: 'Tiuzeni momwe mugwiritsire ntchito Kumsika', body: "Sankhani “I'm here to buy” (kugula) kapena “I want to sell” (kugulitsa). Ogula akhoza kuyamba kusakatula ndi kucheza ndi ogulitsa nthawi yomweyo." },
  },
  {
    id: 'search', target: 'search',
    en: { title: 'Search the way you speak', body: 'Type in Chichewa, English or both — a whole sentence is fine. Try “Ndikufuna chimanga cha mtengo wotsika” or “plumber near Mitundu”. Add a budget like “pansi pa 5000” or “under 5000”.' },
    ny: { title: 'Sakani momwe mumalankhulira', body: 'Lembani mu Chichewa, Chingerezi kapena zonse ziwiri — ngakhale chiganizo chonse. Yesani “Ndikufuna chimanga cha mtengo wotsika” kapena “plumber pafupi ndi Mitundu”. Onjezerani mtengo ngati “pansi pa 5000”.' },
  },
  {
    id: 'requests', target: 'requests',
    en: { title: "Can't find it? Post a request", body: 'See what people nearby are looking for — or tap “Post a request” and sellers will come to you with offers.' },
    ny: { title: 'Simukupeza? Lembani pempho', body: 'Onani zomwe anthu a pafupi akufuna — kapena dinani “Post a request” ndipo ogulitsa adzakubweretserani mitengo yawo.' },
  },
  {
    id: 'spotlight', target: 'spotlight',
    en: { title: 'Spotlight', body: 'Featured and newest listings play here. Sellers can boost a listing to appear at the top.' },
    ny: { title: 'Spotlight', body: 'Katundu wapadera ndi watsopano amaonekera apa. Ogulitsa akhoza kulipira kuti katundu wawo aonekere pamwamba.' },
  },
  {
    id: 'categories', target: 'categories',
    en: { title: 'Browse by category', body: 'Tap a category to narrow the list — food, clothing, services, farm inputs and more.' },
    ny: { title: "Sakatulani m'magulu", body: 'Dinani gulu kuti muone zokhazo — chakudya, zovala, ntchito, zipangizo za ulimi ndi zina.' },
  },
  {
    id: 'listing', target: 'listing-card',
    en: { title: 'Every listing', body: 'Tap the photo for details. ❤️ saves it, 💬 lets you comment, and “Message” opens a chat with the seller.' },
    ny: { title: 'Katundu aliyense', body: 'Dinani chithunzi kuti muone zambiri. ❤️ kusunga, 💬 kulemba ndemanga, ndipo “Message” imatsegula macheza ndi wogulitsa.' },
  },
  {
    id: 'sell', target: 'nav-sell', fallback: 'center',
    en: { title: 'Sell something', body: 'Tap “Sell” to post a listing with photos in a few steps — or use Voice Listing and just say what you are selling.' },
    ny: { title: 'Gulitsani kanthu', body: "Dinani “Sell” kuti mulembe katundu ndi zithunzi m'mphindi zochepa — kapena gwiritsani Voice Listing ndipo mungonena zomwe mukugulitsa." },
  },
  {
    id: 'messages', target: 'nav-messages', fallback: 'center',
    en: { title: 'Your chats', body: 'All your conversations with buyers and sellers live in “Chat” — send photos, voice notes and price offers.' },
    ny: { title: 'Macheza anu', body: 'Macheza anu onse ndi ogula ndi ogulitsa ali mu “Chat” — tumizani zithunzi, mawu ndi mitengo yokambirana.' },
  },
  {
    id: 'profile', target: 'nav-profile', fallback: 'center',
    en: { title: 'Build trust', body: 'In your Profile, verify your phone number to earn a trust badge. Buyers prefer verified sellers.' },
    ny: { title: 'Khalani odalirika', body: 'Mu Profile yanu, tsimikizani nambala ya foni kuti mulandire baji yodalirika. Ogula amakonda ogulitsa otsimikizika.' },
  },
  {
    id: 'done',
    en: { title: "You're all set! 🎉", body: 'You can replay this tour any time from Settings → “Take the app tour”.' },
    ny: { title: 'Mwakonzeka! 🎉', body: 'Mutha kubwereza ulendowu nthawi iliyonse mu Settings → “Take the app tour”.' },
  },
];

const PAD = 8;
const GAP = 12;

const findTarget = (name) => {
  if (!name) return null;
  const nodes = document.querySelectorAll(`[data-tour="${name}"]`);
  for (const el of nodes) {
    const r = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    if (r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none') return el;
  }
  return null;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const AppTour = ({ ready = true }) => {
  const { language, changeLanguage } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const lang = language === 'ny' ? 'ny' : 'en';
  const ui = UI[lang];

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null); // highlighted element rect (viewport coords)
  const [cardPos, setCardPos] = useState(null);
  const cardRef = useRef(null);
  const nextBtnRef = useRef(null);
  const dirRef = useRef(1); // +1 forward, -1 back (for skipping missing steps)

  // ---------- start / stop ----------
  const start = useCallback(() => {
    dirRef.current = 1;
    setIndex(0);
    setActive(true);
  }, []);

  const stop = useCallback((how) => {
    markSeen(how);
    setActive(false);
    setRect(null);
  }, []);

  // Auto-start once per device, or when ?tour=1 is present.
  useEffect(() => {
    if (!ready) return undefined;
    const forced = new URLSearchParams(location.search).get('tour') === '1';
    if (!forced && hasSeenAppTour()) return undefined;
    const t = setTimeout(start, forced ? 300 : 900);
    if (forced) navigate(location.pathname, { replace: true });
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, [start]);

  const step = STEPS[index];

  // ---------- locate target (skip missing ones) ----------
  useEffect(() => {
    if (!active || !step) return undefined;
    if (!step.target) { setRect(null); return undefined; }

    const el = findTarget(step.target);
    if (!el) {
      if (step.fallback === 'center') { setRect(null); return undefined; }
      // move on in the direction the user was going
      const next = index + dirRef.current;
      if (next >= 0 && next < STEPS.length) setIndex(next);
      else stop('completed');
      return undefined;
    }

    el.scrollIntoView({ block: 'center', inline: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      });
    };
    measure();
    const settle = setTimeout(measure, 400); // after smooth scroll
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, index, step, stop]);

  // ---------- place the card next to the target ----------
  useLayoutEffect(() => {
    if (!active) return;
    const card = cardRef.current;
    if (!card) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;

    if (!rect) {
      setCardPos({ top: Math.max(16, (vh - ch) / 2), left: Math.max(16, (vw - cw) / 2) });
      return;
    }
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - ch;
    let top;
    if (below + ch <= vh - 16) top = below;
    else if (above >= 16) top = above;
    else top = Math.max(16, vh - ch - 16); // tall target: dock at the bottom
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - cw / 2), vw - cw - 16);
    setCardPos({ top, left });
  }, [active, rect, index, lang]);

  // ---------- focus + keyboard ----------
  useEffect(() => {
    if (active) nextBtnRef.current?.focus({ preventScroll: true });
  }, [active, index]);

  const goNext = useCallback(() => {
    dirRef.current = 1;
    if (index >= STEPS.length - 1) stop('completed');
    else setIndex((i) => i + 1);
  }, [index, stop]);

  const goBack = useCallback(() => {
    dirRef.current = -1;
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); stop('skipped'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, goNext, goBack, stop]);

  if (!active || !step) return null;

  const text = step[lang];
  const isLast = index === STEPS.length - 1;
  const visibleCount = STEPS.length;

  const finishAndSearch = () => {
    stop('completed');
    const input = document.querySelector('[data-tour="search"] input');
    input?.focus();
  };

  return (
    <div className="tour-root" aria-live="polite">
      {/* blocks clicks on the page while the tour is open */}
      <div className="tour-blocker" onClick={(e) => e.stopPropagation()} />
      {rect ? (
        <div
          className="tour-spot"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          aria-hidden="true"
        />
      ) : (
        <div className="tour-dim" aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : { visibility: 'hidden' }}
      >
        <div className="tour-top">
          <span className="tour-step">{ui.step(index + 1, visibleCount)}</span>
          <div className="tour-lang" role="group" aria-label="Language">
            <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => changeLanguage('en')} aria-pressed={lang === 'en'}>EN</button>
            <button type="button" className={lang === 'ny' ? 'on' : ''} onClick={() => changeLanguage('ny')} aria-pressed={lang === 'ny'}>Chichewa</button>
          </div>
        </div>

        <h2 id="tour-title" className="tour-title">{text.title}</h2>
        <p id="tour-body" className="tour-body">{text.body}</p>

        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((s, i) => <span key={s.id} className={`tour-dot ${i === index ? 'on' : i < index ? 'past' : ''}`} />)}
        </div>

        <div className="tour-actions">
          {!isLast ? (
            <button type="button" className="tour-skip" onClick={() => stop('skipped')}>{ui.skip}</button>
          ) : <span />}
          <div className="tour-nav">
            {index > 0 && (
              <button type="button" className="tour-back" onClick={goBack}>{ui.back}</button>
            )}
            {isLast ? (
              <>
                <button type="button" className="tour-back" onClick={() => stop('completed')}>{ui.finish}</button>
                <button ref={nextBtnRef} type="button" className="tour-next" onClick={finishAndSearch}>{ui.startSearch}</button>
              </>
            ) : (
              <button ref={nextBtnRef} type="button" className="tour-next" onClick={goNext}>{ui.next}</button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .tour-root { position: fixed; inset: 0; z-index: 10000; font-family: var(--font-sans, system-ui, sans-serif); }
        .tour-blocker { position: absolute; inset: 0; }
        .tour-dim { position: absolute; inset: 0; background: rgba(15, 23, 42, 0.62); }
        .tour-spot {
          position: fixed; border-radius: 14px; pointer-events: none;
          box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.62), 0 0 0 3px var(--color-accent, #F59E0B);
          transition: top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease;
        }
        .tour-card {
          position: fixed; width: min(360px, calc(100vw - 32px));
          background: var(--color-surface, #fff); color: var(--color-text, #0F172A);
          border-radius: 18px; padding: 16px 16px 14px;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.28);
          transition: top 0.25s ease, left 0.25s ease;
        }
        .tour-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 8px; }
        .tour-step { font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--color-text-muted, #64748B); }
        .tour-lang { display: inline-flex; border: 1px solid var(--color-border, #E2E8F0); border-radius: 999px; overflow: hidden; }
        .tour-lang button {
          border: 0; background: transparent; padding: 4px 10px; font: inherit; font-size: 11.5px; font-weight: 600;
          color: var(--color-text-secondary, #475569); cursor: pointer;
        }
        .tour-lang button.on { background: var(--color-primary, #1E3A8A); color: var(--color-text-inverse, #fff); }
        .tour-title { font-family: var(--font-serif, inherit); font-size: 18px; font-weight: 600; margin: 0 0 6px; line-height: 1.3; }
        .tour-body { font-size: 14px; line-height: 1.55; margin: 0; color: var(--color-text-secondary, #334155); }
        .tour-dots { display: flex; gap: 5px; margin: 14px 0 12px; }
        .tour-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--color-border, #E2E8F0); transition: width 0.2s; }
        .tour-dot.past { background: var(--color-border-strong, #94A3B8); }
        .tour-dot.on { width: 18px; background: var(--color-primary, #1E3A8A); }
        .tour-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .tour-nav { display: flex; gap: 8px; }
        .tour-skip {
          border: 0; background: transparent; padding: 8px 2px; font: inherit; font-size: 13px;
          color: var(--color-text-muted, #64748B); cursor: pointer; text-decoration: underline; text-underline-offset: 3px;
        }
        .tour-back, .tour-next {
          padding: 9px 14px; border-radius: 12px; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer;
        }
        .tour-back { border: 1px solid var(--color-border, #E2E8F0); background: var(--color-surface, #fff); color: var(--color-text, #0F172A); }
        .tour-next { border: 1px solid var(--color-primary, #1E3A8A); background: var(--color-primary, #1E3A8A); color: var(--color-text-inverse, #fff); }
        .tour-next:focus-visible, .tour-back:focus-visible, .tour-skip:focus-visible, .tour-lang button:focus-visible {
          outline: 3px solid var(--color-accent, #F59E0B); outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .tour-spot, .tour-card, .tour-dot { transition: none; }
        }
      `}</style>
    </div>
  );
};

export default AppTour;
