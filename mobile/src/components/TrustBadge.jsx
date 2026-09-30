// mobile/src/components/TrustBadge.jsx
import React from 'react';
import useTrustScore from '../hooks/useTrustScore';
import VerificationBadge from './VerificationBadge';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 14, color = 'currentColor', strokeWidth = 1.75, fill = 'none' }) => {
  const icons = {
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    check: "M20 6L9 17l-5-5",
    checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    award: "M12 15l-3.5 2 1.33-4.5-3.33-2.5h4.17L12 6l1.33 4h4.17l-3.33 2.5L15.5 17 12 15z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    trending: "M23 6l-9.5 9.5-5-5L1 18",
    flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
    thumbUp: "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  };

  const d = icons[name] || icons.shield;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
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
// EXISTING BADGE TYPES (kept for backward compatibility)
// ============================================================
const BADGE_TYPES = {
  verified: {
    icon: 'shield',
    label: 'Verified',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.08)',
  },
  trusted: {
    icon: 'checkCircle',
    label: 'Trusted',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
  topRated: {
    icon: 'award',
    label: 'Top Rated',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  fastResponder: {
    icon: 'zap',
    label: 'Fast Responder',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.08)',
  },
  memberSince: {
    icon: 'user',
    label: 'Member',
    color: '#64748B',
    bg: 'rgba(100, 116, 139, 0.08)',
  },
  responsive: {
    icon: 'clock',
    label: 'Quick Replies',
    color: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.08)',
  },
  popular: {
    icon: 'trending',
    label: 'Popular',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.08)',
  },
  reliable: {
    icon: 'thumbUp',
    label: 'Reliable',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
};

// ============================================================
// EXISTING TrustBadge COMPONENT (unchanged API)
// ============================================================
const TrustBadge = ({
  type,
  label,
  value,
  icon,
  color,
  variant = 'default',
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const config = type ? BADGE_TYPES[type] : null;

  const displayLabel = label || config?.label || '';
  const displayIcon = icon || config?.icon || 'shield';
  const displayColor = color || config?.color || '#64748B';
  const displayBg = config?.bg || `${displayColor}15`;

  const finalLabel = value ? `${displayLabel} ${value}` : displayLabel;

  return (
    <span
      className={`trust-badge trust-badge-${size} trust-badge-${variant} ${className}`}
      style={
        variant === 'solid'
          ? { background: displayColor, color: '#FFFFFF', borderColor: displayColor }
          : variant === 'outline'
          ? { borderColor: displayColor, color: displayColor, background: 'transparent' }
          : variant === 'minimal'
          ? { background: 'transparent', color: displayColor, border: 'none' }
          : { background: displayBg, color: displayColor, border: '1px solid transparent' }
      }
    >
      {showIcon && (
        <Icon
          name={displayIcon}
          size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12}
          color={variant === 'solid' ? '#FFFFFF' : displayColor}
          strokeWidth={size === 'sm' ? 2 : 1.75}
        />
      )}
      <span className="trust-badge-label">{finalLabel}</span>

      <style jsx>{`
        .trust-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 20px;
          font-family: inherit;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
          line-height: 1;
        }

        .trust-badge-sm { padding: 3px 8px; font-size: 10px; gap: 3px; }
        .trust-badge-md { padding: 4px 10px; font-size: 11px; }
        .trust-badge-lg { padding: 6px 12px; font-size: 12px; }

        .trust-badge-label {
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .trust-badge:hover { transform: translateY(-1px); }

        @media (max-width: 480px) {
          .trust-badge-md { padding: 3px 8px; font-size: 10px; }
          .trust-badge-lg { padding: 5px 10px; font-size: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .trust-badge { transition: none; }
          .trust-badge:hover { transform: none; }
        }
      `}</style>
    </span>
  );
};

// ============================================================
// EXISTING TrustBadgeGroup (kept for backward compatibility)
// ============================================================
export const TrustBadgeGroup = ({
  badges = [],
  size = 'md',
  variant = 'default',
  max = 3,
  className = '',
}) => {
  const visibleBadges = badges.slice(0, max);
  const remaining = badges.length - max;

  return (
    <div className={`trust-badge-group ${className}`}>
      {visibleBadges.map((badge, idx) => (
        <TrustBadge
          key={idx}
          type={badge.type}
          label={badge.label}
          value={badge.value}
          icon={badge.icon}
          color={badge.color}
          size={size}
          variant={variant}
        />
      ))}
      {remaining > 0 && (
        <span className="trust-badge-more">+{remaining}</span>
      )}

      <style jsx>{`
        .trust-badge-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .trust-badge-more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 8px;
          border-radius: 20px;
          background: #F1F5F9;
          color: #64748B;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
        }
      `}</style>
    </div>
  );
};

// ============================================================
// ★ NEW: Tier-driven badge. Reads real trust data for a user.
// ============================================================
const TIER_META = {
  0: { label: 'Unverified', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)', icon: 'shield' },
  1: { label: 'Phone Verified', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'checkCircle' },
  2: { label: 'ID Verified', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', icon: 'shield' },
  3: { label: 'Business Verified', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: 'award' },
};

export const TrustTierBadge = ({
  userId,
  size = 'md',
  showLabel = true,
  variant = 'default',
  className = '',
}) => {
  const { tier, loading } = useTrustScore(userId);

  if (loading) {
    return (
      <span
        className={`trust-badge trust-badge-${size} ${className}`}
        style={{ background: '#F3F4F6', width: 70, height: 20, display: 'inline-block' }}
      />
    );
  }

  const meta = TIER_META[tier] || TIER_META[0];

  return (
    <TrustBadge
      icon={meta.icon}
      label={meta.label}
      color={meta.color}
      variant={variant}
      size={size}
      showIcon={showLabel}
      className={className}
    />
  );
};

// ============================================================
// ★ NEW: Real-data badge group — pulls tier + verification flags
// ============================================================
export const RealTrustBadgeGroup = ({
  userId,
  size = 'sm',
  variant = 'default',
  showLabels = false,
  max = 4,
  className = '',
}) => {
  const {
    trust,
    loading,
    emailVerified,
    phoneVerified,
    idVerified,
    businessVerified,
  } = useTrustScore(userId);

  if (loading) {
    return (
      <div className={`trust-badge-group ${className}`} style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 40,
              height: 18,
              background: '#F3F4F6',
              borderRadius: 999,
              display: 'inline-block',
            }}
          />
        ))}
      </div>
    );
  }

  if (!trust) return null;

  const visible = [
    { type: 'email', verified: emailVerified },
    { type: 'phone', verified: phoneVerified },
    { type: 'id', verified: idVerified },
    { type: 'business', verified: businessVerified },
  ]
    .filter((v) => v.verified)
    .slice(0, max);

  if (visible.length === 0) {
    return (
      <div className={className}>
        <TrustTierBadge userId={userId} size={size} variant={variant} showLabel={showLabels} />
      </div>
    );
  }

  return (
    <div className={`trust-badge-group ${className}`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {visible.map((v, i) => (
        <VerificationBadge
          key={i}
          type={v.type}
          verified
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  );
};

export { Icon };
export default TrustBadge;