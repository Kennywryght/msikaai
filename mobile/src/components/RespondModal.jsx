// mobile/src/components/RespondModal.jsx
import React, { useState, useEffect } from 'react';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    x: 'M18 6L6 18M6 6l12 12',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  };
  const d = icons[name] || icons.send;
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

export default function RespondModal({ isOpen, onClose, onSubmit, requestTitle }) {
  const [message, setMessage] = useState('');
  const [offeredPrice, setOfferedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setMessage('');
      setOfferedPrice('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError('Please write a message');
      return;
    }

    if (message.trim().length < 10) {
      setError('Message should be at least 10 characters');
      return;
    }

    const price = offeredPrice.trim() ? parseFloat(offeredPrice) : null;
    if (offeredPrice.trim() && (Number.isNaN(price) || price < 0)) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        message: message.trim(),
        offeredPrice: price,
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to send response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={loading ? undefined : onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Respond to Request</h3>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <Icon name="x" size={18} strokeWidth={2.4} />
          </button>
        </div>

        {requestTitle && (
          <p className="modal-subtitle">
            Re: <strong>{requestTitle}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className="modal-body">
          <label className="label">Your message</label>
          <textarea
            className="textarea"
            placeholder="Tell them how you can help. Mention timing, quality, and what you can offer."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
            disabled={loading}
            autoFocus
          />
          <span className="char-count">{message.length}/1000</span>

          <label className="label">Offered price (optional)</label>
          <div className="price-input">
            <span className="price-prefix">MK</span>
            <input
              type="number"
              className="input"
              placeholder="e.g. 45000"
              value={offeredPrice}
              onChange={(e) => setOfferedPrice(e.target.value)}
              min="0"
              step="100"
              disabled={loading}
            />
          </div>

          {error && <p className="error">{error}</p>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !message.trim()}
            >
              {loading ? 'Sending…' : (
                <>
                  <Icon name="send" size={14} color="#FFFFFF" strokeWidth={2.4} />
                  Send response
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 36, 114, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1100;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          max-width: 480px;
          width: 100%;
          max-height: calc(100vh - 40px);
          overflow-y: auto;
          box-shadow: var(--shadow-2xl);
          animation: slideUp 0.25s ease-out;
          border: 1px solid var(--color-border);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px 12px;
          border-bottom: 1px solid var(--color-border);
        }

        .modal-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: var(--color-text);
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .modal-close:hover:not(:disabled) { background: var(--color-border); }

        .modal-subtitle {
          padding: 0 20px;
          margin: 12px 0 0;
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }

        .modal-body {
          padding: 16px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .label {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 8px;
        }

        .textarea {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          padding: 12px;
          font-size: 14px;
          color: var(--color-text);
          font-family: inherit;
          resize: vertical;
          outline: none;
          min-height: 100px;
        }

        .textarea:focus {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .char-count {
          font-size: 11px;
          color: var(--color-text-muted);
          text-align: right;
        }

        .price-input {
          display: flex;
          align-items: stretch;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          overflow: hidden;
        }

        .price-input:focus-within {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .price-prefix {
          display: flex;
          align-items: center;
          padding: 0 12px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-secondary);
          border-right: 1px solid var(--color-border);
        }

        .input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px;
          font-size: 14px;
          color: var(--color-text);
          outline: none;
          font-family: inherit;
        }

        .error {
          margin-top: 8px;
          font-size: 12.5px;
          color: var(--color-error);
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        .btn-secondary,
        .btn-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px;
          border-radius: var(--radius-xl);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          min-height: 46px;
        }

        .btn-secondary {
          background: var(--color-surface-alt);
          border: 1.5px solid var(--color-border);
          color: var(--color-text-secondary);
        }

        .btn-secondary:hover:not(:disabled) { background: var(--color-border); }

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

        .btn-secondary:disabled,
        .btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 480px) {
          .modal-content { border-radius: var(--radius-2xl); }
          .modal-header { padding: 16px 16px 10px; }
          .modal-subtitle { padding: 0 16px; }
          .modal-body { padding: 12px 16px 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-overlay, .modal-content { animation: none; }
          .btn-primary:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </div>
  );
}