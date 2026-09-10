// mobile/src/pages/IncomingRequests.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18M6 6l12 12",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
    checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    xCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6",
    alertCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  };

  const d = icons[name] || icons.inbox;
  
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
// MOCK DATA
// ============================================================
const MOCK_REQUESTS = [
  {
    id: 'req-1',
    status: 'pending',
    type: 'reservation',
    listing: {
      title: 'Fresh Tomatoes, basket',
      price: 650,
      emoji: '🍅',
    },
    buyer: {
      name: 'Mary T.',
      initials: 'MT',
      color: '#3B82F6',
      phone: '+265 991 234 567',
      rating: 4.7,
      memberSince: '2024',
    },
    requestedAt: '15 minutes ago',
    pickupTime: 'Today, 4:00 PM',
    pickupLocation: 'Mitundu Trading Centre',
    note: 'I can pick up around 4pm, is that okay?',
  },
  {
    id: 'req-2',
    status: 'pending',
    type: 'booking',
    listing: {
      title: 'Electrician, home wiring',
      price: 5000,
      emoji: '⚡',
    },
    buyer: {
      name: 'James N.',
      initials: 'JN',
      color: '#8B5CF6',
      phone: '+265 999 456 789',
      rating: 4.9,
      memberSince: '2023',
    },
    requestedAt: '1 hour ago',
    pickupTime: 'Tomorrow, 10:00 AM',
    pickupLocation: 'Mitundu Chimbiri',
    note: 'Need wiring for 3 rooms and a kitchen. Please bring materials.',
  },
  {
    id: 'req-3',
    status: 'pending',
    type: 'reservation',
    listing: {
      title: 'Maize, 50kg bag',
      price: 350,
      emoji: '🌽',
    },
    buyer: {
      name: 'Grace K.',
      initials: 'GK',
      color: '#EC4899',
      phone: '+265 888 111 222',
      rating: 4.5,
      memberSince: '2024',
    },
    requestedAt: '3 hours ago',
    pickupTime: 'Today, 6:00 PM',
    pickupLocation: 'Bunda Market',
    note: '',
  },
];

