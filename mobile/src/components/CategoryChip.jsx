// mobile/src/components/CategoryChip.jsx
import React from 'react';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 14, color = 'currentColor', strokeWidth = 1.75, fill = 'none' }) => {
  const icons = {
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
    hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
    wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    bag: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
    coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
    shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
    tool: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    smartphone: "M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01",
    book: "M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    check: "M20 6L9 17l-5-5",
  };

  const d = icons[name] || icons.store;
  
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
// CATEGORY CHIP COMPONENT
// ============================================================
const CategoryChip = ({
  category,
  active = false,
  onClick,
  variant = 'default', // 'default' | 'filled' | 'outline'
  size = 'md', // 'sm' | 'md' | 'lg'
  showIcon = true,
  showCount = false,
  count,
  disabled = false,
  className = '',
}) => {
  // Support both string and object
  const label = typeof category === 'string' ? category : category?.label;
  const iconName = typeof category === 'object' ? category?.icon : category?.iconKey;
  const color = typeof category === 'object' ? category?.color : undefined;
  const emoji = typeof category === 'object' ? category?.emoji : undefined;

  const handleClick = () => {
    if (disabled) return;
    if (onClick) onClick(category);
  };

  // Determine color
  const activeColor = color || '#F59E0B';

  return (
    <button
      className={`category-chip category-chip-${size} category-chip-${variant} ${active ? 'active' : ''} ${disabled ? 'disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      style={active ? { 
        background: activeColor, 
        borderColor: activeColor,
        color: '#FFFFFF' 
      } : {}}
    >
      {/* Icon or Emoji */}
      {emoji ? (
        <span className="chip-emoji">{emoji}</span>
      ) : iconName && showIcon ? (
        <Icon
          name={iconName}
          size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14}
          color={active ? '#FFFFFF' : activeColor}
          strokeWidth={1.75}
        />
      ) : null}

      {/* Label */}
      <span className="chip-label">{label}</span>

      {/* Count */}
      {showCount && count !== undefined && (
        <span className={`chip-count ${active ? 'chip-count-active' : ''}`}>
          {count}
        </span>
      )}

      <style jsx>{`
        .category-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 20px;
          cursor: pointer;
          font-family: inherit;
          white-space: nowrap;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          user-select: none;
          border: 1.5px solid transparent;
        }

        /* ===== SIZES ===== */
        .category-chip-sm {
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 500;
          gap: 4px;
        }

        .category-chip-md {
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
        }

        .category-chip-lg {
          padding: 9px 18px;
          font-size: 14px;
          font-weight: 600;
        }

        /* ===== VARIANTS ===== */
        .category-chip-default {
          background: #FFFFFF;
          border-color: #E2E8F0;
          color: #475569;
        }

        .category-chip-default:hover:not(.disabled) {
          border-color: #94A3B8;
          background: #F8FAFC;
          transform: translateY(-1px);
        }

        .category-chip-filled {
          background: #F8FAFC;
          border-color: transparent;
          color: #475569;
        }

        .category-chip-filled:hover:not(.disabled) {
          background: #F1F5F9;
          transform: translateY(-1px);
        }

        .category-chip-outline {
          background: transparent;
          border-color: #E2E8F0;
          color: #64748B;
        }

        .category-chip-outline:hover:not(.disabled) {
          border-color: #94A3B8;
          color: #1E293B;
        }

        /* ===== ACTIVE ===== */
        .category-chip.active {
          color: #FFFFFF;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(30, 41, 59, 0.12);
          transform: translateY(0);
        }

        .category-chip.active:hover:not(.disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 41, 59, 0.15);
        }

        /* ===== DISABLED ===== */
        .category-chip.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== ELEMENTS ===== */
        .chip-emoji {
          font-size: 1em;
          line-height: 1;
          flex-shrink: 0;
        }

        .chip-label {
          line-height: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .chip-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: #F1F5F9;
          color: #64748B;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .chip-count-active {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        /* ===== ACTIVE STATE FOR EMOJI ===== */
        .category-chip.active .chip-emoji {
          filter: brightness(1.2);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .category-chip-md {
            padding: 6px 12px;
            font-size: 12px;
          }
          .category-chip-lg {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .category-chip {
            transition: none;
          }
          .category-chip:hover:not(.disabled),
          .category-chip.active:hover:not(.disabled) {
            transform: none;
          }
        }
      `}</style>
    </button>
  );
};

export default CategoryChip;