// mobile/src/pages/Chat.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { messagesAPI } from '../services/api';
import { supabase } from '../lib/supabase';
import { useUserPresence } from '../hooks/usePresence';
import { useTyping } from '../hooks/useTyping';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    moreVertical: "M12 5a1 1 0 100-2 1 1 0 000 2zM12 13a1 1 0 100-2 1 1 0 000 2zM12 21a1 1 0 100-2 1 1 0 000 2z",
    check: "M20 6L9 17l-5-5",
    checkCheck: "M18 6L7 17l-4-4M22 6l-11 11",
    image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
    mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    close: "M18 6L6 18M6 6l12 12",
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
// NORMALIZERS
// Backend may return snake_case (Supabase raw) or camelCase.
// The UI expects camelCase (senderId, imageUrl, createdAt, readAt).
// ============================================================
const normalizeMessage = (raw) => {
  if (!raw) return raw;
  const createdAt = raw.createdAt || raw.created_at || raw.timestamp || null;
  return {
    ...raw,
    id: raw.id,
    senderId:
      raw.senderId ??
      raw.sender_id ??
      raw.user_id ??
      raw.from_user_id ??
      null,
    text: raw.text ?? raw.content ?? raw.body ?? '',
    imageUrl: raw.imageUrl ?? raw.image_url ?? raw.image ?? null,
    type: raw.type ?? (raw.imageUrl || raw.image_url ? 'image' : 'text'),
    createdAt,
    readAt: raw.readAt ?? raw.read_at ?? null,
  };
};

const normalizeParticipant = (raw) => {
  if (!raw) return {};
  return {
    id: raw.id ?? raw.user_id ?? null,
    fullName: raw.fullName ?? raw.full_name ?? raw.name ?? null,
    email: raw.email ?? null,
    avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? null,
  };
};

