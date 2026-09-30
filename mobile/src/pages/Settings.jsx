// mobile/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useToast } from '../components/ToastContainer';
import { usePushNotifications } from '../hooks/usePushNotifications';
import useTrustScore from '../hooks/useTrustScore';
import TrustScoreRing from '../components/TrustScoreRing';
import SubscriptionSection from '../components/SubscriptionSection';
import Logo from '../components/Logo';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    chevronRight: "M9 18l6-6-6-6",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    lock: "M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    helpCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01",
    messageCircle: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    fileText: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
    trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
    eyeOff: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22",
    check: "M20 6L9 17l-5-5",
    moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    x: "M18 6L6 18M6 6l12 12",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  };

  const d = icons[name] || icons.info;

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
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

const getUserDisplayName = (user) => {
  if (!user) return 'User';
  const full =
    user.full_name || user.fullName || user.name || user.display_name || '';
  if (full && String(full).trim()) return String(full).trim();
  if (user.email) {
    const prefix = user.email.split('@')[0];
    const cleaned = prefix.split(/[._-]/)[0];
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return 'User';
};

const getInitials = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Settings = () => {
  const { user, logout, updateRole } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currentRole, setCurrentRole] = useState(user?.role || 'buyer');

  // ★ PHASE 3G: trust data
  const { tier, score, loading: trustLoading } = useTrustScore(user?.id);

  const {
    supported: pushSupported,
    permission: pushPermission,
    subscribed: pushSubscribed,
    busy: pushBusy,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications(user?.id);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.role) setCurrentRole(user.role);
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Failed to logout', 'error');
    }
  };

  const handleLanguageChange = (lang) => {
    if (setLanguage) setLanguage(lang);
    success(lang === 'ny' ? 'Chichewa selected' : 'English selected');
  };

  const handleRoleChange = async (role) => {
    setCurrentRole(role);
    if (updateRole) {
      try {
        await updateRole(role);
        success(`Switched to ${role} mode`);
      } catch (err) {
        showToast('Failed to update role', 'error');
      }
    }
  };

  const handleTogglePush = async () => {
    if (pushSubscribed) {
      const res = await unsubscribePush();
      if (res.success) showToast('Push notifications disabled', 'info');
    } else {
      const res = await subscribePush();
      if (res.success) {
        success('Push notifications enabled 🔔');
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const userName = getUserDisplayName(user);
  const userInitial = getInitials(userName);

  const TIER_NAMES = {
    0: 'Unverified',
    1: 'Phone Verified',
    2: 'ID Verified',
    3: 'Business Verified',
  };
  const TIER_COLORS = {
    0: '#9CA3AF',
    1: '#3B82F6',
    2: '#8B5CF6',
    3: '#10B981',
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} color="var(--color-text)" strokeWidth={2.2} />
          </button>
        </div>
        <div className="header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="main-content">
        {/* ★ PHASE 3G: Trust Profile card */}
        <Link to="/trust" className="trust-hero-card">
          <div className="trust-hero-left">
            {trustLoading ? (
              <div className="trust-ring-skeleton" />
            ) : (
              <TrustScoreRing score={score} tier={tier} size={72} stroke={6} />
            )}
          </div>
          <div className="trust-hero-right">
            <div className="trust-hero-label">Trust Profile</div>
            <div
              className="trust-hero-tier"
              style={{ color: TIER_COLORS[tier] || TIER_COLORS[0] }}
            >
              Tier {tier} — {TIER_NAMES[tier] || TIER_NAMES[0]}
            </div>
            <div className="trust-hero-desc">
              View verifications, escrow limit, and score breakdown
            </div>
          </div>
          <Icon
            name="chevronRight"
            size={18}
            color="var(--color-text-muted)"
            strokeWidth={2}
          />
        </Link>

        <Link to="/profile" className="profile-card">
          <div className="profile-avatar">{userInitial}</div>
          <div className="profile-info">
            <span className="profile-name">{userName}</span>
            <span className="profile-email">{user?.email || 'No email'}</span>
          </div>
          <Icon name="chevronRight" size={18} color="var(--color-text-muted)" strokeWidth={2} />
        </Link>

        <div id="subscription">
          <SubscriptionSection />
        </div>

        <section className="settings-section">
          <h2 className="section-title">Account</h2>
          <div className="settings-group">
            {/* ★ PHASE 3G: Trust Profile entry */}
            <Link to="/trust" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'var(--color-primary-tint)' }}>
                <Icon name="shield" size={18} color="var(--color-primary)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Trust Profile</span>
                <span className="item-desc">
                  Tier {tier} — {TIER_NAMES[tier] || TIER_NAMES[0]}
                </span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </Link>

            <Link to="/profile" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'var(--color-primary-tint)' }}>
                <Icon name="user" size={18} color="var(--color-primary)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Edit Profile</span>
                <span className="item-desc">Update your personal information</span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </Link>

            <Link to="/dashboard" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'var(--color-accent-tint)' }}>
                <Icon name="store" size={18} color="var(--color-accent)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Business Information</span>
                <span className="item-desc">Manage your business details</span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </Link>

            <Link to="/my-reservations" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'var(--color-secondary-tint)' }}>
                <Icon name="fileText" size={18} color="var(--color-secondary-hover)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">My Reservations</span>
                <span className="item-desc">View your orders and history</span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </Link>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Role</h2>
          <div className="settings-group">
            <div className="role-selector">
              <p className="role-desc">Choose how you use Kumsika</p>
              <div className="role-options">
                {[
                  { id: 'buyer', label: 'Buyer', emoji: '🛍️' },
                  { id: 'seller', label: 'Seller', emoji: '🏪' },
                  { id: 'provider', label: 'Provider', emoji: '🔧' },
                  { id: 'both', label: 'Both', emoji: '⚡' },
                ].map((role) => (
                  <button
                    key={role.id}
                    className={`role-chip ${currentRole === role.id ? 'active' : ''}`}
                    onClick={() => handleRoleChange(role.id)}
                  >
                    <span className="role-emoji">{role.emoji}</span>
                    <span className="role-label">{role.label}</span>
                    {currentRole === role.id && (
                      <Icon name="check" size={12} color="var(--color-text-inverse)" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Preferences</h2>
          <div className="settings-group">
            <div className="settings-item-static">
              <div className="item-icon-wrap" style={{ background: 'var(--color-secondary-tint)' }}>
                <Icon name="globe" size={18} color="var(--color-secondary-hover)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Language</span>
                <span className="item-desc">
                  {language === 'ny' ? 'Chichewa' : 'English'}
                </span>
              </div>
              <div className="language-toggle">
                <button
                  className={`lang-btn ${language === 'ny' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('ny')}
                  aria-label="Chichewa"
                >
                  🇲🇼
                </button>
                <button
                  className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('en')}
                  aria-label="English"
                >
                  🇬🇧
                </button>
              </div>
            </div>

            <div className="settings-item-static">
              <div className="item-icon-wrap" style={{ background: 'var(--color-accent-tint)' }}>
                <Icon name="bell" size={18} color="var(--color-accent)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">In-app notifications</span>
                <span className="item-desc">Messages, reservations, and updates</span>
              </div>
              <button
                className={`toggle-switch ${notificationsEnabled ? 'on' : ''}`}
                onClick={() => {
                  setNotificationsEnabled(!notificationsEnabled);
                  success(notificationsEnabled ? 'Notifications off' : 'Notifications on');
                }}
                aria-label="Toggle in-app notifications"
              >
                <span className="toggle-thumb" />
              </button>
            </div>

            {pushSupported && (
              <div className="settings-item-static">
                <div className="item-icon-wrap" style={{ background: 'var(--color-secondary-tint)' }}>
                  <Icon name="send" size={18} color="var(--color-secondary-hover)" strokeWidth={1.9} />
                </div>
                <div className="item-content">
                  <span className="item-label">Push notifications</span>
                  <span className="item-desc">
                    {pushPermission === 'denied'
                      ? 'Blocked in your browser settings'
                      : pushSubscribed
                      ? 'You will be notified even when the tab is closed'
                      : 'Get notified about new messages'}
                  </span>
                </div>
                <button
                  className={`toggle-switch ${pushSubscribed ? 'on' : ''}`}
                  onClick={handleTogglePush}
                  disabled={pushBusy || pushPermission === 'denied'}
                  aria-label="Toggle push notifications"
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Support</h2>
          <div className="settings-group">
            <a href="mailto:support@kumsika.com" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'var(--color-primary-tint)' }}>
                <Icon name="helpCircle" size={18} color="var(--color-primary)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Help & Support</span>
                <span className="item-desc">Get help with your account</span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </a>

            <button
              className="settings-item"
              onClick={() => showToast('Report submitted', 'success')}
            >
              <div className="item-icon-wrap" style={{ background: 'var(--color-accent-tint)' }}>
                <Icon name="messageCircle" size={18} color="var(--color-accent)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Report a Problem</span>
                <span className="item-desc">Let us know what's wrong</span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </button>

            <Link to="/about" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'var(--color-secondary-tint)' }}>
                <Icon name="info" size={18} color="var(--color-secondary-hover)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">About Kumsika</span>
                <span className="item-desc">Learn more about the platform</span>
              </div>
              <Icon name="chevronRight" size={16} color="var(--color-text-muted)" strokeWidth={2} />
            </Link>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title danger">Danger Zone</h2>
          <div className="settings-group">
            <button className="settings-item danger" onClick={() => setShowLogoutConfirm(true)}>
              <div className="item-icon-wrap" style={{ background: 'var(--color-error-bg)' }}>
                <Icon name="logout" size={18} color="var(--color-error)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label danger-text">Log Out</span>
                <span className="item-desc">Sign out of your account</span>
              </div>
            </button>

            <button className="settings-item danger" onClick={() => setShowDeleteConfirm(true)}>
              <div className="item-icon-wrap" style={{ background: 'var(--color-error-bg)' }}>
                <Icon name="trash" size={18} color="var(--color-error)" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label danger-text">Delete Account</span>
                <span className="item-desc">Permanently delete your account</span>
              </div>
            </button>
          </div>
        </section>

        <div className="app-info">
          <div className="app-logo">
            <Logo variant="full" size={50} clickable={false} />
          </div>
          <p className="app-version">Version 2.0.0</p>
          <p className="app-copyright">
            © {new Date().getFullYear()} Kumsika — Built for Malawi 🇲🇼
          </p>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <Icon name="logout" size={28} color="var(--color-error)" strokeWidth={1.85} />
            </div>
            <h3 className="modal-title">Log out?</h3>
            <p className="modal-desc">
              You'll need to sign in again to access your account.
            </p>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button className="modal-btn danger" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap danger">
              <Icon name="trash" size={28} color="var(--color-error)" strokeWidth={1.85} />
            </div>
            <h3 className="modal-title">Delete account?</h3>
            <p className="modal-desc">
              This will permanently delete your account, listings, and all data. This
              action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="modal-btn secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="modal-btn danger"
                onClick={() => {
                  showToast('Account deletion requested. Contact support to confirm.', 'info');
                  setShowDeleteConfirm(false);
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'messageCircle' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const active = item.id === 'profile';
            return (
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon
                    name={item.icon}
                    size={20}
                    color={active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)'}
                    strokeWidth={1.85}
                  />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .settings-page { padding-bottom: 40px; }
        }

        .page-header {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 14px 16px 20px;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-top {
          margin-bottom: 12px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .header-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .header-btn:hover {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .header-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: clamp(24px, 3.2vw, 28px);
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 13.5px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .main-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        /* ★ PHASE 3G: Trust hero card */
        .trust-hero-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: linear-gradient(135deg, #F0F9FF, #FFFFFF);
          border: 1px solid #BFDBFE;
          border-radius: var(--radius-2xl);
          text-decoration: none;
          color: inherit;
          margin-bottom: 12px;
          transition: all 0.22s ease;
          box-shadow: var(--shadow-xs);
        }

        .trust-hero-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .trust-hero-left { flex-shrink: 0; }

        .trust-ring-skeleton {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(90deg, #E5E7EB, #F3F4F6, #E5E7EB);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .trust-hero-right {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .trust-hero-label {
          font-size: 10.5px;
          font-weight: 800;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .trust-hero-tier {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .trust-hero-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          line-height: 1.4;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          text-decoration: none;
          color: inherit;
          margin-bottom: 24px;
          transition: all 0.22s ease;
          box-shadow: var(--shadow-xs);
        }

        .profile-card:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .profile-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: var(--color-primary);
          color: var(--color-text-inverse);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: var(--shadow-primary);
          letter-spacing: 0.02em;
        }

        .profile-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-name {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .profile-email {
          font-size: 12.5px;
          color: var(--color-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .settings-section { margin-bottom: 24px; }

        .section-title {
          font-size: 11.5px;
          font-weight: 800;
          color: var(--color-text-muted);
          margin: 0 0 10px 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .section-title.danger { color: var(--color-error); }

        .settings-group {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
          box-shadow: var(--shadow-xs);
        }

        .settings-item,
        .settings-item-static {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          border: none;
          background: transparent;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: background var(--transition-fast);
          border-bottom: 1px solid var(--color-border);
        }

        .settings-item:last-child,
        .settings-item-static:last-child {
          border-bottom: none;
        }

        .settings-item:hover { background: var(--color-surface-alt); }
        .settings-item-static { cursor: default; }

        .item-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .item-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }

        .item-label.danger-text { color: var(--color-error); }

        .item-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .role-selector { padding: 16px; }

        .role-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 12px;
          font-weight: 500;
        }

        .role-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .role-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 12px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface-alt);
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
          min-height: 46px;
        }

        .role-chip:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-tint);
          color: var(--color-text);
        }

        .role-chip.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-primary);
        }

        .role-emoji { font-size: 15px; }
        .role-label { font-size: 13px; }

        .language-toggle {
          display: flex;
          gap: 4px;
          padding: 3px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-lg);
          flex-shrink: 0;
          border: 1px solid var(--color-border);
        }

        .lang-btn {
          width: 38px;
          height: 32px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .lang-btn:hover { background: var(--color-border); }

        .lang-btn.active {
          background: var(--color-surface);
          box-shadow: var(--shadow-xs);
        }

        .toggle-switch {
          position: relative;
          width: 46px;
          height: 27px;
          border-radius: 14px;
          border: none;
          background: var(--color-border-strong);
          cursor: pointer;
          padding: 3px;
          transition: all 0.28s ease;
          flex-shrink: 0;
        }

        .toggle-switch.on {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }

        .toggle-switch:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-thumb {
          display: block;
          width: 21px;
          height: 21px;
          border-radius: 50%;
          background: var(--color-surface);
          transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
          box-shadow: 0 2px 4px rgba(10, 36, 114, 0.2);
        }

        .toggle-switch.on .toggle-thumb { transform: translateX(19px); }

        .app-info {
          text-align: center;
          padding: 28px 16px 16px;
        }

        .app-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .app-version {
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin: 0 0 4px;
          font-family: var(--font-mono);
        }

        .app-copyright {
          font-size: 11px;
          color: var(--color-text-muted);
          margin: 0;
          opacity: 0.7;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 36, 114, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          max-width: 380px;
          width: 100%;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: var(--shadow-2xl);
          animation: slideUp 0.25s ease-out;
          border: 1px solid var(--color-border);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-icon-wrap {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: var(--color-error-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .modal-title {
          font-family: var(--font-serif);
          font-size: 19px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .modal-desc {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin: 0 0 24px;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-btn {
          flex: 1;
          padding: 13px;
          border-radius: var(--radius-xl);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all var(--transition-fast);
          min-height: 46px;
        }

        .modal-btn.secondary {
          background: var(--color-surface-alt);
          border: 1.5px solid var(--color-border);
          color: var(--color-text-secondary);
        }

        .modal-btn.secondary:hover { background: var(--color-border); }

        .modal-btn.danger {
          background: var(--color-error);
          border: none;
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-error);
        }

        .modal-btn.danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(220, 38, 38, 0.35);
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 10px;
          z-index: 100;
        }

        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-family: inherit;
          min-width: 44px;
        }

        .nav-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }

        .nav-icon-wrap.active {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }

        .nav-btn:hover .nav-icon-wrap:not(.active) {
          background: var(--color-surface-alt);
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .nav-label.active {
          color: var(--color-text);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .page-header { padding: 12px 12px 16px; }
          .main-content { padding: 16px 12px; }
          .page-title { font-size: 22px; }
          .profile-card { padding: 14px; }
          .profile-avatar { width: 48px; height: 48px; font-size: 17px; }
          .settings-item,
          .settings-item-static { padding: 13px 14px; }
          .trust-hero-card { padding: 14px; gap: 12px; }
          .trust-hero-tier { font-size: 15px; }
        }

        @media (max-width: 380px) {
          .role-options { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          .settings-item,
          .profile-card,
          .trust-hero-card,
          .role-chip,
          .toggle-switch,
          .lang-btn,
          .modal-btn,
          .nav-icon-wrap { transition: none; }
          .profile-card:hover,
          .trust-hero-card:hover,
          .modal-btn.danger:hover { transform: none; }
          .modal-overlay,
          .modal-content { animation: none; }
          .trust-ring-skeleton { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Settings;