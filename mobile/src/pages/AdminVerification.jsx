// mobile/src/pages/AdminVerifications.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { trustAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    check: 'M20 6L9 17l-5-5',
    x: 'M18 6L6 18M6 6l12 12',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    id: 'M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM9 5h6v2H9z',
    building: 'M3 21h18M5 21V7l7-5 7 5v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
    externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
    checkCircle: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3',
    xCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6',
  };
  const d = icons[name] || icons.shield;
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
// META
// ============================================================
const VERIFICATION_META = {
  email: {
    label: 'Email',
    icon: 'mail',
    color: '#0EA5E9',
    bg: '#E0F2FE',
    description: 'Email confirmation',
  },
  phone: {
    label: 'Phone',
    icon: 'phone',
    color: '#3B82F6',
    bg: '#EFF6FF',
    description: 'Phone number confirmation',
  },
  id: {
    label: 'Government ID',
    icon: 'id',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    description: 'Government ID document',
  },
  business: {
    label: 'Business',
    icon: 'building',
    color: '#10B981',
    bg: '#ECFDF5',
    description: 'Business registration',
  },
};

const STATUS_META = {
  pending: { label: 'Pending', color: '#92400E', bg: '#FEF3C7', icon: 'clock' },
  approved: { label: 'Approved', color: '#065F46', bg: '#D1FAE5', icon: 'checkCircle' },
  rejected: { label: 'Rejected', color: '#991B1B', bg: '#FEE2E2', icon: 'xCircle' },
  expired: { label: 'Expired', color: '#374151', bg: '#E5E7EB', icon: 'clock' },
};

