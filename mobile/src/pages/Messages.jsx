// mobile/src/pages/Messages.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { messagesAPI } from '../services/api';
import { supabase } from '../lib/supabase'; // ✅ REALTIME

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
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
// HELPERS
// ============================================================
const AVATAR_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#EF4444'];

const pickColor = (str) => {
  if (!str) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const initialsOf = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );

  // ✅ REALTIME channel ref
  const channelRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadConversations = useCallback(
    async (opts = {}) => {
      if (!user?.id) return;
      if (!opts.silent) setLoading(true);
      try {
        const res = await messagesAPI.getConversations();
        setThreads(res.data?.conversations || []);
      } catch (err) {
        console.error('Failed to load conversations:', err);
        if (!opts.silent) setThreads([]);
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [user?.id]
  );

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ============================================================
  // ✅ REALTIME SUBSCRIPTION — conversations
  // Fires when last_message_at, unread counts, etc. change.
  // Filter: this user is either participant_one or participant_two.
  // We cannot use a single filter for OR, so we subscribe broadly and
  // filter client-side (RLS + the small row count make this fast).
  // ============================================================
  useEffect(() => {
    if (!user?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT + UPDATE
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          // Only react to conversations we're part of
          const isMine =
            row.participant_one_id === user.id ||
            row.participant_two_id === user.id;
          if (!isMine) return;

          // Update thread in state
          setThreads((prev) => {
            const existing = prev.find((t) => t.id === row.id);
            const isP1 = row.participant_one_id === user.id;

            if (existing) {
              // Merge the changed fields, preserve otherParticipant
              const updated = {
                ...existing,
                lastMessageText: row.last_message_text,
                lastMessageAt: row.last_message_at,
                unreadCount: isP1
                  ? row.unread_count_for_one
                  : row.unread_count_for_two,
              };
              // Re-sort by last_message_at (newest first)
              const others = prev.filter((t) => t.id !== row.id);
              return [updated, ...others].sort((a, b) => {
                const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return bt - at;
              });
            }

            // New conversation — fetch its full shape (with otherParticipant)
            // and add it to the top
            messagesAPI
              .getConversation(row.id)
              .then((res) => {
                const c = res.data?.conversation;
                if (!c) return;
                setThreads((curr) => {
                  if (curr.some((t) => t.id === c.id)) return curr;
                  return [c, ...curr];
                });
              })
              .catch(() => {
                // Fallback: refresh the whole list
                loadConversations({ silent: true });
              });

            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log(`🛰️ Realtime channel [inbox:${user.id}] status:`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, loadConversations]);

  // ✅ REALTIME: refresh on tab focus (catch up on missed events)
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        loadConversations({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadConversations]);

  const filteredThreads = threads.filter((t) => {
    const other = t.otherParticipant || {};
    const name = (other.fullName || other.email || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      name.includes(q) ||
      (t.lastMessageText || '').toLowerCase().includes(q);
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'unread' && t.unreadCount > 0);
    return matchesSearch && matchesFilter;
  });

  const totalUnread = threads.reduce(
    (sum, t) => sum + (t.unreadCount || 0),
    0
  );

  const handleThreadClick = (threadId) => {
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
      <div className="page-header">
        <div className="header-top">
          <h1 className="page-title">
            Messages
            {totalUnread > 0 && <span className="unread-badge">{totalUnread}</span>}
          </h1>
          <button
            className="filter-btn"
            onClick={() => loadConversations()}
            title="Refresh"
          >
            <Icon name="refresh" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
        </div>

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

      <div className="threads-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : filteredThreads.length > 0 ? (
          <div className="threads-list">
            {filteredThreads.map((thread) => {
              const other = thread.otherParticipant || {};
              const name = other.fullName || other.email?.split('@')[0] || 'User';
              const initials = initialsOf(other.fullName, other.email);
              const color = pickColor(other.id || name);

              return (
                <div
                  key={thread.id}
                  className={`thread-card ${thread.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => handleThreadClick(thread.id)}
                >
                  <div className="thread-avatar-wrap">
                    <div
                      className="thread-avatar"
                      style={{ background: `${color}15`, color }}
                    >
                      {initials}
                    </div>
                  </div>

                  <div className="thread-content">
                    <div className="thread-header">
                      <span className="thread-name">{name}</span>
                      <span className="thread-time">
                        {formatTime(thread.lastMessageAt)}
                      </span>
                    </div>
                    <p className="thread-message">
                      {thread.lastMessageText || 'Start the conversation…'}
                    </p>
                  </div>

                  {thread.unreadCount > 0 && (
                    <span className="unread-count">{thread.unreadCount}</span>
                  )}
                </div>
              );
            })}
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
        /* KEEP ALL STYLES FROM THE PREVIOUS VERSION — unchanged */
        .messages-page {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }
        @media (min-width: 769px) {
          .messages-page { padding-bottom: 40px; }
        }
        .page-header {
          background: #FFFFFF; padding: 16px;
          border-bottom: 1px solid #F1F5F9;
          position: sticky; top: 0; z-index: 10;
        }
        .header-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 14px; max-width: 800px;
          margin-left: auto; margin-right: auto;
        }
        .page-title {
          font-size: clamp(22px, 3vw, 26px); font-weight: 700;
          color: #1E293B; margin: 0; display: flex; align-items: center;
          gap: 8px; letter-spacing: -0.5px;
        }
        .unread-badge {
          font-size: 12px; font-weight: 700; color: #FFFFFF;
          background: #F59E0B; padding: 2px 8px;
          border-radius: 10px; min-width: 20px; text-align: center;
        }
        .filter-btn {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid #F1F5F9; background: #FFFFFF;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: all 0.2s;
        }
        .filter-btn:hover { background: #F8FAFC; }
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #F8FAFC; border: 1px solid #F1F5F9;
          border-radius: 12px; padding: 10px 14px;
          max-width: 800px; margin: 0 auto 12px; transition: all 0.2s;
        }
        .search-wrapper:focus-within {
          border-color: #F59E0B; background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06);
        }
        .search-input {
          flex: 1; border: none; outline: none; font-size: 14px;
          color: #1E293B; background: transparent; font-family: inherit;
        }
        .search-input::placeholder { color: #94A3B8; }
        .filter-chips {
          display: flex; gap: 8px; max-width: 800px; margin: 0 auto;
        }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          border: 1px solid #E2E8F0; background: #FFFFFF;
          font-size: 13px; font-weight: 500; color: #64748B;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .filter-chip:hover { border-color: #94A3B8; }
        .filter-chip.active {
          background: #1E293B; border-color: #1E293B; color: #FFFFFF;
        }
        .chip-badge {
          font-size: 10px; font-weight: 700; background: #F59E0B;
          color: #FFFFFF; padding: 1px 6px; border-radius: 8px;
        }
        .threads-container {
          max-width: 800px; margin: 0 auto; padding: 12px 16px;
        }
        .threads-list {
          display: flex; flex-direction: column; gap: 6px;
        }
        .thread-card {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px; background: #FFFFFF;
          border-radius: 12px; border: 1px solid #F1F5F9;
          cursor: pointer; transition: all 0.2s; position: relative;
        }
        .thread-card:hover {
          border-color: #E2E8F0; transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        .thread-card.unread {
          background: #FFFFFF; border-color: rgba(245, 158, 11, 0.2);
        }
        .thread-card.unread::before {
          content: ''; position: absolute; left: 0; top: 12px;
          bottom: 12px; width: 3px; background: #F59E0B;
          border-radius: 0 3px 3px 0;
        }
        .thread-avatar-wrap { position: relative; flex-shrink: 0; }
        .thread-avatar {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700;
        }
        .thread-content { flex: 1; min-width: 0; }
        .thread-header {
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px; margin-bottom: 2px;
        }
        .thread-name {
          font-size: 14px; font-weight: 600; color: #1E293B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .thread-time {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #94A3B8;
          flex-shrink: 0; font-weight: 500;
        }
        .thread-message {
          font-size: 13px; color: #64748B; margin: 0;
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; line-height: 1.4;
        }
        .thread-card.unread .thread-message {
          color: #1E293B; font-weight: 500;
        }
        .unread-count {
          position: absolute; top: 12px; right: 12px;
          min-width: 20px; height: 20px; padding: 0 6px;
          border-radius: 10px; background: #F59E0B;
          color: #FFFFFF; font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .loading-state {
          display: flex; justify-content: center; padding: 60px 20px;
        }
        .loading-spinner {
          width: 32px; height: 32px;
          border: 3px solid #E2E8F0;
          border-top-color: #F59E0B; border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty-state {
          text-align: center; padding: 60px 20px;
          background: #FFFFFF; border-radius: 14px;
          border: 1px solid #F1F5F9;
        }
        .empty-icon {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .empty-title {
          font-size: 17px; font-weight: 700; color: #1E293B;
          margin: 0 0 4px;
        }
        .empty-text {
          font-size: 14px; color: #94A3B8;
          margin: 0 0 20px; line-height: 1.5;
        }
        .empty-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 10px 20px; background: #1E293B;
          border: none; border-radius: 10px; color: #FFFFFF;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: all 0.2s;
        }
        .empty-btn:hover {
          background: #F59E0B; transform: scale(0.98);
        }
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.4);
          display: flex; justify-content: space-around;
          padding: 4px 0 8px; z-index: 100;
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; background: none; border: none; cursor: pointer;
          padding: 4px 8px; font-family: inherit;
          min-width: 44px; position: relative;
        }
        .nav-icon-wrap {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .nav-icon-wrap.active { background: #1E293B; }
        .nav-label { font-size: 9px; font-weight: 500; color: #94A3B8; }
        .nav-label.active { color: #1E293B; font-weight: 600; }
        .nav-badge {
          position: absolute; top: 2px; right: 6px;
          min-width: 16px; height: 16px; padding: 0 4px;
          border-radius: 8px; background: #F59E0B;
          color: #FFFFFF; font-size: 9px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #FFFFFF;
        }
        @media (max-width: 480px) {
          .page-header { padding: 12px; }
          .threads-container { padding: 10px 12px; }
          .page-title { font-size: 20px; }
          .thread-card { padding: 12px; gap: 10px; }
          .thread-avatar { width: 44px; height: 44px; font-size: 14px; }
          .thread-name { font-size: 13px; }
          .thread-message { font-size: 12px; }
        }
        @media (max-width: 380px) {
          .thread-avatar { width: 40px; height: 40px; font-size: 13px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .thread-card, .nav-icon-wrap, .empty-btn { transition: none; }
          .thread-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default Messages;