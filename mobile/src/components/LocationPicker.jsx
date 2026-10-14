// mobile/src/components/LocationPicker.jsx
// Location input that fills itself with where the user is ("Kawale 1, Lilongwe")
// as soon as the form opens. The user can re-detect with the button or edit
// the text; a typed value is never overwritten by auto-detection.
import React, { useRef } from 'react';
import { useAutoLocation } from '../hooks/useAutoLocation';

const STATUS_TEXT = {
  locating: 'Finding your location…',
  resolving: 'Getting the place name…',
  denied: 'Location access is blocked. Allow location for this site in your browser settings, then tap the target button — or type the place.',
  unsupported: "This device can't share its location — please type the place.",
  error: "Couldn't get your location. Tap the target button to try again, or type the place.",
  unnamed: "We found your position but not its name — please type the area (e.g. Kawale 1, Lilongwe).",
};

/**
 * @param {object} props
 * @param {string} props.value
 * @param {(text: string) => void} props.onChange
 * @param {(r: { name, place, coords, accuracy }) => void} [props.onDetected]  coords etc. for the caller
 * @param {'name'|'full'} [props.format='name']  'full' adds the road (for street addresses)
 * @param {boolean} [props.autoDetect=true]  detect on open when the field is empty
 * @param {boolean} [props.replaceDefault=false]  the starting value is a fallback that detection may replace
 * @param {() => void} [props.onManualEdit]  user typed; callers clear stored coords
 */
const LocationPicker = ({
  value,
  onChange,
  onDetected,
  onManualEdit,
  format = 'name',
  autoDetect = true,
  replaceDefault = false,
  name,
  id,
  placeholder = 'e.g. Kawale 1, Lilongwe',
  required = false,
  disabled = false,
  inputClassName = 'form-input',
  ariaLabel,
}) => {
  // Remember what we filled in, so a later detection can replace our own
  // value but never something the user typed.
  // With replaceDefault, the starting value (e.g. the profile's saved place)
  // is only a fallback: detection may replace it until the user types.
  const lastAuto = useRef(replaceDefault ? String(value || '').trim() || null : null);
  const manualRequest = useRef(false);
  const startedEmpty = useRef(replaceDefault || !String(value || '').trim());

  const { status, result, detect } = useAutoLocation({
    auto: autoDetect && startedEmpty.current,
    onResolved: (r) => {
      const text = (format === 'full' ? r.place?.full : null) || r.name;
      const current = String(value || '').trim();
      const mayFill = manualRequest.current || !current || current === lastAuto.current;
      manualRequest.current = false;
      if (text && mayFill) {
        lastAuto.current = text;
        onChange(text);
      }
      onDetected?.(r);
    },
  });

  const busy = status === 'locating' || status === 'resolving';
  const message = status === 'done' && result?.name
    ? `📍 Detected automatically${result.accuracy ? ` (within about ${result.accuracy < 1000 ? `${result.accuracy} m` : `${(result.accuracy / 1000).toFixed(1)} km`})` : ''}`
    : STATUS_TEXT[status];

  return (
    <div className="lp">
      <div className="lp-row">
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onManualEdit?.();
          }}
          className={inputClassName}
          placeholder={busy ? 'Detecting your location…' : placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          aria-label={ariaLabel}
        />
        <button
          type="button"
          className={`lp-btn ${busy ? 'lp-busy' : ''}`}
          onClick={() => { manualRequest.current = true; detect(); }}
          disabled={disabled || busy}
          aria-label="Detect my location"
          title="Detect my location"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="7" />
            <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>
      {message && (
        <p className={`lp-status lp-${status}`} role="status" aria-live="polite">{message}</p>
      )}
      <style>{`
        .lp { width: 100%; }
        .lp-row { display: flex; gap: 8px; align-items: stretch; }
        .lp-row > input { flex: 1; min-width: 0; }
        .lp-btn {
          flex-shrink: 0; width: 46px; display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--color-border, #E2E8F0); border-radius: var(--radius-xl, 12px);
          background: var(--color-surface, #fff); color: var(--color-primary, #1E40AF); cursor: pointer;
        }
        .lp-btn:disabled { opacity: 0.6; cursor: wait; }
        .lp-busy svg { animation: lp-spin 1.2s linear infinite; }
        @keyframes lp-spin { to { transform: rotate(360deg); } }
        .lp-status { margin: 6px 0 0; font-size: 12px; line-height: 1.4; color: var(--color-text-muted, #64748B); }
        .lp-done { color: var(--color-success, #15803D); }
        .lp-denied, .lp-error, .lp-unsupported, .lp-unnamed { color: var(--color-warning, #B45309); }
        @media (prefers-reduced-motion: reduce) { .lp-busy svg { animation: none; } }
      `}</style>
    </div>
  );
};

export default LocationPicker;
