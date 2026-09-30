// mobile/src/components/TrustScoreRing.jsx
import React from 'react';

const TIER_COLORS = {
  0: '#9CA3AF', // gray
  1: '#3B82F6', // blue
  2: '#8B5CF6', // purple
  3: '#10B981', // green
};

/**
 * TrustScoreRing
 *
 * @param {number} score   - 0 to 100
 * @param {number} tier    - 0 to 3 (determines ring color)
 * @param {number} size    - pixel diameter (default 96)
 * @param {number} stroke  - stroke width (default 8)
 * @param {boolean} showLabel - show score number inside (default true)
 */
export default function TrustScoreRing({
  score = 0,
  tier = 0,
  size = 96,
  stroke = 8,
  showLabel = true,
}) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (safeScore / 100) * circumference;

  const color = TIER_COLORS[tier] || TIER_COLORS[0];

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label={`Trust score ${safeScore} out of 100`}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      </svg>
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: size * 0.28,
              fontWeight: 700,
              color: '#111827',
              lineHeight: 1,
            }}
          >
            {safeScore}
          </span>
          <span
            style={{
              fontSize: size * 0.1,
              color: '#6B7280',
              marginTop: 2,
              letterSpacing: 0.5,
            }}
          >
            TRUST
          </span>
        </div>
      )}
    </div>
  );
}