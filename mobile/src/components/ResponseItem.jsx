// mobile/src/components/ResponseItem.jsx
import React from 'react';

const Icon = ({ name, size = 14, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    chat: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
  };
  const d = icons[name] || icons.message;
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

const STATUS_META = {
  pending: { label: 'Pending', color: '#92400E', bg: '#FEF3C7' },
  accepted: { label: 'Accepted', color: '#065F46', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#991B1B', bg: '#FEE2E2' },
  withdrawn: { label: 'Withdrawn', color: '#374151', bg: '#E5E7EB' },
};

const TIER_COLORS = {
  0: '#9CA3AF',
  1: '#3B82F6',
  2: '#8B5CF6',
  3: '#10B981',
};

const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export default function ResponseItem({
  response,
  isOwner,            // viewer owns the request
  onAccept,           // () => void
  onReject,           // () => void
  onWithdraw,         // () => void
  onOpenChat,         // (conversationId) => void
  busy = false,
}) {
  if (!response) return null;

  const statusMeta = STATUS_META[response.status] || STATUS_META.pending;
  const responder = response.responder;
  const name = responder?.full_name || 'Responder';
  const initials = initialsOf(name);
  const tierColor = TIER_COLORS[responder?.trust?.tier ?? 0];

  const isPending = response.status === 'pending';
  const isAccepted = response.status === 'accepted';
  const isMine = response.is_mine;

  return (
    <div className={`response-item ${isAccepted ? 'accepted' : ''}`}>
      <div className="response-header">
        <div className="responder">
          <div className="responder-avatar" style={{ background: tierColor }}>
            {initials}
          </div>
          <div className="responder-info">
            <span className="responder-name">
              {name}
              {isMine && <span className="you-tag">You</span>}
            </span>
            <span className="responder-sub">
              {responder?.trust?.tier > 0
                ? `Tier ${responder.trust.tier}`
                : 'Unverified'}
              {responder?.trust?.trust_score != null && (
                <> · Score {responder.trust.trust_score}</>
              )}
            </span>
          </div>
        </div>
        <span
          className="status-pill"
          style={{ background: statusMeta.bg, color: statusMeta.color }}
        >
          {statusMeta.label}
        </span>
      </div>

      <p className="response-message">{response.message}</p>

      <div className="response-meta">
        {response.offered_price != null && (
          <span className="meta-price">
            <Icon name="tag" size={12} strokeWidth={2} />
            MK {Number(response.offered_price).toLocaleString()}
          </span>
        )}
        <span className="meta-time">
          <Icon name="clock" size={11} strokeWidth={2} />
          {timeAgo(response.created_at)}
        </span>
      </div>

      {(isPending || isAccepted) && (
        <div className="response-actions">
          {/* Owner of request — pending → accept/reject */}
          {isOwner && isPending && (
            <>
              <button
                className="action-btn reject"
                onClick={onReject}
                disabled={busy}
              >
                <Icon name="x" size={13} strokeWidth={2.6} />
                Reject
              </button>
              <button
                className="action-btn accept"
                onClick={onAccept}
                disabled={busy}
              >
                <Icon name="check" size={13} strokeWidth={2.6} />
                Accept
              </button>
            </>
          )}

          {/* Responder — pending → withdraw */}
          {isMine && isPending && !isOwner && (
            <button
              className="action-btn withdraw"
              onClick={onWithdraw}
              disabled={busy}
            >
              Withdraw response
            </button>
          )}

          {/* Accepted → open chat */}
          {isAccepted && response.conversation_id && (
            <button
              className="action-btn chat"
              onClick={() => onOpenChat?.(response.conversation_id)}
              disabled={busy}
            >
              <Icon name="chat" size={13} strokeWidth={2.2} />
              Open chat
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        .response-item {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-family: inherit;
        }

        .response-item.accepted {
          background: linear-gradient(135deg, #F0FDF4, #FFFFFF);
          border-color: #86EFAC;
        }

        .response-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .responder {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }

        .responder-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .responder-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .responder-name {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .you-tag {
          padding: 1px 6px;
          background: var(--color-accent-tint);
          color: var(--color-accent);
          font-size: 9.5px;
          font-weight: 800;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .responder-sub {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .status-pill {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .response-message {
          font-size: 13.5px;
          color: var(--color-text);
          line-height: 1.55;
          margin: 0;
          padding: 10px 12px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-lg);
          border-left: 3px solid var(--color-accent);
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .response-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }

        .meta-price {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          background: var(--color-accent-tint);
          color: var(--color-accent);
          font-size: 12px;
          font-weight: 700;
          border-radius: 999px;
        }

        .meta-time {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--color-text-muted);
        }

        .response-actions {
          display: flex;
          gap: 8px;
          padding-top: 4px;
          border-top: 1px solid var(--color-border);
          margin-top: 2px;
          padding-top: 10px;
        }

        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 14px;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.accept {
          background: #10B981;
          color: #FFFFFF;
        }

        .action-btn.accept:hover:not(:disabled) { background: #059669; }

        .action-btn.reject {
          background: #FEE2E2;
          color: #991B1B;
        }

        .action-btn.reject:hover:not(:disabled) { background: #FECACA; }

        .action-btn.withdraw {
          background: var(--color-surface-alt);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
        }

        .action-btn.withdraw:hover:not(:disabled) { background: var(--color-border); }

        .action-btn.chat {
          background: var(--color-primary);
          color: #FFFFFF;
          box-shadow: var(--shadow-primary);
        }

        .action-btn.chat:hover:not(:disabled) { background: #1E40AF; }

        @media (prefers-reduced-motion: reduce) {
          .action-btn { transition: none; }
        }
      `}</style>
    </div>
  );
}