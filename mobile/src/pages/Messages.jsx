// mobile/src/pages/Messages.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { messagesAPI } from '../services/api';
import { supabase } from '../lib/supabase';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2',
    plus: 'M12 4v16m8-8H4',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    refresh: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
    // ★ New icons for polish
    check: 'M20 6L9 17l-5-5',
    checkCheck: 'M18 6L7 17l-4-4M22 6l-11 11',
    image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
    mic: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
    arrowRight: 'M5 12h14M12 5l7 7-7 7',
    close: 'M18 6L6 18M6 6l12 12',
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

/* Classify last message preview so we can show a tiny icon for
   image / voice messages instead of raw text. */
const previewOf = (thread) => {
  const text = thread.lastMessageText || '';
  const lower = text.toLowerCase();
  if (lower === '[image]') return { kind: 'image', text: 'Photo' };
  if (lower === '[voice message]' || lower === '[voice]')
    return { kind: 'audio', text: 'Voice message' };
  if (lower.startsWith('[image]')) return { kind: 'image', text: text.replace('[image]', '').trim() || 'Photo' };
  if (lower.startsWith('[voice')) return { kind: 'audio', text: 'Voice message' };
  return { kind: 'text', text: text || 'Start the conversation…' };
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

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ============================================================
  // REALTIME (unchanged logic, cleaner merge)
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
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          const isMine =
            row.participant_one_id === user.id ||
            row.participant_two_id === user.id;
          if (!isMine) return;

          setThreads((prev) => {
            const existing = prev.find((t) => t.id === row.id);
            const isP1 = row.participant_one_id === user.id;

            if (existing) {
              const updated = {
                ...existing,
                lastMessageText: row.last_message_text,
                lastMessageAt: row.last_message_at,
                unreadCount: isP1
                  ? row.unread_count_for_one
                  : row.unread_count_for_two,
              };
              const others = prev.filter((t) => t.id !== row.id);
              return [updated, ...others].sort((a, b) => {
                const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return bt - at;
              });
            }

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
              .catch(() => loadConversations({ silent: true }));

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

  // Refresh on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) loadConversations({ silent: true });
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadConversations]);

  // ============================================================
  // DERIVED
  // ============================================================
  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
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
  }, [threads, searchQuery, activeFilter]);

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0),
    [threads]
  );

  const handleThreadClick = (threadId) => {
    navigate(`/chat/${threadId}`);
  };

  const handleClearSearch = () => setSearchQuery('');

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="messages-page">
      {/* ============ HEADER ============ */}
      <header className="page-header">
        <div className="header-inner">
          <div className="header-top">
            <div className="header-title-wrap">
              <h1 className="page-title">Messages</h1>
              {totalUnread > 0 && (
                <span className="unread-badge">{totalUnread}</span>
              )}
            </div>

            <div className="header-actions">
              <button
                className="icon-btn"
                onClick={() => loadConversations()}
                title="Refresh"
                aria-label="Refresh conversations"
              >
                <Icon name="refresh" size={17} color="#64748B" strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="search-wrapper">
            <Icon name="search" size={16} color="#94A3B8" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search by name or message…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoComplete="off"
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button
                className="clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <Icon name="close" size={14} color="#64748B" strokeWidth={2.2} />
              </button>
            )}
          </div>

          <div className="filter-chips">
            <button
              className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
              {threads.length > 0 && (
                <span className="chip-count">{threads.length}</span>
              )}
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
      </header>

      {/* ============ THREADS ============ */}
      <main className="threads-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : filteredThreads.length > 0 ? (
          <ul className="threads-list" role="list">
            {filteredThreads.map((thread) => {
              const other = thread.otherParticipant || {};
              const name = other.fullName || other.email?.split('@')[0] || 'User';
              const initials = initialsOf(other.fullName, other.email);
              const color = pickColor(other.id || name);
              const preview = previewOf(thread);
              const isUnread = thread.unreadCount > 0;

              return (
                <li key={thread.id}>
                  <button
                    className={`thread-card ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleThreadClick(thread.id)}
                    type="button"
                  >
                    <div className="thread-avatar-wrap">
                      <div
                        className="thread-avatar"
                        style={{ background: `${color}15`, color }}
                      >
                        {initials}
                      </div>
                      {isUnread && <span className="thread-online-dot" />}
                    </div>

                    <div className="thread-content">
                      <div className="thread-header">
                        <span className="thread-name">{name}</span>
                        <span className="thread-time">
                          {formatTime(thread.lastMessageAt)}
                        </span>
                      </div>

                      <div className="thread-preview-row">
                        {preview.kind === 'image' && (
                          <span className="preview-icon preview-icon-img">
                            <Icon name="image" size={12} color="#64748B" strokeWidth={2} />
                          </span>
                        )}
                        {preview.kind === 'audio' && (
                          <span className="preview-icon preview-icon-mic">
                            <Icon name="mic" size={11} color="#64748B" strokeWidth={2} />
                          </span>
                        )}
                        <p className={`thread-message ${isUnread ? 'unread' : ''}`}>
                          {preview.text}
                        </p>
                      </div>
                    </div>

                    {isUnread && (
                      <span className="unread-count">
                        {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="empty-state">
            <div className="empty-icon-wrap">
              <div className="empty-icon-inner">
                <Icon name="message" size={34} color="#F59E0B" strokeWidth={1.6} />
              </div>
            </div>
            <h3 className="empty-title">
              {searchQuery
                ? 'No conversations match'
                : activeFilter === 'unread'
                ? "You're all caught up"
                : 'No messages yet'}
            </h3>
            <p className="empty-text">
              {searchQuery
                ? `Nothing matched “${searchQuery}”. Try a different search.`
                : activeFilter === 'unread'
                ? 'Every conversation has been read. Great job!'
                : 'Start a conversation by contacting a seller — they usually reply fast.'}
            </p>
            {!searchQuery && activeFilter === 'all' && (
              <button className="empty-btn" onClick={() => navigate('/landing')}>
                <Icon name="search" size={14} color="#FFFFFF" strokeWidth={2.2} />
                Browse listings
                <Icon name="arrowRight" size={14} color="#FFFFFF" strokeWidth={2.2} />
              </button>
            )}
          </div>
        )}
      </main>

      {/* ============ BOTTOM NAV ============ */}
      {isMobile && (
        <nav className="bottom-nav" aria-label="Primary navigation">
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
                    color={active ? '#FFFFFF' : '#94A3B8'}
                    strokeWidth={1.75}
                  />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>
                  {item.label}
                </span>
                {item.id === 'messages' && totalUnread > 0 && (
                  <span className="nav-badge">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      <style jsx>{`
        /* ============================================================
           MESSAGES PAGE
           ============================================================ */
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

        /* ---------- HEADER ---------- */
        .page-header {
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 16px 16px 14px;
        }
        .header-inner { max-width: 800px; margin: 0 auto; }
        .header-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 14px;
        }
        .header-title-wrap {
          display: flex; align-items: center; gap: 8px;
        }
        .page-title {
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .unread-badge {
          font-size: 12px; font-weight: 700; color: #FFFFFF;
          background: linear-gradient(135deg, #F59E0B, #EA580C);
          padding: 3px 9px; border-radius: 10px;
          min-width: 22px; text-align: center;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.35);
        }
        .header-actions { display: flex; gap: 8px; }
        .icon-btn {
          width: 38px; height: 38px; border-radius: 11px;
          border: 1px solid #F1F5F9; background: #FFFFFF;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
        }
        .icon-btn:hover { background: #F8FAFC; border-color: #E2E8F0; }
        .icon-btn:active { transform: scale(0.95); }

        /* ---------- SEARCH ---------- */
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #F8FAFC;
          border: 1.5px solid #F1F5F9;
          border-radius: 14px;
          padding: 11px 14px;
          margin-bottom: 12px;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
        }
        .search-wrapper:focus-within {
          border-color: #F59E0B;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }
        .search-input {
          flex: 1; border: none; outline: none; font-size: 14px;
          color: #1E293B; background: transparent; font-family: inherit;
          min-width: 0;
        }
        .search-input::placeholder { color: #94A3B8; }
        .clear-btn {
          width: 22px; height: 22px; border-radius: 50%;
          border: none; background: #E2E8F0;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
          transition: background 0.15s;
        }
        .clear-btn:hover { background: #CBD5E1; }

        /* ---------- FILTER CHIPS ---------- */
        .filter-chips { display: flex; gap: 8px; }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 15px; border-radius: 20px;
          border: 1px solid #E2E8F0; background: #FFFFFF;
          font-size: 13px; font-weight: 600; color: #64748B;
          cursor: pointer; font-family: inherit;
          transition: all 0.18s;
        }
        .filter-chip:hover { border-color: #CBD5E1; color: #1E293B; }
        .filter-chip.active {
          background: #0F172A; border-color: #0F172A; color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
        }
        .chip-count {
          font-size: 11px; font-weight: 700;
          padding: 1px 6px; border-radius: 8px;
          background: rgba(15, 23, 42, 0.08);
          color: inherit; line-height: 1.4;
        }
        .filter-chip.active .chip-count {
          background: rgba(255, 255, 255, 0.18);
        }
        .chip-badge {
          font-size: 10px; font-weight: 800; background: #F59E0B;
          color: #FFFFFF; padding: 2px 7px; border-radius: 8px;
          line-height: 1.4;
        }

        /* ---------- THREADS LIST ---------- */
        .threads-container {
          max-width: 800px; margin: 0 auto;
          padding: 14px 16px;
        }
        .threads-list {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 8px;
        }

        .thread-card {
          display: flex; align-items: center; gap: 12px;
          padding: 14px; background: #FFFFFF;
          border-radius: 14px; border: 1px solid #F1F5F9;
          cursor: pointer; transition: all 0.2s;
          position: relative;
          font-family: inherit;
          text-align: left;
          width: 100%;
          outline: none;
        }
        .thread-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.06);
        }
        .thread-card:active { transform: translateY(0); }
        .thread-card:focus-visible {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }
        .thread-card.unread {
          background: #FFFFFF;
          border-color: rgba(245, 158, 11, 0.25);
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.06);
        }
        .thread-card.unread::before {
          content: '';
          position: absolute;
          left: 0; top: 14px; bottom: 14px;
          width: 3px; border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #F59E0B, #EA580C);
        }

        .thread-avatar-wrap { position: relative; flex-shrink: 0; }
        .thread-avatar {
          width: 50px; height: 50px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: 700;
          letter-spacing: 0.02em;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
        }
        .thread-online-dot {
          position: absolute; bottom: 2px; right: 2px;
          width: 12px; height: 12px; border-radius: 50%;
          background: #10B981;
          border: 2px solid #FFFFFF;
        }

        .thread-content { flex: 1; min-width: 0; }
        .thread-header {
          display: flex; justify-content: space-between;
          align-items: center; gap: 8px; margin-bottom: 4px;
        }
        .thread-name {
          font-size: 14.5px; font-weight: 700;
          color: #0F172A;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          letter-spacing: -0.01em;
        }
        .thread-time {
          font-size: 11.5px; color: #94A3B8;
          flex-shrink: 0; font-weight: 600;
          font-variant-numeric: tabular-nums;
        }
        .thread-card.unread .thread-time { color: #F59E0B; }

        .thread-preview-row {
          display: flex; align-items: center; gap: 6px;
          min-width: 0;
        }
        .preview-icon {
          width: 18px; height: 18px; border-radius: 5px;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .preview-icon-img { background: rgba(59, 130, 246, 0.1); }
        .preview-icon-mic { background: rgba(16, 185, 129, 0.1); }

        .thread-message {
          font-size: 13px; color: #64748B; margin: 0;
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; line-height: 1.4;
          min-width: 0;
        }
        .thread-message.unread {
          color: #334155; font-weight: 600;
        }

        .unread-count {
          min-width: 22px; height: 22px; padding: 0 7px;
          border-radius: 11px;
          background: linear-gradient(135deg, #F59E0B, #EA580C);
          color: #FFFFFF; font-size: 11px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.35);
          font-variant-numeric: tabular-nums;
        }

        /* ---------- LOADING ---------- */
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

        /* ---------- EMPTY ---------- */
        .empty-state {
          text-align: center;
          padding: 56px 24px 64px;
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #F1F5F9;
        }
        .empty-icon-wrap {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
          margin-bottom: 18px;
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.15);
        }
        .empty-icon-inner {
          display: flex; align-items: center; justify-content: center;
        }
        .empty-title {
          font-size: 18px; font-weight: 800;
          color: #0F172A; margin: 0 0 6px;
          letter-spacing: -0.01em;
        }
        .empty-text {
          font-size: 13.5px; color: #64748B;
          margin: 0 auto 22px; line-height: 1.55;
          max-width: 340px;
        }
        .empty-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 11px 22px;
          background: #0F172A;
          border: none; border-radius: 12px;
          color: #FFFFFF;
          font-size: 14px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: background 0.2s, transform 0.12s, box-shadow 0.2s;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
        }
        .empty-btn:hover {
          background: #F59E0B;
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(245, 158, 11, 0.3);
        }
        .empty-btn:active { transform: translateY(0); }

        /* ---------- BOTTOM NAV ---------- */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
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
          transition: background 0.2s;
        }
        .nav-icon-wrap.active { background: #1E293B; }
        .nav-label { font-size: 9px; font-weight: 500; color: #94A3B8; }
        .nav-label.active { color: #1E293B; font-weight: 600; }
        .nav-badge {
          position: absolute; top: 0; right: 6px;
          min-width: 16px; height: 16px; padding: 0 4px;
          border-radius: 8px;
          background: linear-gradient(135deg, #F59E0B, #EA580C);
          color: #FFFFFF; font-size: 9px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #FFFFFF;
          font-variant-numeric: tabular-nums;
        }

        /* ---------- MOBILE ---------- */
        @media (max-width: 480px) {
          .page-header { padding: 14px 14px 12px; }
          .threads-container { padding: 12px 12px; }
          .page-title { font-size: 21px; }
          .thread-card { padding: 12px; gap: 10px; border-radius: 12px; }
          .thread-avatar { width: 46px; height: 46px; font-size: 15px; }
          .thread-name { font-size: 14px; }
          .thread-message { font-size: 12.5px; }
          .empty-state { padding: 44px 20px 52px; }
        }
        @media (max-width: 380px) {
          .thread-avatar { width: 42px; height: 42px; font-size: 13px; }
          .thread-card { padding: 11px 10px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .thread-card, .nav-icon-wrap, .empty-btn, .icon-btn {
            transition: none;
          }
          .thread-card:hover,
          .empty-btn:hover,
          .icon-btn:active {
            transform: none;
          }
          .loading-spinner { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Messages;