// mobile/src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    moreVertical: "M12 5a1 1 0 100-2 1 1 0 000 2zM12 13a1 1 0 100-2 1 1 0 000 2zM12 21a1 1 0 100-2 1 1 0 000 2z",
    check: "M20 6L9 17l-5-5",
    checkCheck: "M18 6L7 17l-4-4M22 6l-11 11",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
    smile: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
    mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
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
// MOCK DATA
// ============================================================
const MOCK_THREAD = {
  id: 'thread-1',
  name: 'Grace M.',
  initials: 'GM',
  avatarColor: '#F59E0B',
  online: true,
  lastSeen: 'online',
  listing: {
    id: 'listing-1',
    title: 'Fresh tomatoes, basket',
    price: 'MK650',
    emoji: '🍅',
  },
};

const MOCK_MESSAGES = [
  { id: 1, sender: 'them', text: 'Hi, is this still available?', time: '10:30 AM', status: 'read' },
  { id: 2, sender: 'me', text: 'Yes, still available! When can you pick up?', time: '10:32 AM', status: 'read' },
  { id: 3, sender: 'them', text: 'I can come today after 4pm', time: '10:35 AM', status: 'read' },
  { id: 4, sender: 'me', text: 'That works for me. Let me know when you\'re on the way.', time: '10:36 AM', status: 'delivered' },
  { id: 5, sender: 'them', text: 'Great, I\'ll see you then!', time: '10:38 AM', status: 'read' },
  { id: 6, sender: 'me', text: '📍 Mitundu Trading Centre, near the market', time: '10:39 AM', status: 'delivered' },
  { id: 7, sender: 'them', text: 'Perfect, I know the place', time: '10:40 AM', status: 'read' },
];

