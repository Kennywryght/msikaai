// mobile/src/pages/Messages.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    check: "M20 6L9 17l-5-5",
    checkCheck: "M18 6L7 17l-4-4M22 6l-11 11",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    pin: "M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V17h14v-1.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V6h1a2 2 0 000-4H8a2 2 0 000 4h1z",
    filter: "M3 6h18M6 12h12M10 18h4",
    bellOff: "M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14M18 8a6 6 0 00-9.33-5M1 1l22 22",
  };

  const d = icons[name] || icons.message;
  
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
// MOCK THREADS DATA
// ============================================================
const MOCK_THREADS = [
  {
    id: 'thread-1',
    name: 'Grace M.',
    initials: 'GM',
    avatarColor: '#F59E0B',
    lastMessage: 'Yes, still available! When can you pick up?',
    time: '2m',
    unread: 2,
    online: true,
    listing: {
      title: 'Fresh tomatoes, basket',
      price: 'MK650',
      emoji: '🍅',
    },
  },
  {
    id: 'thread-2',
    name: 'Chikondi B.',
    initials: 'CB',
    avatarColor: '#3B82F6',
    lastMessage: 'I can come tomorrow morning around 10',
    time: '1h',
    unread: 0,
    online: true,
    listing: {
      title: 'Electrician, home wiring',
      price: 'MK5,000/visit',
      emoji: '⚡',
    },
  },
  {
    id: 'thread-3',
    name: 'Sarah M.',
    initials: 'SM',
    avatarColor: '#EC4899',
    lastMessage: 'Great, I\'ll send you the address',
    time: '3h',
    unread: 0,
    online: false,
    listing: {
      title: 'Secondhand shirts',
      price: 'MK1,000-2,500',
      emoji: '👕',
    },
  },
  {
    id: 'thread-4',
    name: 'Peter K.',
    initials: 'PK',
    avatarColor: '#10B981',
    lastMessage: 'Thanks for the business!',
    time: 'Yesterday',
    unread: 0,
    online: false,
    listing: {
      title: 'Maize, basket',
      price: 'MK350',
      emoji: '🌽',
    },
  },
  {
    id: 'thread-5',
    name: 'Mary T.',
    initials: 'MT',
    avatarColor: '#8B5CF6',
    lastMessage: 'Can you do MK500 for the bag?',
    time: 'Yesterday',
    unread: 1,
    online: false,
    listing: {
      title: 'Cement, 50kg bag',
      price: 'MK18,000',
      emoji: '🏗️',
    },
  },
  {
    id: 'thread-6',
    name: 'James N.',
    initials: 'JN',
    avatarColor: '#EF4444',
    lastMessage: 'See you tomorrow at 4pm 👋',
    time: '2d',
    unread: 0,
    online: false,
    listing: {
      title: 'Plumber, per hour',
      price: 'MK4,000',
      emoji: '🔧',
    },
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = !searchQuery ||
      thread.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'unread' && thread.unread > 0);

    return matchesSearch && matchesFilter;
  });

  const totalUnread = threads.reduce((sum, t) => sum + t.unread, 0);

  const handleThreadClick = (threadId) => {
    // Mark as read
    setThreads(prev => 
      prev.map(t => t.id === threadId ? { ...t, unread: 0 } : t)
    );
    navigate(`/chat/${threadId}`);
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <div className="messages-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <h1 className="page-title">
            Messages
            {totalUnread > 0 && (
              <span className="unread-badge">{totalUnread}</span>
            )}
          </h1>
          <button className="filter-btn" onClick={() => showToast('Filter options coming soon', 'info')}>
            <Icon name="filter" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Icon name="search" size={16} color="#94A3B8" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            autoComplete="off"
          />
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
            {totalUnread > 0 && <span className="chip-badge">{totalUnread}</span>}
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="threads-container">
        {filteredThreads.length > 0 ? (
          <div className="threads-list">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={`thread-card ${thread.unread > 0 ? 'unread' : ''}`}
                onClick={() => handleThreadClick(thread.id)}
              >
                {/* Avatar */}
                <div className="thread-avatar-wrap">
                  <div 
                    className="thread-avatar"
                    style={{ background: `${thread.avatarColor}15`, color: thread.avatarColor }}
                  >
                    {thread.initials}
                  </div>
                  {thread.online && <span className="online-dot" />}
                </div>

                {/* Content */}
                <div className="thread-content">
                  <div className="thread-header">
                    <span className="thread-name">{thread.name}</span>
                    <span className="thread-time">
                      {thread.unread > 0 && <span className="unread-dot" />}
                      {thread.time}
                    </span>
                  </div>

                  <p className="thread-message">
                    {thread.lastMessage}
                  </p>

                  <div className="thread-listing">
                    <span className="listing-emoji">{thread.listing.emoji}</span>
                    <span className="listing-title">{thread.listing.title}</span>
                    <span className="listing-price">{thread.listing.price}</span>
                  </div>
                </div>

                {/* Unread Badge */}
                {thread.unread > 0 && (
                  <span className="unread-count">{thread.unread}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="message" size={40} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </h3>
            <p className="empty-text">
              {searchQuery 
                ? 'Try a different search term'
                : 'Start a conversation by contacting a seller'}
            </p>
            {!searchQuery && (
              <button className="empty-btn" onClick={() => navigate('/landing')}>
                <Icon name="search" size={14} color="#FFFFFF" strokeWidth={2} />
                Browse Listings
              </button>
            )}
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
                {item.id === 'messages' && totalUnread > 0 && (
                  <span className="nav-badge">{totalUnread}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .messages-page {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .messages-page {
            padding-bottom: 40px;
          }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: #FFFFFF;
          padding: 16px;
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
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .page-title {
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.5px;
        }

        .unread-badge {
          font-size: 12px;
          font-weight: 700;
          color: #FFFFFF;
          background: #F59E0B;
          padding: 2px 8px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }

        .filter-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #F1F5F9;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #F8FAFC;
        }

        /* ===== SEARCH ===== */
        .search-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          padding: 10px 14px;
          max-width: 800px;
          margin: 0 auto 12px;
          transition: all 0.2s;
        }

        .search-wrapper:focus-within {
          border-color: #F59E0B;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1E293B;
          background: transparent;
          font-family: inherit;
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        /* ===== FILTER CHIPS ===== */
        .filter-chips {
          display: flex;
          gap: 8px;
          max-width: 800px;
          margin: 0 auto;
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
          font-family: inherit;
          transition: all 0.2s;
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
          font-size: 10px;
          font-weight: 700;
          background: #F59E0B;
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: 8px;
        }

        /* ===== THREADS ===== */
        .threads-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 12px 16px;
        }

        .threads-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .thread-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .thread-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .thread-card.unread {
          background: #FFFFFF;
          border-color: rgba(245, 158, 11, 0.2);
        }

        .thread-card.unread::before {
          content: '';
          position: absolute;
          left: 0;
          top: 12px;
          bottom: 12px;
          width: 3px;
          background: #F59E0B;
          border-radius: 0 3px 3px 0;
        }

        /* ===== AVATAR ===== */
        .thread-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .thread-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
        }

        .online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #FFFFFF;
        }

        /* ===== CONTENT ===== */
        .thread-content {
          flex: 1;
          min-width: 0;
        }

        .thread-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }

        .thread-name {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .thread-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94A3B8;
          flex-shrink: 0;
          font-weight: 500;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #F59E0B;
        }

        .thread-message {
          font-size: 13px;
          color: #64748B;
          margin: 0 0 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.4;
        }

        .thread-card.unread .thread-message {
          color: #1E293B;
          font-weight: 500;
        }

        /* ===== LISTING TAG ===== */
        .thread-listing {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: #F8FAFC;
          border-radius: 8px;
          font-size: 11px;
          max-width: 100%;
          overflow: hidden;
        }

        .listing-emoji {
          font-size: 12px;
          flex-shrink: 0;
        }

        .listing-title {
          color: #64748B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .listing-price {
          color: #10B981;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* ===== UNREAD COUNT ===== */
        .unread-count {
          position: absolute;
          top: 12px;
          right: 12px;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #F59E0B;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #F1F5F9;
        }

        .empty-icon {
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
          position: relative;
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

        .nav-badge {
          position: absolute;
          top: 2px;
          right: 6px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 8px;
          background: #F59E0B;
          color: #FFFFFF;
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .page-header {
            padding: 12px;
          }
          .threads-container {
            padding: 10px 12px;
          }
          .page-title {
            font-size: 20px;
          }
          .thread-card {
            padding: 12px;
            gap: 10px;
          }
          .thread-avatar {
            width: 44px;
            height: 44px;
            font-size: 14px;
          }
          .thread-name {
            font-size: 13px;
          }
          .thread-message {
            font-size: 12px;
          }
        }

        @media (max-width: 380px) {
          .thread-avatar {
            width: 40px;
            height: 40px;
            font-size: 13px;
          }
          .thread-listing {
            font-size: 10px;
            padding: 3px 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .thread-card,
          .nav-icon-wrap,
          .empty-btn,
          .continue-btn {
            transition: none;
          }
          .thread-card:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Messages;