const normalizeConversation = (raw) => {
  if (!raw) return null;

  // Resolve the "other participant" from whatever the backend gives us
  let other = raw.otherParticipant || raw.other_participant;
  if (!other) {
    // Fallback: build it from raw participant fields
    other = {
      id:
        raw.other_user_id ??
        raw.participant_one_id ??
        raw.participant_two_id ??
        raw.peer_id ??
        null,
      fullName:
        raw.other_user_name ??
        raw.participant_one_name ??
        raw.participant_two_name ??
        null,
      email:
        raw.other_user_email ??
        raw.participant_one_email ??
        raw.participant_two_email ??
        null,
      avatar_url: raw.other_user_avatar ?? raw.participant_one_avatar ?? null,
    };
  }

  return {
    ...raw,
    otherParticipant: normalizeParticipant(other),
    listing: raw.listing || raw.listings || raw.listing_snapshot || null,
    unreadCount:
      raw.unreadCount ??
      raw.unread_count ??
      raw.unread_count_for_one ??
      raw.unread_count_for_two ??
      0,
  };
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
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const QUICK_REPLIES = [
  'Is this still available?',
  'Can I pick up today?',
  "What's your best price?",
  'When can I collect?',
  'Can you deliver?',
];

const MAX_IMAGE_MB = 10;

// ============================================================
// MAIN COMPONENT
// ============================================================
const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const channelRef = useRef(null);
  const lastMessageCountRef = useRef(0);

  // ✅ PRESENCE & TYPING
  const otherUserId = conversation?.otherParticipant?.id;
  const { isOnline } = useUserPresence(otherUserId);
  const { otherUserIsTyping, notifyTyping, stopTyping } = useTyping(
    id,
    user?.id,
    otherUserId
  );

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const loadConversation = useCallback(
    async (opts = {}) => {
      if (!id || !user?.id) return;
      if (!opts.silent) setLoading(true);
      try {
        const res = await messagesAPI.getConversation(id);

        // ✅ NORMALIZE
        setConversation(normalizeConversation(res.data?.conversation || null));

        const incoming = (res.data?.messages || []).map(normalizeMessage);

        if (incoming.length !== lastMessageCountRef.current) {
          lastMessageCountRef.current = incoming.length;
          if (!opts.silent || incoming.length > 0) {
            setTimeout(() => scrollToBottom(), 50);
          }
        }
        setMessages(incoming);

        messagesAPI.markConversationRead(id).catch(() => {});
      } catch (err) {
        console.error('Load conversation error:', err);
        if (!opts.silent) {
          showToast('Failed to load conversation', 'error');
        }
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [id, user?.id, showToast, scrollToBottom]
  );

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // ============================================================
  // REALTIME — messages
  // ============================================================
  useEffect(() => {
    if (!id || !user?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = normalizeMessage(payload.new);   // ✅ NORMALIZE
          if (!newMsg) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const next = [...prev, newMsg];
            lastMessageCountRef.current = next.length;
            setTimeout(() => scrollToBottom(), 50);
            return next;
          });

          if (newMsg.senderId !== user.id) {
            messagesAPI.markConversationRead(id).catch(() => {});
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const updated = normalizeMessage(payload.new);   // ✅ NORMALIZE
          if (!updated) return;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
          );
        }
      )
      .subscribe((status) => {
        console.log(`🛰️ Realtime channel [chat:${id}] status:`, status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [id, user?.id, scrollToBottom]);

  // Catch up when the tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && id) {
        loadConversation({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [id, loadConversation]);

  // ============================================================
  // SEND TEXT
  // ============================================================
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    stopTyping();

    setSending(true);
    setInputText('');
    setShowQuickReplies(false);

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      senderId: user.id,
      text,
      type: 'text',
      createdAt: new Date().toISOString(),
      __optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      const res = await messagesAPI.sendMessage(id, { text });
      const real = normalizeMessage(res.data?.message);   // ✅ NORMALIZE
      if (real) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
      }
    } catch (err) {
      console.error('Send message error:', err);
      showToast('Failed to send message', 'error');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // SEND IMAGE
  // ============================================================
  const handlePickImage = () => {
    if (uploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      showToast(`Image must be under ${MAX_IMAGE_MB}MB`, 'warning');
      return;
    }
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'warning');
      return;
    }

    stopTyping();
    setUploadingImage(true);
    setShowQuickReplies(false);

    const localPreviewUrl = URL.createObjectURL(file);
    const tempId = `temp-img-${Date.now()}`;
    const optimistic = {
      id: tempId,
      senderId: user.id,
      imageUrl: localPreviewUrl,
      type: 'image',
      createdAt: new Date().toISOString(),
      __optimistic: true,
      __uploading: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();

    try {
      const uploadRes = await messagesAPI.uploadImage(file);
      const url = uploadRes.data?.url;
      if (!url) throw new Error('Upload did not return a URL');

      const sendRes = await messagesAPI.sendMessage(id, {
        imageUrl: url,
        type: 'image',
      });
      const real = normalizeMessage(sendRes.data?.message);   // ✅ NORMALIZE
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
    } catch (err) {
      console.error('Send image error:', err);
      const msg =
        err?.response?.data?.error || err?.message || 'Failed to send image';
      showToast(msg, 'error');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      URL.revokeObjectURL(localPreviewUrl);
      setUploadingImage(false);
    }
  };

  const handleQuickReply = (reply) => {
    setInputText(reply);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleViewListing = () => {
    if (conversation?.listing?.id) {
      navigate(`/listing/${conversation.listing.id}`);
    }
  };

  const handleBottomNav = (navId) => {
    if (navId === 'home') navigate('/landing');
    else if (navId === 'search') navigate('/search');
    else if (navId === 'sell') navigate('/create-listing');
    else if (navId === 'messages') navigate('/messages');
    else if (navId === 'profile') navigate('/profile');
  };

  const other = conversation?.otherParticipant || {};
  const otherName = other.fullName || other.email?.split('@')[0] || 'User';
  const initials = initialsOf(other.fullName, other.email);
  const color = pickColor(other.id || otherName);

  if (loading && !conversation) {
    return (
      <div className="chat-page">
        <div className="chat-loading">
          <div className="loading-spinner" />
        </div>
        <style jsx>{`
          .chat-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: #F8FAFC;
          }
          .chat-loading {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #E2E8F0;
            border-top-color: #F59E0B;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelected}
        style={{ display: 'none' }}
      />

      {/* Chat Header */}
      <div className="chat-header">
        {/* ✅ Back goes to Messages (not to the listing) */}
        <button
          className="header-btn"
          onClick={() => navigate('/messages', { replace: true })}
          aria-label="Back to messages"
        >
          <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
        </button>

        <div className="header-user" onClick={handleViewListing}>
          <div className="header-avatar-wrap">
            <div
              className="header-avatar"
              style={{ background: `${color}15`, color }}
            >
              {initials}
            </div>
            {isOnline && <span className="header-online" />}
          </div>
          <div className="header-info">
            <span className="header-name">{otherName}</span>
            <span className={`header-status ${otherUserIsTyping ? 'typing' : ''}`}>
              {otherUserIsTyping
                ? 'typing…'
                : isOnline
                ? 'Online'
                : other.email || 'Tap to view'}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-btn">
            <Icon name="moreVertical" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Listing Pinned */}
      {conversation?.listing && (
        <div className="listing-pinned">
          <div className="pinned-content" onClick={handleViewListing}>
            <span className="pinned-emoji">📦</span>
            <div className="pinned-info">
              <span className="pinned-title">{conversation.listing.title}</span>
              {conversation.listing.price && (
                <span className="pinned-price">
                  MK {Number(conversation.listing.price).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            const isUploading = msg.__uploading;
            return (
              <div
                key={msg.id}
                className={`message-row ${isMine ? 'sent' : 'received'}`}
              >
                <div className={`message-bubble ${isMine ? 'sent' : 'received'}`}>
                  {msg.imageUrl && (
                    <button
                      type="button"
                      className="message-image-btn"
                      onClick={() => setLightboxUrl(msg.imageUrl)}
                    >
                      <img
                        src={msg.imageUrl}
                        alt=""
                        className="message-image"
                        loading="lazy"
                      />
                      {isUploading && (
                        <div className="message-image-overlay">
                          <div className="mini-spinner" />
                        </div>
                      )}
                    </button>
                  )}
                  {msg.text && <p className="message-text">{msg.text}</p>}
                  <div className="message-meta">
                    <span className="message-time">
                      {isUploading ? 'sending…' : formatTime(msg.createdAt)}
                    </span>
                    {isMine && !isUploading && (
                      <Icon
                        name={msg.readAt ? 'checkCheck' : 'check'}
                        size={12}
                        color={msg.readAt ? '#3B82F6' : 'rgba(255,255,255,0.5)'}
                        strokeWidth={2}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {otherUserIsTyping && (
          <div className="message-row received">
            <div className="message-bubble received typing">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {showQuickReplies && messages.length < 4 && !uploadingImage && (
        <div className="quick-replies">
          <div className="quick-replies-scroll">
            {QUICK_REPLIES.map((reply, idx) => (
              <button
                key={idx}
                className="quick-reply-chip"
                onClick={() => handleQuickReply(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-wrapper">
        <div className="chat-input-row">
          <button
            className="input-action-btn"
            onClick={handlePickImage}
            disabled={uploadingImage || sending}
            title="Send a photo"
          >
            {uploadingImage ? (
              <div className="mini-spinner mini-spinner-dark" />
            ) : (
              <Icon name="image" size={20} color="#64748B" strokeWidth={1.75} />
            )}
          </button>
          <div className="input-field-wrap">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (e.target.value.trim()) {
                  notifyTyping();
                } else {
                  stopTyping();
                }
              }}
              onKeyDown={handleKeyDown}
              onBlur={stopTyping}
              placeholder="Type a message..."
              className="chat-input"
              rows={1}
              disabled={sending}
            />
          </div>
          {inputText.trim() ? (
            <button className="send-btn" onClick={handleSend} disabled={sending}>
              <Icon name="send" size={18} color="#FFFFFF" strokeWidth={2} />
            </button>
          ) : (
            <button className="input-action-btn" disabled>
              <Icon name="mic" size={20} color="#CBD5E1" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="lightbox"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="Image preview"
        >
          <button
            className="lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxUrl(null);
            }}
            aria-label="Close"
          >
            <Icon name="close" size={22} color="#FFFFFF" strokeWidth={2} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
        .chat-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 70px;
        }
        @media (min-width: 769px) {
          .chat-page { padding-bottom: 0; }
        }
        .chat-header {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0; position: sticky; top: 0; z-index: 10;
        }
        .header-btn {
          width: 38px; height: 38px; border-radius: 10px; border: none;
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .header-btn:hover { background: #F8FAFC; }
        .header-user {
          flex: 1; display: flex; align-items: center; gap: 10px;
          cursor: pointer; min-width: 0;
        }
        .header-avatar-wrap { position: relative; flex-shrink: 0; }
        .header-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700;
        }
        .header-online {
          position: absolute;
          bottom: 1px; right: 1px;
          width: 11px; height: 11px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #FFFFFF;
          animation: presencePulse 2.4s ease-in-out infinite;
        }
        @keyframes presencePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          50% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
        }
        .header-info { display: flex; flex-direction: column; min-width: 0; }
        .header-name {
          font-size: 15px; font-weight: 700; color: #1E293B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .header-status {
          font-size: 12px; color: #94A3B8; font-weight: 500;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .header-status.typing {
          color: #10B981;
          font-weight: 600;
          font-style: italic;
        }
        .header-actions { display: flex; gap: 2px; flex-shrink: 0; }
        .listing-pinned {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; background: #FEFCF5;
          border-bottom: 1px solid #FDE68A; flex-shrink: 0;
        }
        .pinned-content {
          flex: 1; display: flex; align-items: center; gap: 10px;
          cursor: pointer; min-width: 0;
        }
        .pinned-emoji { font-size: 20px; flex-shrink: 0; }
        .pinned-info { display: flex; flex-direction: column; min-width: 0; }
        .pinned-title {
          font-size: 13px; font-weight: 600; color: #1E293B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pinned-price { font-size: 12px; font-weight: 700; color: #10B981; }
        .messages-container {
          flex: 1; overflow-y: auto; padding: 16px 14px 8px;
          display: flex; flex-direction: column; gap: 4px;
          scrollbar-width: thin;
        }
        .messages-container::-webkit-scrollbar { width: 4px; }
        .messages-container::-webkit-scrollbar-thumb {
          background: #E2E8F0; border-radius: 4px;
        }
        .empty-chat {
          text-align: center; padding: 40px 20px;
          color: #94A3B8; font-size: 14px;
        }
        .message-row {
          display: flex; flex-direction: column;
          max-width: 78%; margin-bottom: 2px;
        }
        .message-row.sent { align-self: flex-end; align-items: flex-end; }
        .message-row.received { align-self: flex-start; align-items: flex-start; }
        .message-bubble {
          padding: 10px 14px; border-radius: 16px; position: relative;
          word-wrap: break-word; max-width: 100%;
        }
        .message-bubble.sent {
          background: #1E293B; color: #FFFFFF;
          border-bottom-right-radius: 4px;
        }
        .message-bubble.received {
          background: #FFFFFF; color: #1E293B;
          border: 1px solid #F1F5F9;
          border-bottom-left-radius: 4px;
        }
        .message-bubble.typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 14px 18px;
        }
        .typing-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #94A3B8;
          animation: typingBounce 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .message-image-btn {
          display: block; padding: 0; margin: 0 0 6px;
          border: none; background: transparent; cursor: pointer;
          position: relative; border-radius: 10px; overflow: hidden;
          max-width: 240px;
        }
        .message-image {
          display: block; width: 100%; height: auto;
          max-height: 320px; object-fit: cover; border-radius: 10px;
        }
        .message-image-overlay {
          position: absolute; inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex; align-items: center; justify-content: center;
        }
        .message-text {
          font-size: 14px; margin: 0; line-height: 1.4;
          white-space: pre-wrap; word-break: break-word;
        }
        .message-meta {
          display: flex; align-items: center; gap: 4px;
          justify-content: flex-end; margin-top: 4px;
        }
        .message-time {
          font-size: 10px; color: rgba(255, 255, 255, 0.5);
        }
        .message-bubble.received .message-time { color: #94A3B8; }
        .mini-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #FFFFFF; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        .mini-spinner-dark {
          border-color: rgba(100, 116, 139, 0.25);
          border-top-color: #64748B;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .quick-replies {
          background: #FFFFFF; border-top: 1px solid #F1F5F9;
          padding: 10px 0; flex-shrink: 0;
        }
        .quick-replies-scroll {
          display: flex; gap: 8px; padding: 0 14px;
          overflow-x: auto; scrollbar-width: none;
        }
        .quick-replies-scroll::-webkit-scrollbar { display: none; }
        .quick-reply-chip {
          padding: 8px 14px; border-radius: 20px;
          border: 1px solid #E2E8F0; background: #F8FAFC;
          font-size: 13px; color: #64748B; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          font-family: inherit; transition: all 0.2s; flex-shrink: 0;
        }
        .quick-reply-chip:hover {
          background: rgba(245, 158, 11, 0.08);
          border-color: #F59E0B; color: #F59E0B;
        }
        .chat-input-wrapper {
          background: #FFFFFF; border-top: 1px solid #F1F5F9;
          padding: 10px 14px; flex-shrink: 0;
        }
        .chat-input-row {
          display: flex; align-items: flex-end; gap: 8px;
        }
        .input-action-btn {
          width: 40px; height: 40px; border-radius: 50%;
          border: none; background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .input-action-btn:hover:not(:disabled) { background: #F8FAFC; }
        .input-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .input-field-wrap {
          flex: 1; background: #F8FAFC;
          border: 1.5px solid #F1F5F9; border-radius: 22px;
          transition: all 0.2s; min-width: 0;
        }
        .input-field-wrap:focus-within {
          border-color: #F59E0B; background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06);
        }
        .chat-input {
          width: 100%; padding: 10px 16px; border: none;
          outline: none; background: transparent; font-size: 14px;
          color: #1E293B; font-family: inherit; resize: none;
          max-height: 100px; line-height: 1.4; box-sizing: border-box;
        }
        .chat-input::placeholder { color: #94A3B8; }
        .send-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: #1E293B; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s;
        }
        .send-btn:hover:not(:disabled) {
          background: #F59E0B; transform: scale(1.05);
        }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .send-btn:active:not(:disabled) { transform: scale(0.95); }
        .lightbox {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.95);
          z-index: 1000; display: flex; align-items: center;
          justify-content: center; padding: 20px;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .lightbox-image {
          max-width: 100%; max-height: 100%; border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .lightbox-close {
          position: absolute; top: 20px; right: 20px;
          width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(255, 255, 255, 0.15);
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; transition: background 0.2s;
        }
        .lightbox-close:hover { background: rgba(255, 255, 255, 0.25); }
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
          padding: 4px 8px; font-family: inherit; min-width: 44px;
        }
        .nav-icon-wrap {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .nav-icon-wrap.active { background: #1E293B; }
        .nav-label { font-size: 9px; font-weight: 500; color: #94A3B8; }
        .nav-label.active { color: #1E293B; font-weight: 600; }
        @media (max-width: 480px) {
          .chat-header { padding: 10px 12px; }
          .messages-container { padding: 14px 12px 6px; }
          .message-row { max-width: 85%; }
          .message-bubble { padding: 8px 12px; }
          .message-text { font-size: 13.5px; }
          .chat-input-wrapper { padding: 8px 12px; }
          .message-image-btn { max-width: 200px; }
        }
        @media (max-width: 380px) {
          .header-avatar { width: 36px; height: 36px; font-size: 13px; }
          .header-name { font-size: 14px; }
          .header-btn { width: 34px; height: 34px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .send-btn:active:not(:disabled) { transform: none; }
          .lightbox { animation: none; }
          .header-online { animation: none; }
          .typing-dot { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Chat;