const QUICK_REPLIES = [
  'Is this still available?',
  'Can I pick up today?',
  'What\'s your best price?',
  'When can I collect?',
  'Can you deliver?',
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showListingInfo, setShowListingInfo] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMessage = {
      id: Date.now(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setShowQuickReplies(false);

    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'them',
          text: 'Okay, got it! 👍',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        }]);
      }, 1500);
    }, 800);
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

  const handleCall = () => {
    showToast('Calling Grace M...', 'info');
  };

  const handleViewListing = () => {
    navigate(`/listing/${MOCK_THREAD.listing.id}`);
  };

  const handleBottomNav = (navId) => {
    if (navId === 'home') navigate('/landing');
    else if (navId === 'search') navigate('/search');
    else if (navId === 'sell') navigate('/create-listing');
    else if (navId === 'messages') navigate('/messages');
    else if (navId === 'profile') navigate('/profile');
  };

  const formatTime = (time) => time;

  return (
    <div className="chat-page">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="header-btn" onClick={() => navigate(-1)}>
          <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
        </button>

        <div className="header-user" onClick={handleViewListing}>
          <div className="header-avatar-wrap">
            <div 
              className="header-avatar"
              style={{ background: `${MOCK_THREAD.avatarColor}15`, color: MOCK_THREAD.avatarColor }}
            >
              {MOCK_THREAD.initials}
            </div>
            {MOCK_THREAD.online && <span className="header-online" />}
          </div>
          <div className="header-info">
            <span className="header-name">{MOCK_THREAD.name}</span>
            <span className="header-status">
              {isTyping ? 'typing...' : MOCK_THREAD.lastSeen}
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button className="header-btn" onClick={handleCall}>
            <Icon name="phone" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
          <button className="header-btn">
            <Icon name="moreVertical" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Listing Pinned */}
      {showListingInfo && (
        <div className="listing-pinned">
          <div className="pinned-content" onClick={handleViewListing}>
            <span className="pinned-emoji">{MOCK_THREAD.listing.emoji}</span>
            <div className="pinned-info">
              <span className="pinned-title">{MOCK_THREAD.listing.title}</span>
              <span className="pinned-price">{MOCK_THREAD.listing.price}</span>
            </div>
          </div>
          <button className="pinned-close" onClick={() => setShowListingInfo(false)}>
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="messages-container">
        <div className="messages-date-divider">
          <span>Today</span>
        </div>

        {messages.map((msg, idx) => {
          const showTime = idx === 0 || 
            (idx > 0 && messages[idx - 1].time !== msg.time);
          
          return (
            <div key={msg.id} className={`message-row ${msg.sender === 'me' ? 'sent' : 'received'}`}>
              {showTime && (
                <span className="message-time-label">{msg.time}</span>
              )}
              <div className={`message-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                <p className="message-text">{msg.text}</p>
                <div className="message-meta">
                  <span className="message-time">{msg.time}</span>
                  {msg.sender === 'me' && (
                    <Icon 
                      name={msg.status === 'read' ? 'checkCheck' : 'check'} 
                      size={12} 
                      color={msg.status === 'read' ? '#3B82F6' : 'rgba(255,255,255,0.5)'} 
                      strokeWidth={2}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
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
      {showQuickReplies && messages.length < 4 && (
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
          <button className="input-action-btn">
            <Icon name="image" size={20} color="#64748B" strokeWidth={1.75} />
          </button>
          <div className="input-field-wrap">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="chat-input"
              rows={1}
            />
          </div>
          {inputText.trim() ? (
            <button className="send-btn" onClick={handleSend}>
              <Icon name="send" size={18} color="#FFFFFF" strokeWidth={2} />
            </button>
          ) : (
            <button className="input-action-btn">
              <Icon name="mic" size={20} color="#64748B" strokeWidth={1.75} />
            </button>
          )}
        </div>
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
          .chat-page {
            padding-bottom: 0;
          }
        }

        /* ===== HEADER ===== */
        .chat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .header-btn:hover {
          background: #F8FAFC;
        }

        .header-user {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          min-width: 0;
        }

        .header-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
        }

        .header-online {
          position: absolute;
          bottom: 1px;
          right: 1px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #10B981;
          border: 2px solid #FFFFFF;
        }

        .header-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .header-name {
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-status {
          font-size: 12px;
          color: #10B981;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 2px;
          flex-shrink: 0;
        }

        /* ===== LISTING PINNED ===== */
        .listing-pinned {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #FEFCF5;
          border-bottom: 1px solid #FDE68A;
          flex-shrink: 0;
        }

        .pinned-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          min-width: 0;
        }

        .pinned-emoji {
          font-size: 20px;
          flex-shrink: 0;
        }

        .pinned-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .pinned-title {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pinned-price {
          font-size: 12px;
          font-weight: 700;
          color: #10B981;
        }

        .pinned-close {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 18px;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .pinned-close:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        /* ===== MESSAGES ===== */
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scrollbar-width: thin;
        }

        .messages-container::-webkit-scrollbar {
          width: 4px;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 4px;
        }

        .messages-date-divider {
          display: flex;
          justify-content: center;
          margin-bottom: 12px;
        }

        .messages-date-divider span {
          font-size: 11px;
          font-weight: 600;
          color: #94A3B8;
          background: #FFFFFF;
          padding: 4px 12px;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
        }

        .message-time-label {
          display: block;
          text-align: center;
          font-size: 11px;
          color: #94A3B8;
          margin: 12px 0 6px;
          font-weight: 500;
        }

        .message-row {
          display: flex;
          flex-direction: column;
          max-width: 78%;
          margin-bottom: 2px;
        }

        .message-row.sent {
          align-self: flex-end;
          align-items: flex-end;
        }

        .message-row.received {
          align-self: flex-start;
          align-items: flex-start;
        }

        .message-bubble {
          padding: 10px 14px;
          border-radius: 16px;
          position: relative;
          word-wrap: break-word;
          max-width: 100%;
        }

        .message-bubble.sent {
          background: #1E293B;
          color: #FFFFFF;
          border-bottom-right-radius: 4px;
        }

        .message-bubble.received {
          background: #FFFFFF;
          color: #1E293B;
          border: 1px solid #F1F5F9;
          border-bottom-left-radius: 4px;
        }

        .message-text {
          font-size: 14px;
          margin: 0;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: flex-end;
          margin-top: 4px;
        }

        .message-time {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
        }

        .message-bubble.received .message-time {
          color: #94A3B8;
        }

        /* ===== TYPING ===== */
        .message-bubble.typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 14px 18px;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #94A3B8;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        /* ===== QUICK REPLIES ===== */
        .quick-replies {
          background: #FFFFFF;
          border-top: 1px solid #F1F5F9;
          padding: 10px 0;
          flex-shrink: 0;
        }

        .quick-replies-scroll {
          display: flex;
          gap: 8px;
          padding: 0 14px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .quick-replies-scroll::-webkit-scrollbar {
          display: none;
        }

        .quick-reply-chip {
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .quick-reply-chip:hover {
          background: rgba(245, 158, 11, 0.08);
          border-color: #F59E0B;
          color: #F59E0B;
        }

        /* ===== INPUT ===== */
        .chat-input-wrapper {
          background: #FFFFFF;
          border-top: 1px solid #F1F5F9;
          padding: 10px 14px;
          flex-shrink: 0;
        }

        .chat-input-row {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .input-action-btn {
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
          flex-shrink: 0;
        }

        .input-action-btn:hover {
          background: #F8FAFC;
        }

        .input-field-wrap {
          flex: 1;
          background: #F8FAFC;
          border: 1.5px solid #F1F5F9;
          border-radius: 22px;
          transition: all 0.2s;
          min-width: 0;
        }

        .input-field-wrap:focus-within {
          border-color: #F59E0B;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06);
        }

        .chat-input {
          width: 100%;
          padding: 10px 16px;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #1E293B;
          font-family: inherit;
          resize: none;
          max-height: 100px;
          line-height: 1.4;
          box-sizing: border-box;
        }

        .chat-input::placeholder {
          color: #94A3B8;
        }

        .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1E293B;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .send-btn:hover {
          background: #F59E0B;
          transform: scale(1.05);
        }

        .send-btn:active {
          transform: scale(0.95);
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
          .chat-header {
            padding: 10px 12px;
          }
          .messages-container {
            padding: 14px 12px 6px;
          }
          .message-row {
            max-width: 85%;
          }
          .message-bubble {
            padding: 8px 12px;
          }
          .message-text {
            font-size: 13.5px;
          }
          .chat-input-wrapper {
            padding: 8px 12px;
          }
        }

        @media (max-width: 380px) {
          .header-avatar {
            width: 36px;
            height: 36px;
            font-size: 13px;
          }
          .header-name {
            font-size: 14px;
          }
          .header-btn {
            width: 34px;
            height: 34px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .typing-dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Chat;