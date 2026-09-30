// mobile/src/pages/DeliveryDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import useDelivery from '../hooks/useDelivery';
import DeliveryStatusBadge from '../components/DeliveryStatusBadge';
import TrustBadge from '../components/TrustBadge';

const PACKAGE_META = {
  small: { label: 'Small', emoji: '✉️', desc: 'Envelope, documents' },
  medium: { label: 'Medium', emoji: '📦', desc: 'Shoebox' },
  large: { label: 'Large', emoji: '🎒', desc: 'Carry-on bag' },
  bulky: { label: 'Bulky', emoji: '🛋️', desc: 'Furniture, multiple bags' },
};

const TIER_COLORS = {
  0: '#9CA3AF',
  1: '#3B82F6',
  2: '#8B5CF6',
  3: '#10B981',
};

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    truck: 'M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    alert: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  };
  const d = icons[name] || icons.truck;
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

const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatFee = (fee) => {
  if (fee == null || fee === '') return 'Fee flexible';
  return `MK ${Number(fee).toLocaleString()}`;
};

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();

  const {
    delivery,
    loading,
    error,
    mutating,
    accept,
    markPickedUp,
    markDelivered,
    confirm,
    cancel,
  } = useDelivery(id);

  const [confirmCancelModal, setConfirmCancelModal] = useState(false);
  const [confirmDeliveryModal, setConfirmDeliveryModal] = useState(false);

  const handleAccept = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/deliveries/${id}` } });
      return;
    }
    try {
      await accept();
      success('Delivery accepted! 🚚');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed to accept');
    }
  };

  const handlePickup = async () => {
    try {
      await markPickedUp();
      success('Marked as picked up');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed');
    }
  };

  const handleDeliver = async () => {
    try {
      await markDelivered();
      success('Marked as delivered');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed');
    }
  };

  const handleConfirm = async () => {
    try {
      await confirm();
      success('Delivery confirmed! 🎉');
      setConfirmDeliveryModal(false);
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed');
    }
  };

  const handleCancel = async () => {
    try {
      await cancel('Cancelled by poster');
      success('Delivery cancelled');
      setConfirmCancelModal(false);
      navigate('/deliveries');
    } catch (err) {
      showError(err?.response?.data?.error || err?.message || 'Failed');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/deliveries/${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: delivery?.title || 'Kumsika Delivery',
          text: `Check out this delivery job on Kumsika: ${delivery?.title}`,
          url,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      success('Link copied to clipboard');
    } catch {
      showError('Could not copy link');
    }
  };

  if (loading && !delivery) {
    return (
      <div className="page">
        <div className="header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <h1 className="header-title">Delivery</h1>
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

  if (!loading && (error || !delivery)) {
    return (
      <div className="page">
        <div className="header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <h1 className="header-title">Delivery</h1>
        </div>
        <div className="content">
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="alert" size={40} color="#9CA3AF" strokeWidth={1.6} />
            </div>
            <h2 className="empty-title">Delivery not found</h2>
            <p className="empty-desc">{error || 'This job may have been removed.'}</p>
            <button className="btn-primary" onClick={() => navigate('/deliveries')}>
              Browse deliveries
            </button>
          </div>
        </div>
        <style jsx>{sharedStyles}</style>
      </div>
    );
  }

  const pkg = PACKAGE_META[delivery.package_size] || PACKAGE_META.medium;
  const status = delivery.effective_status || delivery.status || 'open';
  const isPoster = delivery.is_mine;
  const isCourier = delivery.is_mine_as_courier;
  const poster = delivery.poster;
  const courier = delivery.courier;

  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <h1 className="header-title">Delivery</h1>
        <button className="share-btn" onClick={handleShare} aria-label="Share">
          <Icon name="truck" size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        <div className="hero">
          <div className="hero-badges">
            <span className="pkg-pill">
              <span className="pkg-emoji">{pkg.emoji}</span>
              {pkg.label}
            </span>
            <DeliveryStatusBadge status={status} size="md" />
            {isPoster && <span className="pill mine-pill">Yours</span>}
            {isCourier && <span className="pill courier-pill">Your job</span>}
          </div>

          <h1 className="title">{delivery.title}</h1>

          {delivery.description && (
            <p className="description">{delivery.description}</p>
          )}

          <div className="fee-hero">
            <Icon name="tag" size={16} color="#FFFFFF" strokeWidth={2.2} />
            <span>{formatFee(delivery.courier_fee)}</span>
          </div>
        </div>

        <div className="route-card">
          <div className="route-point">
            <div className="route-dot-wrap pickup">
              <span className="route-dot" />
            </div>
            <div className="route-content">
              <span className="route-label">Pickup</span>
              <span className="route-location">{delivery.pickup_location}</span>
              {(isPoster || isCourier) && (delivery.pickup_contact_name || delivery.pickup_contact_phone) && (
                <div className="contact-row">
                  {delivery.pickup_contact_name && (
                    <span className="contact-item">
                      <Icon name="user" size={12} strokeWidth={2} />
                      {delivery.pickup_contact_name}
                    </span>
                  )}
                  {delivery.pickup_contact_phone && (
                    <a
                      href={`tel:${delivery.pickup_contact_phone}`}
                      className="contact-item contact-link"
                    >
                      <Icon name="phone" size={12} strokeWidth={2} />
                      {delivery.pickup_contact_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="route-connector" />

          <div className="route-point">
            <div className="route-dot-wrap dropoff">
              <span className="route-dot" />
            </div>
            <div className="route-content">
              <span className="route-label">Dropoff</span>
              <span className="route-location">{delivery.dropoff_location}</span>
              {(isPoster || isCourier) && (delivery.dropoff_contact_name || delivery.dropoff_contact_phone) && (
                <div className="contact-row">
                  {delivery.dropoff_contact_name && (
                    <span className="contact-item">
                      <Icon name="user" size={12} strokeWidth={2} />
                      {delivery.dropoff_contact_name}
                    </span>
                  )}
                  {delivery.dropoff_contact_phone && (
                    <a
                      href={`tel:${delivery.dropoff_contact_phone}`}
                      className="contact-item contact-link"
                    >
                      <Icon name="phone" size={12} strokeWidth={2} />
                      {delivery.dropoff_contact_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="party-card">
          <div className="party-avatar" style={{ background: TIER_COLORS[poster?.trust?.tier ?? 0] }}>
            {initialsOf(poster?.full_name || 'Poster')}
          </div>
          <div className="party-info">
            <span className="party-role">Posted by</span>
            <span className="party-name">{poster?.full_name || 'Poster'}</span>
            <div className="party-trust">
              {poster?.trust && (
                <TrustBadge
                  label={
                    poster.trust.tier >= 3
                      ? 'Business'
                      : poster.trust.tier >= 2
                      ? 'ID Verified'
                      : poster.trust.tier >= 1
                      ? 'Verified'
                      : 'Unverified'
                  }
                  color={TIER_COLORS[poster.trust.tier ?? 0]}
                  size="sm"
                />
              )}
            </div>
          </div>
          <button
            className="view-profile-btn"
            onClick={() => navigate(`/trust/${poster?.id}`)}
            disabled={!poster?.id}
          >
            View
          </button>
        </div>

        {courier && (
          <div className="party-card">
            <div className="party-avatar" style={{ background: TIER_COLORS[courier?.trust?.tier ?? 0] }}>
              {initialsOf(courier?.full_name || 'Courier')}
            </div>
            <div className="party-info">
              <span className="party-role">Courier</span>
              <span className="party-name">{courier?.full_name || 'Courier'}</span>
              <div className="party-trust">
                {courier?.trust && (
                  <TrustBadge
                    label={`${courier.trust.deliveriesCompletedCount || 0} deliveries`}
                    color="#10B981"
                    size="sm"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <div className="timeline">
          {[
            { key: 'created_at', label: 'Posted', icon: 'clock' },
            { key: 'accepted_at', label: 'Accepted', icon: 'check' },
            { key: 'picked_up_at', label: 'Picked up', icon: 'truck' },
            { key: 'delivered_at', label: 'Delivered', icon: 'check' },
            { key: 'confirmed_at', label: 'Confirmed', icon: 'check' },
          ].map((step) => (
            <div
              key={step.key}
              className={`timeline-item ${
                delivery[step.key] ? 'done' : ''
              }`}
            >
              <span className="timeline-dot" />
              <div className="timeline-content">
                <span className="timeline-label">{step.label}</span>
                {delivery[step.key] && (
                  <span className="timeline-time">
                    {timeAgo(delivery[step.key])}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {delivery.cancel_reason && (
          <div className="info-card">
            <Icon name="alert" size={16} color="#991B1B" strokeWidth={2} />
            <span>Cancelled: {delivery.cancel_reason}</span>
          </div>
        )}

        {/* Actions */}
        {status === 'open' && !isPoster && (
          <button className="btn-primary btn-full" onClick={handleAccept} disabled={mutating}>
            {mutating ? 'Accepting…' : 'Accept this delivery 🚚'}
          </button>
        )}

        {status === 'open' && isPoster && (
          <button
            className="btn-secondary btn-full"
            onClick={() => setConfirmCancelModal(true)}
            disabled={mutating}
          >
            Cancel job
          </button>
        )}

        {status === 'accepted' && isCourier && (
          <button className="btn-primary btn-full" onClick={handlePickup} disabled={mutating}>
            {mutating ? 'Updating…' : 'Mark as picked up 📦'}
          </button>
        )}

        {status === 'accepted' && isPoster && (
          <button
            className="btn-secondary btn-full"
            onClick={() => setConfirmCancelModal(true)}
            disabled={mutating}
          >
            Cancel job
          </button>
        )}

        {status === 'picked_up' && isCourier && (
          <button className="btn-primary btn-full" onClick={handleDeliver} disabled={mutating}>
            {mutating ? 'Updating…' : 'Mark as delivered ✅'}
          </button>
        )}

        {status === 'picked_up' && isPoster && (
          <div className="info-card warning">
            <Icon name="truck" size={16} color="#92400E" strokeWidth={2} />
            <span>Courier is en route. Confirm receipt when the package arrives.</span>
          </div>
        )}

        {status === 'delivered' && isPoster && (
          <button
            className="btn-primary btn-full"
            onClick={() => setConfirmDeliveryModal(true)}
            disabled={mutating}
          >
            Confirm receipt ✅
          </button>
        )}

        {status === 'delivered' && isCourier && (
          <div className="info-card warning">
            <Icon name="clock" size={16} color="#92400E" strokeWidth={2} />
            <span>Waiting for the poster to confirm receipt.</span>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="info-card success">
            <Icon name="check" size={16} color="#065F46" strokeWidth={2.4} />
            <span>Delivery confirmed. Thank you!</span>
          </div>
        )}
      </div>

      {/* Cancel confirm */}
      {confirmCancelModal && (
        <div className="modal-overlay" onClick={() => setConfirmCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap reject">
              <Icon name="x" size={28} color="#DC2626" strokeWidth={2.4} />
            </div>
            <h3 className="modal-title">Cancel this delivery?</h3>
            <p className="modal-desc">
              {delivery.courier_id
                ? "Your courier will be notified. You can't undo this."
                : "This job will be removed from the public board."}
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmCancelModal(false)}
                disabled={mutating}
              >
                Keep
              </button>
              <button
                className="btn-danger"
                onClick={handleCancel}
                disabled={mutating}
              >
                {mutating ? 'Cancelling…' : 'Cancel delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delivery modal */}
      {confirmDeliveryModal && (
        <div className="modal-overlay" onClick={() => setConfirmDeliveryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon-wrap approve">
              <Icon name="check" size={28} color="#10B981" strokeWidth={2.4} />
            </div>
            <h3 className="modal-title">Confirm you received the package?</h3>
            <p className="modal-desc">
              This will update the courier's trust score. Please only confirm if you
              received the package.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDeliveryModal(false)}
                disabled={mutating}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirm}
                disabled={mutating}
              >
                {mutating ? 'Confirming…' : 'Yes, confirm'}
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

        .modal-content {
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          max-width: 400px;
          width: 100%;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--color-border);
        }

        .modal-icon-wrap {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .modal-icon-wrap.reject { background: #FEE2E2; }
        .modal-icon-wrap.approve { background: #D1FAE5; }

        .modal-title {
          font-family: var(--font-serif);
          font-size: 19px;
          font-weight: 600;
          margin: 0 0 8px;
          color: var(--color-text);
        }

        .modal-desc {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin: 0 0 24px;
          line-height: 1.6;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-actions > button {
          flex: 1;
        }
      `}</style>
    </div>
  );
}

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
    align-items: center;
  }

  .pkg-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 999px;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pkg-emoji { font-size: 12px; }

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

  .mine-pill {
    background: var(--color-accent-tint);
    color: var(--color-accent);
  }

  .courier-pill {
    background: #DBEAFE;
    color: #1E40AF;
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

  .fee-hero {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    align-self: flex-start;
    padding: 10px 18px;
    background: var(--color-primary);
    color: #FFFFFF;
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-primary);
    letter-spacing: -0.01em;
  }

  .route-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
    box-shadow: var(--shadow-xs);
  }

  .route-point {
    display: flex;
    gap: 14px;
    padding: 8px 0;
  }

  .route-dot-wrap {
    width: 22px;
    display: flex;
    justify-content: center;
    flex-shrink: 0;
    padding-top: 4px;
  }

  .route-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .route-dot-wrap.pickup .route-dot {
    background: #10B981;
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
  }

  .route-dot-wrap.dropoff .route-dot {
    background: #F59E0B;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15);
  }

  .route-connector {
    margin-left: 10px;
    width: 2px;
    height: 24px;
    background: var(--color-border);
    border-radius: 2px;
  }

  .route-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .route-label {
    font-size: 10.5px;
    font-weight: 800;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .route-location {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text);
    line-height: 1.4;
  }

  .contact-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
  }

  .contact-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-secondary);
    text-decoration: none;
  }

  .contact-link {
    color: var(--color-primary);
    font-weight: 600;
  }

  .party-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xs);
  }

  .party-avatar {
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

  .party-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .party-role {
    font-size: 10.5px;
    font-weight: 800;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .party-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }

  .party-trust { margin-top: 4px; }

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

  .view-profile-btn:hover:not(:disabled) {
    background: var(--color-border);
  }

  .view-profile-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .timeline {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: var(--shadow-xs);
  }

  .timeline-item {
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.45;
    transition: opacity 0.2s ease;
  }

  .timeline-item.done { opacity: 1; }

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-border);
    flex-shrink: 0;
    position: relative;
  }

  .timeline-item.done .timeline-dot {
    background: #10B981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }

  .timeline-content {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex: 1;
  }

  .timeline-label {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--color-text);
  }

  .timeline-time {
    font-size: 11.5px;
    color: var(--color-text-muted);
  }

  .info-card {
    display: flex;
    gap: 10px;
    padding: 14px;
    background: #FEF3C7;
    border: 1px solid #FCD34D;
    border-radius: var(--radius-xl);
    font-size: 13px;
    color: #92400E;
    line-height: 1.5;
    align-items: flex-start;
    font-weight: 500;
  }

  .info-card.success {
    background: #D1FAE5;
    border-color: #86EFAC;
    color: #065F46;
  }

  .info-card.warning {
    background: #FEF3C7;
    border-color: #FCD34D;
    color: #92400E;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 18px;
    border-radius: var(--radius-xl);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    min-height: 50px;
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

  .btn-secondary:hover:not(:disabled) { background: var(--color-border); }

  .btn-danger {
    background: var(--color-error);
    color: #FFFFFF;
  }

  .btn-danger:hover:not(:disabled) { background: #B91C1C; }

  .btn-full { width: 100%; }

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