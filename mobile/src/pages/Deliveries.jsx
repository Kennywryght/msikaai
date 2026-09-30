// mobile/src/pages/Deliveries.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useDeliveries from '../hooks/useDeliveries';
import DeliveryCard from '../components/DeliveryCard';

const PACKAGE_OPTIONS = [
  { value: 'all', label: 'All sizes' },
  { value: 'small', label: 'Small ✉️' },
  { value: 'medium', label: 'Medium 📦' },
  { value: 'large', label: 'Large 🎒' },
  { value: 'bulky', label: 'Bulky 🛋️' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'fee_high', label: 'Highest fee' },
  { value: 'fee_low', label: 'Lowest fee' },
];

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.9 }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    plus: 'M12 4v16m8-8H4',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    x: 'M18 6L6 18M6 6l12 12',
    truck: 'M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z',
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

const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-row">
      <div className="skeleton-pill" />
      <div className="skeleton-pill skeleton-pill-wide" />
    </div>
    <div className="skeleton-line skeleton-line-title" />
    <div className="skeleton-line" />
    <div className="skeleton-line skeleton-line-short" />
    <style jsx>{`
      .skeleton-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-2xl);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        animation: pulse 1.5s ease-in-out infinite;
      }
      .skeleton-row { display: flex; gap: 6px; }
      .skeleton-pill {
        width: 60px;
        height: 16px;
        border-radius: 999px;
        background: var(--color-surface-alt);
      }
      .skeleton-pill-wide { width: 90px; }
      .skeleton-line {
        height: 12px;
        background: var(--color-surface-alt);
        border-radius: 6px;
        width: 100%;
      }
      .skeleton-line-title { height: 16px; width: 70%; }
      .skeleton-line-short { width: 40%; }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.55; }
      }
    `}</style>
  </div>
);

