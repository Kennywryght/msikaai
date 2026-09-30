// mobile/src/components/VerificationBadge.jsx
import React from 'react';

const META = {
  email: { label: 'Email', emoji: '✉️', color: '#0EA5E9', bg: '#E0F2FE' },
  phone: { label: 'Phone', emoji: '📱', color: '#3B82F6', bg: '#EFF6FF' },
  id: { label: 'ID', emoji: '🪪', color: '#8B5CF6', bg: '#F5F3FF' },
  business: { label: 'Business', emoji: '🏢', color: '#10B981', bg: '#ECFDF5' },
};

/**
 * VerificationBadge
 *
 * @param {'email'|'phone'|'id'|'business'} type
 * @param {boolean} verified
 * @param {'sm'|'md'} size
 * @param {boolean} showLabel
 */
export default function VerificationBadge({
  type,
  verified = false,
  size = 'sm',
  showLabel = false,
}) {
  const meta = META[type];
  if (!meta) return null;

  const dims = size === 'md'
    ? { padding: '6px 10px', fontSize: 13, iconSize: 16 }
    : { padding: '3px 8px', fontSize: 11, iconSize: 12 };

  return (
    <span
      title={`${meta.label} ${verified ? 'verified' : 'not verified'}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: dims.padding,
        fontSize: dims.fontSize,
        fontWeight: 500,
        borderRadius: 999,
        background: verified ? meta.bg : '#F3F4F6',
        color: verified ? meta.color : '#9CA3AF',
        border: `1px solid ${verified ? meta.color + '40' : '#E5E7EB'}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: dims.iconSize }} aria-hidden="true">
        {verified ? '✓' : meta.emoji}
      </span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}