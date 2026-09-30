// mobile/src/components/TrustTierCard.jsx
import React from 'react';

const TIER_META = {
  0: {
    name: 'Unverified',
    description: 'Anonymous browsing only',
    color: '#9CA3AF',
    bg: '#F3F4F6',
    emoji: '⚪',
  },
  1: {
    name: 'Phone Verified',
    description: 'Phone number confirmed',
    color: '#3B82F6',
    bg: '#EFF6FF',
    emoji: '🔵',
  },
  2: {
    name: 'ID Verified',
    description: 'Government ID confirmed',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    emoji: '🟣',
  },
  3: {
    name: 'Business Verified',
    description: 'Registered business confirmed',
    color: '#10B981',
    bg: '#ECFDF5',
    emoji: '🟢',
  },
};

export default function TrustTierCard({
  trust,
  showNextTier = true,
  onClick,
}) {
  if (!trust) {
    return (
      <div style={styles.skeleton}>
        <div style={styles.skeletonLine} />
        <div style={{ ...styles.skeletonLine, width: '60%' }} />
      </div>
    );
  }

  const tier = trust.tier ?? 0;
  const meta = TIER_META[tier] || TIER_META[0];

  const nextTierReq = trust.next_tier_requirements || [];
  const nextTier = TIER_META[tier + 1];

  return (
    <div
      style={{
        ...styles.card,
        background: meta.bg,
        borderColor: meta.color,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <div style={styles.header}>
        <div style={styles.tierBadge}>
          <span style={styles.tierEmoji}>{meta.emoji}</span>
          <span style={{ ...styles.tierName, color: meta.color }}>
            Tier {tier} — {meta.name}
          </span>
        </div>
        <div style={styles.limitRow}>
          <span style={styles.limitLabel}>Escrow limit</span>
          <span style={styles.limitValue}>
            MK {Number(trust.escrow_limit || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <p style={styles.desc}>{meta.description}</p>

      {showNextTier && nextTier && nextTierReq.length > 0 && (
        <div style={styles.nextTier}>
          <span style={styles.nextTierLabel}>Next: {nextTier.name}</span>
          <span style={styles.nextTierReq}>
            Requires: {nextTierReq.join(', ')}
          </span>
        </div>
      )}

      {tier === 3 && (
        <div style={{ ...styles.nextTier, background: '#D1FAE5' }}>
          <span style={{ ...styles.nextTierLabel, color: '#065F46' }}>
            ✓ Highest tier reached
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'all 200ms ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  tierBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tierEmoji: { fontSize: 18 },
  tierName: {
    fontSize: 15,
    fontWeight: 600,
  },
  limitRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  limitLabel: {
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: 700,
    color: '#111827',
  },
  desc: {
    fontSize: 13,
    color: '#4B5563',
    margin: 0,
  },
  nextTier: {
    marginTop: 4,
    background: '#FFFFFF',
    borderRadius: 8,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  nextTierLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
  },
  nextTierReq: {
    fontSize: 11,
    color: '#6B7280',
  },
  skeleton: {
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  skeletonLine: {
    height: 14,
    background: '#F3F4F6',
    borderRadius: 6,
    width: '80%',
  },
};