// mobile/src/components/DeliveryCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryStatusBadge from './DeliveryStatusBadge';

const PACKAGE_META = {
  small: { label: 'Small', emoji: '✉️' },
  medium: { label: 'Medium', emoji: '📦' },
  large: { label: 'Large', emoji: '🎒' },
  bulky: { label: 'Bulky', emoji: '🛋️' },
};

const TIER_COLORS = {
  0: '#9CA3AF',
  1: '#3B82F6',
  2: '#8B5CF6',
  3: '#10B981',
};

const Icon = ({ name, size = 14, color = 'currentColor', strokeWidth = 2 }) => {
  const icons = {
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  };
  const d = icons[name] || icons.mapPin;
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

const formatFee = (fee) => {
  if (fee == null || fee === '') return null;
  return `MK ${Number(fee).toLocaleString()}`;
};

export default function DeliveryCard({ delivery, onClick, compact = false }) {
  const navigate = useNavigate();

  if (!delivery) return null;

  const pkg = PACKAGE_META[delivery.package_size] || PACKAGE_META.medium;
  const fee = formatFee(delivery.courier_fee);
  const status = delivery.effective_status || delivery.status || 'open';
  const poster = delivery.poster;
  const posterName = poster?.full_name || 'Poster';
  const posterInitials = initialsOf(posterName);
  const tierColor = TIER_COLORS[poster?.trust?.tier ?? 0];

  const handleClick = () => {
    if (onClick) return onClick(delivery);
    navigate(`/deliveries/${delivery.id}`);
  };

  return (
    <div
      className={`delivery-card ${compact ? 'compact' : ''}`}
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
          <span className="pkg-pill">
            <span className="pkg-emoji">{pkg.emoji}</span>
            {pkg.label}
          </span>
          {delivery.is_mine && <span className="pill mine-pill">Yours</span>}
          {delivery.is_mine_as_courier && (
            <span className="pill courier-pill">Your job</span>
          )}
        </div>
        <DeliveryStatusBadge status={status} size="sm" />
      </div>

      <h3 className="card-title">{delivery.title}</h3>

      <div className="route">
        <div className="route-point">
          <span className="route-dot pickup" />
          <span className="route-text">{delivery.pickup_location}</span>
        </div>
        <div className="route-line" />
        <div className="route-point">
          <span className="route-dot dropoff" />
          <span className="route-text">{delivery.dropoff_location}</span>
        </div>
      </div>

      <div className="card-footer">
        <div className="poster-info">
          <div className="poster-avatar" style={{ background: tierColor }}>
            {posterInitials}
          </div>
          <div className="poster-text">
            <span className="poster-name">{posterName}</span>
            <span className="poster-sub">
              <Icon name="clock" size={10} strokeWidth={2} />
              {timeAgo(delivery.created_at)}
            </span>
          </div>
        </div>

        {fee ? (
          <div className="fee-tag">{fee}</div>
        ) : (
          <div className="fee-tag fee-flexible">Fee flexible</div>
        )}
      </div>

      <style jsx>{`
        .delivery-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          box-shadow: var(--shadow-xs);
          font-family: inherit;
        }

        .delivery-card:hover,
        .delivery-card:focus-visible {
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
          gap: 6px;
          flex-wrap: wrap;
        }

        .pkg-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 999px;
          background: var(--color-surface-alt);
          color: var(--color-text-secondary);
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pkg-emoji { font-size: 11px; }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .mine-pill {
          background: var(--color-accent-tint);
          color: var(--color-accent);
        }

        .courier-pill {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .card-title {
          font-family: var(--font-serif);
          font-size: 15.5px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: -0.01em;
        }

        .route {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 8px 0 4px;
        }

        .route-point {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .route-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .route-dot.pickup {
          background: #10B981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }

        .route-dot.dropoff {
          background: #F59E0B;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
        }

        .route-line {
          width: 2px;
          height: 12px;
          margin-left: 3px;
          background: var(--color-border);
          border-radius: 2px;
        }

        .route-text {
          font-size: 12.5px;
          color: var(--color-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--color-border);
        }

        .poster-info {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .poster-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10.5px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .poster-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          min-width: 0;
        }

        .poster-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .poster-sub {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          color: var(--color-text-muted);
        }

        .fee-tag {
          flex-shrink: 0;
          padding: 5px 12px;
          border-radius: 999px;
          background: var(--color-accent-tint);
          color: var(--color-accent);
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .fee-flexible {
          background: var(--color-surface-alt);
          color: var(--color-text-muted);
          font-style: italic;
        }

        .compact .card-title { font-size: 14px; }

        @media (max-width: 480px) {
          .delivery-card { padding: 12px 14px; }
          .card-title { font-size: 14.5px; }
          .route-text { font-size: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .delivery-card { transition: none; }
          .delivery-card:hover,
          .delivery-card:focus-visible { transform: none; }
        }
      `}</style>
    </div>
  );
}