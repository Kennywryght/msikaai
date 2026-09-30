// mobile/src/pages/TrustProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrust } from '../context/TrustContext';
import useTrustScore from '../hooks/useTrustScore';
import { trustAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import TrustScoreRing from '../components/TrustScoreRing';
import TrustTierCard from '../components/TrustTierCard';
import VerificationBadge from '../components/VerificationBadge';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    chevronRight: 'M9 18l6-6-6-6',
    check: 'M20 6L9 17l-5-5',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    id: 'M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM9 5h6v2H9z',
    building: 'M3 21h18M5 21V7l7-5 7 5v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    lock: 'M12 2a4 4 0 00-4 4v4H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4zM12 14v4M9 12h6',
    trendingUp: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    award: 'M12 15l-3.5 2 1.33-4.5-3.33-2.5h4.17L12 6l1.33 4h4.17l-3.33 2.5L15.5 17 12 15z',
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
// VERIFICATION TYPE META
// ============================================================
const VERIFICATION_META = {
  email: {
    label: 'Email',
    description: 'Confirm your email address to earn +3 trust points',
    icon: 'mail',
    color: '#0EA5E9',
    bg: '#E0F2FE',
    route: '/verify-email',
  },
  phone: {
    label: 'Phone',
    description: 'Confirm your phone number to earn +5 trust points and reach Tier 1',
    icon: 'phone',
    color: '#3B82F6',
    bg: '#EFF6FF',
    route: '/verify-phone',
  },
  id: {
    label: 'Government ID',
    description: 'Upload a government ID to earn +5 trust points and reach Tier 2',
    icon: 'id',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    route: '/verify-id',
  },
  business: {
    label: 'Business',
    description: 'Verify your registered business to earn +2 trust points and reach Tier 3',
    icon: 'building',
    color: '#10B981',
    bg: '#ECFDF5',
    route: '/verify-business',
  },
};

// ============================================================
// COMPONENT
// ============================================================
export default function TrustProfile() {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { recomputeOwnTrust, refreshOwnTrust } = useTrust();
  const { showToast, success } = useToast();

  const targetUserId = paramUserId || user?.id;
  const isOwn = !paramUserId || paramUserId === user?.id;

  const {
    trust,
    tier,
    score,
    loading,
    error,
    emailVerified,
    phoneVerified,
    idVerified,
    businessVerified,
  } = useTrustScore(targetUserId);

  const [refreshing, setRefreshing] = useState(false);
  const [verifications, setVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  // Load verification history for own profile
  useEffect(() => {
    if (!isOwn || !isAuthenticated) return;
    let cancelled = false;
    setLoadingVerifications(true);
    trustAPI
      .getMyVerifications()
      .then((res) => {
        if (cancelled) return;
        setVerifications(res?.data?.verifications || []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('⚠️ Failed to load verifications:', err?.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingVerifications(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOwn, isAuthenticated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isOwn) {
        await recomputeOwnTrust();
        success('Trust score refreshed');
      } else {
        await refreshOwnTrust();
      }
    } catch (err) {
      showToast('Failed to refresh', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleStartVerification = (type) => {
    const meta = VERIFICATION_META[type];
    if (!meta) return;
    navigate(meta.route);
  };

  const verificationState = {
    email: emailVerified,
    phone: phoneVerified,
    id: idVerified,
    business: businessVerified,
  };

  const totalVerified = Object.values(verificationState).filter(Boolean).length;
  const totalVerifications = Object.keys(verificationState).length;

  // ============================================================
  // LOADING
  // ============================================================
  if (loading && !trust) {
    return (
      <div className="trust-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <h1 className="page-title">Trust Profile</h1>
        </div>
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading trust profile…</p>
        </div>
        <style jsx>{sharedStyles}</style>
      </div>
    );
  }

  // ============================================================
  // ERROR / NOT FOUND
  // ============================================================
  if (!trust) {
    return (
      <div className="trust-page">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
          </button>
          <h1 className="page-title">Trust Profile</h1>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2 className="empty-title">Trust profile not found</h2>
          <p className="empty-desc">
            {error || 'This user does not have a trust profile yet.'}
          </p>
        </div>
        <style jsx>{sharedStyles}</style>
      </div>
    );
  }

  // ============================================================
  // MAIN
  // ============================================================
  return (
    <div className="trust-page">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <div className="header-title-wrap">
          <h1 className="page-title">
            {isOwn ? 'Your Trust Profile' : 'Trust Profile'}
          </h1>
          <p className="page-subtitle">
            {isOwn
              ? 'Your reputation on Kumsika'
              : 'Verified reputation and standing'}
          </p>
        </div>
        {isOwn && (
          <button
            className={`refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh trust score"
          >
            <Icon name="refresh" size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="main-content">
        {/* ===== HERO CARD ===== */}
        <div className="hero-card">
          <div className="hero-left">
            <TrustScoreRing score={score} tier={tier} size={120} stroke={10} />
          </div>
          <div className="hero-right">
            <div className="hero-tier-label">Current Tier</div>
            <div className="hero-tier-name">Tier {tier}</div>
            <div className="hero-tier-desc">
              {tier === 0 && 'Unverified'}
              {tier === 1 && 'Phone Verified'}
              {tier === 2 && 'ID Verified'}
              {tier === 3 && 'Business Verified'}
            </div>
            <div className="hero-progress">
              <span>{totalVerified} of {totalVerifications} verifications complete</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(totalVerified / totalVerifications) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ===== TIER CARD ===== */}
        <TrustTierCard trust={trust} />

        {/* ===== VERIFICATION SECTION (own profile only) ===== */}
        {isOwn && (
          <section className="section">
            <h2 className="section-title">Verifications</h2>
            <div className="verifications-list">
              {Object.entries(VERIFICATION_META).map(([type, meta]) => {
                const verified = verificationState[type];
                return (
                  <div
                    key={type}
                    className={`verification-item ${verified ? 'verified' : ''}`}
                  >
                    <div
                      className="verification-icon-wrap"
                      style={{ background: verified ? meta.bg : '#F3F4F6' }}
                    >
                      <Icon
                        name={meta.icon}
                        size={20}
                        color={verified ? meta.color : '#9CA3AF'}
                        strokeWidth={1.9}
                      />
                    </div>
                    <div className="verification-content">
                      <div className="verification-title-row">
                        <span className="verification-title">{meta.label}</span>
                        {verified && (
                          <span className="verified-pill">
                            <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="verification-desc">{meta.description}</p>
                    </div>
                    {!verified && (
                      <button
                        className="verify-btn"
                        onClick={() => handleStartVerification(type)}
                      >
                        Verify
                        <Icon name="chevronRight" size={14} strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== STATS ===== */}
        <section className="section">
          <h2 className="section-title">Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrap">
                <Icon name="award" size={18} color="#3B82F6" strokeWidth={1.9} />
              </div>
              <div className="stat-value">{trust.trust_score ?? 0}</div>
              <div className="stat-label">Trust Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap">
                <Icon name="star" size={18} color="#F59E0B" strokeWidth={1.9} />
              </div>
              <div className="stat-value">
                {Number(trust.average_rating || 0).toFixed(1)}
              </div>
              <div className="stat-label">
                Rating ({trust.total_reviews ?? 0} reviews)
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap">
                <Icon name="trendingUp" size={18} color="#10B981" strokeWidth={1.9} />
              </div>
              <div className="stat-value">{trust.listings_count ?? 0}</div>
              <div className="stat-label">Listings</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrap">
                <Icon name="lock" size={18} color="#8B5CF6" strokeWidth={1.9} />
              </div>
              <div className="stat-value">
                MK {Number(trust.escrow_limit || 0).toLocaleString()}
              </div>
              <div className="stat-label">Escrow Limit</div>
            </div>
          </div>
        </section>

        {/* ===== VERIFICATION HISTORY (own profile) ===== */}
        {isOwn && (
          <section className="section">
            <h2 className="section-title">Verification History</h2>
            {loadingVerifications ? (
              <div className="history-loading">Loading…</div>
            ) : verifications.length === 0 ? (
              <div className="history-empty">
                No verification requests yet. Start one above.
              </div>
            ) : (
              <div className="history-list">
                {verifications.map((v) => (
                  <div key={v.id} className="history-item">
                    <div className="history-left">
                      <VerificationBadge
                        type={v.type}
                        verified={v.status === 'approved'}
                        size="sm"
                      />
                      <div className="history-info">
                        <span className="history-type">
                          {VERIFICATION_META[v.type]?.label || v.type}
                        </span>
                        <span className="history-date">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                    </div>
                    <span className={`history-status history-status-${v.status}`}>
                      {v.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== INFO CARD ===== */}
        <div className="info-card">
          <Icon name="shield" size={18} color="#3B82F6" strokeWidth={1.9} />
          <div className="info-content">
            <div className="info-title">How trust scores work</div>
            <p className="info-desc">
              Your trust score is built from verifications, activity, reviews, and
              successful transactions. Higher tiers unlock larger escrow limits and
              more visibility.
            </p>
          </div>
        </div>

        {/* ===== CTA (own profile) ===== */}
        {isOwn && tier < 3 && (
          <Link to="/settings" className="cta-btn">
            <Icon name="award" size={18} color="#FFFFFF" strokeWidth={2} />
            Unlock higher tiers
          </Link>
        )}
      </div>

      <style jsx>{sharedStyles}</style>
    </div>
  );
}

// ============================================================
// SHARED STYLES
// ============================================================
const sharedStyles = `
  .trust-page {
    min-height: 100vh;
    background: var(--color-bg);
    font-family: var(--font-sans);
    color: var(--color-text);
    padding-bottom: 40px;
  }

  .page-header {
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
    transition: all 0.2s ease;
    flex-shrink: 0;
    color: var(--color-text);
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

  .page-title {
    font-family: var(--font-serif);
    font-size: clamp(20px, 3vw, 24px);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .page-subtitle {
    font-size: 12.5px;
    color: var(--color-text-muted);
    margin: 2px 0 0;
  }

  .main-content {
    max-width: 640px;
    margin: 0 auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .hero-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-xs);
  }

  .hero-left { flex-shrink: 0; }

  .hero-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .hero-tier-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hero-tier-name {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
  }

  .hero-tier-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .hero-progress {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .hero-progress span {
    font-size: 11.5px;
    color: var(--color-text-muted);
  }

  .progress-bar {
    width: 100%;
    height: 6px;
    background: var(--color-surface-alt);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3B82F6, #10B981);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .section-title {
    font-size: 11.5px;
    font-weight: 800;
    color: var(--color-text-muted);
    margin: 0 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .verifications-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .verification-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    transition: all 0.2s ease;
  }

  .verification-item.verified {
    background: linear-gradient(135deg, #F0FDF4, #FFFFFF);
    border-color: #86EFAC;
  }

  .verification-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .verification-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .verification-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .verification-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text);
  }

  .verified-pill {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px;
    background: #10B981;
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 700;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .verification-desc {
    font-size: 12px;
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.4;
  }

  .verify-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: var(--color-primary);
    color: #FFFFFF;
    font-size: 12.5px;
    font-weight: 700;
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .verify-btn:hover {
    background: var(--color-primary-hover, #1E40AF);
    transform: translateY(-1px);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    padding: 16px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
  }

  .stat-value {
    font-family: var(--font-serif);
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.1;
  }

  .stat-label {
    font-size: 11.5px;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
  }

  .history-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .history-type {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
    text-transform: capitalize;
  }

  .history-date {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .history-status {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 3px 10px;
    border-radius: 999px;
    flex-shrink: 0;
  }

  .history-status-pending { background: #FEF3C7; color: #92400E; }
  .history-status-approved { background: #D1FAE5; color: #065F46; }
  .history-status-rejected { background: #FEE2E2; color: #991B1B; }
  .history-status-expired { background: #E5E7EB; color: #374151; }

  .history-loading,
  .history-empty {
    padding: 20px;
    text-align: center;
    font-size: 13px;
    color: var(--color-text-muted);
    background: var(--color-surface);
    border: 1px dashed var(--color-border);
    border-radius: var(--radius-xl);
  }

  .info-card {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
    border-radius: var(--radius-xl);
  }

  .info-content { flex: 1; min-width: 0; }

  .info-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #1E40AF;
    margin-bottom: 4px;
  }

  .info-desc {
    font-size: 12.5px;
    color: #1E3A8A;
    margin: 0;
    line-height: 1.5;
  }

  .cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    background: var(--color-primary);
    color: #FFFFFF;
    text-decoration: none;
    font-size: 14px;
    font-weight: 700;
    border-radius: var(--radius-xl);
    transition: all 0.2s ease;
    box-shadow: var(--shadow-primary);
  }

  .cta-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px rgba(10, 36, 114, 0.2);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 12px;
    color: var(--color-text-muted);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.9s linear infinite;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon { font-size: 44px; margin-bottom: 12px; }

  .empty-title {
    font-family: var(--font-serif);
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 6px;
  }

  .empty-desc {
    font-size: 13px;
    color: var(--color-text-muted);
    margin: 0;
  }

  @media (max-width: 480px) {
    .hero-card {
      flex-direction: column;
      text-align: center;
    }

    .hero-right {
      align-items: center;
    }

    .hero-progress {
      align-self: stretch;
    }

    .verification-item {
      flex-wrap: wrap;
    }

    .verify-btn {
      width: 100%;
      justify-content: center;
      margin-top: 6px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
`;