// ============================================================
// COMPONENT
// ============================================================
const AdminVerifications = () => {
  const navigate = useNavigate();
  const { showToast, success } = useToast();

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  // Modal state
  const [actionModal, setActionModal] = useState(null);
  // { type: 'approve' | 'reject', verification }

  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // LOAD PENDING
  // ============================================================
  const loadVerifications = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const res = await trustAPI.getPendingVerifications();
      const list = res?.data?.verifications || [];
      setVerifications(list);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || 'Failed to load verifications';
      setError(msg);
      if (err?.response?.status === 403) {
        showToast('Admin access required', 'error');
        navigate('/landing');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadVerifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVerifications(false);
  };

  // ============================================================
  // APPROVE / REJECT
  // ============================================================
  const confirmApprove = async () => {
    if (!actionModal?.verification) return;
    setSubmitting(true);
    try {
      const res = await trustAPI.approveVerification(actionModal.verification.id);
      if (res?.data?.success) {
        success('Verification approved');
        setVerifications((prev) =>
          prev.filter((v) => v.id !== actionModal.verification.id)
        );
        setActionModal(null);
      } else {
        showToast(res?.data?.error || 'Failed to approve', 'error');
      }
    } catch (err) {
      showToast(
        err?.response?.data?.error || err.message || 'Failed to approve',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!actionModal?.verification) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      showToast('Please enter a rejection reason (min 5 characters)', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await trustAPI.rejectVerification(
        actionModal.verification.id,
        rejectReason.trim()
      );
      if (res?.data?.success) {
        success('Verification rejected');
        setVerifications((prev) =>
          prev.filter((v) => v.id !== actionModal.verification.id)
        );
        setActionModal(null);
        setRejectReason('');
      } else {
        showToast(res?.data?.error || 'Failed to reject', 'error');
      }
    } catch (err) {
      showToast(
        err?.response?.data?.error || err.message || 'Failed to reject',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (type, verification) => {
    setRejectReason('');
    setActionModal({ type, verification });
  };

  const closeModal = () => {
    if (submitting) return;
    setActionModal(null);
    setRejectReason('');
  };

  // ============================================================
  // FILTERS
  // ============================================================
  const filtered = useMemo(() => {
    if (activeTab === 'all') return verifications;
    return verifications.filter((v) => v.status === activeTab);
  }, [verifications, activeTab]);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, expired: 0, all: verifications.length };
    for (const v of verifications) {
      if (c[v.status] !== undefined) c[v.status]++;
    }
    return c;
  }, [verifications]);

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const shortenId = (id) => (id ? `${id.slice(0, 8)}…` : '—');

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="page">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/admin')} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <div className="header-title-wrap">
          <h1 className="title">Verification Queue</h1>
          <p className="subtitle">
            {counts.pending} pending · {counts.all} total
          </p>
        </div>
        <button
          className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh"
        >
          <Icon name="refresh" size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        {/* Tabs */}
        <div className="tabs">
          {[
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'approved', label: 'Approved', count: counts.approved },
            { id: 'rejected', label: 'Rejected', count: counts.rejected },
            { id: 'all', label: 'All', count: counts.all },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading">
            <div className="spinner" />
            <p>Loading verifications…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="error-card">
            <Icon name="xCircle" size={28} color="#991B1B" strokeWidth={2} />
            <p className="error-title">Failed to load</p>
            <p className="error-desc">{error}</p>
            <button className="retry-btn" onClick={() => loadVerifications()}>
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">
              <Icon name="inbox" size={40} color="#9CA3AF" strokeWidth={1.6} />
            </div>
            <h2 className="empty-title">
              {activeTab === 'pending' ? 'All caught up!' : 'Nothing here'}
            </h2>
            <p className="empty-desc">
              {activeTab === 'pending'
                ? 'There are no pending verifications to review.'
                : 'No verifications in this category.'}
            </p>
          </div>
        )}

        {/* List */}
        {!loading && !error && filtered.length > 0 && (
          <div className="list">
            {filtered.map((v) => {
              const meta = VERIFICATION_META[v.type] || VERIFICATION_META.email;
              const statusMeta = STATUS_META[v.status] || STATUS_META.pending;
              const isPending = v.status === 'pending';

              return (
                <div key={v.id} className="card">
                  <div className="card-header">
                    <div
                      className="type-icon-wrap"
                      style={{ background: meta.bg }}
                    >
                      <Icon name={meta.icon} size={20} color={meta.color} strokeWidth={1.9} />
                    </div>
                    <div className="card-title-wrap">
                      <span className="card-type">{meta.label}</span>
                      <span className="card-id">ID: {shortenId(v.id)}</span>
                    </div>
                    <span
                      className="status-pill"
                      style={{ background: statusMeta.bg, color: statusMeta.color }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="field">
                      <span className="field-label">User</span>
                      <span className="field-value">{shortenId(v.userId)}</span>
                    </div>

                    {v.submittedValue && (
                      <div className="field">
                        <span className="field-label">
                          {v.type === 'email'
                            ? 'Email'
                            : v.type === 'phone'
                            ? 'Phone'
                            : v.type === 'id'
                            ? 'ID number'
                            : 'Registration #'}
                        </span>
                        <span className="field-value">{v.submittedValue}</span>
                      </div>
                    )}

                    {v.metadata?.businessName && (
                      <div className="field">
                        <span className="field-label">Business name</span>
                        <span className="field-value">{v.metadata.businessName}</span>
                      </div>
                    )}

                    {v.metadata?.idType && (
                      <div className="field">
                        <span className="field-label">ID type</span>
                        <span className="field-value">
                          {String(v.metadata.idType).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}

                    <div className="field">
                      <span className="field-label">Submitted</span>
                      <span className="field-value">{formatDate(v.createdAt)}</span>
                    </div>

                    {v.rejectionReason && (
                      <div className="field">
                        <span className="field-label">Rejection reason</span>
                        <span className="field-value rejection">{v.rejectionReason}</span>
                      </div>
                    )}

                    {v.documentUrl && (
                      <a
                        href={v.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="doc-link"
                      >
                        <Icon name="externalLink" size={14} strokeWidth={2} />
                        View submitted document
                      </a>
                    )}
                  </div>

                  {isPending && (
                    <div className="card-actions">
                      <button
                        className="action-btn reject"
                        onClick={() => openModal('reject', v)}
                        disabled={submitting}
                      >
                        <Icon name="x" size={14} strokeWidth={2.4} />
                        Reject
                      </button>
                      <button
                        className="action-btn approve"
                        onClick={() => openModal('approve', v)}
                        disabled={submitting}
                      >
                        <Icon name="check" size={14} strokeWidth={2.4} />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== ACTION MODAL ===== */}
      {actionModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {actionModal.type === 'approve' ? (
              <>
                <div className="modal-icon-wrap approve">
                  <Icon name="check" size={32} color="#10B981" strokeWidth={2.5} />
                </div>
                <h3 className="modal-title">Approve verification?</h3>
                <p className="modal-desc">
                  This will mark the{' '}
                  <strong>
                    {VERIFICATION_META[actionModal.verification.type]?.label}
                  </strong>{' '}
                  verification as approved and update the user's trust score.
                </p>
                <div className="modal-actions">
                  <button
                    className="modal-btn secondary"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn primary"
                    onClick={confirmApprove}
                    disabled={submitting}
                  >
                    {submitting ? 'Approving…' : 'Approve'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-icon-wrap reject">
                  <Icon name="x" size={32} color="#DC2626" strokeWidth={2.5} />
                </div>
                <h3 className="modal-title">Reject verification</h3>
                <p className="modal-desc">
                  Provide a reason. The user will see this on their Trust Profile.
                </p>
                <textarea
                  className="reason-input"
                  placeholder="e.g. Document is blurry or unreadable"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  disabled={submitting}
                  autoFocus
                />
                <div className="modal-actions">
                  <button
                    className="modal-btn secondary"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn danger"
                    onClick={confirmReject}
                    disabled={submitting || rejectReason.trim().length < 5}
                  >
                    {submitting ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--color-bg);
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
        .refresh-btn {
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
        .refresh-btn:hover:not(:disabled) {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .refresh-btn.spinning {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .header-title-wrap {
          flex: 1;
          min-width: 0;
        }

        .title {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 2px 0 0;
        }

        .content {
          max-width: 720px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Tabs */
        .tabs {
          display: flex;
          gap: 4px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          padding: 4px;
          border-radius: var(--radius-xl);
          overflow-x: auto;
        }

        .tab {
          flex: 1;
          min-width: fit-content;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-muted);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab:hover {
          color: var(--color-text);
        }

        .tab.active {
          background: var(--color-surface);
          color: var(--color-text);
          box-shadow: var(--shadow-xs);
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-size: 10px;
          font-weight: 700;
          border-radius: 999px;
        }

        .tab.active .tab-count {
          background: var(--color-primary);
        }

        /* Loading */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 12px;
          color: var(--color-text-muted);
          font-size: 13px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        /* Error */
        .error-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 40px 20px;
          background: #FEE2E2;
          border: 1px solid #FCA5A5;
          border-radius: var(--radius-2xl);
        }

        .error-title {
          font-size: 15px;
          font-weight: 700;
          color: #991B1B;
          margin: 0;
        }

        .error-desc {
          font-size: 13px;
          color: #991B1B;
          margin: 0;
          text-align: center;
        }

        .retry-btn {
          margin-top: 8px;
          padding: 8px 16px;
          background: #991B1B;
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        /* Empty */
        .empty {
          text-align: center;
          padding: 60px 20px;
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
          color: var(--color-text);
          margin: 0 0 6px;
        }

        .empty-desc {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0;
        }

        /* List */
        .list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-xs);
        }

        .card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-md);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--color-border);
        }

        .type-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-title-wrap {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .card-type {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .card-id {
          font-size: 11px;
          color: var(--color-text-muted);
          font-family: var(--font-mono);
        }

        .status-pill {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .card-body {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }

        .field-label {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .field-value {
          font-size: 13px;
          color: var(--color-text);
          font-weight: 500;
          text-align: right;
          word-break: break-word;
        }

        .field-value.rejection {
          color: #991B1B;
          font-style: italic;
        }

        .doc-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          padding: 8px 12px;
          background: var(--color-primary-tint);
          color: var(--color-primary);
          border-radius: var(--radius-lg);
          text-decoration: none;
          font-size: 12.5px;
          font-weight: 600;
          align-self: flex-start;
          transition: background 0.2s ease;
        }

        .doc-link:hover {
          background: var(--color-primary-soft, #DBEAFE);
        }

        .card-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          background: var(--color-surface-alt);
          border-top: 1px solid var(--color-border);
        }

        .action-btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-btn.reject {
          background: #FEE2E2;
          color: #991B1B;
        }

        .action-btn.reject:hover:not(:disabled) {
          background: #FECACA;
        }

        .action-btn.approve {
          background: #10B981;
          color: #FFFFFF;
        }

        .action-btn.approve:hover:not(:disabled) {
          background: #059669;
        }

        /* Modal */
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
          max-width: 400px;
          width: 100%;
          padding: 28px 24px 24px;
          text-align: center;
          box-shadow: var(--shadow-2xl);
          animation: slideUp 0.25s ease-out;
          border: 1px solid var(--color-border);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
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

        .modal-icon-wrap.approve { background: #D1FAE5; }
        .modal-icon-wrap.reject { background: #FEE2E2; }

        .modal-title {
          font-family: var(--font-serif);
          font-size: 19px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .modal-desc {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          margin: 0 0 20px;
          line-height: 1.6;
        }

        .reason-input {
          width: 100%;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          background: var(--color-surface-alt);
          padding: 12px;
          font-size: 14px;
          color: var(--color-text);
          font-family: inherit;
          resize: vertical;
          outline: none;
          margin-bottom: 16px;
        }

        .reason-input:focus {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .modal-actions {
          display: flex;
          gap: 10px;
        }

        .modal-btn {
          flex: 1;
          padding: 13px;
          border-radius: var(--radius-xl);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          min-height: 46px;
        }

        .modal-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .modal-btn.secondary {
          background: var(--color-surface-alt);
          border: 1.5px solid var(--color-border);
          color: var(--color-text-secondary);
        }

        .modal-btn.secondary:hover:not(:disabled) {
          background: var(--color-border);
        }

        .modal-btn.primary {
          background: #10B981;
          border: none;
          color: #FFFFFF;
        }

        .modal-btn.primary:hover:not(:disabled) {
          background: #059669;
        }

        .modal-btn.danger {
          background: #DC2626;
          border: none;
          color: #FFFFFF;
        }

        .modal-btn.danger:hover:not(:disabled) {
          background: #B91C1C;
        }

        @media (max-width: 480px) {
          .header { padding: 12px; }
          .content { padding: 12px; }
          .title { font-size: 18px; }
          .field {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
          .field-value { text-align: left; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminVerifications;