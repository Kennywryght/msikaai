// mobile/src/components/RequestCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const URGENCY_META = {
  low: { label: 'Low', color: '#6B7280', bg: '#F3F4F6' },
  medium: { label: 'Medium', color: '#0EA5E9', bg: '#E0F2FE' },
  high: { label: 'High', color: '#F59E0B', bg: '#FEF3C7' },
  urgent: { label: 'Urgent', color: '#DC2626', bg: '#FEE2E2' },
};

const STATUS_META = {
  open: { label: 'Open', color: '#065F46', bg: '#D1FAE5' },
  answered: { label: 'Answered', color: '#1E40AF', bg: '#DBEAFE' },
  fulfilled: { label: 'Fulfilled', color: '#065F46', bg: '#D1FAE5' },
  expired: { label: 'Expired', color: '#374151', bg: '#E5E7EB' },
  cancelled: { label: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' },
};

const Icon = ({ name, size = 14, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  };
  const d = icons[name] || icons.tag;
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

const formatBudget = (min, max) => {
  const fmt = (n) => `MK ${Number(n).toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
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

const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const TIER_COLORS = {
  0: '#9CA3AF',
  1: '#3B82F6',
  2: '#8B5CF6',
  3: '#10B981',
};

export default function RequestCard({ request, onClick }) {
  const navigate = useNavigate();

  if (!request) return null;

  const urgency = URGENCY_META[request.urgency] || URGENCY_META.medium;
  const statusKey = request.effective_status || request.status || 'open';
  const status = STATUS_META[statusKey] || STATUS_META.open;
  const budget = formatBudget(request.budget_min, request.budget_max);
  const author = request.author;
  const authorName = author?.full_name || 'Anonymous';
  const authorInitials = initialsOf(authorName);
  const tierColor = TIER_COLORS[author?.trust?.tier ?? 0];

  const handleClick = () => {
    if (onClick) return onClick(request);
    navigate(`/requests/${request.id}`);
  };

  const isMine = request.is_mine;

  return (
    <div
      className="request-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="card-top">
        <div className="card-badges">
          <span
            className="pill urgency-pill"
            style={{ background: urgency.bg, color: urgency.color }}
          >
            {urgency.label}
          </span>
          {statusKey !== 'open' && (
            <span
              className="pill status-pill"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </span>
          )}
          {isMine && <span className="pill mine-pill">Yours</span>}
        </div>
        <span className="time-ago">
          <Icon name="clock" size={11} strokeWidth={2} />
          {timeAgo(request.created_at)}
        </span>
      </div>

      <h3 className="card-title">{request.title}</h3>

      {request.description && (
        <p className="card-desc">{request.description}</p>
      )}

      <div className="card-meta">
        {budget && (
          <span className="meta-item budget">
            <Icon name="tag" size={12} strokeWidth={2} />
            <span>{budget}</span>
          </span>
        )}
        {request.location_area && (
          <span className="meta-item">
            <Icon name="mapPin" size={12} strokeWidth={2} />
            <span>{request.location_area}</span>
          </span>
        )}
        {request.category && (
          <span className="meta-item">
            <Icon name="tag" size={12} strokeWidth={2} />
            <span>{request.category}</span>
          </span>
        )}
      </div>

      <div className="card-footer">
        <div className="author">
          <div className="author-avatar" style={{ background: tierColor }}>
            {authorInitials}
          </div>
          <div className="author-info">
            <span className="author-name">{authorName}</span>
            <span className="author-sub">
              {author?.trust?.tier > 0
                ? `Tier ${author.trust.tier}`
                : 'Unverified'}
            </span>
          </div>
        </div>
        <div className="response-count">
          <Icon name="message" size={13} strokeWidth={2} />
          <span>
            {request.responses_count || 0}{' '}
            {request.responses_count === 1 ? 'response' : 'responses'}
          </span>
        </div>
      </div>

      <style jsx>{`
        .request-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          outline: none;
          box-shadow: var(--shadow-xs);
        }

        .request-card:hover,
        .request-card:focus-visible {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .card-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .mine-pill {
          background: var(--color-accent-tint);
          color: var(--color-accent);
        }

        .time-ago {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          color: var(--color-text-muted);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .card-title {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
          letter-spacing: -0.01em;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding-top: 4px;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .meta-item.budget {
          color: var(--color-accent);
          font-weight: 600;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--color-border);
          margin-top: 2px;
        }

        .author {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .author-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .author-info {
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
        }

        .author-name {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .author-sub {
          font-size: 10.5px;
          color: var(--color-text-muted);
        }

        .response-count {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--color-text-secondary);
          font-weight: 500;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .request-card { padding: 14px; }
          .card-title { font-size: 15px; }
          .card-desc { font-size: 12.5px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .request-card { transition: none; }
          .request-card:hover,
          .request-card:focus-visible { transform: none; }
        }
      `}</style>
    </div>
  );
}