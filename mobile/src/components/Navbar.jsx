// mobile/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { notificationsAPI } from '../services/api';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.75,
  className = '',
  fill = 'none',
}) => {
  const icons = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    dashboard:
      'M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3',
    plus: 'M12 4v16m8-8H4',
    ai: 'M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
    menu: 'M4 6h16M4 12h16M4 18h16',
    close: 'M6 18L18 6M6 6l12 12',
    bell: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
    clock:
      'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    check: 'M20 6L9 17l-5-5',
    sparkles:
      'M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    mic: 'M19 10v2a7 7 0 01-14 0v-2M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM8 21h8',
    store:
      'M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9',
    settings:
      'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z',
    trending: 'M23 6l-9.5 9.5-5-5L1 18',
  };

  const d = icons[name] || icons.home;

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
// NOTIFICATION ICON MAP
// ============================================================
const NOTIFICATION_ICONS = {
  message: '💬',
  view: '👁️',
  order: '📦',
  reservation: '📦',
  request: '⏰',
  heart: '❤️',
  like: '❤️',
  star: '⭐',
  review: '⭐',
  award: '🏆',
  system: '🔔',
  default: '🔔',
};

// ============================================================
// NAVBAR COMPONENT
// ============================================================
const Navbar = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const notificationRef = useRef(null);
  const bellRef = useRef(null);
  const lastFetchRef = useRef(0);

  const isMobile = windowWidth <= 768;

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resize effect
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // ============================================================
  // FETCH NOTIFICATIONS — hardened against network / undefined
  // ============================================================
  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoadingNotifications(true);
    try {
      const response = await notificationsAPI.getNotifications(user.id);

      // ✅ Safe access — response.data may be undefined on errored responses
      const list = response?.data?.notifications ?? [];
      const ok = response?.data?.success ?? true;

      setNotifications(ok && Array.isArray(list) ? list : []);
    } catch (err) {
      // ✅ Network / backend down — degrade silently, don't crash the Navbar
      if (err?.response) {
        console.warn('Notifications failed (server):', err.response.status);
      } else if (err?.request) {
        console.warn('Notifications unavailable (network/CORS):', err.message);
      } else {
        console.warn('Notifications failed:', err?.message || err);
      }
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Auto-fetch with a 30s backoff to prevent retry storms during outages
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const now = Date.now();
    if (now - lastFetchRef.current < 30_000) return;
    lastFetchRef.current = now;

    fetchNotifications();
  }, [isAuthenticated, user?.id]);

  // Handlers
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = async (id) => {
    try {
      await notificationsAPI.markAsRead(id, user?.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.warn('Error marking as read:', err?.message || err);
    }
    setIsNotificationsOpen(false);
    navigate('/notifications');
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead(user?.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.warn('Error marking all as read:', err?.message || err);
    }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) fetchNotifications();
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Nav items
  const desktopNavItems = [
    { label: 'Home', path: '/landing', icon: 'home' },
    { label: 'Search', path: '/search', icon: 'search' },
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  ];

  const mobileNavSections = [
    {
      label: 'Main',
      items: [
        { label: 'Home', path: '/landing', icon: 'home' },
        { label: 'Search', path: '/search', icon: 'search' },
        { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      ],
    },
    {
      label: 'Sell',
      items: [
        { label: 'Create Listing', path: '/create-listing', icon: 'plus' },
        { label: 'Voice Listing', path: '/voice-listing', icon: 'mic' },
        { label: 'Ad Generator', path: '/ad-generator', icon: 'sparkles' },
      ],
    },
    {
      label: 'Discover',
      items: [
        { label: 'AI Search', path: '/ai-search', icon: 'ai' },
        { label: 'Price Board', path: '/price-board', icon: 'trending' },
        { label: 'My Reservations', path: '/my-reservations', icon: 'clock' },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Messages', path: '/messages', icon: 'message' },
        { label: 'Notifications', path: '/notifications', icon: 'bell' },
        { label: 'Profile', path: '/profile', icon: 'user' },
        { label: 'Settings', path: '/settings', icon: 'settings' },
        { label: 'About', path: '/about', icon: 'info' },
      ],
    },
  ];

  const isActive = (path) => {
    if (path === '/landing') {
      return location.pathname === '/landing' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link to={isAuthenticated ? '/landing' : '/'} className="logo">
            <div className="logo-icon">
              <span className="logo-icon-text">K</span>
            </div>
            <span className="logo-text">
              Ku<span className="logo-accent">msika</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          {isAuthenticated && (
            <div className="desktop-nav">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${
                    isActive(item.path) ? 'nav-item-active' : ''
                  }`}
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Right Section */}
          <div className="nav-right">
            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="bell-wrapper">
                <button
                  ref={bellRef}
                  onClick={toggleNotifications}
                  className="icon-btn"
                  aria-label="Notifications"
                >
                  <Icon name="bell" size={20} color="#64748B" strokeWidth={1.75} />
                  {unreadCount > 0 && <span className="bell-dot" />}
                </button>

                {isNotificationsOpen && (
                  <div ref={notificationRef} className="notification-dropdown">
                    <div className="notification-header">
                      <h4 className="notification-title">
                        Notifications
                        {unreadCount > 0 && (
                          <span className="notification-badge">{unreadCount}</span>
                        )}
                      </h4>
                      {unreadCount > 0 && (
                        <button className="mark-all-btn" onClick={markAllAsRead}>
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="notification-list">
                      {loadingNotifications ? (
                        <div className="notification-loading">
                          <div className="loading-spinner-small" />
                          <span>Loading...</span>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => {
                          const icon =
                            NOTIFICATION_ICONS[notification.type] ||
                            NOTIFICATION_ICONS.default;
                          return (
                            <div
                              key={notification.id}
                              className={`notification-item ${
                                !notification.read ? 'notification-item-unread' : ''
                              }`}
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <div className="notification-avatar">{icon}</div>
                              <div className="notification-content">
                                <p className="notification-item-title">
                                  {notification.title}
                                  {!notification.read && (
                                    <span className="notification-unread-dot" />
                                  )}
                                </p>
                                <p className="notification-item-desc">
                                  {notification.description}
                                </p>
                                <p className="notification-time">
                                  <Icon
                                    name="clock"
                                    size={10}
                                    color="#94A3B8"
                                    strokeWidth={1.75}
                                  />
                                  {notification.time_ago || 'Just now'}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="notification-empty">
                          <div className="notification-empty-icon">🔔</div>
                          <h4 className="notification-empty-title">All caught up!</h4>
                          <p className="notification-empty-desc">
                            No new notifications
                          </p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="notification-footer">
                        <button
                          className="view-all-btn"
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            navigate('/notifications');
                          }}
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons or Avatar */}
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/profile')}
                className="avatar-btn"
                aria-label="Profile"
              >
                <div className="avatar">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-link">
                  Login
                </Link>
                <Link to="/register" className="auth-link-primary">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hamburger-btn"
              aria-label="Toggle menu"
            >
              <Icon
                name={isMobileMenuOpen ? 'close' : 'menu'}
                size={22}
                color="#1E293B"
                strokeWidth={1.75}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Header */}
            <div className="mobile-header">
              <div className="mobile-logo">
                <div className="mobile-logo-icon">K</div>
                <span>
                  Ku<span className="mobile-logo-accent">msika</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-close"
                aria-label="Close"
              >
                <Icon name="close" size={20} color="#1E293B" strokeWidth={1.75} />
              </button>
            </div>

            {/* User Info */}
            {isAuthenticated && user && (
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-name">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="mobile-user-email">{user?.email}</span>
                </div>
              </div>
            )}

            {/* Navigation Sections */}
            <div className="mobile-nav">
              {isAuthenticated ? (
                mobileNavSections.map((section) => (
                  <div key={section.label} className="mobile-nav-section">
                    <span className="mobile-section-label">{section.label}</span>
                    {section.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`mobile-nav-item ${
                          isActive(item.path) ? 'mobile-nav-item-active' : ''
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon
                          name={item.icon}
                          size={18}
                          color="currentColor"
                          strokeWidth={1.75}
                        />
                        <span>{item.label}</span>
                        {item.path === '/notifications' && unreadCount > 0 && (
                          <span className="mobile-badge">{unreadCount}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                ))
              ) : (
                <>
                  <Link
                    to="/login"
                    className="mobile-nav-item"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon name="user" size={18} color="#64748B" strokeWidth={1.75} />
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="mobile-nav-item mobile-nav-item-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon name="plus" size={18} color="#F59E0B" strokeWidth={1.75} />
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Bottom */}
            <div className="mobile-bottom">
              <span className="mobile-version">v2.0.0</span>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="mobile-signout-btn"
                >
                  <Icon name="logout" size={16} color="#EF4444" strokeWidth={1.75} />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ===== NAVBAR ===== */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
          height: 60px;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }

        .navbar-scrolled {
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 2px 20px rgba(30, 41, 59, 0.04);
        }

        .navbar-inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          height: 100%;
        }

        /* ===== LOGO ===== */
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-icon {
          width: 34px;
          height: 34px;
          background: #1e293b;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(30, 41, 59, 0.15);
        }

        .logo-icon-text {
          color: #f59e0b;
          font-size: 17px;
          font-weight: 700;
          font-family: 'Georgia', serif;
        }

        .logo-text {
          font-family: 'Georgia', serif;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .logo-accent {
          color: #f59e0b;
        }

        /* ===== DESKTOP NAV ===== */
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 4px;
        }

        @media (min-width: 769px) {
          .desktop-nav {
            display: flex;
          }
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .nav-item-active {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
        }

        /* ===== RIGHT SECTION ===== */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .icon-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #f8fafc;
        }

        .bell-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid #ffffff;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }

        .avatar-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
        }

        .auth-buttons {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .auth-link {
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .auth-link:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .auth-link-primary {
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          background: #1e293b;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .auth-link-primary:hover {
          background: #f59e0b;
        }

        .hamburger-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .hamburger-btn:hover {
          background: #f8fafc;
        }

        @media (min-width: 769px) {
          .hamburger-btn {
            display: none;
          }
        }

        /* ===== NOTIFICATION DROPDOWN ===== */
        .bell-wrapper {
          position: relative;
        }

        .notification-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 100px);
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 12px 48px rgba(30, 41, 59, 0.15);
          overflow: hidden;
          z-index: 1001;
          display: flex;
          flex-direction: column;
          animation: dropdownSlide 0.2s ease-out;
        }

        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .notification-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-badge {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          background: #f59e0b;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .mark-all-btn {
          font-size: 12px;
          font-weight: 600;
          color: #f59e0b;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 10px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .mark-all-btn:hover {
          background: #fef3c7;
        }

        .notification-list {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        .notification-list::-webkit-scrollbar {
          width: 3px;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }

        .notification-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          font-size: 13px;
          color: #94a3b8;
        }

        .loading-spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 18px;
          cursor: pointer;
          transition: all 0.15s;
          border-bottom: 1px solid #f8fafc;
        }

        .notification-item:last-child {
          border-bottom: none;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-item-unread {
          background: rgba(245, 158, 11, 0.04);
          border-left: 3px solid #f59e0b;
        }

        .notification-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-item-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .notification-unread-dot {
          width: 6px;
          height: 6px;
          background: #f59e0b;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .notification-item-desc {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94a3b8;
        }

        .notification-empty {
          text-align: center;
          padding: 32px 20px;
        }

        .notification-empty-icon {
          font-size: 40px;
          margin-bottom: 8px;
        }

        .notification-empty-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px;
        }

        .notification-empty-desc {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
        }

        .notification-footer {
          padding: 10px 18px;
          border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .view-all-btn {
          width: 100%;
          padding: 10px;
          background: #f8fafc;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .view-all-btn:hover {
          background: #f1f5f9;
        }

        /* ===== MOBILE MENU ===== */
        .mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .mobile-menu {
          width: 85%;
          max-width: 340px;
          height: 100%;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .mobile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          font-family: 'Georgia', serif;
        }

        .mobile-logo-icon {
          width: 32px;
          height: 32px;
          background: #1e293b;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f59e0b;
          font-size: 15px;
          font-weight: 700;
        }

        .mobile-logo-accent {
          color: #f59e0b;
        }

        .mobile-close {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #f8fafc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .mobile-close:hover {
          background: #f1f5f9;
        }

        .mobile-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          margin: 12px 16px;
          background: linear-gradient(
            135deg,
            rgba(245, 158, 11, 0.06),
            rgba(245, 158, 11, 0.02)
          );
          border-radius: 12px;
          border: 1px solid rgba(245, 158, 11, 0.15);
          flex-shrink: 0;
        }

        .mobile-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .mobile-user-details {
          flex: 1;
          min-width: 0;
        }

        .mobile-user-name {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-user-email {
          font-size: 11px;
          color: #94a3b8;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mobile-nav {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px;
        }

        .mobile-nav-section {
          margin-bottom: 16px;
        }

        .mobile-section-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 4px 4px;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          text-decoration: none;
          transition: all 0.15s;
          margin-bottom: 2px;
          min-height: 44px;
        }

        .mobile-nav-item:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .mobile-nav-item-active {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
          font-weight: 600;
        }

        .mobile-nav-item-primary {
          color: #f59e0b;
        }

        .mobile-badge {
          margin-left: auto;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #f59e0b;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-bottom {
          padding: 16px;
          border-top: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .mobile-version {
          display: block;
          text-align: center;
          font-size: 10px;
          color: #cbd5e1;
          margin-bottom: 10px;
          font-family: 'SF Mono', monospace;
        }

        .mobile-signout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          color: #ef4444;
          background: #fef2f2;
          border: 1px solid #fecaca;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 44px;
        }

        .mobile-signout-btn:hover {
          background: #fee2e2;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .navbar-inner {
            padding: 0 12px;
          }
          .logo-text {
            font-size: 16px;
          }
          .logo-icon {
            width: 32px;
            height: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bell-dot {
            animation: none;
          }
          .notification-dropdown,
          .mobile-overlay,
          .mobile-menu {
            animation: none;
          }
          .nav-item,
          .icon-btn,
          .avatar,
          .auth-link,
          .auth-link-primary,
          .hamburger-btn,
          .mobile-nav-item,
          .mobile-signout-btn,
          .view-all-btn,
          .mark-all-btn {
            transition: none;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar;