// mobile/src/pages/Notifications.jsx
import React, { useState, useEffect } from 'react';
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
// MOCK NOTIFICATIONS
// ============================================================
const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1',
    type: 'message',
    title: 'New message from Grace M.',
    description: 'Yes, still available! When can you pick up?',
    time: '2 minutes ago',
    timestamp: Date.now() - 2 * 60 * 1000,
    read: false,
    actionLink: '/chat/thread-1',
  },
  {
    id: 'n-2',
    type: 'reservation',
    title: 'Reservation confirmed',
    description: 'Your reservation for "Fresh Tomatoes" is confirmed for pickup today at 4pm.',
    time: '15 minutes ago',
    timestamp: Date.now() - 15 * 60 * 1000,
    read: false,
    actionLink: '/my-reservations',
  },
  {
    id: 'n-3',
    type: 'request',
    title: 'New booking request',
    description: 'James N. wants to book your Electrician service tomorrow at 10am.',
    time: '1 hour ago',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: false,
    actionLink: '/incoming-requests',
  },
  {
    id: 'n-4',
    type: 'like',
    title: '3 people liked your listing',
    description: 'Your "Maize, 50kg bag" listing is getting attention.',
    time: '3 hours ago',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    read: true,
    actionLink: '/dashboard',
  },
  {
    id: 'n-5',
    type: 'review',
    title: 'New 5-star review',
    description: 'Mary T. rated your "Fresh Tomatoes" 5 stars and left a comment.',
    time: '5 hours ago',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    read: true,
    actionLink: '/dashboard',
  },
  {
    id: 'n-6',
    type: 'reservation',
    title: 'Reservation expired',
    description: 'Your reservation for "Onions, per kg" expired because it was not collected.',
    time: 'Yesterday',
    timestamp: Date.now() - 24 * 60 * 60 * 1000,
    read: true,
    actionLink: '/my-reservations',
    variant: 'warning',
  },
  {
    id: 'n-7',
    type: 'message',
    title: 'New message from Chikondi B.',
    description: 'I can come tomorrow morning around 10',
    time: 'Yesterday',
    timestamp: Date.now() - 26 * 60 * 60 * 1000,
    read: true,
    actionLink: '/chat/thread-2',
  },
  {
    id: 'n-8',
    type: 'system',
    title: 'Welcome to Kumsika!',
    description: 'Your account is all set up. Start browsing listings in Mitundu.',
    time: '3 days ago',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    read: true,
    actionLink: '/landing',
  },
];

// ============================================================
// TYPE CONFIG
// ============================================================
const TYPE_CONFIG = {
  message: { icon: 'message', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.08)' },
  reservation: { icon: 'package', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
  request: { icon: 'clock', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  like: { icon: 'heart', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
  review: { icon: 'star', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
  system: { icon: 'info', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.08)' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState('all');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [loading, setLoading] = useState(false);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch real notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const response = await notificationsAPI.getNotifications(user.id);
        if (response.data?.success && response.data.notifications?.length > 0) {
          setNotifications(response.data.notifications);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navigate
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    success('All notifications marked as read');
  };

  const handleClearAll = () => {
    if (!window.confirm('Clear all notifications?')) return;
    setNotifications([]);
    success('Notifications cleared');
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  // Group by date
  const groupNotificationsByDate = (items) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const groups = { today: [], yesterday: [], earlier: [] };

    items.forEach(item => {
      const diff = now - item.timestamp;
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

    return (
      <div
        key={notification.id}
        className={`notification-card ${isUnread ? 'unread' : ''}`}
        onClick={() => handleNotificationClick(notification)}
      >
        {/* Unread Bar */}
        {isUnread && <div className="unread-bar" />}

        {/* Icon */}
        <div 
          className="notification-icon-wrap"
          style={{ background: config.bg, color: config.color }}
        >
          <Icon name={config.icon} size={18} color={config.color} strokeWidth={1.75} />
        </div>

        {/* Content */}
        <div className="notification-content">
          <div className="notification-header">
            <span className={`notification-title ${isUnread ? 'bold' : ''}`}>
              {notification.title}
            </span>
            {isUnread && <span className="unread-dot" />}
          </div>
          <p className="notification-desc">{notification.description}</p>
          <span className="notification-time">
            <Icon name="clock" size={10} color="#94A3B8" strokeWidth={1.75} />
            {notification.time}
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
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
          </button>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="header-action-btn" onClick={handleMarkAllAsRead}>
                <Icon name="checkCheck" size={16} color="#64748B" strokeWidth={1.75} />
              </button>
            )}
            {notifications.length > 0 && (
              <button className="header-action-btn" onClick={handleClearAll}>
                <Icon name="x" size={16} color="#64748B" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="bell" size={14} color="#F59E0B" strokeWidth={1.75} />
            <span>Inbox</span>
          </div>
          <h1 className="page-title">
            Notifications
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
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
        {filteredNotifications.length > 0 ? (
          <>
            {/* Today */}
            {groups.today.length > 0 && (
              <section className="notification-group">
                <h2 className="group-title">Today</h2>
                <div className="notifications-list">
                  {groups.today.map(renderNotificationCard)}
                </div>
              </section>
            )}

            {/* Yesterday */}
            {groups.yesterday.length > 0 && (
              <section className="notification-group">
                <h2 className="group-title">Yesterday</h2>
                <div className="notifications-list">
                  {groups.yesterday.map(renderNotificationCard)}
                </div>
              </section>
            )}

            {/* Earlier */}
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
              <Icon name="filter" size={48} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No {activeFilter} notifications</h3>
            <p className="empty-text">
              Try switching to a different filter
            </p>
            <button 
              className="empty-btn"
              onClick={() => setActiveFilter('all')}
            >
              Show All
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <Icon name="bell" size={48} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">You're all caught up!</h3>
            <p className="empty-text">
              New messages, reservations, and updates will appear here
            </p>
            <button 
              className="empty-btn"
              onClick={() => navigate('/landing')}
            >
              <Icon name="search" size={14} color="#FFFFFF" strokeWidth={2} />
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
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? '#FFFFFF' : '#94A3B8'} strokeWidth={1.75} />
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
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .notifications-page {
            padding-bottom: 40px;
          }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: #FFFFFF;
          padding: 14px 16px 16px;
          border-bottom: 1px solid #F1F5F9;
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
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-btn:hover {
          background: #F1F5F9;
        }

        .header-actions {
          display: flex;
          gap: 6px;
        }

        .header-action-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-action-btn:hover {
          background: #F1F5F9;
        }

        .header-content {
          max-width: 700px;
          margin: 0 auto 14px;
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
          margin-bottom: 8px;
        }

        .page-title {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .unread-badge {
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          background: #F59E0B;
          padding: 3px 10px;
          border-radius: 12px;
          min-width: 24px;
          text-align: center;
        }

        .page-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== FILTER CHIPS ===== */
        .filter-chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          max-width: 700px;
          margin: 0 auto;
        }

        .filter-chips::-webkit-scrollbar {
          display: none;
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .filter-chip:hover {
          border-color: #94A3B8;
        }

        .filter-chip.active {
          background: #1E293B;
          border-color: #1E293B;
          color: #FFFFFF;
        }

        .chip-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: #F59E0B;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 16px;
        }

        /* ===== GROUPS ===== */
        .notification-group {
          margin-bottom: 20px;
        }

        .group-title {
          font-size: 12px;
          font-weight: 700;
          color: #94A3B8;
          margin: 0 0 8px 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* ===== NOTIFICATION CARD ===== */
        .notification-card {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .notification-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .notification-card.unread {
          background: #FEFCF5;
          border-color: rgba(245, 158, 11, 0.15);
        }

        .unread-bar {
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          background: #F59E0B;
          border-radius: 0 3px 3px 0;
        }

        .notification-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
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
          color: #1E293B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }

        .notification-title.bold {
          font-weight: 700;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #F59E0B;
          flex-shrink: 0;
        }

        .notification-desc {
          font-size: 13px;
          color: #64748B;
          margin: 0 0 6px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notification-card.unread .notification-desc {
          color: #475569;
        }

        .notification-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
        }

        /* ===== EMPTY ===== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #F1F5F9;
        }

        .empty-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 17px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
        }

        .empty-text {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 20px;
          line-height: 1.5;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }

        .empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .empty-btn:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.4);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }

        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
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
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label.active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .page-header {
            padding: 12px 12px 14px;
          }
          .main-content {
            padding: 12px;
          }
          .page-title {
            font-size: 20px;
          }
          .notification-card {
            padding: 12px;
            gap: 10px;
          }
          .notification-icon-wrap {
            width: 36px;
            height: 36px;
          }
          .notification-title {
            font-size: 13px;
          }
          .notification-desc {
            font-size: 12px;
          }
        }

        @media (max-width: 380px) {
          .header-btn,
          .header-action-btn {
            width: 34px;
            height: 34px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .notification-card,
          .filter-chip,
          .empty-btn {
            transition: none;
          }
          .notification-card:hover,
          .empty-btn:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;