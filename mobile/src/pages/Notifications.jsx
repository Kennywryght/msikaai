// mobile/src/pages/Notifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
    check: "M20 6L9 17l-5-5",
    checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    xCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6",
    trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    alertCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    x: "M18 6L6 18M6 6l12 12",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    filter: "M3 6h18M6 12h12M10 18h4",
    checkCheck: "M18 6L7 17l-4-4M22 6l-11 11",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
  };

  const d = icons[name] || icons.bell;

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
// TYPE CONFIG
// Semantic token mapping per notification category. Values are
// CSS custom-property strings so they work in inline styles.
//   message    → secondary (info)
//   reservation/order → success (money-adjacent, confirmed)
//   request/booking   → warning (in-progress)
//   like              → error   (matches flame-red treatment)
//   review            → warning (same as request, per original)
//   system            → primary (structural info)
//   alert             → error   (attention)
// ============================================================
const TYPE_CONFIG = {
  message:     { icon: 'message',     color: 'var(--color-secondary-hover)', bg: 'var(--color-info-bg)' },
  reservation: { icon: 'package',     color: 'var(--color-success)',         bg: 'var(--color-success-bg)' },
  order:       { icon: 'package',     color: 'var(--color-success)',         bg: 'var(--color-success-bg)' },
  request:     { icon: 'clock',       color: 'var(--color-warning)',         bg: 'var(--color-warning-bg)' },
  booking:     { icon: 'clock',       color: 'var(--color-warning)',         bg: 'var(--color-warning-bg)' },
  like:        { icon: 'heart',       color: 'var(--color-error)',           bg: 'var(--color-error-bg)' },
  review:      { icon: 'star',        color: 'var(--color-warning)',         bg: 'var(--color-warning-bg)' },
  system:      { icon: 'info',        color: 'var(--color-primary)',         bg: 'var(--color-primary-tint)' },
  alert:       { icon: 'alertCircle', color: 'var(--color-error)',           bg: 'var(--color-error-bg)' },
};

