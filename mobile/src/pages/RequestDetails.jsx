// mobile/src/pages/RequestDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import useRequest from '../hooks/useRequest';
import ResponseItem from '../components/ResponseItem';
import RespondModal from '../components/RespondModal';
import TrustBadge from '../components/TrustBadge';

const URGENCY_META = {
  low: { label: 'Low priority', color: '#6B7280', bg: '#F3F4F6' },
  medium: { label: 'Medium priority', color: '#0EA5E9', bg: '#E0F2FE' },
  high: { label: 'High priority', color: '#F59E0B', bg: '#FEF3C7' },
  urgent: { label: 'Urgent', color: '#DC2626', bg: '#FEE2E2' },
};

const STATUS_META = {
  open: { label: 'Open', color: '#065F46', bg: '#D1FAE5' },
  answered: { label: 'Answered', color: '#1E40AF', bg: '#DBEAFE' },
  fulfilled: { label: 'Fulfilled', color: '#065F46', bg: '#D1FAE5' },
  expired: { label: 'Expired', color: '#374151', bg: '#E5E7EB' },
  cancelled: { label: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' },
};

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
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
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const expiryLabel = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days >= 1) return `Expires in ${days}d`;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  return `Expires in ${hours}h`;
};

const formatBudget = (min, max) => {
  const fmt = (n) => `MK ${Number(n).toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return 'Budget flexible';
};

const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const TIER_COLORS = {
  0: '#9CA3AF',
  1: '#3B82F6',
  2: '#8B5CF6',
  3: '#10B981',
};

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: showError, showToast } = useToast();

  const {
    request,
    loading,
    error,
    mutating,
    respond,
    acceptResponse,
    withdrawResponse,
    markFulfilled,
    cancel,
  } = useRequest(id);

  const [showRespondModal, setShowRespondModal] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // ============================================================
  // ACCESS GUARDS
  // ============================================================
  const isOwner = !!user?.id && request?.user_id === user.id;

  const myResponse = (request?.responses || []).find((r) => r.is_mine);
  const hasResponded = !!myResponse;

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRespondClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/requests/${id}` } });
      return;
    }
    setShowRespondModal(true);
  };

  const handleSubmitResponse = async ({ message, offeredPrice }) => {
    try {
      await respond({ message, offeredPrice });
      success('Response sent! 🎉');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed to respond');
      throw err;
    }
  };

  const handleAccept = async (responseId) => {
    try {
      const result = await acceptResponse(responseId);
      success('Response accepted — chat opened');
      if (result?.conversationId) {
        setTimeout(() => navigate(`/chat/${result.conversationId}`), 800);
      }
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed to accept');
    }
  };

  const handleReject = async (responseId) => {
    try {
      // No direct "reject" endpoint — use withdraw semantics from owner side.
      // Backend has accept (which auto-rejects others) and withdraw (responder only).
      // For MVP, we simply note the request and let the owner ignore pending ones.
      showToast('You can accept a different response — this one stays pending', 'info');
    } catch (err) {
      console.warn(err);
    }
  };

  const handleWithdraw = async (responseId) => {
    try {
      await withdrawResponse(responseId);
      success('Response withdrawn');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed to withdraw');
    }
  };

  const handleFulfill = async () => {
    try {
      await markFulfilled();
      success('Request marked as fulfilled 🎉');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed to fulfill');
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      success('Request cancelled');
      navigate('/requests');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed to cancel');
    }
  };

  const handleOpenChat = (conversationId) => {
    if (conversationId) navigate(`/chat/${conversationId}`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/requests/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: request?.title || 'Kumsika Request',
          text: `Check out this request on Kumsika: ${request?.title}`,
          url,
        });
        return;
      } catch (err) {
        // user cancelled
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      success('Link copied to clipboard');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading && !request) {
    return (
      <div className="page">
        <div className="header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <h1 className="header-title">Request</h1>
        </div>
        <div className="content">
          <div className="skeleton skeleton-hero" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line-short" />
        </div>
        <style jsx>{sharedStyles}</style>
      </div>
    );
  }

  if (!loading && (error || !request)) {
    return (
      <div className="page">
        <div className="header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <h1 className="header-title">Request</h1>
        </div>
        <div className="content">
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="alert" size={40} color="#9CA3AF" strokeWidth={1.6} />
            </div>
            <h2 className="empty-title">Request not found</h2>
            <p className="empty-desc">{error || 'This request may have been deleted.'}</p>
            <button className="btn-primary" onClick={() => navigate('/requests')}>
              Browse requests
            </button>
          </div>
        </div>
        <style jsx>{sharedStyles}</style>
      </div>
    );
  }

  const urgency = URGENCY_META[request.urgency] || URGENCY_META.medium;
  const statusKey = request.effective_status || request.status || 'open';
  const status = STATUS_META[statusKey] || STATUS_META.open;
  const author = request.author;
  const authorName = author?.full_name || 'Anonymous';
  const authorInitials = initialsOf(authorName);
  const tierColor = TIER_COLORS[author?.trust?.tier ?? 0];
  const expiry = expiryLabel(request.expires_at);
  const responses = request.responses || [];
  const isOpen = statusKey === 'open' || statusKey === 'answered';
  const canRespond = !isOwner && isOpen && !hasResponded;

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <h1 className="header-title">Request</h1>
        <button className="share-btn" onClick={handleShare} aria-label="Share">
          <Icon name="send" size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        {/* Hero */}
        <div className="hero">
          <div className="hero-badges">
            <span className="pill" style={{ background: urgency.bg, color: urgency.color }}>
              {urgency.label}
            </span>
            <span className="pill" style={{ background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>

          <h1 className="title">{request.title}</h1>

          {request.description && (
            <p className="description">{request.description}</p>
          )}

          <div className="meta-grid">
            <div className="meta-cell">
              <span className="meta-icon">
                <Icon name="tag" size={14} strokeWidth={2} />
              </span>
              <div className="meta-content">
                <span className="meta-label">Budget</span>
                <span className="meta-value">
                  {formatBudget(request.budget_min, request.budget_max)}
                </span>
              </div>
            </div>

            {request.location_area && (
              <div className="meta-cell">
                <span className="meta-icon">
                  <Icon name="mapPin" size={14} strokeWidth={2} />
                </span>
                <div className="meta-content">
                  <span className="meta-label">Location</span>
                  <span className="meta-value">{request.location_area}</span>
                </div>
              </div>
            )}

            {request.category && (
              <div className="meta-cell">
                <span className="meta-icon">
                  <Icon name="message" size={14} strokeWidth={2} />
                </span>
                <div className="meta-content">
                  <span className="meta-label">Category</span>
                  <span className="meta-value">{request.category}</span>
                </div>
              </div>
            )}

            <div className="meta-cell">
              <span className="meta-icon">
                <Icon name="clock" size={14} strokeWidth={2} />
              </span>
              <div className="meta-content">
                <span className="meta-label">Posted</span>
                <span className="meta-value">{timeAgo(request.created_at)}</span>
              </div>
            </div>

            {expiry && (
              <div className="meta-cell">
                <span className="meta-icon">
                  <Icon name="alert" size={14} strokeWidth={2} />
                </span>
                <div className="meta-content">
                  <span className="meta-label">Timeline</span>
                  <span className="meta-value">{expiry}</span>
                </div>
              </div>
            )}

            <div className="meta-cell">
              <span className="meta-icon">
                <Icon name="message" size={14} strokeWidth={2} />
              </span>
              <div className="meta-content">
                <span className="meta-label">Responses</span>
                <span className="meta-value">{responses.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Author card */}
        {author && (
          <div className="author-card">
            <div className="author-avatar" style={{ background: tierColor }}>
              {authorInitials}
            </div>
            <div className="author-info">
              <span className="author-name">{authorName}</span>
              <span className="author-sub">
                {author.location_text || 'Malawi'}
              </span>
              <div className="author-trust">
                {author.trust ? (
                  <TrustBadge
                    label={
                      author.trust.tier >= 3
                        ? 'Business'
                        : author.trust.tier >= 2
                        ? 'ID Verified'
                        : author.trust.tier >= 1
                        ? 'Verified'
                        : 'Unverified'
                    }
                    color={tierColor}
                    size="sm"
                    variant="default"
                  />
                ) : null}
              </div>
            </div>
            <button
              className="view-profile-btn"
              onClick={() => navigate(`/trust/${author.id}`)}
            >
              View
            </button>
          </div>
        )}

        {/* Owner actions */}
        {isOwner && isOpen && (
          <div className="owner-actions">
            {statusKey === 'answered' && (
              <button
                className="btn-primary btn-full"
                onClick={handleFulfill}
                disabled={mutating}
              >
                <Icon name="check" size={14} color="#FFFFFF" strokeWidth={2.6} />
                Mark as Fulfilled
              </button>
            )}
            <button
              className="btn-secondary btn-full"
              onClick={() => setConfirmCancel(true)}
              disabled={mutating}
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Non-owner respond CTA */}
        {canRespond && (
          <button className="btn-primary btn-full respond-cta" onClick={handleRespondClick}>
            <Icon name="send" size={15} color="#FFFFFF" strokeWidth={2.4} />
            Respond to this Request
          </button>
        )}

        {/* Already responded */}
        {!isOwner && hasResponded && myResponse.status === 'pending' && (
          <div className="your-response-banner">
            <Icon name="check" size={16} color="#065F46" strokeWidth={2.4} />
            <span>You've already responded to this request</span>
          </div>
        )}

        {/* Not logged in */}
        {!isAuthenticated && (
          <div className="login-prompt">
            <Icon name="user" size={18} color="#1E40AF" strokeWidth={1.9} />
            <div className="login-prompt-text">
              <span>Sign in to respond to this request</span>
            </div>
            <button className="btn-primary btn-sm" onClick={handleRespondClick}>
              Sign in
            </button>
          </div>
        )}

        {/* Responses section */}
        <section className="responses-section">
          <div className="section-header">
            <h2 className="section-title">
              Responses
              {responses.length > 0 && (
                <span className="section-count">{responses.length}</span>
              )}
            </h2>
          </div>

          {responses.length === 0 ? (
            <div className="no-responses">
              <Icon name="message" size={28} color="#9CA3AF" strokeWidth={1.6} />
              <p>No responses yet. {isOwner ? 'Share this request to get more visibility.' : 'Be the first to respond!'}</p>
              {isOwner && (
                <button className="btn-secondary btn-sm" onClick={handleShare}>
                  Share request
                </button>
              )}
            </div>
          ) : (
            <div className="responses-list">
              {responses.map((r) => (
                <ResponseItem
                  key={r.id}
                  response={r}
                  isOwner={isOwner}
                  onAccept={() => handleAccept(r.id)}
                  onReject={() => handleReject(r.id)}
                  onWithdraw={() => handleWithdraw(r.id)}
                  onOpenChat={handleOpenChat}
                  busy={mutating}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Respond modal */}
      <RespondModal
        isOpen={showRespondModal}
        onClose={() => setShowRespondModal(false)}
        onSubmit={handleSubmitResponse}
        requestTitle={request.title}
      />

      {/* Cancel confirm modal */}
      {confirmCancel && (
        <div className="modal-overlay" onClick={() => setConfirmCancel(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <Icon name="x" size={28} color="#DC2626" strokeWidth={2.4} />
            </div>
            <h3 className="confirm-title">Cancel this request?</h3>
            <p className="confirm-desc">
              Responders will be notified. This cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                className="btn-secondary btn-full"
                onClick={() => setConfirmCancel(false)}
                disabled={mutating}
              >
                Keep request
              </button>
              <button
                className="btn-danger btn-full"
                onClick={() => {
                  setConfirmCancel(false);
                  handleCancel();
                }}
                disabled={mutating}
              >
                {mutating ? 'Cancelling…' : 'Cancel request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{sharedStyles}</style>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 36, 114, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1100;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .confirm-modal {
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          max-width: 380px;
          width: 100%;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--color-border);
        }

        .confirm-icon {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: var(--color-error-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .confirm-title {
          font-family: var(--font-serif);
          font-size: 19px;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .confirm-desc {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin: 0 0 24px;
          line-height: 1.6;
        }

        .confirm-actions {
          display: flex;
          gap: 10px;
        }

        .btn-danger {
          background: var(--color-error);
          color: #FFFFFF;
          border: none;
          box-shadow: var(--shadow-error);
        }

        .btn-danger:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(220, 38, 38, 0.35);
        }
      `}</style>
    </div>
  );
}

// ============================================================
// SHARED STYLES
// ============================================================
const sharedStyles = `
  .page {
    min-height: 100vh;
    background: var(--color-bg);
    background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
    background-size: 22px 22px;
    font-family: var(--font-sans);
    color: var(--color-text);
    padding-bottom: 40px;
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--color-border);
  }

  .back-btn,
  .share-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .back-btn:hover,
  .share-btn:hover {
    background: var(--color-surface-alt);
    border-color: var(--color-accent);
  }

  .header-title {
    flex: 1;
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.01em;
  }

  .content {
    max-width: 720px;
    margin: 0 auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .hero {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    box-shadow: var(--shadow-xs);
  }

  .hero-badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .title {
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 600;
    margin: 0;
    color: var(--color-text);
    letter-spacing: -0.02em;
    line-height: 1.25;
  }

  .description {
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
  }

  @media (max-width: 480px) {
    .meta-grid { grid-template-columns: 1fr; }
  }

  .meta-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .meta-icon {
    width: 30px;
    height: 30px;
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--color-text-secondary);
  }

  .meta-content {
    display: flex;
    flex-direction: column;
    gap: 0;
    min-width: 0;
  }

  .meta-label {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-value {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .author-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xs);
  }

  .author-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .author-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .author-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .author-sub {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .author-trust {
    display: flex;
    margin-top: 2px;
  }

  .view-profile-btn {
    padding: 8px 14px;
    background: var(--color-surface-alt);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: 12.5px;
    font-weight: 600;
    border-radius: var(--radius-lg);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .view-profile-btn:hover {
    background: var(--color-border);
  }

  .owner-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .respond-cta {
    margin-top: 4px;
  }

  .your-response-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: #D1FAE5;
    border: 1px solid #6EE7B7;
    border-radius: var(--radius-xl);
    color: #065F46;
    font-size: 13.5px;
    font-weight: 600;
  }

  .login-prompt {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: var(--radius-xl);
    color: #1E3A8A;
  }

  .login-prompt-text {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
  }

  .responses-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .section-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-serif);
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .section-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 8px;
    background: var(--color-accent-tint);
    color: var(--color-accent);
    font-size: 11px;
    font-weight: 800;
    border-radius: 999px;
    font-family: var(--font-sans);
  }

  .no-responses {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px 20px;
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-2xl);
    text-align: center;
  }

  .no-responses p {
    font-size: 13.5px;
    color: var(--color-text-muted);
    margin: 0;
    max-width: 320px;
    line-height: 1.5;
  }

  .responses-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 18px;
    border-radius: var(--radius-xl);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    min-height: 46px;
    border: none;
  }

  .btn-primary {
    background: var(--color-primary);
    color: #FFFFFF;
    box-shadow: var(--shadow-primary);
  }

  .btn-primary:hover:not(:disabled) {
    background: #1E40AF;
    transform: translateY(-1px);
  }

  .btn-secondary {
    background: var(--color-surface-alt);
    border: 1.5px solid var(--color-border);
    color: var(--color-text-secondary);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-border);
  }

  .btn-danger {
    background: var(--color-error);
    color: #FFFFFF;
  }

  .btn-danger:hover:not(:disabled) { background: #B91C1C; }

  .btn-full { width: 100%; }

  .btn-sm {
    padding: 9px 14px;
    font-size: 12.5px;
    min-height: 36px;
    border-radius: var(--radius-lg);
  }

  .btn-primary:disabled,
  .btn-secondary:disabled,
  .btn-danger:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
  }

  .empty-icon {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: var(--color-surface-alt);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .empty-title {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 6px;
  }

  .empty-desc {
    font-size: 13.5px;
    color: var(--color-text-muted);
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .skeleton {
    background: var(--color-surface-alt);
    border-radius: var(--radius-xl);
    animation: pulse 1.5s ease-in-out infinite;
  }

  .skeleton-hero { height: 180px; }

  .skeleton-line {
    height: 14px;
    border-radius: 6px;
    width: 100%;
  }

  .skeleton-line-short { width: 60%; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  @media (max-width: 480px) {
    .content { padding: 16px 12px; }
    .hero { padding: 16px; }
    .title { font-size: 20px; }
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
`;