export default function Deliveries() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const {
    deliveries,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh,
    loadMore,
    hasMore,
  } = useDeliveries();

  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({ search: searchInput });
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  const handlePost = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/deliveries/new' } });
      return;
    }
    navigate('/deliveries/new');
  };

  const handleCardClick = (delivery) => {
    navigate(`/deliveries/${delivery.id}`);
  };

  const clearSearch = () => {
    setSearchInput('');
    updateFilters({ search: '' });
  };

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
          <h1>Deliveries</h1>
          <p>
            {total > 0
              ? `${total} open ${total === 1 ? 'job' : 'jobs'}`
              : 'Courier jobs near you'}
          </p>
        </div>
        <button
          className={`header-btn ${refreshing ? 'spinning' : ''}`}
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refresh"
        >
          <Icon name="refresh" size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="content">
        <div className="search-bar">
          <Icon name="search" size={18} color="#6B7280" strokeWidth={2} />
          <input
            type="text"
            className="search-input"
            placeholder="Search deliveries…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button className="search-clear" onClick={clearSearch} aria-label="Clear">
              <Icon name="x" size={14} strokeWidth={2.4} />
            </button>
          )}
        </div>

        <div className="tabs">
          <button
            className={`tab ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon
              name="filter"
              size={14}
              color={showFilters ? '#FFFFFF' : 'currentColor'}
              strokeWidth={2}
            />
            Filters
          </button>
          <button
            className="tab"
            onClick={() => navigate('/deliveries/earnings')}
          >
            <Icon name="truck" size={14} strokeWidth={2} />
            My earnings
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-row">
              <label className="filter-label">Package size</label>
              <div className="chip-row">
                {PACKAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`chip ${
                      filters.packageSize === opt.value ? 'active' : ''
                    }`}
                    onClick={() => updateFilters({ packageSize: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-row">
              <label className="filter-label">Sort by</label>
              <select
                className="filter-select"
                value={filters.sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-row">
              <label className="filter-label">Pickup area</label>
              <input
                type="text"
                className="filter-input"
                placeholder="e.g. Mitundu"
                value={filters.pickupArea}
                onChange={(e) => updateFilters({ pickupArea: e.target.value })}
              />
            </div>

            <div className="filter-row">
              <label className="filter-label">Dropoff area</label>
              <input
                type="text"
                className="filter-input"
                placeholder="e.g. Lilongwe"
                value={filters.dropoffArea}
                onChange={(e) => updateFilters({ dropoffArea: e.target.value })}
              />
            </div>

            <button className="reset-btn" onClick={resetFilters}>
              Reset all filters
            </button>
          </div>
        )}

        {loading && !refreshing && deliveries.length === 0 && (
          <div className="list">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="error-card">
            <p className="error-title">Failed to load deliveries</p>
            <p className="error-desc">{error}</p>
            <button className="retry-btn" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && deliveries.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="inbox" size={44} color="#9CA3AF" strokeWidth={1.5} />
            </div>
            <h2 className="empty-title">No delivery jobs found</h2>
            <p className="empty-desc">
              {searchInput
                ? 'Try a different search term or clear your filters.'
                : 'Be the first to post a delivery job.'}
            </p>
            <button className="empty-cta" onClick={handlePost}>
              <Icon name="plus" size={16} color="#FFFFFF" strokeWidth={2.4} />
              Post a delivery job
            </button>
          </div>
        )}

        {!loading && !error && deliveries.length > 0 && (
          <div className="list">
            {deliveries.map((d) => (
              <DeliveryCard key={d.id} delivery={d} onClick={handleCardClick} />
            ))}
          </div>
        )}

        <div ref={loadMoreRef} className="load-more">
          {loadingMore && (
            <div className="load-more-spinner">
              <div className="spinner" />
              <span>Loading more…</span>
            </div>
          )}
          {!hasMore && deliveries.length > 0 && (
            <p className="end-text">You've reached the end</p>
          )}
        </div>
      </div>

      <button
        className="fab"
        onClick={handlePost}
        aria-label="Post a delivery job"
      >
        <Icon name="plus" size={22} color="#FFFFFF" strokeWidth={2.6} />
      </button>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
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

        .header-title {
          flex: 1;
          min-width: 0;
        }

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
          gap: 12px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          transition: border-color 0.2s ease;
        }

        .search-bar:focus-within { border-color: var(--color-primary); }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 14px;
          font-family: inherit;
          color: var(--color-text);
          outline: none;
          min-width: 0;
        }

        .search-input::placeholder { color: var(--color-text-muted); }

        .search-clear {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--color-surface-alt);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          flex-shrink: 0;
        }

        .tabs {
          display: flex;
          gap: 6px;
        }

        .tab {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab:hover { border-color: var(--color-accent); color: var(--color-text); }

        .tab.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
        }

        .filters-panel {
          padding: 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .filter-select,
        .filter-input {
          padding: 10px 12px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 13.5px;
          font-family: inherit;
          color: var(--color-text);
          background: var(--color-surface-alt);
          outline: none;
        }

        .filter-select:focus,
        .filter-input:focus {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }

        .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }

        .chip {
          padding: 6px 12px;
          border-radius: 999px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .chip:hover { border-color: var(--color-accent); color: var(--color-text); }

        .chip.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: #FFFFFF;
        }

        .reset-btn {
          align-self: flex-start;
          padding: 8px 14px;
          background: none;
          border: none;
          color: var(--color-error);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          border-radius: var(--radius-lg);
        }

        .reset-btn:hover { background: var(--color-error-bg); }

        .list { display: flex; flex-direction: column; gap: 12px; }

        .error-card,
        .empty-state {
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

        .empty-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
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
        }

        .load-more { padding: 20px 0; text-align: center; }

        .load-more-spinner {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-muted);
          font-size: 13px;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-border);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .end-text {
          font-size: 12.5px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .fab {
          position: fixed;
          bottom: 24px;
          right: 20px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-primary);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(10, 36, 114, 0.28);
          z-index: 90;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .fab:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 32px rgba(10, 36, 114, 0.36);
        }

        @media (max-width: 768px) { .fab { bottom: 88px; } }

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