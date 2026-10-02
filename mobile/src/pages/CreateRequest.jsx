// mobile/src/pages/CreateRequest.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { requestsAPI, locationAPI } from '../services/api';

// ============================================================
// CONSTANTS
// ============================================================
const CATEGORIES = [
  'Food',
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Services',
  'Transport',
  'Agriculture',
  'Health & Beauty',
  'Construction',
  'Education',
  'Other',
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low', emoji: '🌱', desc: 'No rush' },
  { value: 'medium', label: 'Medium', emoji: '⏳', desc: 'Within a week' },
  { value: 'high', label: 'High', emoji: '⚡', desc: 'Within 2–3 days' },
  { value: 'urgent', label: 'Urgent', emoji: '🔥', desc: 'Today / tomorrow' },
];

const EXPIRY_OPTIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
];

const MAX_TITLE = 120;
const MAX_DESC = 2000;

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    plus: 'M12 4v16m8-8H4',
    check: 'M20 6L9 17l-5-5',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    crosshair: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 2v4M12 18v4M2 12h4M18 12h4',
  };
  const d = icons[name] || icons.info;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (n) => {
  if (n == null || n === '') return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  return num.toLocaleString();
};

const CreateRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError, showToast } = useToast();

  // ============================================================
  // FORM STATE
  // ============================================================
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [locationArea, setLocationArea] = useState(user?.location_text || '');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [expiryDays, setExpiryDays] = useState(14);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [locating, setLocating] = useState(false);

  // ★ PHASE 1: captured coords (hidden from UI, sent to backend)
  const [coords, setCoords] = useState(null); // { lat, lng }

  // ============================================================
  // VALIDATION
  // ============================================================
  const validation = useMemo(() => {
    const errors = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    } else if (title.trim().length < 5) {
      errors.title = 'Title should be at least 5 characters';
    }

    if (description && description.length > MAX_DESC) {
      errors.description = `Description is too long (max ${MAX_DESC})`;
    }

    const minNum = budgetMin !== '' ? parseFloat(budgetMin) : null;
    const maxNum = budgetMax !== '' ? parseFloat(budgetMax) : null;

    if (minNum != null && (Number.isNaN(minNum) || minNum < 0)) {
      errors.budgetMin = 'Enter a valid amount';
    }
    if (maxNum != null && (Number.isNaN(maxNum) || maxNum < 0)) {
      errors.budgetMax = 'Enter a valid amount';
    }
    if (minNum != null && maxNum != null && minNum > maxNum) {
      errors.budgetMax = 'Max must be greater than min';
    }

    return errors;
  }, [title, description, budgetMin, budgetMax]);

  const isValid = Object.keys(validation).length === 0;

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this device', 'error');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        // ★ PHASE 1: reverse-geocode on the backend
        try {
          const res = await locationAPI.reverse(latitude, longitude);
          const name = res?.data?.name;
          if (name) {
            setLocationArea(name);
            success(`Location set: ${name}`);
          } else {
            setLocationArea(`Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
            showToast('Could not resolve a place name — you can edit it', 'warning');
          }
        } catch (err) {
          console.warn('reverse geocode error:', err);
          setLocationArea(`Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
          showToast('Could not resolve a place name — you can edit it', 'warning');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        showToast('Could not access your location', 'error');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError('Please fix the highlighted fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        locationArea: locationArea.trim() || null,
        // ★ PHASE 1: only send coords if the user actually captured them
        locationLat: coords?.lat ?? null,
        locationLng: coords?.lng ?? null,
        budgetMin: budgetMin !== '' ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax !== '' ? parseFloat(budgetMax) : null,
        urgency,
        expiryDays,
      };

      const res = await requestsAPI.create(payload);
      const created = res?.data?.request;

      if (created?.id) {
        success('Request posted! 🎉');
        navigate(`/requests/${created.id}`);
      } else {
        setError('Request was created but no ID was returned');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create request';
      setError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || description || budgetMin || budgetMax) {
      if (!window.confirm('Discard this request?')) return;
    }
    navigate(-1);
  };

  // ============================================================
  // PREVIEW VALUES
  // ============================================================
  const previewBudget = () => {
    const min = budgetMin ? formatCurrency(budgetMin) : null;
    const max = budgetMax ? formatCurrency(budgetMax) : null;
    if (min && max) return `MK ${min} – ${max}`;
    if (min) return `From MK ${min}`;
    if (max) return `Up to MK ${max}`;
    return 'Budget flexible';
  };

  const urgencyMeta = URGENCY_OPTIONS.find((u) => u.value === urgency);

  return (
    <div className="page">
      <div className="header">
        <button
          className="back-btn"
          onClick={handleCancel}
          aria-label="Back"
        >
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <div className="header-title">
          <h1>Post a Request</h1>
          <p>Tell the community what you need</p>
        </div>
        <button
          className={`preview-toggle ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview((v) => !v)}
          aria-label="Toggle preview"
        >
          <Icon name="message" size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        {/* Info banner */}
        <div className="info-banner">
          <Icon name="info" size={18} color="#1E40AF" strokeWidth={1.9} />
          <div className="info-text">
            <strong>How it works:</strong> Post what you need. Sellers and
            providers respond. You chat and agree — no payments through
            Kumsika.
          </div>
        </div>

        {/* Live preview */}
        {showPreview && (
          <div className="preview-card">
            <div className="preview-label">Preview</div>
            <h3 className="preview-title">
              {title.trim() || 'Your request title'}
            </h3>
            {description.trim() && (
              <p className="preview-desc">{description.trim()}</p>
            )}
            <div className="preview-meta">
              <span className="preview-pill">
                <Icon name="tag" size={11} strokeWidth={2} />
                {previewBudget()}
              </span>
              {locationArea && (
                <span className="preview-pill">
                  <Icon name="mapPin" size={11} strokeWidth={2} />
                  {locationArea}
                </span>
              )}
              {urgencyMeta && (
                <span className="preview-pill">
                  {urgencyMeta.emoji} {urgencyMeta.label}
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* Title */}
          <div className="field">
            <label className="label">
              What are you looking for? <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${validation.title ? 'input-error' : ''}`}
              placeholder="e.g. 20kg of fresh maize"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              maxLength={MAX_TITLE}
              disabled={submitting}
              autoFocus
            />
            <div className="field-footer">
              {validation.title ? (
                <span className="field-error">{validation.title}</span>
              ) : (
                <span className="field-hint">
                  Keep it short and specific
                </span>
              )}
              <span className="field-counter">
                {title.length}/{MAX_TITLE}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="field">
            <label className="label">More details (optional)</label>
            <textarea
              className={`textarea ${validation.description ? 'input-error' : ''}`}
              placeholder="Add any specifics — quantity, timing, condition, preferred brands…"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, MAX_DESC))
              }
              rows={5}
              maxLength={MAX_DESC}
              disabled={submitting}
            />
            <div className="field-footer">
              {validation.description ? (
                <span className="field-error">{validation.description}</span>
              ) : (
                <span className="field-hint">
                  The more context, the better the responses
                </span>
              )}
              <span className="field-counter">
                {description.length}/{MAX_DESC}
              </span>
            </div>
          </div>

          {/* Category */}
          <div className="field">
            <label className="label">Category</label>
            <div className="chip-grid">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`chip ${category === cat ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                  disabled={submitting}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="field">
            <label className="label">Location (optional)</label>
            <div className="input-with-btn">
              <input
                type="text"
                className="input"
                placeholder="e.g. Mitundu, Lilongwe"
                value={locationArea}
                onChange={(e) => {
                  setLocationArea(e.target.value);
                  setCoords(null); // ★ PHASE 1: manual edit invalidates captured coords
                }}
                disabled={submitting}
              />
              <button
                type="button"
                className="icon-inline-btn"
                onClick={handleUseLocation}
                disabled={submitting || locating}
                aria-label="Use my location"
              >
                <Icon
                  name="crosshair"
                  size={18}
                  color={locating ? '#9CA3AF' : '#1E40AF'}
                  strokeWidth={2}
                />
              </button>
            </div>
            <span className="field-hint">
              Where can this be picked up or delivered?
            </span>
          </div>

          {/* Budget */}
          <div className="field">
            <label className="label">Budget range (optional)</label>
            <div className="budget-row">
              <div className="budget-input">
                <span className="budget-prefix">MK</span>
                <input
                  type="number"
                  className={`input ${validation.budgetMin ? 'input-error' : ''}`}
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  min="0"
                  step="100"
                  disabled={submitting}
                />
              </div>
              <span className="budget-sep">–</span>
              <div className="budget-input">
                <span className="budget-prefix">MK</span>
                <input
                  type="number"
                  className={`input ${validation.budgetMax ? 'input-error' : ''}`}
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  min="0"
                  step="100"
                  disabled={submitting}
                />
              </div>
            </div>
            {validation.budgetMax ? (
              <span className="field-error">{validation.budgetMax}</span>
            ) : (
              <span className="field-hint">
                Helps responders know what's in range
              </span>
            )}
          </div>

          {/* Urgency */}
          <div className="field">
            <label className="label">How urgent is this?</label>
            <div className="urgency-grid">
              {URGENCY_OPTIONS.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  className={`urgency-card ${urgency === u.value ? 'active' : ''}`}
                  onClick={() => setUrgency(u.value)}
                  disabled={submitting}
                >
                  <span className="urgency-emoji">{u.emoji}</span>
                  <span className="urgency-label">{u.label}</span>
                  <span className="urgency-desc">{u.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div className="field">
            <label className="label">
              Keep this request open for
            </label>
            <div className="expiry-row">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`expiry-chip ${expiryDays === opt.value ? 'active' : ''}`}
                  onClick={() => setExpiryDays(opt.value)}
                  disabled={submitting}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="field-hint">
              After this period, the request expires automatically
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="submit-error">
              <Icon name="info" size={16} color="#991B1B" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !isValid}
            >
              {submitting ? (
                'Posting…'
              ) : (
                <>
                  <Icon name="send" size={15} color="#FFFFFF" strokeWidth={2.4} />
                  Post request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 40px;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
        }

        .back-btn,
        .preview-toggle {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .back-btn:hover,
        .preview-toggle:hover {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .preview-toggle.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
        }

        .preview-toggle.active :global(svg) {
          stroke: #FFFFFF;
        }

        .header-title {
          flex: 1;
          min-width: 0;
        }

        .header-title h1 {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .header-title p {
          font-size: 12.5px;
          color: var(--color-text-muted);
          margin: 2px 0 0;
        }

        .content {
          max-width: 640px;
          margin: 0 auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-banner {
          display: flex;
          gap: 10px;
          padding: 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: var(--radius-xl);
          align-items: flex-start;
        }

        .info-text {
          font-size: 13px;
          color: #1E3A8A;
          line-height: 1.5;
        }

        .info-text strong {
          font-weight: 700;
        }

        .preview-card {
          padding: 14px 16px;
          background: var(--color-surface);
          border: 1px dashed var(--color-accent);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .preview-label {
          font-size: 10.5px;
          font-weight: 800;
          color: var(--color-accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .preview-title {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text);
          line-height: 1.3;
          word-break: break-word;
        }

        .preview-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.5;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .preview-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }

        .preview-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--color-surface-alt);
          color: var(--color-text-secondary);
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 20px;
          box-shadow: var(--shadow-xs);
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: 0.01em;
        }

        .req {
          color: var(--color-error);
        }

        .input,
        .textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          font-size: 14.5px;
          color: var(--color-text);
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .input:focus,
        .textarea:focus {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
        }

        .input-error {
          border-color: var(--color-error);
          background: #FEF2F2;
        }

        .field-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .field-hint {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }

        .field-error {
          font-size: 11.5px;
          color: var(--color-error);
          font-weight: 600;
        }

        .field-counter {
          font-size: 11px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
          flex-shrink: 0;
        }

        .chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .chip {
          padding: 7px 14px;
          border-radius: 999px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .chip:hover:not(:disabled) {
          border-color: var(--color-accent);
          color: var(--color-text);
        }

        .chip.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
        }

        .chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-with-btn {
          display: flex;
          align-items: stretch;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .input-with-btn:focus-within {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .input-with-btn .input {
          border: none;
          background: transparent;
          border-radius: 0;
        }

        .icon-inline-btn {
          width: 46px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }

        .icon-inline-btn:hover:not(:disabled) {
          background: var(--color-border);
        }

        .icon-inline-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .budget-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .budget-input {
          flex: 1;
          display: flex;
          align-items: stretch;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .budget-input:focus-within {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .budget-input .input {
          border: none;
          background: transparent;
          border-radius: 0;
          padding: 12px 12px 12px 8px;
        }

        .budget-prefix {
          display: flex;
          align-items: center;
          padding: 0 4px 0 12px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-secondary);
        }

        .budget-sep {
          font-size: 16px;
          color: var(--color-text-muted);
          font-weight: 700;
        }

        .urgency-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        @media (min-width: 480px) {
          .urgency-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .urgency-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 12px 8px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface-alt);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          min-height: 86px;
          justify-content: center;
        }

        .urgency-card:hover:not(:disabled) {
          border-color: var(--color-accent);
          background: var(--color-surface);
        }

        .urgency-card.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
          box-shadow: var(--shadow-primary);
        }

        .urgency-card:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .urgency-emoji { font-size: 20px; }

        .urgency-label {
          font-size: 13px;
          font-weight: 700;
        }

        .urgency-desc {
          font-size: 10.5px;
          color: var(--color-text-muted);
          text-align: center;
          line-height: 1.3;
        }

        .urgency-card.active .urgency-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        .expiry-row {
          display: flex;
          gap: 6px;
        }

        .expiry-chip {
          flex: 1;
          padding: 10px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .expiry-chip:hover:not(:disabled) {
          border-color: var(--color-accent);
          color: var(--color-text);
        }

        .expiry-chip.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
        }

        .expiry-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-error {
          display: flex;
          gap: 8px;
          padding: 12px 14px;
          background: #FEE2E2;
          border: 1px solid #FCA5A5;
          border-radius: var(--radius-lg);
          color: #991B1B;
          font-size: 13px;
          font-weight: 600;
          align-items: flex-start;
        }

        .actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: var(--radius-xl);
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          min-height: 50px;
        }

        .btn-primary {
          background: var(--color-primary);
          border: none;
          color: #FFFFFF;
          box-shadow: var(--shadow-primary);
        }

        .btn-primary:hover:not(:disabled) {
          background: #1E40AF;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--color-surface-alt);
          border: 1.5px solid var(--color-border);
          color: var(--color-text-secondary);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--color-border);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 480px) {
          .content { padding: 16px 12px; }
          .form { padding: 16px; }
          .header { padding: 12px; }
          .header-title h1 { font-size: 18px; }
          .actions { flex-direction: column-reverse; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CreateRequest;