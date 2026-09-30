// mobile/src/pages/CreateDelivery.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { deliveriesAPI } from '../services/api';

const PACKAGE_OPTIONS = [
  { value: 'small', label: 'Small', emoji: '✉️', desc: 'Envelope, documents' },
  { value: 'medium', label: 'Medium', emoji: '📦', desc: 'Shoebox' },
  { value: 'large', label: 'Large', emoji: '🎒', desc: 'Carry-on bag' },
  { value: 'bulky', label: 'Bulky', emoji: '🛋️', desc: 'Furniture, multiple bags' },
];

const MAX_TITLE = 120;
const MAX_DESC = 1000;

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
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

const formatFeePreview = (fee) => {
  if (!fee) return 'Fee flexible';
  const num = Number(fee);
  if (Number.isNaN(num)) return 'Fee flexible';
  return `MK ${num.toLocaleString()}`;
};

export default function CreateDelivery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [packageSize, setPackageSize] = useState('medium');

  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupContactName, setPickupContactName] = useState('');
  const [pickupContactPhone, setPickupContactPhone] = useState('');

  const [dropoffLocation, setDropoffLocation] = useState('');
  const [dropoffContactName, setDropoffContactName] = useState('');
  const [dropoffContactPhone, setDropoffContactPhone] = useState('');

  const [courierFee, setCourierFee] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const validation = useMemo(() => {
    const errors = {};
    if (!title.trim()) errors.title = 'Title is required';
    else if (title.trim().length < 5) errors.title = 'Title should be at least 5 characters';
    if (!pickupLocation.trim()) errors.pickupLocation = 'Pickup location is required';
    if (!dropoffLocation.trim()) errors.dropoffLocation = 'Dropoff location is required';

    const fee = courierFee !== '' ? parseFloat(courierFee) : null;
    if (fee != null && (Number.isNaN(fee) || fee < 0)) {
      errors.courierFee = 'Enter a valid fee';
    }

    return errors;
  }, [title, pickupLocation, dropoffLocation, courierFee]);

  const isValid = Object.keys(validation).length === 0;

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
        packageSize,
        pickupLocation: pickupLocation.trim(),
        pickupContactName: pickupContactName.trim() || null,
        pickupContactPhone: pickupContactPhone.trim() || null,
        dropoffLocation: dropoffLocation.trim(),
        dropoffContactName: dropoffContactName.trim() || null,
        dropoffContactPhone: dropoffContactPhone.trim() || null,
        courierFee: courierFee !== '' ? parseFloat(courierFee) : null,
      };

      const res = await deliveriesAPI.create(payload);
      const created = res?.data?.delivery;

      if (created?.id) {
        success('Delivery job posted! 🚚');
        navigate(`/deliveries/${created.id}`);
      } else {
        setError('Request was created but no ID was returned');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create delivery job';
      setError(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || pickupLocation || dropoffLocation) {
      if (!window.confirm('Discard this delivery job?')) return;
    }
    navigate(-1);
  };

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={handleCancel} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <div className="header-title">
          <h1>Post a Delivery</h1>
          <p>Tell nearby couriers what to move</p>
        </div>
        <button
          className={`preview-toggle ${showPreview ? 'active' : ''}`}
          onClick={() => setShowPreview((v) => !v)}
          aria-label="Toggle preview"
        >
          <Icon name="info" size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        <div className="info-banner">
          <Icon name="info" size={18} color="#1E40AF" strokeWidth={1.9} />
          <div className="info-text">
            <strong>Payment is off-platform.</strong> You pay the courier in cash
            when the package arrives. Kumsika only connects you.
          </div>
        </div>

        {showPreview && (
          <div className="preview-card">
            <div className="preview-label">Preview</div>
            <h3 className="preview-title">
              {title.trim() || 'Your delivery title'}
            </h3>
            <div className="preview-route">
              <span className="preview-dot pickup" />
              <span>{pickupLocation.trim() || 'Pickup location'}</span>
            </div>
            <div className="preview-route">
              <span className="preview-dot dropoff" />
              <span>{dropoffLocation.trim() || 'Dropoff location'}</span>
            </div>
            <div className="preview-footer">
              <span className="preview-pill">
                {PACKAGE_OPTIONS.find((o) => o.value === packageSize)?.emoji}{' '}
                {PACKAGE_OPTIONS.find((o) => o.value === packageSize)?.label}
              </span>
              <span className="preview-pill fee">
                {formatFeePreview(courierFee)}
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label">
              Title <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${validation.title ? 'input-error' : ''}`}
              placeholder="e.g. Small package to Lilongwe"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
              maxLength={MAX_TITLE}
              disabled={submitting}
              autoFocus
            />
            {validation.title && (
              <span className="field-error">{validation.title}</span>
            )}
          </div>

          <div className="field">
            <label className="label">Description (optional)</label>
            <textarea
              className="textarea"
              placeholder="Add details — fragile, keep upright, contact before arriving…"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESC))}
              rows={3}
              maxLength={MAX_DESC}
              disabled={submitting}
            />
            <span className="field-counter">
              {description.length}/{MAX_DESC}
            </span>
          </div>

          <div className="field">
            <label className="label">Package size</label>
            <div className="pkg-grid">
              {PACKAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`pkg-card ${
                    packageSize === opt.value ? 'active' : ''
                  }`}
                  onClick={() => setPackageSize(opt.value)}
                  disabled={submitting}
                >
                  <span className="pkg-emoji">{opt.emoji}</span>
                  <span className="pkg-label">{opt.label}</span>
                  <span className="pkg-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="section-header">
            <span className="section-badge pickup">Pickup</span>
          </div>

          <div className="field">
            <label className="label">
              Pickup location <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${validation.pickupLocation ? 'input-error' : ''}`}
              placeholder="e.g. Mitundu Market"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              disabled={submitting}
            />
            {validation.pickupLocation && (
              <span className="field-error">{validation.pickupLocation}</span>
            )}
          </div>

          <div className="two-col">
            <div className="field">
              <label className="label">Contact name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Alice"
                value={pickupContactName}
                onChange={(e) => setPickupContactName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="field">
              <label className="label">Contact phone</label>
              <input
                type="tel"
                className="input"
                placeholder="e.g. 0999123456"
                value={pickupContactPhone}
                onChange={(e) => setPickupContactPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="section-header">
            <span className="section-badge dropoff">Dropoff</span>
          </div>

          <div className="field">
            <label className="label">
              Dropoff location <span className="req">*</span>
            </label>
            <input
              type="text"
              className={`input ${validation.dropoffLocation ? 'input-error' : ''}`}
              placeholder="e.g. Area 47, Lilongwe"
              value={dropoffLocation}
              onChange={(e) => setDropoffLocation(e.target.value)}
              disabled={submitting}
            />
            {validation.dropoffLocation && (
              <span className="field-error">{validation.dropoffLocation}</span>
            )}
          </div>

          <div className="two-col">
            <div className="field">
              <label className="label">Contact name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Bob"
                value={dropoffContactName}
                onChange={(e) => setDropoffContactName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="field">
              <label className="label">Contact phone</label>
              <input
                type="tel"
                className="input"
                placeholder="e.g. 0888123456"
                value={dropoffContactPhone}
                onChange={(e) => setDropoffContactPhone(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Courier fee (MK, optional)</label>
            <div className="fee-input">
              <span className="fee-prefix">MK</span>
              <input
                type="number"
                className={`input ${validation.courierFee ? 'input-error' : ''}`}
                placeholder="e.g. 5000"
                value={courierFee}
                onChange={(e) => setCourierFee(e.target.value)}
                min="0"
                step="100"
                disabled={submitting}
              />
            </div>
            {validation.courierFee ? (
              <span className="field-error">{validation.courierFee}</span>
            ) : (
              <span className="field-hint">
                Leave blank for couriers to propose a fee
              </span>
            )}
          </div>

          {error && (
            <div className="submit-error">
              <Icon name="info" size={16} color="#991B1B" strokeWidth={2} />
              <span>{error}</span>
            </div>
          )}

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
                  Post delivery
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
        }

        .preview-toggle.active :global(svg) { stroke: #FFFFFF; }

        .header-title { flex: 1; min-width: 0; }

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
        }

        .preview-route {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .preview-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .preview-dot.pickup { background: #10B981; }
        .preview-dot.dropoff { background: #F59E0B; }

        .preview-footer {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding-top: 6px;
          border-top: 1px solid var(--color-border);
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

        .preview-pill.fee {
          background: var(--color-accent-tint);
          color: var(--color-accent);
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

        .section-header {
          margin-top: 4px;
          border-top: 1px solid var(--color-border);
          padding-top: 14px;
        }

        .section-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .section-badge.pickup { background: #D1FAE5; color: #065F46; }
        .section-badge.dropoff { background: #FEF3C7; color: #92400E; }

        .field { display: flex; flex-direction: column; gap: 6px; }

        .label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text);
        }

        .req { color: var(--color-error); }

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

        .textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

        .input-error {
          border-color: var(--color-error);
          background: #FEF2F2;
        }

        .field-error {
          font-size: 11.5px;
          color: var(--color-error);
          font-weight: 600;
        }

        .field-hint {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }

        .field-counter {
          font-size: 11px;
          color: var(--color-text-muted);
          text-align: right;
          font-family: var(--font-mono);
        }

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 480px) {
          .two-col { grid-template-columns: 1fr; }
        }

        .pkg-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        @media (min-width: 480px) {
          .pkg-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .pkg-card {
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
          min-height: 88px;
          justify-content: center;
        }

        .pkg-card:hover:not(:disabled) {
          border-color: var(--color-accent);
          background: var(--color-surface);
        }

        .pkg-card.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
          box-shadow: var(--shadow-primary);
        }

        .pkg-card:disabled { opacity: 0.5; cursor: not-allowed; }

        .pkg-emoji { font-size: 20px; }
        .pkg-label { font-size: 13px; font-weight: 700; }
        .pkg-desc {
          font-size: 10.5px;
          color: var(--color-text-muted);
          text-align: center;
          line-height: 1.3;
        }

        .pkg-card.active .pkg-desc { color: rgba(255, 255, 255, 0.85); }

        .fee-input {
          display: flex;
          align-items: stretch;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          overflow: hidden;
        }

        .fee-input:focus-within {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .fee-input .input {
          border: none;
          background: transparent;
          border-radius: 0;
          padding: 12px 12px 12px 8px;
        }

        .fee-prefix {
          display: flex;
          align-items: center;
          padding: 0 4px 0 12px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-secondary);
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

        .btn-secondary:hover:not(:disabled) { background: var(--color-border); }

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
}