// mobile/src/pages/DeliveryEarnings.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useCourierEarnings from '../hooks/useCourierEarnings';
import DeliveryCard from '../components/DeliveryCard';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    dollar: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
    trending: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
    truck: 'M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
  };
  const d = icons[name] || icons.dollar;
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

const formatMoney = (n) => {
  const num = Number(n) || 0;
  return `MK ${num.toLocaleString()}`;
};

export default function DeliveryEarnings() {
  const navigate = useNavigate();
  const { earnings, loading, refreshing, error, refresh } = useCourierEarnings();

  const lifetime = earnings?.lifetime || { completedCount: 0, totalEarned: 0 };
  const thisMonth = earnings?.thisMonth || { completedCount: 0, totalEarned: 0 };
  const activeCount = earnings?.activeCount || 0;
  const recent = earnings?.recent || [];

  return (
    <div className="page">
      <div className="header">
        <button
          className="header-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <Icon name="arrowLeft" size={20} strokeWidth={2.2} />
        </button>
        <div className="header-title">
          <h1>My Earnings</h1>
          <p>Your delivery history on Kumsika</p>
        </div>
        <button
          className={`header-btn ${refreshing ? 'spinning' : ''}`}
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh"
        >
          <Icon name="trending" size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        <div className="info-banner">
          <Icon name="info" size={16} color="#1E40AF" strokeWidth={2} />
          <span>
            Earnings reflect off-platform cash payments you received from posters.
            Kumsika doesn't hold or transfer money.
          </span>
        </div>

        {loading && !earnings && (
          <div className="loading">
            <div className="spinner" />
            <p>Loading your earnings…</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-card">
            <p className="error-title">Failed to load earnings</p>
            <p className="error-desc">{error}</p>
            <button className="retry-btn" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrap life">
                  <Icon name="dollar" size={20} color="#3B82F6" strokeWidth={2} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatMoney(lifetime.totalEarned)}</div>
                  <div className="stat-label">Lifetime earned</div>
                  <div className="stat-sub">
                    {lifetime.completedCount}{' '}
                    {lifetime.completedCount === 1 ? 'delivery' : 'deliveries'}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap month">
                  <Icon name="trending" size={20} color="#10B981" strokeWidth={2} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{formatMoney(thisMonth.totalEarned)}</div>
                  <div className="stat-label">This month</div>
                  <div className="stat-sub">
                    {thisMonth.completedCount}{' '}
                    {thisMonth.completedCount === 1 ? 'delivery' : 'deliveries'}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap active">
                  <Icon name="truck" size={20} color="#8B5CF6" strokeWidth={2} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{activeCount}</div>
                  <div className="stat-label">Active now</div>
                  <div className="stat-sub">
                    {activeCount === 1 ? 'job in progress' : 'jobs in progress'}
                  </div>
                </div>
              </div>
            </div>

            <section className="recent-section">
              <div className="section-header">
                <h2 className="section-title">Recent completed deliveries</h2>
                <span className="section-count">
                  {recent.length > 0 ? `Last ${recent.length}` : ''}
                </span>
              </div>

              {recent.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon name="inbox" size={40} color="#9CA3AF" strokeWidth={1.5} />
                  </div>
                  <h3 className="empty-title">No completed deliveries yet</h3>
                  <p className="empty-desc">
                    Accept a job from the board to start earning.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => navigate('/deliveries')}
                  >
                    Browse open jobs
                  </button>
                </div>
              ) : (
                <div className="recent-list">
                  {recent.map((d) => (
                    <DeliveryCard key={d.id} delivery={d} compact />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
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

        .header-back,
        .header-btn {
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

        .header-back:hover,
        .header-btn:hover:not(:disabled) {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .header-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .header-btn.spinning { animation: spin 0.8s linear infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }

        .header-title { flex: 1; min-width: 0; }

        .header-title h1 {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .header-title p {
          font-size: 12.5px;
          color: var(--color-text-muted);
          margin: 2px 0 0;
        }

        .content {
          max-width: 720px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .info-banner {
          display: flex;
          gap: 10px;
          padding: 12px 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: var(--radius-xl);
          font-size: 12.5px;
          color: #1E3A8A;
          line-height: 1.5;
          align-items: flex-start;
        }

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

        .error-card {
          text-align: center;
          padding: 40px 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
        }

        .error-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-error);
          margin: 0 0 4px;
        }

        .error-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 0 0 16px;
        }

        .retry-btn {
          padding: 10px 20px;
          background: var(--color-primary);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-lg);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 640px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xs);
        }

        .stat-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon-wrap.life { background: #DBEAFE; }
        .stat-icon-wrap.month { background: #D1FAE5; }
        .stat-icon-wrap.active { background: #EDE9FE; }

        .stat-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.015em;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }

        .stat-label {
          font-size: 11.5px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .stat-sub {
          font-size: 11px;
          color: var(--color-text-muted);
        }

        .recent-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: 17px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .section-count {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }

        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: var(--color-surface);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--color-surface-alt);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .empty-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .empty-desc {
          font-size: 13.5px;
          color: var(--color-text-muted);
          margin: 0;
          max-width: 320px;
          line-height: 1.5;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 20px;
          background: var(--color-primary);
          color: #FFFFFF;
          border: none;
          border-radius: var(--radius-xl);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          box-shadow: var(--shadow-primary);
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #1E40AF;
          transform: translateY(-1px);
        }

        @media (max-width: 480px) {
          .header { padding: 12px; }
          .content { padding: 12px; }
          .header-title h1 { font-size: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
      `}</style>
    </div>
  );
}