// ============================================================
// HELPERS
// ============================================================
const getTimestamp = (n) => {
  if (!n) return 0;
  const raw = n.timestamp ?? n.created_at ?? n.createdAt ?? n.time ?? null;
  if (!raw) return 0;
  if (typeof raw === 'number') return raw;
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const formatRelative = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const normalizeNotification = (raw) => {
  if (!raw) return null;
  return {
    id: String(raw.id ?? raw._id ?? `n-${Math.random().toString(36).slice(2)}`),
    type: raw.type || raw.kind || 'system',
    title: raw.title || raw.subject || 'Notification',
    description: raw.description ?? raw.body ?? raw.message ?? '',
    read: raw.read ?? raw.is_read ?? raw.isRead ?? false,
    actionLink:
      raw.actionLink ??
      raw.action_link ??
      raw.link ??
      raw.url ??
      (raw.data?.link || null),
    variant: raw.variant || null,
    timestamp: getTimestamp(raw),
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchNotifications = useCallback(
    async (opts = {}) => {
      if (!user?.id) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      if (opts.silent) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const response = await notificationsAPI.getNotifications(user.id);
        const raw =
          response.data?.notifications ||
          response.data?.data ||
          response.data ||
          [];
        const list = Array.isArray(raw) ? raw : [];
        const normalized = list.map(normalizeNotification).filter(Boolean);
        normalized.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(normalized);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load notifications'
        );
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && user?.id) fetchNotifications({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [fetchNotifications, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'message') return n.type === 'message';
    if (activeFilter === 'reservation')
      return n.type === 'reservation' || n.type === 'order';
    return n.type === activeFilter;
  });

  const handleNotificationClick = async (notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );

    if (user?.id && notificationsAPI.markAsRead) {
      try {
        await notificationsAPI.markAsRead(notification.id, user.id);
      } catch (err) {
        console.warn('markAsRead failed (non-fatal):', err?.message);
      }
    }

    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      if (notificationsAPI.markAllAsRead) {
        await notificationsAPI.markAllAsRead(user.id);
      }
      success('All notifications marked as read');
    } catch (err) {
      console.warn('markAllAsRead failed:', err?.message);
      showToast('Marked locally — server sync failed', 'info');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    setNotifications([]);
    try {
      if (notificationsAPI.clearAll) {
        await notificationsAPI.clearAll(user.id);
      }
      success('Notifications cleared');
    } catch (err) {
      console.warn('clearAll failed:', err?.message);
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const groupNotificationsByDate = (items) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const groups = { today: [], yesterday: [], earlier: [] };

    items.forEach((item) => {
      const diff = now - (item.timestamp || now);
      if (diff < oneDayMs) groups.today.push(item);
      else if (diff < 2 * oneDayMs) groups.yesterday.push(item);
      else groups.earlier.push(item);
    });

    return groups;
  };

  const groups = groupNotificationsByDate(filteredNotifications);

  const renderNotificationCard = (notification) => {
    const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
    const isUnread = !notification.read;
    const timeLabel = formatRelative(notification.timestamp);

    return (
      <div
        key={notification.id}
        className={`notification-card ${isUnread ? 'unread' : ''}`}
        onClick={() => handleNotificationClick(notification)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNotificationClick(notification);
          }
        }}
      >
        {isUnread && <div className="unread-bar" />}

        <div
          className="notification-icon-wrap"
          style={{ background: config.bg }}
        >
          <Icon name={config.icon} size={18} color={config.color} strokeWidth={1.9} />
        </div>

        <div className="notification-content">
          <div className="notification-header">
            <span className={`notification-title ${isUnread ? 'bold' : ''}`}>
              {notification.title}
            </span>
            {isUnread && <span className="unread-dot" />}
          </div>
          {notification.description && (
            <p className="notification-desc">{notification.description}</p>
          )}
          <span className="notification-time">
            <Icon name="clock" size={10} color="var(--color-text-muted)" strokeWidth={2} />
            {timeLabel}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} color="var(--color-text)" strokeWidth={2.2} />
          </button>
          <div className="header-actions">
            <button
              className="header-action-btn"
              onClick={() => fetchNotifications({ silent: true })}
              disabled={refreshing}
              aria-label="Refresh"
            >
              <Icon
                name="refresh"
                size={16}
                color={refreshing ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'}
                strokeWidth={2}
              />
            </button>
            {unreadCount > 0 && (
              <button
                className="header-action-btn"
                onClick={handleMarkAllAsRead}
                aria-label="Mark all as read"
              >
                <Icon name="checkCheck" size={16} color="var(--color-text-secondary)" strokeWidth={2} />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className="header-action-btn"
                onClick={handleClearAll}
                aria-label="Clear all"
              >
                <Icon name="x" size={16} color="var(--color-text-secondary)" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="bell" size={13} color="var(--color-accent)" strokeWidth={2.1} />
            <span>Inbox</span>
          </div>
          <h1 className="page-title">
            Notifications
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : notifications.length > 0
              ? 'All caught up!'
              : 'Nothing here yet'}
          </p>
        </div>

        {/* Filter Chips */}
        <div className="filter-chips">
          <button
            className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-chip ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread
            {unreadCount > 0 && <span className="chip-badge">{unreadCount}</span>}
          </button>
          <button
            className={`filter-chip ${activeFilter === 'message' ? 'active' : ''}`}
            onClick={() => setActiveFilter('message')}
          >
            Messages
          </button>
          <button
            className={`filter-chip ${activeFilter === 'reservation' ? 'active' : ''}`}
            onClick={() => setActiveFilter('reservation')}
          >
            Orders
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p className="loading-text">Loading your notifications…</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon-wrap empty-icon-error">
              <Icon name="alertCircle" size={40} color="var(--color-error)" strokeWidth={1.6} />
            </div>
            <h3 className="empty-title">Couldn't load notifications</h3>
            <p className="empty-text">{error}</p>
            <button className="empty-btn" onClick={() => fetchNotifications()}>
              <Icon name="refresh" size={14} color="var(--color-text-inverse)" strokeWidth={2.2} />
              Try Again
            </button>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <>
            {groups.today.length > 0 && (
              <section className="notification-group">
                <h2 className="group-title">Today</h2>
                <div className="notifications-list">
                  {groups.today.map(renderNotificationCard)}
                </div>
              </section>
            )}

            {groups.yesterday.length > 0 && (
              <section className="notification-group">
                <h2 className="group-title">Yesterday</h2>
                <div className="notifications-list">
                  {groups.yesterday.map(renderNotificationCard)}
                </div>
              </section>
            )}

            {groups.earlier.length > 0 && (
              <section className="notification-group">
                <h2 className="group-title">Earlier</h2>
                <div className="notifications-list">
                  {groups.earlier.map(renderNotificationCard)}
                </div>
              </section>
            )}
          </>
        ) : activeFilter !== 'all' ? (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Icon name="filter" size={40} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No {activeFilter} notifications</h3>
            <p className="empty-text">Try switching to a different filter.</p>
            <button className="empty-btn" onClick={() => setActiveFilter('all')}>
              Show All
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Icon name="bell" size={40} color="var(--color-text-muted)" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">You're all caught up!</h3>
            <p className="empty-text">
              New messages, orders, and updates will appear here.
            </p>
            <button className="empty-btn" onClick={() => navigate('/landing')}>
              <Icon name="search" size={14} color="var(--color-text-inverse)" strokeWidth={2.2} />
              Browse Listings
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {isMobile && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'message' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const active = item.id === 'messages';
            return (
              <button
                key={item.id}
                className="nav-btn"
                onClick={() => handleBottomNav(item.id)}
              >
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
        .notifications-page {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .notifications-page { padding-bottom: 40px; }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: var(--color-surface);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 14px 16px 16px;
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          max-width: 700px;
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
          transition: all 0.15s;
        }

        .header-btn:hover {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .header-actions { display: flex; gap: 6px; }

        .header-action-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .header-action-btn:hover:not(:disabled) {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .header-action-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .header-content {
          max-width: 700px;
          margin: 0 auto 14px;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--color-accent-tint);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 11.5px;
          color: var(--color-accent);
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: clamp(24px, 3.2vw, 30px);
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .unread-badge {
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 800;
          color: var(--color-text-inverse);
          background: var(--color-accent);
          padding: 4px 10px;
          border-radius: var(--radius-xl);
          min-width: 26px;
          text-align: center;
          box-shadow: var(--shadow-accent);
        }

        .page-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        /* ===== FILTER CHIPS ===== */
        .filter-chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          max-width: 700px;
          margin: 0 auto;
          padding-bottom: 2px;
        }

        .filter-chips::-webkit-scrollbar { display: none; }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.18s;
          flex-shrink: 0;
        }

        .filter-chip:hover {
          border-color: var(--color-accent);
          color: var(--color-text);
        }

        .filter-chip.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-primary);
        }

        .chip-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 18px;
          padding: 0 6px;
          border-radius: 9px;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-size: 10px;
          font-weight: 800;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 18px 16px;
        }

        /* ===== GROUPS ===== */
        .notification-group { margin-bottom: 22px; }

        .group-title {
          font-size: 11.5px;
          font-weight: 800;
          color: var(--color-text-muted);
          margin: 0 0 10px 6px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* ===== NOTIFICATION CARD ===== */
        .notification-card {
          display: flex;
          gap: 13px;
          padding: 14px;
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-xs);
        }

        .notification-card:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .notification-card:focus-visible {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .notification-card.unread {
          background: var(--color-accent-tint);
          border-color: var(--color-accent);
        }

        .unread-bar {
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 14px;
          width: 3.5px;
          background: var(--color-accent);
          border-radius: 0 3px 3px 0;
        }

        .notification-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
        }

        .notification-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
          letter-spacing: -0.005em;
        }

        .notification-title.bold { font-weight: 700; }

        .unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--color-accent);
          flex-shrink: 0;
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .notification-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 6px;
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-card.unread .notification-desc { color: var(--color-text); }

        .notification-time {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        /* ===== LOADING ===== */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 70px 24px;
          text-align: center;
        }

        .loading-spinner {
          width: 34px;
          height: 34px;
          border: 3px solid var(--color-primary-tint);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 14px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-text {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
          font-weight: 500;
        }

        /* ===== EMPTY ===== */
        .empty-state {
          text-align: center;
          padding: 56px 24px 64px;
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xs);
        }

        .empty-icon-wrap {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          background: var(--color-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: var(--shadow-md);
        }

        .empty-icon-error {
          background: var(--color-error-bg);
          box-shadow: var(--shadow-error);
        }

        .empty-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .empty-text {
          font-size: 13.5px;
          color: var(--color-text-muted);
          margin: 0 auto 22px;
          line-height: 1.55;
          max-width: 320px;
        }

        .empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 12px 24px;
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-xl);
          color: var(--color-text-inverse);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          box-shadow: var(--shadow-primary);
          letter-spacing: 0.01em;
        }

        .empty-btn:hover {
          background: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-accent);
        }

        .empty-btn:active { transform: translateY(0); }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--color-surface);
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
          transition: background var(--transition-fast), transform 0.15s;
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

        .nav-label.active { color: var(--color-text); font-weight: 600; }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .page-header { padding: 12px 12px 14px; }
          .main-content { padding: 14px 12px; }
          .page-title { font-size: 22px; }
          .notification-card { padding: 13px; gap: 11px; }
          .notification-icon-wrap { width: 38px; height: 38px; }
          .notification-title { font-size: 13.5px; }
          .notification-desc { font-size: 12.5px; }
        }

        @media (max-width: 380px) {
          .header-btn,
          .header-action-btn { width: 36px; height: 36px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .notification-card,
          .filter-chip,
          .empty-btn,
          .header-btn,
          .header-action-btn { transition: none; }
          .notification-card:hover,
          .empty-btn:hover { transform: none; }
          .loading-spinner { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Notifications;