// mobile/src/components/RoleChoiceBlock.jsx
//
// Model C — landing page role block.
// Shows only when the user has no CHOSEN role yet.
// 'customer' (DB default), 'guest', null, and '' all count as "not chosen".
// Disappears once picked. Never gates browsing.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastContainer';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 22, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    shopping: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
    store: 'M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9',
    wrench: 'M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
  };
  const d = icons[name] || icons.shopping;
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
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
};

// Roles that mean "user has chosen". Anything else → show the block.
const CHOSEN_ROLES = new Set(['buyer', 'seller', 'provider', 'both', 'business', 'admin']);

const RoleChoiceBlock = () => {
  const navigate = useNavigate();
  const { user, setRoleAsBuyer } = useAuth();
  const { success } = useToast();

  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---------- Visibility ----------
  // Hide if:
  //   * no user record yet (Supabase still initializing)
  //   * user manually dismissed this session
  //   * user.role is a CHOSEN role
  const roleValue = String(user?.role || '').toLowerCase();
  const alreadyChosen = CHOSEN_ROLES.has(roleValue);

  if (!user || dismissed || alreadyChosen) return null;

  // ---------- Handlers ----------

  const handleBuyer = async () => {
    setLoading(true);
    const result = await setRoleAsBuyer();
    setLoading(false);

    if (result.success) {
      success("Welcome! You can start browsing right away 🛍️");
      // No navigation — they're already on the landing page
    } else {
      // Fall back to the safe path
      navigate('/role-selection', { replace: true });
    }
  };

  const handleSeller = () => {
    navigate('/login', {
      state: {
        from: '/profile-setup',
        role: 'seller',
        reason: 'signup',
      },
    });
  };

  const handleProvider = () => {
    navigate('/login', {
      state: {
        from: '/profile-setup',
        role: 'provider',
        reason: 'signup',
      },
    });
  };

  // ---------- Render ----------
  return (
    <div className="role-block-wrap">
      <div className="role-block">
        <button
          className="dismiss-btn"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <Icon name="x" size={16} color="#9C9482" strokeWidth={2} />
        </button>

        <div className="role-block-header">
          <h2 className="role-block-title">How will you use Kumsika?</h2>
          <p className="role-block-subtitle">
            Pick what fits — you can change it later.
          </p>
        </div>

        <div className="role-options">
          <button
            className="role-option buyer"
            onClick={handleBuyer}
            disabled={loading}
          >
            <div className="role-icon-wrap buyer">
              <Icon name="shopping" size={22} color="#3B82F6" />
            </div>
            <div className="role-text">
              <span className="role-name">I'm here to buy</span>
              <span className="role-desc">Browse, message sellers — no signup</span>
            </div>
            <div className="role-arrow">
              <Icon name="arrowRight" size={16} color="#3B82F6" strokeWidth={2} />
            </div>
          </button>

          <button className="role-option seller" onClick={handleSeller}>
            <div className="role-icon-wrap seller">
              <Icon name="store" size={22} color="#D99A3B" />
            </div>
            <div className="role-text">
              <span className="role-name">I want to sell</span>
              <span className="role-desc">List products, reach local buyers</span>
            </div>
            <div className="role-arrow">
              <Icon name="arrowRight" size={16} color="#D99A3B" strokeWidth={2} />
            </div>
          </button>

          <button className="role-option provider" onClick={handleProvider}>
            <div className="role-icon-wrap provider">
              <Icon name="wrench" size={22} color="#8B5CF6" />
            </div>
            <div className="role-text">
              <span className="role-name">I offer services</span>
              <span className="role-desc">Get hired for your skills</span>
            </div>
            <div className="role-arrow">
              <Icon name="arrowRight" size={16} color="#8B5CF6" strokeWidth={2} />
            </div>
          </button>
        </div>

        <p className="role-block-footnote">
          Browsing is always free. Signup only needed to post.
        </p>
      </div>

      <style jsx>{`
        .role-block-wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 14px 20px 2px;
        }

        .role-block {
          position: relative;
          background: #FFFDF8;
          border: 1px solid #EFE6CE;
          border-radius: 16px;
          padding: 22px 20px 18px;
          box-shadow:
            0 2px 6px rgba(22, 38, 31, 0.04),
            0 12px 30px rgba(22, 38, 31, 0.06);
          animation: fadeInUp 0.4s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dismiss-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border: none;
          background: #F7F1E3;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dismiss-btn:hover { background: #ECE3CC; }

        .role-block-header {
          margin-bottom: 16px;
          text-align: center;
        }

        .role-block-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: #201F1B;
          letter-spacing: -0.01em;
          margin: 0 0 4px;
        }

        .role-block-subtitle {
          font-size: 13px;
          color: #9C9482;
          margin: 0;
        }

        .role-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .role-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 16px 12px;
          border: 1.5px solid #EFE6CE;
          border-radius: 12px;
          background: #FFFDF8;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          position: relative;
        }

        .role-option:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(22, 38, 31, 0.08);
        }

        .role-option:disabled { opacity: 0.6; cursor: not-allowed; }

        .role-option.buyer:hover:not(:disabled) {
          border-color: #3B82F6;
          background: rgba(59, 130, 246, 0.03);
        }
        .role-option.seller:hover {
          border-color: #D99A3B;
          background: rgba(217, 154, 59, 0.03);
        }
        .role-option.provider:hover {
          border-color: #8B5CF6;
          background: rgba(139, 92, 246, 0.03);
        }

        .role-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .role-icon-wrap.buyer { background: rgba(59, 130, 246, 0.1); }
        .role-icon-wrap.seller { background: rgba(217, 154, 59, 0.12); }
        .role-icon-wrap.provider { background: rgba(139, 92, 246, 0.1); }

        .role-text { display: flex; flex-direction: column; gap: 3px; }

        .role-name {
          font-size: 14px;
          font-weight: 700;
          color: #201F1B;
        }

        .role-desc {
          font-size: 11px;
          color: #9C9482;
          line-height: 1.4;
        }

        .role-arrow {
          position: absolute;
          bottom: 8px;
          right: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .role-option:hover .role-arrow { opacity: 1; }

        .role-block-footnote {
          text-align: center;
          font-size: 11px;
          color: #9C9482;
          margin: 14px 0 0;
        }

        @media (max-width: 640px) {
          .role-block-wrap { padding: 12px 16px 2px; }
          .role-options { grid-template-columns: 1fr; }
          .role-option {
            flex-direction: row;
            text-align: left;
            padding: 14px;
            gap: 14px;
          }
          .role-text { flex: 1; align-items: flex-start; }
          .role-arrow { position: static; opacity: 1; margin-left: auto; }
        }

        @media (max-width: 420px) {
          .role-block { padding: 18px 14px 14px; border-radius: 14px; }
          .role-block-title { font-size: 16px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .role-block { animation: none; }
          .role-option, .dismiss-btn, .role-arrow { transition: none; }
          .role-option:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default RoleChoiceBlock;