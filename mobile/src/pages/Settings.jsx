// mobile/src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { useToast } from '../components/ToastContainer';
import { usePushNotifications } from '../hooks/usePushNotifications';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
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

// ============================================================
// HELPERS
// ============================================================
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

// ============================================================
// MAIN COMPONENT
// ============================================================
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

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} color="#201F1B" strokeWidth={2.2} />
          </button>
        </div>
        <div className="header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Profile Card */}
        <Link to="/profile" className="profile-card">
          <div className="profile-avatar">{userInitial}</div>
          <div className="profile-info">
            <span className="profile-name">{userName}</span>
            <span className="profile-email">{user?.email || 'No email'}</span>
          </div>
          <Icon name="chevronRight" size={18} color="#9C9482" strokeWidth={2} />
        </Link>

        {/* Account Section */}
        <section className="settings-section">
          <h2 className="section-title">Account</h2>
          <div className="settings-group">
            <Link to="/profile" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'rgba(62, 108, 118, 0.12)' }}>
                <Icon name="user" size={18} color="#3E6C76" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Edit Profile</span>
                <span className="item-desc">Update your personal information</span>
              </div>
              <Icon name="chevronRight" size={16} color="#C9BB98" strokeWidth={2} />
            </Link>

            <Link to="/dashboard" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'rgba(217, 154, 59, 0.14)' }}>
                <Icon name="store" size={18} color="#D99A3B" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Business Information</span>
                <span className="item-desc">Manage your business details</span>
              </div>
              <Icon name="chevronRight" size={16} color="#C9BB98" strokeWidth={2} />
            </Link>

            <Link to="/my-reservations" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'rgba(139, 90, 131, 0.12)' }}>
                <Icon name="fileText" size={18} color="#8B5A83" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">My Reservations</span>
                <span className="item-desc">View your orders and history</span>
              </div>
              <Icon name="chevronRight" size={16} color="#C9BB98" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* Role Section */}
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
                      <Icon name="check" size={12} color="#F7F1E3" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="settings-section">
          <h2 className="section-title">Preferences</h2>
          <div className="settings-group">
            {/* Language */}
            <div className="settings-item-static">
              <div className="item-icon-wrap" style={{ background: 'rgba(91, 123, 94, 0.12)' }}>
                <Icon name="globe" size={18} color="#5B7B5E" strokeWidth={1.9} />
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

            {/* In-app notifications */}
            <div className="settings-item-static">
              <div className="item-icon-wrap" style={{ background: 'rgba(217, 154, 59, 0.14)' }}>
                <Icon name="bell" size={18} color="#D99A3B" strokeWidth={1.9} />
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

            {/* Push notifications */}
            {pushSupported && (
              <div className="settings-item-static">
                <div className="item-icon-wrap" style={{ background: 'rgba(139, 90, 131, 0.12)' }}>
                  <Icon name="send" size={18} color="#8B5A83" strokeWidth={1.9} />
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

        {/* Support */}
        <section className="settings-section">
          <h2 className="section-title">Support</h2>
          <div className="settings-group">
            <a href="mailto:support@kumsika.com" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'rgba(62, 108, 118, 0.12)' }}>
                <Icon name="helpCircle" size={18} color="#3E6C76" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Help & Support</span>
                <span className="item-desc">Get help with your account</span>
              </div>
              <Icon name="chevronRight" size={16} color="#C9BB98" strokeWidth={2} />
            </a>

            <button
              className="settings-item"
              onClick={() => showToast('Report submitted', 'success')}
            >
              <div className="item-icon-wrap" style={{ background: 'rgba(188, 91, 52, 0.12)' }}>
                <Icon name="messageCircle" size={18} color="#BC5B34" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">Report a Problem</span>
                <span className="item-desc">Let us know what's wrong</span>
              </div>
              <Icon name="chevronRight" size={16} color="#C9BB98" strokeWidth={2} />
            </button>

            <Link to="/about" className="settings-item">
              <div className="item-icon-wrap" style={{ background: 'rgba(139, 90, 131, 0.12)' }}>
                <Icon name="info" size={18} color="#8B5A83" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label">About Kumsika</span>
                <span className="item-desc">Learn more about the platform</span>
              </div>
              <Icon name="chevronRight" size={16} color="#C9BB98" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="settings-section">
          <h2 className="section-title danger">Danger Zone</h2>
          <div className="settings-group">
            <button className="settings-item danger" onClick={() => setShowLogoutConfirm(true)}>
              <div className="item-icon-wrap" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
                <Icon name="logout" size={18} color="#DC2626" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label danger-text">Log Out</span>
                <span className="item-desc">Sign out of your account</span>
              </div>
            </button>

            <button className="settings-item danger" onClick={() => setShowDeleteConfirm(true)}>
              <div className="item-icon-wrap" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
                <Icon name="trash" size={18} color="#DC2626" strokeWidth={1.9} />
              </div>
              <div className="item-content">
                <span className="item-label danger-text">Delete Account</span>
                <span className="item-desc">Permanently delete your account</span>
              </div>
            </button>
          </div>
        </section>

        {/* App Info */}
        <div className="app-info">
          <div className="app-logo">
            <span className="logo-icon">K</span>
            <span className="logo-text">Kumsika</span>
          </div>
          <p className="app-version">Version 2.0.0</p>
          <p className="app-copyright">
            © {new Date().getFullYear()} Kumsika — Built for Malawi 🇲🇼
          </p>
        </div>
      </div>

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap">
              <Icon name="logout" size={28} color="#DC2626" strokeWidth={1.85} />
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

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap danger">
              <Icon name="trash" size={28} color="#DC2626" strokeWidth={1.85} />
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

      {/* Bottom Nav */}
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
                    color={active ? '#F7F1E3' : '#9C9482'}
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
        /* ========================================================
           SETTINGS — warm, editorial, matches the marketplace
           ======================================================== */
        .settings-page {
          min-height: 100vh;
          background: #F7F1E3;
          background-image: radial-gradient(rgba(217, 154, 59, 0.06) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #201F1B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .settings-page { padding-bottom: 40px; }
        }

        .page-header {
          background: rgba(255, 253, 248, 0.94);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 14px 16px 20px;
          border-bottom: 1px solid rgba(239, 230, 206, 0.9);
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
          border-radius: 11px;
          border: 1px solid rgba(239, 230, 206, 0.9);
          background: #FFFDF8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .header-btn:hover {
          background: #F7F1E3;
          border-color: rgba(217, 154, 59, 0.4);
        }

        .header-content {
          max-width: 600px;
          margin: 0 auto;
        }

        .page-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(24px, 3.2vw, 28px);
          font-weight: 600;
          color: #201F1B;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 13.5px;
          color: #9C9482;
          margin: 0;
        }

        .main-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        /* ===== PROFILE CARD ===== */
        .profile-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: #FFFDF8;
          border-radius: 16px;
          border: 1px solid rgba(239, 230, 206, 0.9);
          text-decoration: none;
          color: inherit;
          margin-bottom: 24px;
          transition: all 0.22s ease;
          box-shadow: 0 1px 3px rgba(22, 38, 31, 0.04);
        }

        .profile-card:hover {
          border-color: rgba(217, 154, 59, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(22, 38, 31, 0.08);
        }

        .profile-avatar {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          color: #F7F1E3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: 0 6px 16px rgba(36, 69, 59, 0.25);
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
          font-family: 'Fraunces', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          color: #201F1B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.01em;
        }

        .profile-email {
          font-size: 12.5px;
          color: #9C9482;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ===== SECTIONS ===== */
        .settings-section { margin-bottom: 24px; }

        .section-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #9C9482;
          margin: 0 0 10px 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .section-title.danger { color: #DC2626; }

        .settings-group {
          background: #FFFDF8;
          border-radius: 16px;
          border: 1px solid rgba(239, 230, 206, 0.9);
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(22, 38, 31, 0.04);
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
          transition: background 0.15s;
          border-bottom: 1px solid rgba(239, 230, 206, 0.55);
        }

        .settings-item:last-child,
        .settings-item-static:last-child {
          border-bottom: none;
        }

        .settings-item:hover { background: #F7F1E3; }

        .settings-item-static { cursor: default; }

        .item-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 11px;
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
          color: #201F1B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: -0.005em;
        }

        .item-label.danger-text { color: #DC2626; }

        .item-desc {
          font-size: 12px;
          color: #9C9482;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ===== ROLE SELECTOR ===== */
        .role-selector { padding: 16px; }

        .role-desc {
          font-size: 13px;
          color: #6B6259;
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
          border: 1.5px solid rgba(239, 230, 206, 0.9);
          border-radius: 12px;
          background: #F7F1E3;
          font-size: 13px;
          font-weight: 700;
          color: #6B6259;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 46px;
        }

        .role-chip:hover {
          border-color: rgba(217, 154, 59, 0.5);
          background: #FFFDF8;
          color: #201F1B;
        }

        .role-chip.active {
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          border-color: #24453B;
          color: #F7F1E3;
          box-shadow: 0 6px 16px rgba(36, 69, 59, 0.25);
        }

        .role-emoji { font-size: 15px; }
        .role-label { font-size: 13px; }

        /* ===== LANGUAGE ===== */
        .language-toggle {
          display: flex;
          gap: 4px;
          padding: 3px;
          background: #F7F1E3;
          border-radius: 11px;
          flex-shrink: 0;
          border: 1px solid rgba(239, 230, 206, 0.9);
        }

        .lang-btn {
          width: 38px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .lang-btn:hover { background: rgba(239, 230, 206, 0.6); }

        .lang-btn.active {
          background: #FFFDF8;
          box-shadow: 0 2px 6px rgba(22, 38, 31, 0.08);
        }

        /* ===== TOGGLE ===== */
        .toggle-switch {
          position: relative;
          width: 46px;
          height: 27px;
          border-radius: 14px;
          border: none;
          background: #E4D9BD;
          cursor: pointer;
          padding: 3px;
          transition: all 0.28s ease;
          flex-shrink: 0;
        }

        .toggle-switch.on {
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          box-shadow: 0 3px 8px rgba(36, 69, 59, 0.25);
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
          background: #FFFDF8;
          transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.2, 1);
          box-shadow: 0 2px 4px rgba(22, 38, 31, 0.2);
        }

        .toggle-switch.on .toggle-thumb { transform: translateX(19px); }

        /* ===== APP INFO ===== */
        .app-info {
          text-align: center;
          padding: 28px 16px 16px;
        }

        .app-logo {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 8px;
        }

        .logo-icon {
          width: 34px;
          height: 34px;
          border-radius: 11px;
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          color: #F0D9A8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(36, 69, 59, 0.22);
        }

        .logo-text {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          color: #201F1B;
          letter-spacing: -0.01em;
        }

        .app-version {
          font-size: 11.5px;
          color: #9C9482;
          margin: 0 0 4px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        .app-copyright {
          font-size: 11px;
          color: #C9BB98;
          margin: 0;
        }

        /* ===== MODALS ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(22, 38, 31, 0.5);
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
          background: #FFFDF8;
          border-radius: 22px;
          max-width: 380px;
          width: 100%;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(22, 38, 31, 0.28);
          animation: slideUp 0.25s ease-out;
          border: 1px solid rgba(239, 230, 206, 0.9);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-icon-wrap {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .modal-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          color: #201F1B;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .modal-desc {
          font-size: 13.5px;
          color: #6B6259;
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
          border-radius: 13px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 46px;
        }

        .modal-btn.secondary {
          background: #F7F1E3;
          border: 1.5px solid rgba(239, 230, 206, 0.9);
          color: #6B6259;
        }

        .modal-btn.secondary:hover { background: #EFE6CE; }

        .modal-btn.danger {
          background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
          border: none;
          color: #FFFFFF;
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.25);
        }

        .modal-btn.danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(220, 38, 38, 0.35);
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 253, 248, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid rgba(239, 230, 206, 0.9);
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
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }

        .nav-icon-wrap.active {
          background: #24453B;
          box-shadow: 0 4px 10px rgba(36, 69, 59, 0.25);
        }

        .nav-btn:hover .nav-icon-wrap:not(.active) {
          background: rgba(239, 230, 206, 0.6);
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #9C9482;
        }

        .nav-label.active {
          color: #201F1B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .page-header { padding: 12px 12px 16px; }
          .main-content { padding: 16px 12px; }
          .page-title { font-size: 22px; }
          .profile-card { padding: 14px; }
          .profile-avatar { width: 48px; height: 48px; font-size: 17px; }
          .settings-item,
          .settings-item-static { padding: 13px 14px; }
        }

        @media (max-width: 380px) {
          .role-options { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          .settings-item,
          .profile-card,
          .role-chip,
          .toggle-switch,
          .lang-btn,
          .modal-btn,
          .nav-icon-wrap { transition: none; }
          .profile-card:hover,
          .modal-btn.danger:hover { transform: none; }
          .modal-overlay,
          .modal-content { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Settings;