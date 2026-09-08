// mobile/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { notificationsAPI } from '../services/api';

// ============================================================
// PREMIUM LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  dashboard: "M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3",
  plus: "M12 4v16m8-8H4",
  ai: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  check: "M20 6L9 17l-5-5",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  mic: "M19 10v2a7 7 0 01-14 0v-2M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM8 21h8",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
};

// ============================================================
// NOTIFICATION ICON MAP
// ============================================================
const NOTIFICATION_ICONS = {
  message: '💬',
  view: '👁️',
  order: '📦',
  heart: '❤️',
  star: '⭐',
  award: '🏆',
  default: '🔔',
};

const Navbar = () => {
  const { user, signOut, isAuthenticated, userRole } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const bellRef = useRef(null);

  // ============================================================
  // SCROLL EFFECT
  // ============================================================
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================================
  // CLOSE MENUS ON ROUTE CHANGE
  // ============================================================
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // ============================================================
  // CLOSE NOTIFICATION DROPDOWN ON CLICK OUTSIDE
  // ============================================================
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

  // ============================================================
  // FETCH REAL NOTIFICATIONS
  // ============================================================
  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoadingNotifications(true);
    try {
      const response = await notificationsAPI.getNotifications(user.id);
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // ============================================================
  // FETCH NOTIFICATIONS ON MOUNT
  // ============================================================
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchNotifications();
    }
  }, [isAuthenticated, user?.id]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    setIsNotificationsOpen(false);
    navigate('/notifications');
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const toggleNotifications = () => {
    if (!isNotificationsOpen) {
      fetchNotifications();
    }
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================================
  // ✅ NAVIGATION ITEMS - Desktop
  // ============================================================
  const navItems = [
    { label: 'Home', path: '/landing', icon: 'home' },
    { label: 'Search', path: '/search', icon: 'search' },
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  ];

  // ============================================================
  // ✅ MOBILE NAVIGATION ITEMS - ALL PAGES
  // ============================================================
  const mobileNavItems = [
    { label: 'Home', path: '/landing', icon: 'home' },
    { label: 'Search', path: '/search', icon: 'search' },
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'AI Search', path: '/ai-search', icon: 'ai' },
    { label: 'Ad Generator', path: '/ad-generator', icon: 'sparkles' },
    { label: 'Voice Listing', path: '/voice-listing', icon: 'mic' },
    { label: 'Create Listing', path: '/create-listing', icon: 'plus' },
    { label: 'About', path: '/about', icon: 'info' },
    { label: 'Profile', path: '/profile', icon: 'user' },
  ];

  const isActive = (path) => {
    if (path === '/landing') {
      return location.pathname === '/landing' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // ============================================================
  // STYLES
  // ============================================================
  const styles = {
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: isScrolled 
        ? 'rgba(255,255,255,0.98)'
        : 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(226,232,240,0.3)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      boxShadow: isScrolled ? '0 2px 20px rgba(30,41,59,0.06)' : 'none',
      width: '100%',
      maxWidth: '100vw',
    },
    container: {
      width: '100%',
      maxWidth: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '100%',
      gap: '8px',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      textDecoration: 'none',
      flexShrink: 0,
    },
    logoIcon: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #1E293B, #F59E0B)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
    },
    logoIconText: {
      color: '#FFFFFF',
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '16px',
      fontWeight: '700',
    },
    logoText: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '17px',
      fontWeight: '700',
      color: '#1E293B',
      letterSpacing: '-0.02em',
    },
    logoAccent: {
      color: '#F59E0B',
    },
    desktopNav: {
      display: 'none',
      alignItems: 'center',
      gap: '4px',
    },
    navItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#64748B',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
    },
    navItemActive: {
      color: '#F59E0B',
      background: 'rgba(245,158,11,0.08)',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginLeft: 'auto',
      flexShrink: 0,
    },
    
    // ===== NOTIFICATION BELL =====
    bellWrapper: {
      position: 'relative',
    },
    bellBtn: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '40px',
      minHeight: '40px',
      position: 'relative',
    },
    bellDot: {
      position: 'absolute',
      top: '6px',
      right: '6px',
      width: '8px',
      height: '8px',
      background: '#EF4444',
      borderRadius: '50%',
      border: '2px solid #FFFFFF',
    },
    
    // ===== NOTIFICATION DROPDOWN =====
    notificationDropdown: {
      position: 'fixed',
      top: '60px',
      right: '12px',
      width: '380px',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 80px)',
      background: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 12px 48px rgba(30,41,59,0.18)',
      overflow: 'hidden',
      animation: 'dropdownSlide 0.25s ease',
      zIndex: 1001,
      display: 'flex',
      flexDirection: 'column',
    },
    notificationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderBottom: '1px solid #F1F5F9',
      flexShrink: 0,
    },
    notificationTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    notificationBadge: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#FFFFFF',
      background: '#F59E0B',
      padding: '2px 10px',
      borderRadius: '12px',
    },
    markAllBtn: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#F59E0B',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      padding: '4px 10px',
      borderRadius: '6px',
      transition: 'all 0.2s ease',
    },
    notificationList: {
      flex: 1,
      overflowY: 'auto',
      padding: '4px 0',
      minHeight: '100px',
      maxHeight: 'calc(100vh - 180px)',
    },
    notificationItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      padding: '14px 20px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      borderBottom: '1px solid #F8FAFC',
    },
    notificationItemUnread: {
      background: 'rgba(245,158,11,0.04)',
      borderLeft: '3px solid #F59E0B',
    },
    notificationAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: '18px',
      background: '#F1F5F9',
    },
    notificationContent: {
      flex: 1,
      minWidth: 0,
    },
    notificationItemTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1E293B',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    notificationItemDesc: {
      fontSize: '13px',
      color: '#64748B',
      margin: '2px 0 0',
      lineHeight: '1.4',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    notificationTime: {
      fontSize: '11px',
      color: '#94A3B8',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    notificationUnreadDot: {
      width: '8px',
      height: '8px',
      background: '#F59E0B',
      borderRadius: '50%',
      flexShrink: 0,
    },
    notificationEmpty: {
      textAlign: 'center',
      padding: '40px 20px',
    },
    notificationEmptyIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    },
    notificationEmptyTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1E293B',
      margin: 0,
    },
    notificationEmptyDesc: {
      fontSize: '13px',
      color: '#94A3B8',
      margin: '4px 0 0',
    },
    notificationLoading: {
      textAlign: 'center',
      padding: '30px 20px',
      color: '#94A3B8',
    },
    
    // ===== USER AVATAR =====
    avatarBtn: {
      display: 'flex',
      alignItems: 'center',
      padding: '4px',
      borderRadius: '20px',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      minHeight: '40px',
      minWidth: '40px',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #EDE9F5, #F59E0B)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: '700',
      color: '#1E293B',
    },

    // ===== HAMBURGER =====
    hamburger: {
      display: 'flex',
      padding: '8px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      minWidth: '44px',
      minHeight: '44px',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ===== MOBILE OVERLAY =====
    mobileOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(30,41,59,0.5)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      zIndex: 999,
      animation: 'fadeIn 0.25s ease',
    },
    mobileMenu: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: '70%',
      maxWidth: '280px',
      height: '100%',
      background: '#FFFFFF',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-8px 0 40px rgba(30,41,59,0.1)',
      animation: 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowY: 'auto',
    },
    mobileHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '14px',
      borderBottom: '1px solid #F1F5F9',
      marginBottom: '14px',
    },
    mobileLogo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '17px',
      fontWeight: '700',
      color: '#1E293B',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    mobileLogoIcon: {
      width: '30px',
      height: '30px',
      background: 'linear-gradient(135deg, #1E293B, #F59E0B)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF',
      fontSize: '15px',
      fontWeight: '700',
    },
    mobileClose: {
      background: 'none',
      border: 'none',
      padding: '6px',
      cursor: 'pointer',
      borderRadius: '8px',
      minWidth: '40px',
      minHeight: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mobileUserInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      background: '#F8FAFC',
      borderRadius: '10px',
      marginBottom: '14px',
      border: '1px solid #F1F5F9',
    },
    mobileUserAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #EDE9F5, #F59E0B)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '700',
      color: '#1E293B',
    },
    mobileUserName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1E293B',
    },
    mobileUserEmail: {
      fontSize: '11px',
      color: '#94A3B8',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: '140px',
    },
    mobileNav: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: 1,
      overflowY: 'auto',
    },
    mobileNavItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#64748B',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      minHeight: '44px',
    },
    mobileNavItemActive: {
      color: '#F59E0B',
      background: 'rgba(245,158,11,0.08)',
    },
    mobileDivider: {
      height: '1px',
      background: '#F1F5F9',
      margin: '4px 0',
    },
    mobileSectionLabel: {
      fontSize: '10px',
      fontWeight: '600',
      color: '#94A3B8',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      padding: '8px 14px 4px',
    },
    mobileBottom: {
      borderTop: '1px solid #F1F5F9',
      paddingTop: '14px',
      marginTop: 'auto',
    },
    mobileVersion: {
      textAlign: 'center',
      fontSize: '10px',
      color: '#94A3B8',
      marginTop: '10px',
    },
    authButtons: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center',
    },
    authLink: {
      padding: '6px 10px',
      fontSize: '13px',
      fontWeight: '500',
      color: '#64748B',
      textDecoration: 'none',
      borderRadius: '8px',
      transition: 'all 0.2s ease',
      minHeight: '36px',
      display: 'flex',
      alignItems: 'center',
    },
    authLinkActive: {
      color: '#F59E0B',
      background: 'rgba(245,158,11,0.08)',
    },
    mobileSignOut: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#EF4444',
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      cursor: 'pointer',
      fontFamily: 'inherit',
      width: '100%',
      minHeight: '44px',
      transition: 'all 0.2s ease',
    },
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.container}>
          <Link to={isAuthenticated ? '/landing' : '/'} style={styles.logo}>
            <div style={styles.logoIcon}>
              <span style={styles.logoIconText}>K</span>
            </div>
            <span style={styles.logoText}>
              Kum<span style={styles.logoAccent}>sika</span>
            </span>
          </Link>

          {isAuthenticated && (
            <div style={styles.desktopNav} className="desktop-nav">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    ...styles.navItem,
                    ...(isActive(item.path) ? styles.navItemActive : {}),
                  }}
                >
                  <Icon d={ICONS[item.icon]} size={16} color="currentColor" strokeWidth={1.75} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          <div style={styles.rightSection}>
            {/* Notification Bell */}
            {isAuthenticated && (
              <div style={styles.bellWrapper}>
                <button
                  ref={bellRef}
                  onClick={toggleNotifications}
                  style={styles.bellBtn}
                  aria-label="Notifications"
                >
                  <Icon d={ICONS.bell} size={22} color="#64748B" strokeWidth={1.75} />
                  {unreadCount > 0 && <span style={styles.bellDot} />}
                </button>

                {isNotificationsOpen && (
                  <div ref={notificationRef} style={styles.notificationDropdown}>
                    <div style={styles.notificationHeader}>
                      <h4 style={styles.notificationTitle}>
                        Notifications
                        {unreadCount > 0 && (
                          <span style={styles.notificationBadge}>{unreadCount}</span>
                        )}
                      </h4>
                      {unreadCount > 0 && (
                        <button
                          style={styles.markAllBtn}
                          onClick={markAllAsRead}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#FEF3C7'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={styles.notificationList}>
                      {loadingNotifications ? (
                        <div style={styles.notificationLoading}>
                          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
                          Loading notifications...
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => {
                          const icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
                          return (
                            <div
                              key={notification.id}
                              style={{
                                ...styles.notificationItem,
                                ...(!notification.read ? styles.notificationItemUnread : {}),
                              }}
                              onClick={() => handleNotificationClick(notification.id)}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                              onMouseLeave={(e) => { 
                                e.currentTarget.style.background = !notification.read 
                                  ? 'rgba(245,158,11,0.04)' 
                                  : 'transparent'; 
                              }}
                            >
                              <div style={styles.notificationAvatar}>
                                {icon}
                              </div>
                              <div style={styles.notificationContent}>
                                <p style={styles.notificationItemTitle}>
                                  {notification.title}
                                  {!notification.read && <span style={styles.notificationUnreadDot} />}
                                </p>
                                <p style={styles.notificationItemDesc}>
                                  {notification.description}
                                </p>
                                <p style={styles.notificationTime}>
                                  <Icon d={ICONS.clock} size={12} color="#94A3B8" strokeWidth={1.75} />
                                  {notification.time_ago || 'Just now'}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={styles.notificationEmpty}>
                          <div style={styles.notificationEmptyIcon}>🔔</div>
                          <h4 style={styles.notificationEmptyTitle}>All caught up!</h4>
                          <p style={styles.notificationEmptyDesc}>
                            You have no new notifications.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <button
                onClick={() => navigate('/profile')}
                style={styles.avatarBtn}
                aria-label="Profile"
              >
                <div style={styles.avatar}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </button>
            ) : (
              <div style={styles.authButtons}>
                <Link to="/login" style={styles.authLink}>
                  Login
                </Link>
                <Link to="/register" style={{ ...styles.authLink, ...styles.authLinkActive }}>
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={styles.hamburger}
              className="hamburger-btn"
              aria-label="Toggle menu"
            >
              <Icon d={isMobileMenuOpen ? ICONS.close : ICONS.menu} size={24} color="#1E293B" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileHeader}>
              <div style={styles.mobileLogo}>
                <div style={styles.mobileLogoIcon}>K</div>
                <span>Kum<span style={{ color: '#F59E0B' }}>sika</span></span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={styles.mobileClose}
                aria-label="Close menu"
              >
                <Icon d={ICONS.close} size={20} color="#1E293B" strokeWidth={1.75} />
              </button>
            </div>

            {isAuthenticated && user && (
              <div style={styles.mobileUserInfo}>
                <div style={styles.mobileUserAvatar}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={styles.mobileUserName}>
                    {user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div style={styles.mobileUserEmail}>{user?.email}</div>
                </div>
              </div>
            )}

            <div style={styles.mobileNav}>
              {isAuthenticated ? (
                <>
                  {/* ✅ ALL PAGES IN MOBILE MENU */}
                  {mobileNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      style={{
                        ...styles.mobileNavItem,
                        ...(isActive(item.path) ? styles.mobileNavItemActive : {}),
                      }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon d={ICONS[item.icon]} size={18} color="currentColor" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  <Link to="/login" style={styles.mobileNavItem} onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon d={ICONS.user} size={18} color="#64748B" strokeWidth={1.75} />
                    Login
                  </Link>
                  <Link to="/register" style={{ ...styles.mobileNavItem, ...styles.mobileNavItemActive }} onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon d={ICONS.plus} size={18} color="#F59E0B" strokeWidth={1.75} />
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <div style={styles.mobileBottom}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.mobileVersion}>v2.0.0</span>
              </div>

              {isAuthenticated && (
                <button
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                  style={styles.mobileSignOut}
                >
                  <Icon d={ICONS.logout} size={16} color="#EF4444" strokeWidth={1.75} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0%); opacity: 1; }
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .navbar { padding: 0 8px !important; }
        }

        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
          .desktop-nav { display: flex !important; }
        }

        .hamburger-btn:active,
        .avatar-btn:active,
        .bell-btn:active,
        .mobile-nav-item:active {
          transform: scale(0.96);
        }

        .mobile-nav-item:hover {
          background: #F8FAFC;
        }

        .notification-item:hover {
          background: #F8FAFC !important;
        }

        .mark-all-btn:hover {
          background: #FEF3C7 !important;
        }

        @supports (padding: max(0px)) {
          .navbar {
            padding-left: max(12px, env(safe-area-inset-left));
            padding-right: max(12px, env(safe-area-inset-right));
          }
        }

        body.menu-open {
          overflow: hidden;
        }

        .notification-list::-webkit-scrollbar {
          width: 3px;
        }
        .notification-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .notification-list::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 20px;
        }
      `}</style>
    </>
  );
};

export default Navbar;