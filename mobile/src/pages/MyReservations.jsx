// mobile/src/pages/MyReservations.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18M6 6l12 12",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    package: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    alertCircle: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
    chevronRight: "M9 18l6-6-6-6",
  };

  const d = icons[name] || icons.package;

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
// MOCK RESERVATIONS
// NOTE: vendor.color values are per-vendor identity markers used
// inline on avatar circles. Intentionally NOT tokenized.
// ============================================================
const MOCK_RESERVATIONS = {
  active: [
    {
      id: 'res-1',
      listing: { title: 'Fresh Tomatoes, basket', price: 650, emoji: '🍅', image: null },
      vendor: { name: 'Grace M.', initials: 'GM', color: '#F59E0B', phone: '+265 888 921 110' },
      status: 'confirmed',
      reservedAt: '2 hours ago',
      pickupTime: 'Today, 4:00 PM',
      pickupLocation: 'Mitundu Trading Centre',
      expiresIn: '3h 24m',
    },
    {
      id: 'res-2',
      listing: { title: 'Maize, 50kg bag', price: 350, emoji: '🌽', image: null },
      vendor: { name: 'Peter K.', initials: 'PK', color: '#10B981', phone: '+265 999 123 456' },
      status: 'pending',
      reservedAt: '30 minutes ago',
      pickupTime: 'Tomorrow, 10:00 AM',
      pickupLocation: 'Bunda Market',
      expiresIn: '23h',
    },
  ],
  history: [
    {
      id: 'hist-1',
      listing: { title: 'Onions, per kg', price: 800, emoji: '🧅' },
      vendor: { name: 'Sarah M.', initials: 'SM', color: '#EC4899' },
      status: 'completed',
      completedAt: 'Yesterday, 5:30 PM',
      rating: 5,
      hasReviewed: true,
    },
    {
      id: 'hist-2',
      listing: { title: 'Fresh Cabbage, head', price: 400, emoji: '🥬' },
      vendor: { name: 'Mary T.', initials: 'MT', color: '#8B5CF6' },
      status: 'completed',
      completedAt: '2 days ago',
      rating: null,
      hasReviewed: false,
    },
    {
      id: 'hist-3',
      listing: { title: 'Electrician, home wiring', price: 5000, emoji: '⚡' },
      vendor: { name: 'Chikondi B.', initials: 'CB', color: '#3B82F6' },
      status: 'cancelled',
      cancelledAt: '3 days ago',
      reason: 'Seller unavailable',
      hasReviewed: false,
    },
  ],
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const MyReservations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, success } = useToast();
  const [activeTab, setActiveTab] = useState('active');
  const [reservations, setReservations] = useState(MOCK_RESERVATIONS);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCancelReservation = (resId) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setReservations(prev => ({
      ...prev,
      active: prev.active.filter(r => r.id !== resId),
    }));
    success('Reservation cancelled');
  };

  const handleMarkCollected = (resId) => {
    const reservation = reservations.active.find(r => r.id === resId);
    if (!reservation) return;

    setReservations(prev => ({
      active: prev.active.filter(r => r.id !== resId),
      history: [
        {
          id: `hist-${Date.now()}`,
          listing: reservation.listing,
          vendor: reservation.vendor,
          status: 'completed',
          completedAt: 'Just now',
          rating: null,
          hasReviewed: false,
        },
        ...prev.history,
      ],
    }));
    success('Marked as collected! 🎉');
  };

  const handleReviewSubmit = () => {
    if (!showReviewModal) return;

    setReservations(prev => ({
      ...prev,
      history: prev.history.map(r =>
        r.id === showReviewModal
          ? { ...r, rating: reviewRating, hasReviewed: true }
          : r
      ),
    }));

    success('Review submitted! ⭐');
    setShowReviewModal(null);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleContactVendor = (vendor) => {
    showToast(`Calling ${vendor.name}...`, 'info');
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const formatPrice = (price) => `MK ${price.toLocaleString()}`;

  const activeCount = reservations.active.length;
  const historyCount = reservations.history.length;

  // Returns token-based colors for the status chip + left accent bar.
  // Semantic mapping:
  //   confirmed → success (money/positive)
  //   pending   → warning (in-progress)
  //   completed → primary (done/neutral)
  //   cancelled → error   (negative)
  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed':
        return { label: 'Confirmed', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: 'check' };
      case 'pending':
        return { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: 'clock' };
      case 'completed':
        return { label: 'Completed', color: 'var(--color-primary)', bg: 'var(--color-primary-tint)', icon: 'check' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'var(--color-error)', bg: 'var(--color-error-bg)', icon: 'x' };
      default:
        return { label: status, color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)', icon: 'info' };
    }
  };

  return (
    <div className="my-reservations">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="var(--color-text)" strokeWidth={1.75} />
          </button>
          <button className="header-btn">
            <Icon name="refresh" size={18} color="var(--color-text-secondary)" strokeWidth={1.75} />
          </button>
        </div>
        <div className="header-content">
          <div className="header-badge">
            <Icon name="package" size={14} color="var(--color-warning)" strokeWidth={1.75} />
            <span>My Orders</span>
          </div>
          <h1 className="page-title">My Reservations</h1>
          <p className="page-subtitle">Track your active and past orders</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            {activeCount > 0 && <span className="tab-badge">{activeCount}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
            {historyCount > 0 && <span className="tab-badge">{historyCount}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Active Reservations */}
        {activeTab === 'active' && (
          <>
            {reservations.active.length > 0 ? (
              <div className="reservations-list">
                {reservations.active.map((res) => {
                  const status = getStatusConfig(res.status);
                  return (
                    <div key={res.id} className="reservation-card">
                      <div className="status-bar" style={{ background: status.color }} />

                      <div className="reservation-top">
                        <span className="status-chip" style={{ background: status.bg, color: status.color }}>
                          <Icon name={status.icon} size={10} color={status.color} strokeWidth={2.5} />
                          {status.label}
                        </span>
                        {res.expiresIn && (
                          <span className="expires-chip">
                            <Icon name="clock" size={10} color="var(--color-text-muted)" strokeWidth={1.75} />
                            Expires in {res.expiresIn}
                          </span>
                        )}
                      </div>

                      <div className="reservation-main">
                        <div className="listing-image">
                          <span className="listing-emoji">{res.listing.emoji}</span>
                        </div>
                        <div className="reservation-info">
                          <h3 className="listing-title">{res.listing.title}</h3>
                          <span className="listing-price">{formatPrice(res.listing.price)}</span>

                          <div className="vendor-info">
                            <div
                              className="vendor-avatar"
                              style={{ background: `${res.vendor.color}15`, color: res.vendor.color }}
                            >
                              {res.vendor.initials}
                            </div>
                            <span className="vendor-name">{res.vendor.name}</span>
                            <button
                              className="vendor-action"
                              onClick={() => handleContactVendor(res.vendor)}
                            >
                              <Icon name="phone" size={12} color="var(--color-text-secondary)" strokeWidth={1.75} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pickup-details">
                        <div className="detail-row">
                          <Icon name="calendar" size={12} color="var(--color-text-muted)" strokeWidth={1.75} />
                          <span className="detail-label">Pickup</span>
                          <span className="detail-value">{res.pickupTime}</span>
                        </div>
                        <div className="detail-row">
                          <Icon name="mapPin" size={12} color="var(--color-text-muted)" strokeWidth={1.75} />
                          <span className="detail-label">Location</span>
                          <span className="detail-value">{res.pickupLocation}</span>
                        </div>
                      </div>

                      <div className="reservation-actions">
                        {res.status === 'confirmed' && (
                          <>
                            <button
                              className="action-btn primary"
                              onClick={() => handleMarkCollected(res.id)}
                            >
                              <Icon name="check" size={14} color="var(--color-text-inverse)" strokeWidth={2.5} />
                              Mark as Collected
                            </button>
                            <button
                              className="action-btn secondary"
                              onClick={() => handleCancelReservation(res.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {res.status === 'pending' && (
                          <>
                            <button
                              className="action-btn outline"
                              onClick={() => showToast('Waiting for seller confirmation...', 'info')}
                            >
                              <Icon name="clock" size={14} color="var(--color-warning)" strokeWidth={2} />
                              Awaiting Confirmation
                            </button>
                            <button
                              className="action-btn secondary"
                              onClick={() => handleCancelReservation(res.id)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="package" size={48} color="var(--color-border-strong)" strokeWidth={1.5} />
                </div>
                <h3 className="empty-title">No active reservations</h3>
                <p className="empty-text">
                  When you reserve items from sellers, they'll appear here
                </p>
                <button
                  className="empty-btn"
                  onClick={() => navigate('/landing')}
                >
                  <Icon name="search" size={14} color="var(--color-text-inverse)" strokeWidth={2} />
                  Browse Listings
                </button>
              </div>
            )}
          </>
        )}

        {/* History */}
        {activeTab === 'history' && (
          <>
            {reservations.history.length > 0 ? (
              <div className="reservations-list">
                {reservations.history.map((res) => {
                  const status = getStatusConfig(res.status);
                  return (
                    <div key={res.id} className="history-card">
                      <div className="history-main">
                        <div className="listing-image small">
                          <span className="listing-emoji">{res.listing.emoji}</span>
                        </div>
                        <div className="history-info">
                          <div className="history-header">
                            <h3 className="listing-title">{res.listing.title}</h3>
                            <span
                              className="status-chip small"
                              style={{ background: status.bg, color: status.color }}
                            >
                              {status.label}
                            </span>
                          </div>
                          <div className="history-meta">
                            <span className="history-price">{formatPrice(res.listing.price)}</span>
                            <span className="history-divider">•</span>
                            <span className="history-date">
                              {res.completedAt || res.cancelledAt}
                            </span>
                          </div>
                          <div className="history-vendor">
                            <div
                              className="vendor-avatar small"
                              style={{ background: `${res.vendor.color}15`, color: res.vendor.color }}
                            >
                              {res.vendor.initials}
                            </div>
                            <span className="vendor-name">{res.vendor.name}</span>
                          </div>
                        </div>
                      </div>

                      {res.status === 'completed' && !res.hasReviewed && (
                        <div className="history-actions">
                          <button
                            className="review-btn"
                            onClick={() => {
                              setShowReviewModal(res.id);
                              setReviewRating(5);
                            }}
                          >
                            <Icon name="star" size={14} color="var(--color-accent)" strokeWidth={1.75} />
                            Leave a Review
                          </button>
                        </div>
                      )}

                      {res.status === 'completed' && res.hasReviewed && res.rating && (
                        <div className="rating-display">
                          {[...Array(5)].map((_, i) => (
                            <Icon
                              key={i}
                              name="star"
                              size={12}
                              color={i < res.rating ? 'var(--color-accent)' : 'var(--color-border-strong)'}
                              fill={i < res.rating ? 'var(--color-accent)' : 'none'}
                              strokeWidth={1.75}
                            />
                          ))}
                          <span className="rating-text">You rated {res.rating} stars</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="inbox" size={48} color="var(--color-border-strong)" strokeWidth={1.5} />
                </div>
                <h3 className="empty-title">No history yet</h3>
                <p className="empty-text">
                  Your completed and cancelled reservations will appear here
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Rate your experience</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(null)}>
                <Icon name="x" size={18} color="var(--color-text-secondary)" strokeWidth={1.75} />
              </button>
            </div>

            <div className="star-rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="star-btn"
                  onClick={() => setReviewRating(star)}
                >
                  <Icon
                    name="star"
                    size={32}
                    color={star <= reviewRating ? 'var(--color-accent)' : 'var(--color-border-strong)'}
                    fill={star <= reviewRating ? 'var(--color-accent)' : 'none'}
                    strokeWidth={1.75}
                  />
                </button>
              ))}
            </div>
            <p className="rating-label">
              {reviewRating === 5 && 'Excellent! 🌟'}
              {reviewRating === 4 && 'Great! 👍'}
              {reviewRating === 3 && 'Good 😊'}
              {reviewRating === 2 && 'Could be better'}
              {reviewRating === 1 && 'Not great'}
            </p>

            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="form-textarea"
                placeholder="Share your experience..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowReviewModal(null)}>
                Skip
              </button>
              <button className="btn-primary" onClick={handleReviewSubmit}>
                Submit Review
              </button>
            </div>
          </div>
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
            const active = item.id === 'profile';
            return (
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .my-reservations {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .my-reservations { padding-bottom: 40px; }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: var(--color-surface);
          padding: 14px 16px 0;
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
          width: 38px;
          height: 38px;
          border-radius: var(--radius-lg);
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-btn:hover { background: var(--color-border); }

        .header-content {
          max-width: 700px;
          margin: 0 auto 16px;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--color-warning-bg);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          color: var(--color-warning);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
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
          color: var(--color-text-muted);
          cursor: pointer;
          font-family: inherit;
          position: relative;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }

        .tab-btn:hover { color: var(--color-text-secondary); }

        .tab-btn.active {
          color: var(--color-text);
          border-bottom-color: var(--color-accent);
        }

        .tab-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-size: 10px;
          font-weight: 700;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 700px;
          margin: 0 auto;
          padding: 16px;
        }

        .reservations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ===== RESERVATION CARD ===== */
        .reservation-card {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow-xs);
        }

        .status-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }

        .reservation-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px 10px 18px;
          border-bottom: 1px solid var(--color-surface-alt);
          gap: 8px;
          flex-wrap: wrap;
        }

        .status-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-xl);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .status-chip.small {
          font-size: 10px;
          padding: 3px 8px;
        }

        .expires-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .reservation-main {
          display: flex;
          gap: 12px;
          padding: 14px 14px 12px 18px;
        }

        .listing-image {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .listing-image.small {
          width: 48px;
          height: 48px;
        }

        .listing-emoji { font-size: 28px; }
        .listing-image.small .listing-emoji { font-size: 22px; }

        .reservation-info { flex: 1; min-width: 0; }

        .listing-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .listing-price {
          font-family: var(--font-serif);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-primary);
          display: block;
          margin-bottom: 8px;
        }

        .vendor-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .vendor-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .vendor-avatar.small {
          width: 20px;
          height: 20px;
          font-size: 8px;
        }

        .vendor-name {
          font-size: 12px;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .vendor-action {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .vendor-action:hover { background: var(--color-border); }

        .pickup-details {
          background: var(--color-surface-alt);
          padding: 12px 14px 12px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-top: 1px solid var(--color-border);
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .detail-label {
          color: var(--color-text-muted);
          font-weight: 500;
          min-width: 60px;
        }

        .detail-value {
          color: var(--color-text);
          font-weight: 600;
          flex: 1;
        }

        .reservation-actions {
          display: flex;
          gap: 8px;
          padding: 12px 14px 14px 18px;
          border-top: 1px solid var(--color-border);
        }

        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: var(--radius-lg);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 40px;
        }

        .action-btn.primary {
          background: var(--color-primary);
          border: none;
          color: var(--color-text-inverse);
        }

        .action-btn.primary:hover {
          background: var(--color-accent);
          transform: scale(0.98);
        }

        .action-btn.secondary {
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          color: var(--color-text-secondary);
          flex: 0 0 auto;
          padding: 10px 16px;
        }

        .action-btn.secondary:hover { background: var(--color-border); }

        .action-btn.outline {
          background: var(--color-warning-bg);
          border: 1px solid var(--color-warning);
          color: var(--color-warning);
        }

        /* ===== HISTORY CARD ===== */
        .history-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
          box-shadow: var(--shadow-xs);
        }

        .history-main {
          display: flex;
          gap: 12px;
          padding: 14px;
        }

        .history-info { flex: 1; min-width: 0; }

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
          font-family: var(--font-serif);
          color: var(--color-primary);
          font-weight: 600;
        }

        .history-divider { color: var(--color-border); }

        .history-date { color: var(--color-text-muted); }

        .history-vendor {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .history-actions {
          padding: 12px 14px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-alt);
        }

        .review-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .review-btn:hover {
          background: var(--color-accent-tint);
          border-color: var(--color-accent);
          color: var(--color-accent);
        }

        .rating-display {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 10px 14px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-alt);
        }

        .rating-text {
          font-size: 11px;
          color: var(--color-text-muted);
          margin-left: 6px;
          font-weight: 500;
        }

        /* ===== EMPTY ===== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
        }

        .empty-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-title {
          font-family: var(--font-serif);
          font-size: 17px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
        }

        .empty-text {
          font-size: 14px;
          color: var(--color-text-muted);
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
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-lg);
          color: var(--color-text-inverse);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .empty-btn:hover {
          background: var(--color-accent);
          transform: scale(0.98);
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 36, 114, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          max-width: 420px;
          width: 100%;
          padding: 24px;
          box-shadow: var(--shadow-2xl);
          animation: slideUp 0.25s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-family: var(--font-serif);
          font-size: 17px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover { background: var(--color-border); }

        .star-rating-input {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.2s;
        }

        .star-btn:hover { transform: scale(1.15); }
        .star-btn:active { transform: scale(0.95); }

        .rating-label {
          text-align: center;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 20px;
        }

        .form-group { margin-bottom: 16px; }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 6px;
        }

        .form-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 14px;
          color: var(--color-text);
          outline: none;
          background: var(--color-surface);
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          line-height: 1.5;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .form-textarea:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .btn-secondary {
          flex: 1;
          padding: 12px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          color: var(--color-text-secondary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-secondary:hover { background: var(--color-border); }

        .btn-primary {
          flex: 1;
          padding: 12px;
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-lg);
          color: var(--color-text-inverse);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: var(--color-accent);
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
          border-top: 1px solid var(--color-border);
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
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .nav-label.active {
          color: var(--color-text);
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .page-header { padding: 12px 12px 0; }
          .main-content { padding: 12px; }
          .page-title { font-size: 20px; }
          .reservation-main { padding: 12px 12px 10px 16px; }
          .listing-image { width: 52px; height: 52px; }
          .listing-emoji { font-size: 24px; }
          .pickup-details { padding: 10px 12px 10px 16px; }
          .reservation-actions { padding: 10px 12px 12px 16px; }
        }

        @media (max-width: 380px) {
          .listing-title { font-size: 13px; }
          .listing-price { font-size: 13px; }
          .action-btn { font-size: 11px; padding: 8px 10px; min-height: 36px; }
          .detail-label { min-width: 50px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .star-btn, .action-btn, .btn-primary, .btn-secondary { transition: none; }
          .star-btn:hover, .action-btn.primary:hover, .btn-primary:hover { transform: none; }
          .modal-overlay, .modal-content { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default MyReservations;