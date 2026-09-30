// mobile/src/components/DeliveryStatusBadge.jsx
import React from 'react';

const STATUS_META = {
  open: { label: 'Open', color: '#065F46', bg: '#D1FAE5' },
  accepted: { label: 'Accepted', color: '#1E40AF', bg: '#DBEAFE' },
  picked_up: { label: 'Picked Up', color: '#7C2D12', bg: '#FED7AA' },
  delivered: { label: 'Delivered', color: '#5B21B6', bg: '#EDE9FE' },
  confirmed: { label: 'Confirmed', color: '#065F46', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' },
  expired: { label: 'Expired', color: '#374151', bg: '#E5E7EB' },
};

export default function DeliveryStatusBadge({ status, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  const dims =
    size === 'sm'
      ? { padding: '2px 8px', fontSize: 10 }
      : size === 'lg'
      ? { padding: '5px 12px', fontSize: 12 }
      : { padding: '3px 10px', fontSize: 11 };

  return (
    <span
      className={`status-badge status-${status}`}
      style={{
        background: meta.bg,
        color: meta.color,
        ...dims,
      }}
    >
      {meta.label}
      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          font-family: inherit;
          line-height: 1;
        }
      `}</style>
    </span>
  );
}