const MOCK_PAST = [
  {
    id: 'past-1',
    status: 'accepted',
    listing: { title: 'Cement, 50kg bag', price: 18000, emoji: '🏗️' },
    buyer: { name: 'Peter M.', initials: 'PM', color: '#10B981' },
    resolvedAt: 'Yesterday',
  },
  {
    id: 'past-2',
    status: 'declined',
    listing: { title: 'Secondhand shirts', price: 1500, emoji: '👕' },
    buyer: { name: 'Sarah M.', initials: 'SM', color: '#F59E0B' },
    resolvedAt: '2 days ago',
    reason: 'Item already reserved',
  },
  {
    id: 'past-3',
    status: 'expired',
    listing: { title: 'Fresh Cabbage, head', price: 400, emoji: '🥬' },
    buyer: { name: 'John D.', initials: 'JD', color: '#EF4444' },
    resolvedAt: '3 days ago',
    reason: 'No response in time',
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const IncomingRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, success } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [requests, setRequests] = useState(MOCK_REQUESTS);
  const [pastRequests, setPastRequests] = useState(MOCK_PAST);
  const [processing, setProcessing] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAccept = async (reqId) => {
    setProcessing(reqId);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const req = requests.find(r => r.id === reqId);
    if (req) {
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setPastRequests(prev => [{
        id: `past-${Date.now()}`,
        status: 'accepted',
        listing: req.listing,
        buyer: req.buyer,
        resolvedAt: 'Just now',
      }, ...prev]);
    }
    setProcessing(null);
    success('Request accepted! 🎉');
  };

  const handleDecline = async (reqId) => {
    if (!window.confirm('Decline this request?')) return;
    
    setProcessing(reqId);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const req = requests.find(r => r.id === reqId);
    if (req) {
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setPastRequests(prev => [{
        id: `past-${Date.now()}`,
        status: 'declined',
        listing: req.listing,
        buyer: req.buyer,
        resolvedAt: 'Just now',
        reason: 'Declined by seller',
      }, ...prev]);
    }
    setProcessing(null);
    showToast('Request declined', 'info');
  };

  const handleContactBuyer = (buyer) => {
    showToast(`Calling ${buyer.name}...`, 'info');
  };

  const handleMessageBuyer = (buyer) => {
    navigate('/messages');
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const formatPrice = (price) => `MK ${price.toLocaleString()}`;

  const pendingCount = requests.length;

  const getPastStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
        return { label: 'Accepted', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', icon: 'checkCircle' };
      case 'declined':
        return { label: 'Declined', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', icon: 'xCircle' };
      case 'expired':
        return { label: 'Expired', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', icon: 'alertCircle' };
      default:
        return { label: status, color: '#64748B', bg: '#F1F5F9', icon: 'clock' };
    }
  };

  return (
    <div className="incoming-requests">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
          </button>
          <button className="header-btn" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="inbox" size={14} color="#F59E0B" strokeWidth={1.75} />
            <span>Seller Inbox</span>
          </div>
          <h1 className="page-title">Incoming Requests</h1>
          <p className="page-subtitle">Review reservations and booking requests from buyers</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="main-content">
        {activeTab === 'pending' && (
          <>
            {requests.length > 0 ? (
              <div className="requests-list">
                {requests.map((req) => (
                  <div key={req.id} className="request-card">
                    {/* Status Bar */}
                    <div className="status-bar" />

                    {/* Top */}
                    <div className="request-top">
                      <span className="status-chip">
                        <Icon name="clock" size={10} color="#F59E0B" strokeWidth={2.5} />
                        Pending Review
                      </span>
                      <span className="request-time">{req.requestedAt}</span>
                    </div>

                    {/* Listing */}
                    <div className="request-listing">
                      <div className="listing-image">
                        <span className="listing-emoji">{req.listing.emoji}</span>
                      </div>
                      <div className="listing-info">
                        <h3 className="listing-title">{req.listing.title}</h3>
                        <span className="listing-price">{formatPrice(req.listing.price)}</span>
                        <span className="request-type">
                          {req.type === 'booking' ? '📅 Booking Request' : '📦 Reservation Request'}
                        </span>
                      </div>
                    </div>

                    {/* Buyer */}
                    <div className="buyer-section">
                      <div 
                        className="buyer-avatar"
                        style={{ background: `${req.buyer.color}15`, color: req.buyer.color }}
                      >
                        {req.buyer.initials}
                      </div>
                      <div className="buyer-info">
                        <div className="buyer-header">
                          <span className="buyer-name">{req.buyer.name}</span>
                          <span className="buyer-rating">
                            <Icon name="star" size={10} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                            {req.buyer.rating}
                          </span>
                        </div>
                        <span className="buyer-meta">Member since {req.buyer.memberSince}</span>
                      </div>
                      <div className="buyer-actions">
                        <button 
                          className="buyer-action-btn"
                          onClick={() => handleContactBuyer(req.buyer)}
                          title="Call"
                        >
                          <Icon name="phone" size={14} color="#64748B" strokeWidth={1.75} />
                        </button>
                        <button 
                          className="buyer-action-btn"
                          onClick={() => handleMessageBuyer(req.buyer)}
                          title="Message"
                        >
                          <Icon name="message" size={14} color="#64748B" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    {/* Pickup Details */}
                    <div className="pickup-details">
                      <div className="detail-row">
                        <Icon name="calendar" size={12} color="#94A3B8" strokeWidth={1.75} />
                        <span className="detail-label">Pickup</span>
                        <span className="detail-value">{req.pickupTime}</span>
                      </div>
                      <div className="detail-row">
                        <Icon name="mapPin" size={12} color="#94A3B8" strokeWidth={1.75} />
                        <span className="detail-label">Location</span>
                        <span className="detail-value">{req.pickupLocation}</span>
                      </div>
                    </div>

                    {/* Note */}
                    {req.note && (
                      <div className="buyer-note">
                        <Icon name="message" size={12} color="#94A3B8" strokeWidth={1.75} />
                        <span>"{req.note}"</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="request-actions">
                      <button 
                        className="action-btn decline"
                        onClick={() => handleDecline(req.id)}
                        disabled={processing === req.id}
                      >
                        {processing === req.id ? (
                          <span className="btn-spinner-small" />
                        ) : (
                          <>
                            <Icon name="x" size={14} color="#EF4444" strokeWidth={2.5} />
                            Decline
                          </>
                        )}
                      </button>
                      <button 
                        className="action-btn accept"
                        onClick={() => handleAccept(req.id)}
                        disabled={processing === req.id}
                      >
                        {processing === req.id ? (
                          <span className="btn-spinner-small" />
                        ) : (
                          <>
                            <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.5} />
                            Accept
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="inbox" size={48} color="#CBD5E1" strokeWidth={1.5} />
                </div>
                <h3 className="empty-title">All caught up!</h3>
                <p className="empty-text">
                  You have no pending requests. New requests will appear here.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {pastRequests.length > 0 ? (
              <div className="history-list">
                {pastRequests.map((req) => {
                  const status = getPastStatusConfig(req.status);
                  return (
                    <div key={req.id} className="history-card">
                      <div className="history-main">
                        <div className="listing-image small">
                          <span className="listing-emoji">{req.listing.emoji}</span>
                        </div>
                        <div className="history-info">
                          <div className="history-header">
                            <h3 className="listing-title">{req.listing.title}</h3>
                            <span 
                              className="status-chip small"
                              style={{ background: status.bg, color: status.color }}
                            >
                              <Icon name={status.icon} size={9} color={status.color} strokeWidth={2.5} />
                              {status.label}
                            </span>
                          </div>
                          <div className="history-meta">
                            <span className="history-price">{formatPrice(req.listing.price)}</span>
                            <span className="history-divider">•</span>
                            <span className="history-date">{req.resolvedAt}</span>
                          </div>
                          <div className="history-buyer">
                            <div 
                              className="buyer-avatar small"
                              style={{ background: `${req.buyer.color}15`, color: req.buyer.color }}
                            >
                              {req.buyer.initials}
                            </div>
                            <span className="buyer-name-small">{req.buyer.name}</span>
                          </div>
                          {req.reason && (
                            <div className="history-reason">
                              <Icon name="info" size={10} color="#94A3B8" strokeWidth={1.75} />
                              <span>{req.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="clock" size={48} color="#CBD5E1" strokeWidth={1.5} />
                </div>
                <h3 className="empty-title">No history yet</h3>
                <p className="empty-text">
                  Past requests will appear here once resolved
                </p>
              </div>
            )}
          </>
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
            const active = item.id === 'profile';
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
        .incoming-requests {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .incoming-requests {
            padding-bottom: 40px;
          }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: #FFFFFF;
          padding: 14px 16px 0;
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

        .header-content {
          max-width: 700px;
          margin: 0 auto 16px;
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
        }

        .page-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== TABS ===== */
        .tabs {
          display: flex;
          gap: 4px;
          max-width: 700px;
          margin: 0 auto;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 8px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #94A3B8;
          cursor: pointer;
          font-family: inherit;
          position: relative;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }

        .tab-btn:hover {
          color: #64748B;
        }

        .tab-btn.active {
          color: #1E293B;
          border-bottom-color: #F59E0B;
        }

        .tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #F59E0B;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 16px;
        }

        .requests-list,
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ===== REQUEST CARD ===== */
        .request-card {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #F1F5F9;
          overflow: hidden;
          position: relative;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .status-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #F59E0B;
        }

        .request-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px 10px 18px;
          border-bottom: 1px solid #F8FAFC;
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          background: rgba(245, 158, 11, 0.08);
          color: #F59E0B;
        }

        .status-chip.small {
          font-size: 10px;
          padding: 3px 8px;
        }

        .request-time {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
        }

        /* Listing */
        .request-listing {
          display: flex;
          gap: 12px;
          padding: 14px 14px 12px 18px;
          border-bottom: 1px solid #F8FAFC;
        }

        .listing-image {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .listing-image.small {
          width: 48px;
          height: 48px;
        }

        .listing-emoji {
          font-size: 28px;
        }

        .listing-image.small .listing-emoji {
          font-size: 22px;
        }

        .listing-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .listing-title {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .listing-price {
          font-size: 14px;
          font-weight: 700;
          color: #10B981;
        }

        .request-type {
          font-size: 11px;
          color: #94A3B8;
          font-weight: 500;
          margin-top: 2px;
        }

        /* Buyer Section */
        .buyer-section {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px 12px 18px;
          border-bottom: 1px solid #F8FAFC;
        }

        .buyer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .buyer-avatar.small {
          width: 22px;
          height: 22px;
          font-size: 9px;
        }

        .buyer-info {
          flex: 1;
          min-width: 0;
        }

        .buyer-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
          flex-wrap: wrap;
        }

        .buyer-name {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
        }

        .buyer-name-small {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }

        .buyer-rating {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          font-weight: 600;
          color: #1E293B;
          background: #F8FAFC;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .buyer-meta {
          font-size: 11px;
          color: #94A3B8;
        }

        .buyer-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }

        .buyer-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .buyer-action-btn:hover {
          background: #F1F5F9;
        }

        /* Pickup Details */
        .pickup-details {
          background: #F8FAFC;
          padding: 12px 14px 12px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 1px solid #F1F5F9;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .detail-label {
          color: #94A3B8;
          font-weight: 500;
          min-width: 60px;
        }

        .detail-value {
          color: #1E293B;
          font-weight: 600;
          flex: 1;
        }

        /* Buyer Note */
        .buyer-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px 12px 18px;
          background: #FEFCF5;
          border-bottom: 1px solid #FDE68A;
          font-size: 12px;
          color: #92400E;
          line-height: 1.5;
          font-style: italic;
        }

        /* Actions */
        .request-actions {
          display: flex;
          gap: 8px;
          padding: 12px 14px 14px 18px;
        }

        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 42px;
        }

        .action-btn.decline {
          background: #FFFFFF;
          border: 1px solid #FECACA;
          color: #EF4444;
        }

        .action-btn.decline:hover:not(:disabled) {
          background: #FEF2F2;
          transform: scale(0.98);
        }

        .action-btn.accept {
          background: #1E293B;
          border: none;
          color: #FFFFFF;
        }

        .action-btn.accept:hover:not(:disabled) {
          background: #10B981;
          transform: scale(0.98);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .action-btn.decline .btn-spinner-small {
          border-color: rgba(239, 68, 68, 0.3);
          border-top-color: #EF4444;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== HISTORY CARD ===== */
        .history-card {
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .history-main {
          display: flex;
          gap: 12px;
          padding: 14px;
        }

        .history-info {
          flex: 1;
          min-width: 0;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 6px;
        }

        .history-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .history-price {
          color: #10B981;
          font-weight: 700;
        }

        .history-divider {
          color: #E2E8F0;
        }

        .history-date {
          color: #94A3B8;
        }

        .history-buyer {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .history-reason {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          font-size: 11px;
          color: #94A3B8;
          font-style: italic;
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
          margin: 0;
          line-height: 1.5;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
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
            padding: 12px 12px 0;
          }
          .main-content {
            padding: 12px;
          }
          .page-title {
            font-size: 20px;
          }
          .request-listing {
            padding: 12px 12px 10px 16px;
          }
          .listing-image {
            width: 52px;
            height: 52px;
          }
          .listing-emoji {
            font-size: 24px;
          }
          .buyer-section {
            padding: 10px 12px 10px 16px;
          }
          .pickup-details {
            padding: 10px 12px 10px 16px;
          }
          .buyer-note {
            padding: 10px 12px 10px 16px;
          }
          .request-actions {
            padding: 10px 12px 12px 16px;
          }
        }

        @media (max-width: 380px) {
          .listing-title {
            font-size: 13px;
          }
          .listing-price {
            font-size: 13px;
          }
          .action-btn {
            font-size: 12px;
            padding: 8px 10px;
            min-height: 38px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .action-btn,
          .buyer-action-btn,
          .header-btn {
            transition: none;
          }
          .action-btn.decline:hover:not(:disabled),
          .action-btn.accept:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default IncomingRequests;