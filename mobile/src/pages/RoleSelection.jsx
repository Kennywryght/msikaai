// mobile/src/pages/RoleSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 24, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    shopping: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87",
    check: "M20 6L9 17l-5-5",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  };

  const d = icons[name] || icons.store;

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
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// ROLES DATA
// ============================================================
const ROLES = [
  {
    id: 'buyer',
    name: 'Buyer',
    emoji: '🛍️',
    description: 'Browse and buy products or hire services from local sellers',
    icon: 'shopping',
    color: '#3B82F6',
    features: ['Browse listings', 'Contact sellers', 'Reserve items'],
    recommended: false,
  },
  {
    id: 'seller',
    name: 'Seller',
    emoji: '🏪',
    description: 'List your products and reach customers in your area',
    icon: 'store',
    color: '#F59E0B',
    features: ['Post products', 'Manage storefront', 'Track analytics'],
    recommended: false,
  },
  {
    id: 'provider',
    name: 'Service Provider',
    emoji: '🔧',
    description: 'Offer your skills and get hired by local customers',
    icon: 'wrench',
    color: '#8B5CF6',
    features: ['List services', 'Set rates', 'Get booking requests'],
    recommended: false,
  },
  {
    id: 'both',
    name: 'Both',
    emoji: '⚡',
    description: 'Buy and sell — full access to everything Kumsika offers',
    icon: 'zap',
    color: '#10B981',
    features: ['Everything included', 'Switch anytime', 'Maximum flexibility'],
    recommended: true,
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const RoleSelection = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If user already has a role set, preselect it
  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      showToast('Please select a role to continue', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Buyers have nothing further to set up, so onboarding
      // finishes right here. Seller/Provider/Both still need
      // ProfileSetup, so onboarding_completed stays false until
      // that step finishes there.
      const isBuyerOnly = selectedRole === 'buyer';

      await updateProfile({
        role: selectedRole,
        ...(isBuyerOnly ? { onboarding_completed: true } : {}),
      });

      success('Role saved! 🎉');

      if (isBuyerOnly) {
        navigate('/landing', { replace: true });
      } else {
        // Seller, Provider, or Both → go to profile setup
        navigate('/profile-setup', { replace: true });
      }
    } catch (err) {
      console.error('Error saving role:', err);
      showToast('Failed to save role. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-selection">
      <div className="selection-card">
        {/* Header */}
        <div className="card-header">
          <div className="header-badge">
            <Icon name="sparkles" size={14} color="#F59E0B" strokeWidth={1.75} />
            <span>Step 1 of 2</span>
          </div>
          <h1 className="card-title">How will you use Kumsika?</h1>
          <p className="card-subtitle">
            Choose your primary role. You can switch anytime from settings.
          </p>
        </div>

        {/* Role Options */}
        <div className="roles-list">
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                className={`role-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
                style={isSelected ? { borderColor: role.color } : {}}
              >
                {/* Recommended badge */}
                {role.recommended && (
                  <span className="recommended-badge">Most Popular</span>
                )}

                <div className="role-main">
                  <div
                    className={`role-icon ${isSelected ? 'active' : ''}`}
                    style={isSelected ? { background: `${role.color}15` } : {}}
                  >
                    <Icon
                      name={role.icon}
                      size={22}
                      color={isSelected ? role.color : '#94A3B8'}
                      strokeWidth={1.75}
                    />
                  </div>

                  <div className="role-content">
                    <div className="role-title-row">
                      <h3 className="role-name">
                        {role.emoji} {role.name}
                      </h3>
                      <div
                        className={`role-check ${isSelected ? 'selected' : ''}`}
                        style={isSelected ? { background: role.color, borderColor: role.color } : {}}
                      >
                        {isSelected && (
                          <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.5} />
                        )}
                      </div>
                    </div>
                    <p className="role-desc">{role.description}</p>

                    {/* Features (visible when selected) */}
                    {isSelected && (
                      <div className="role-features">
                        {role.features.map((feature, idx) => (
                          <span key={idx} className="feature-tag">
                            <Icon name="check" size={10} color={role.color} strokeWidth={2.5} />
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Note */}
        <div className="info-note">
          <Icon name="info" size={14} color="#94A3B8" strokeWidth={1.75} />
          <span>You can always change this later in your settings</span>
        </div>

        {/* Continue Button */}
        <button
          className={`continue-btn ${selectedRole ? 'active' : ''}`}
          onClick={handleContinue}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <Icon name="arrowRight" size={16} color="#FFFFFF" strokeWidth={2} />
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .role-selection {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
        }

        /* ===== CARD ===== */
        .selection-card {
          max-width: 520px;
          width: 100%;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 32px 28px;
          border: 1px solid #F1F5F9;
          box-shadow: 0 4px 24px rgba(30, 41, 59, 0.04);
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== HEADER ===== */
        .card-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.08);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #F59E0B;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 8px;
          font-family: 'Georgia', serif;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .card-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
          line-height: 1.5;
          max-width: 380px;
          margin: 0 auto;
        }

        /* ===== ROLES LIST ===== */
        .roles-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .role-card {
          position: relative;
          padding: 16px;
          border-radius: 14px;
          border: 2px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.25s ease;
          background: #FFFFFF;
        }

        .role-card:hover {
          border-color: #E2E8F0;
          background: #FAFBFC;
          transform: translateY(-1px);
        }

        .role-card.selected {
          background: #FAFBFC;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.06);
        }

        .recommended-badge {
          position: absolute;
          top: -8px;
          right: 16px;
          background: #10B981;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .role-main {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .role-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .role-content {
          flex: 1;
          min-width: 0;
        }

        .role-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .role-name {
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .role-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }

        .role-desc {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
          line-height: 1.5;
        }

        /* ===== FEATURES ===== */
        .role-features {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #F1F5F9;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .feature-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          color: #64748B;
          background: #F8FAFC;
          padding: 3px 10px;
          border-radius: 8px;
        }

        /* ===== INFO NOTE ===== */
        .info-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #F1F5F9;
          font-size: 12px;
          color: #94A3B8;
          margin-bottom: 16px;
        }

        /* ===== CONTINUE BUTTON ===== */
        .continue-btn {
          width: 100%;
          padding: 14px;
          background: #E2E8F0;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #94A3B8;
          cursor: not-allowed;
          transition: all 0.25s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
        }

        .continue-btn.active {
          background: #1E293B;
          color: #FFFFFF;
          cursor: pointer;
        }

        .continue-btn.active:hover:not(:disabled) {
          background: #F59E0B;
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
        }

        .continue-btn:disabled {
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .selection-card {
            padding: 24px 20px;
            border-radius: 16px;
          }
          .card-title {
            font-size: 20px;
          }
          .role-card {
            padding: 14px;
          }
          .role-icon {
            width: 40px;
            height: 40px;
          }
          .role-icon svg {
            width: 18px;
            height: 18px;
          }
          .role-name {
            font-size: 14px;
          }
          .role-desc {
            font-size: 12px;
          }
        }

        @media (max-width: 380px) {
          .selection-card {
            padding: 20px 16px;
          }
          .card-title {
            font-size: 18px;
          }
          .role-card {
            padding: 12px;
          }
          .role-icon {
            width: 36px;
            height: 36px;
          }
          .role-icon svg {
            width: 16px;
            height: 16px;
          }
          .continue-btn {
            padding: 12px;
            font-size: 14px;
            min-height: 44px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .selection-card,
          .role-features {
            animation: none;
          }
          .role-card,
          .role-icon,
          .role-check,
          .continue-btn {
            transition: none;
          }
          .role-card:hover {
            transform: none;
          }
          .continue-btn.active:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default RoleSelection;