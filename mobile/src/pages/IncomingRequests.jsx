// mobile/src/pages/IncomingRequests.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { requestsAPI } from '../services/api';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
    checkCircle: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
    xCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6',
    alertCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    plus: 'M12 4v16m8-8H4',
    refresh: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15',
    store: 'M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9',
    trendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
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
// HELPERS
// ============================================================
const formatPrice = (price) => {
  if (price == null) return '—';
  const num = Number(price);
  if (Number.isNaN(num)) return '—';
  return `MK ${num.toLocaleString()}`;
};

const timeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

const pickColor = (str) => {
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
  if (!str) return colors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const RESPONSE_STATUS_UI = {
  pending: { label: 'Pending Review', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  negotiating: { label: 'Negotiating', color: 'var(--color-accent)', bg: 'var(--color-accent-soft)' },
  accepted: { label: 'Accepted', color: 'var(--color-success)', bg: 'var(--color-success-bg)' },
  rejected: { label: 'Declined', color: 'var(--color-error)', bg: 'var(--color-error-bg)' },
  withdrawn: { label: 'Withdrawn', color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)' },
};

const REQUEST_STATUS_UI = {
  open: { label: 'Open', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: 'clock' },
  answered: { label: 'Answered', color: 'var(--color-accent)', bg: 'var(--color-accent-soft)', icon: 'message' },
  fulfilled: { label: 'Fulfilled', color: 'var(--color-success)', bg: 'var(--color-success-bg)', icon: 'checkCircle' },
  expired: { label: 'Expired', color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', icon: 'alertCircle' },
  cancelled: { label: 'Cancelled', color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)', icon: 'xCircle' },
};

const IncomingRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, success } = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [past, setPast] = useState([]);
  const [processing, setProcessing] = useState(null);

  const [negotiateFor, setNegotiateFor] = useState(null);
  const [negotiatePrice, setNegotiatePrice] = useState('');
  const [negotiateMessage, setNegotiateMessage] = useState('');
  const [submittingNegotiate, setSubmittingNegotiate] = useState(false);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = useCallback(async (opts = {}) => {
    if (!user?.id) return;
    if (!opts.silent) setLoading(true);
    try {
      const res = await requestsAPI.mine({ status: 'all', limit: 100 });
      const myRequests = res?.data?.requests || [];

      const activeReqs = myRequests.filter((r) =>
        ['open', 'answered'].includes(r.effective_status || r.status)
      );
      const pastReqs = myRequests.filter((r) =>
        ['fulfilled', 'expired', 'cancelled'].includes(r.effective_status || r.status)
      );

      const enrichedActive = await Promise.all(
        activeReqs.map(async (r) => {
          try {
            const detailRes = await requestsAPI.get(r.id);
            return {
              request: detailRes?.data?.request || r,
              responses: detailRes?.data?.request?.responses || [],
            };
          } catch (err) {
            console.warn('Failed to load request detail', r.id, err?.message);
            return { request: r, responses: [] };
          }
        })
      );

      const flatPending = [];
      for (const { request, responses } of enrichedActive) {
        for (const resp of responses) {
          if (['pending', 'negotiating'].includes(resp.status)) {
            flatPending.push({ request, response: resp });
          }
        }
      }

      setPending(flatPending);
      setPast(pastReqs);
    } catch (err) {
      console.error('Load incoming requests error:', err);
      if (!opts.silent) showToast('Failed to load requests', 'error');
    } finally {
      if (!opts.silent) setLoading(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAccept = async (requestId, responseId) => {
    setProcessing(responseId);
    try {
      const res = await requestsAPI.accept(requestId, responseId);
      const conversationId = res?.data?.conversationId;
      success('Response accepted! 🎉');
      await loadData({ silent: true });
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to accept';
      showToast(msg, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (requestId, responseId) => {
    const reason = window.prompt('Reason for declining (optional):') ?? null;
    setProcessing(responseId);
    try {
      await requestsAPI.reject(
        requestId,
        responseId,
        reason && reason.trim() ? reason.trim() : null
      );
      success('Response declined');
      await loadData({ silent: true });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to decline';
      showToast(msg, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenChat = async (response) => {
    if (!response?.conversation_id) {
      showToast('Chat will be available after you accept or negotiate', 'info');
      return;
    }
    navigate(`/chat/${response.conversation_id}`);
  };

  const handleOpenNegotiate = (request, response) => {
    setNegotiateFor({ request, response });
    setNegotiatePrice(
      response.offered_price != null ? String(response.offered_price) : ''
    );
    setNegotiateMessage('');
  };

  const handleCloseNegotiate = () => {
    if (submittingNegotiate) return;
    setNegotiateFor(null);
    setNegotiatePrice('');
    setNegotiateMessage('');
  };

  const handleSubmitNegotiate = async () => {
    if (!negotiateFor) return;
    const priceNum = parseFloat(negotiatePrice);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      showToast('Enter a valid counter price', 'warning');
      return;
    }
    setSubmittingNegotiate(true);
    try {
      const res = await requestsAPI.negotiate(
        negotiateFor.request.id,
        negotiateFor.response.id,
        { counterPrice: priceNum, counterMessage: negotiateMessage.trim() || null }
      );
      const conversationId = res?.data?.conversationId;
      success('Counter offer sent 💰');
      setNegotiateFor(null);
      setNegotiatePrice('');
      setNegotiateMessage('');
      await loadData({ silent: true });
      if (conversationId) {
        navigate(`/chat/${conversationId}`);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to send counter';
      showToast(msg, 'error');
    } finally {
      setSubmittingNegotiate(false);
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const pendingCount = pending.length;

  return (
    <div className="incoming-requests">
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="var(--color-text)" strokeWidth={1.75} />
          </button>
          <button className="header-btn" onClick={() => loadData()}>
            <Icon name="refresh" size={18} color="var(--color-text-secondary)" strokeWidth={1.75} />
          </button>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="inbox" size={14} color="var(--color-warning)" strokeWidth={1.75} />
            <span>Seller Inbox</span>
          </div>
          <h1 className="page-title">Incoming Requests</h1>
          <p className="page-subtitle">Review responses from buyers and negotiate prices</p>
        </div>

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

      <div className="main-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading your requests…</p>
          </div>
        )}

        {!loading && activeTab === 'pending' && (
          <>
            {pending.length > 0 ? (
              <div className="requests-list">
                {pending.map(({ request, response }) => {
                  const responder = response.responder || {};
                  const name = responder.full_name || 'Someone';
                  const initials = initialsOf(responder.full_name, responder.email);
                  const color = pickColor(responder.id || name);
                  const statusUi = RESPONSE_STATUS_UI[response.status] || RESPONSE_STATUS_UI.pending;

                  return (
                    <div key={response.id} className="request-card">
                      <div className="status-bar" style={{ background: statusUi.color }} />

                      <div className="request-top">
                        <span className="status-chip" style={{ background: statusUi.bg, color: statusUi.color }}>
                          <Icon name="clock" size={10} color={statusUi.color} strokeWidth={2.5} />
                          {statusUi.label}
                        </span>
                        <span className="request-time">{timeAgo(response.created_at)}</span>
                      </div>

                      <div className="request-listing">
                        <div className="listing-image">
                          <span className="listing-emoji">📋</span>
                        </div>
                        <div className="listing-info">
                          <h3 className="listing-title">{request.title}</h3>
                          {request.budget_min || request.budget_max ? (
                            <span className="listing-price">
                              Budget:{' '}
                              {request.budget_min && request.budget_max
                                ? `${formatPrice(request.budget_min)} – ${formatPrice(request.budget_max)}`
                                : request.budget_min
                                ? `from ${formatPrice(request.budget_min)}`
                                : `up to ${formatPrice(request.budget_max)}`}
                            </span>
                          ) : (
                            <span className="listing-price">Budget flexible</span>
                          )}
                          {request.location_area && (
                            <span className="request-type">
                              <Icon name="mapPin" size={10} color="var(--color-text-muted)" strokeWidth={2} />{' '}
                              {request.location_name || request.location_area}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="buyer-section">
                        <div className="buyer-avatar" style={{ background: `${color}15`, color }}>
                          {initials}
                        </div>
                        <div className="buyer-info">
                          <div className="buyer-header">
                            <span className="buyer-name">{name}</span>
                            {responder.trust?.trust_score != null && (
                              <span className="buyer-rating">
                                <Icon name="star" size={10} color="var(--color-accent)" strokeWidth={2} fill="var(--color-accent)" />
                                {responder.trust.trust_score}
                              </span>
                            )}
                          </div>
                          {response.offered_price != null && (
                            <span className="buyer-meta">
                              Offered <strong>{formatPrice(response.offered_price)}</strong>
                            </span>
                          )}
                        </div>
                        <div className="buyer-actions">
                          <button className="buyer-action-btn" onClick={() => handleOpenChat(response)} title="Message">
                            <Icon name="message" size={14} color="var(--color-text-secondary)" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>

                      {response.message && (
                        <div className="buyer-note">
                          <Icon name="message" size={12} color="var(--color-warning)" strokeWidth={1.75} />
                          <span>"{response.message}"</span>
                        </div>
                      )}

                      <div className="request-actions">
                        <button
                          className="action-btn decline"
                          onClick={() => handleDecline(request.id, response.id)}
                          disabled={processing === response.id}
                        >
                          <Icon name="x" size={14} color="var(--color-error)" strokeWidth={2.5} />
                          Decline
                        </button>
                        <button
                          className="action-btn negotiate"
                          onClick={() => handleOpenNegotiate(request, response)}
                          disabled={processing === response.id}
                        >
                          <Icon name="tag" size={14} color="var(--color-accent-hover)" strokeWidth={2.2} />
                          Negotiate
                        </button>
                        <button
                          className="action-btn accept"
                          onClick={() => handleAccept(request.id, response.id)}
                          disabled={processing === response.id}
                        >
                          {processing === response.id ? (
                            <span className="btn-spinner-small" />
                          ) : (
                            <>
                              <Icon name="check" size={14} color="var(--color-text-inverse)" strokeWidth={2.5} />
                              Accept
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="inbox" size={48} color="var(--color-border-strong)" strokeWidth={1.5} />
                </div>
                <h3 className="empty-title">All caught up!</h3>
                <p className="empty-text">
                  No pending responses. New ones will appear here when someone responds to your requests.
                </p>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'history' && (
          <>
            {past.length > 0 ? (
              <div className="history-list">
                {past.map((r) => {
                  const statusUi = REQUEST_STATUS_UI[r.effective_status || r.status] || REQUEST_STATUS_UI.open;
                  return (
                    <div key={r.id} className="history-card">
                      <div className="history-main">
                        <div className="listing-image small">
                          <span className="listing-emoji">📋</span>
                        </div>
                        <div className="history-info">
                          <div className="history-header">
                            <h3 className="listing-title">{r.title}</h3>
                            <span
                              className="status-chip small"
                              style={{ background: statusUi.bg, color: statusUi.color }}
                            >
                              <Icon name={statusUi.icon} size={9} color={statusUi.color} strokeWidth={2.5} />
                              {statusUi.label}
                            </span>
                          </div>
                          <div className="history-meta">
                            <span className="history-price">
                              {r.responses_count > 0
                                ? `${r.responses_count} response${r.responses_count === 1 ? '' : 's'}`
                                : 'No responses'}
                            </span>
                            <span className="history-divider">•</span>
                            <span className="history-date">{timeAgo(r.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="clock" size={48} color="var(--color-border-strong)" strokeWidth={1.5} />
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

      {negotiateFor && (
        <div className="modal-overlay" onClick={handleCloseNegotiate}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Send a counter offer</h3>
              <button className="modal-close" onClick={handleCloseNegotiate} aria-label="Close">
                <Icon name="x" size={18} color="var(--color-text)" strokeWidth={2} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-request-ctx">
                <div className="modal-ctx-label">For request</div>
                <div className="modal-ctx-title">{negotiateFor.request.title}</div>
                {negotiateFor.response.offered_price != null && (
                  <div className="modal-ctx-sub">
                    Their offer: <strong>{formatPrice(negotiateFor.response.offered_price)}</strong>
                  </div>
                )}
              </div>

              <div className="modal-field">
                <label className="modal-label">Your counter price (MK)</label>
                <input
                  type="number"
                  className="modal-input"
                  value={negotiatePrice}
                  onChange={(e) => setNegotiatePrice(e.target.value)}
                  placeholder="e.g. 15000"
                  min="0"
                  step="100"
                  autoFocus
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Message (optional)</label>
                <textarea
                  className="modal-textarea"
                  value={negotiateMessage}
                  onChange={(e) => setNegotiateMessage(e.target.value.slice(0, 500))}
                  placeholder="Add a note explaining your price…"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={handleCloseNegotiate} disabled={submittingNegotiate}>
                Cancel
              </button>
              <button className="modal-btn primary" onClick={handleSubmitNegotiate} disabled={submittingNegotiate}>
                {submittingNegotiate ? 'Sending…' : 'Send counter'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        .incoming-requests {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
        }
        @media (min-width: 769px) { .incoming-requests { padding-bottom: 40px; } }

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
          width: 38px; height: 38px;
          border-radius: var(--radius-lg);
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .header-btn:hover { background: var(--color-border); }
        .header-content { max-width: 700px; margin: 0 auto 16px; }
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
        .tabs { display: flex; gap: 4px; max-width: 700px; margin: 0 auto; }
        .tab-btn {
          flex: 1;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 12px 8px;
          border: none; background: transparent;
          font-size: 14px; font-weight: 600;
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
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 20px; height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-size: 11px; font-weight: 700;
        }

        .main-content { max-width: 700px; margin: 0 auto; padding: 16px; }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--color-text-muted);
        }
        .loading-spinner {
          width: 32px; height: 32px;
          border: 3px solid var(--color-primary-tint);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .requests-list, .history-list {
          display: flex; flex-direction: column; gap: 12px;
        }

        .request-card {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          overflow: hidden;
          position: relative;
          box-shadow: var(--shadow-xs);
        }
        .status-bar {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
        }
        .request-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px 10px 18px;
          border-bottom: 1px solid var(--color-surface-alt);
          gap: 8px;
          flex-wrap: wrap;
        }
        .status-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-xl);
          font-size: 11px; font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .status-chip.small {
          font-size: 10px;
          padding: 3px 8px;
        }
        .request-time {
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .request-listing {
          display: flex; gap: 12px;
          padding: 14px 14px 12px 18px;
          border-bottom: 1px solid var(--color-surface-alt);
        }
        .listing-image {
          width: 60px; height: 60px;
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .listing-image.small { width: 48px; height: 48px; }
        .listing-emoji { font-size: 28px; }
        .listing-image.small .listing-emoji { font-size: 22px; }
        .listing-info {
          flex: 1; min-width: 0;
          display: flex; flex-direction: column; gap: 3px;
        }
        .listing-title {
          font-size: 14px; font-weight: 700;
          color: var(--color-text);
          margin: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .listing-price {
          font-family: var(--font-serif);
          font-size: 13.5px; font-weight: 600;
          color: var(--color-primary);
        }
        .request-type {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--color-text-muted);
          font-weight: 500;
          margin-top: 2px;
        }

        .buyer-section {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 14px 12px 18px;
          border-bottom: 1px solid var(--color-surface-alt);
        }
        .buyer-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          flex-shrink: 0;
        }
        .buyer-info { flex: 1; min-width: 0; }
        .buyer-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 2px; flex-wrap: wrap;
        }
        .buyer-name {
          font-size: 13px; font-weight: 700;
          color: var(--color-text);
        }
        .buyer-rating {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 11px; font-weight: 600;
          color: var(--color-text);
          background: var(--color-surface-alt);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }
        .buyer-meta {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }
        .buyer-meta strong {
          color: var(--color-primary);
          font-weight: 700;
        }
        .buyer-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .buyer-action-btn {
          width: 32px; height: 32px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .buyer-action-btn:hover { background: var(--color-border); }

        .buyer-note {
          display: flex; align-items: flex-start; gap: 8px;
          padding: 12px 14px 12px 18px;
          background: var(--color-warning-bg);
          border-bottom: 1px solid var(--color-warning);
          font-size: 12px;
          color: var(--color-warning);
          line-height: 1.5;
          font-style: italic;
        }

        .request-actions {
          display: flex; gap: 8px;
          padding: 12px 14px 14px 18px;
        }
        .action-btn {
          flex: 1;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: var(--radius-lg);
          font-size: 13px; font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 42px;
        }
        .action-btn.decline {
          background: var(--color-surface);
          border: 1.5px solid var(--color-error);
          color: var(--color-error);
        }
        .action-btn.decline:hover:not(:disabled) {
          background: var(--color-error-bg);
          transform: scale(0.98);
        }
        .action-btn.negotiate {
          background: var(--color-accent-soft);
          border: 1.5px solid var(--color-accent);
          color: var(--color-accent-hover);
        }
        .action-btn.negotiate:hover:not(:disabled) {
          background: var(--color-accent);
          color: var(--color-text-inverse);
          transform: scale(0.98);
        }
        .action-btn.negotiate:hover:not(:disabled) svg { stroke: var(--color-text-inverse); }
        .action-btn.accept {
          background: var(--color-primary);
          border: none;
          color: var(--color-text-inverse);
        }
        .action-btn.accept:hover:not(:disabled) {
          background: var(--color-success);
          transform: scale(0.98);
        }
        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner-small {
          width: 16px; height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--color-text-inverse);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .history-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xs);
        }
        .history-main { display: flex; gap: 12px; padding: 14px; }
        .history-info { flex: 1; min-width: 0; }
        .history-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 8px;
          margin-bottom: 6px;
        }
        .history-meta {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; flex-wrap: wrap;
        }
        .history-price {
          font-family: var(--font-serif);
          color: var(--color-primary);
          font-weight: 600;
        }
        .history-divider { color: var(--color-border); }
        .history-date { color: var(--color-text-muted); }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
        }
        .empty-icon-wrap {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .empty-title {
          font-family: var(--font-serif);
          font-size: 17px; font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
        }
        .empty-text {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.5;
          max-width: 300px;
          margin-left: auto;
          margin-right: auto;
        }

        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(10, 36, 114, 0.55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 500;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .modal-card {
          width: 100%; max-width: 460px;
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: popIn 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
        }
        @keyframes popIn {
          from { transform: scale(0.96); opacity: 0.6; }
          to   { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px;
          border-bottom: 1px solid var(--color-border);
        }
        .modal-title {
          font-family: var(--font-serif);
          font-size: 17px; font-weight: 700;
          color: var(--color-text);
          margin: 0;
          letter-spacing: -0.01em;
        }
        .modal-close {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .modal-close:hover { background: var(--color-surface-alt); }

        .modal-body {
          padding: 16px 18px;
          display: flex; flex-direction: column; gap: 16px;
        }
        .modal-request-ctx {
          padding: 12px 14px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        .modal-ctx-label {
          font-size: 10.5px; font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .modal-ctx-title {
          font-size: 14px; font-weight: 700;
          color: var(--color-text);
          margin-bottom: 2px;
        }
        .modal-ctx-sub {
          font-size: 12.5px;
          color: var(--color-text-secondary);
        }
        .modal-ctx-sub strong { color: var(--color-primary); }

        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label {
          font-size: 12.5px; font-weight: 700;
          color: var(--color-text);
        }
        .modal-input,
        .modal-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          font-size: 15px;
          color: var(--color-text);
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .modal-input:focus,
        .modal-textarea:focus {
          border-color: var(--color-accent);
          background: var(--color-surface);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }
        .modal-textarea {
          resize: vertical;
          min-height: 80px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex; gap: 10px;
          padding: 14px 18px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-alt);
        }
        .modal-btn {
          flex: 1;
          padding: 12px 14px;
          border-radius: var(--radius-lg);
          font-family: inherit;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          min-height: 46px;
        }
        .modal-btn.cancel {
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          color: var(--color-text-secondary);
        }
        .modal-btn.cancel:hover:not(:disabled) { background: var(--color-border); }
        .modal-btn.primary {
          background: var(--color-accent);
          border: none;
          color: var(--color-text-inverse);
          box-shadow: var(--shadow-accent);
        }
        .modal-btn.primary:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
        }
        .modal-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--color-border);
          display: flex; justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px;
          background: none; border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-family: inherit;
          min-width: 44px;
        }
        .nav-icon-wrap {
          width: 34px; height: 34px;
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .nav-icon-wrap.active {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }
        .nav-label { font-size: 9px; font-weight: 500; color: var(--color-text-muted); }
        .nav-label.active { color: var(--color-text); font-weight: 600; }

        @media (max-width: 480px) {
          .page-header { padding: 12px 12px 0; }
          .main-content { padding: 12px; }
          .page-title { font-size: 20px; }
          .request-listing { padding: 12px 12px 10px 16px; }
          .listing-image { width: 52px; height: 52px; }
          .listing-emoji { font-size: 24px; }
          .buyer-section { padding: 10px 12px 10px 16px; }
          .buyer-note { padding: 10px 12px 10px 16px; }
          .request-actions { padding: 10px 12px 12px 16px; flex-wrap: wrap; }
          .action-btn { flex: 1 1 30%; font-size: 12px; padding: 8px 6px; min-height: 38px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .action-btn, .buyer-action-btn, .header-btn, .modal-btn { transition: none; }
          .action-btn.decline:hover:not(:disabled),
          .action-btn.negotiate:hover:not(:disabled),
          .action-btn.accept:hover:not(:disabled),
          .modal-btn.primary:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default IncomingRequests;