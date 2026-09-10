// mobile/src/pages/Search.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import { useToast } from '../components/ToastContainer';
import { useAuth } from '../context/AuthContext';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
    dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    filter: "M3 6h18M6 12h12M10 18h4",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  };

  const d = icons[name] || icons.store;
  
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
// CONSTANTS
// ============================================================
const CATEGORIES = [
  'All',
  'Products',
  'Services',
  'Farm Inputs',
  'Food & Groceries',
  'Construction Materials',
  'Electronics',
  'Clothing & Fashion',
  'Vehicles & Parts',
  'Furniture',
  'Tools & Equipment',
  'Other'
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast, success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const searchInputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const category = params.get('category');
    
    if (q) {
      setSearchQuery(q);
      performSearch(0, q);
    }
    if (category && category !== 'All') {
      setSelectedCategory(category);
    }
    if (searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const performSearch = async (page = 0, query = searchQuery) => {
    setLoading(true);

    try {
      const params = {
        limit: 20,
        offset: page * 20
      };

      if (query?.trim()) params.q = query.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);

      const response = await listingsAPI.search(params);
      setResults(response.data.listings || []);
      setTotalResults(response.data.total || 0);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      showToast('Search failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
    }
    performSearch(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setResults([]);
    setTotalResults(0);
    navigate('/search', { replace: true });
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `MK ${price.toLocaleString()}`;
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-search" />
        <div className="skeleton-filters" />
        <div className="skeleton-results">
          {[1,2,3].map(i => <div key={i} className="skeleton-result" />)}
        </div>
        <style jsx>{`
          .loading-skeleton {
            min-height: 100vh;
            background: #F8FAFC;
            padding: 16px 16px 80px;
            max-width: 800px;
            margin: 0 auto;
          }
          .skeleton-search {
            height: 60px;
            background: #E2E8F0;
            border-radius: 12px;
            margin-bottom: 12px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-filters {
            height: 40px;
            background: #E2E8F0;
            border-radius: 8px;
            margin-bottom: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-results {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .skeleton-result {
            height: 100px;
            background: #E2E8F0;
            border-radius: 12px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="main-content">
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <Icon name="arrowLeft" size={16} color="#64748B" strokeWidth={1.75} />
          Back
        </button>

        {/* Search Header */}
        <div className="search-header">
          <div className="search-header-content">
            <div className="header-icon">
              <Icon name="search" size={28} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <h1 className="search-title">Search</h1>
            <p className="search-subtitle">Find products and services in your area</p>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Icon name="search" size={18} color="#94A3B8" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search Mitundu marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-btn">
                <Icon name="search" size={16} color="#FFFFFF" strokeWidth={2} />
                Search
              </button>
            </div>
          </form>

          <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <Icon name="filter" size={14} color="#64748B" strokeWidth={1.75} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="filter-select"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Min Price (MK)</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="1000"
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Max Price (MK)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="10000"
                    className="filter-input"
                  />
                </div>
              </div>
              <div className="filter-actions">
                <button className="btn-apply" onClick={() => performSearch(0)}>
                  Apply
                </button>
                <button className="btn-clear" onClick={clearFilters}>
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <>
            <p className="result-count">Found {totalResults} results</p>
            <div className="results-grid">
              {results.map((listing) => (
                <div
                  key={listing.id}
                  className="result-card"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <div className="result-content">
                    <div className="result-info">
                      <h3 className="result-title">{listing.title}</h3>
                      <p className="result-business">
                        {listing.businesses?.business_name || 'Unknown Business'}
                      </p>
                      <div className="result-badges">
                        <span className="badge badge-category">{listing.category}</span>
                        {listing.price && (
                          <span className="badge badge-price">{formatPrice(listing.price)}</span>
                        )}
                        {listing.price_type === 'negotiable' && (
                          <span className="badge badge-negotiable">Negotiable</span>
                        )}
                        {listing.location_area && (
                          <span className="badge badge-location">
                            <Icon name="mapPin" size={10} color="#1E40AF" strokeWidth={1.75} />
                            {listing.location_area}
                          </span>
                        )}
                      </div>
                    </div>
                    {listing.images && listing.images.length > 0 && (
                      <img src={listing.images[0]} alt={listing.title} className="result-image" loading="lazy" />
                    )}
                  </div>

                  <div className="result-share">
                    <SocialShare 
                      title={listing.title}
                      description={listing.description || ''}
                      url={`${window.location.origin}/listing/${listing.id}`}
                      compact={true}
                      showLabel={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : searchQuery || selectedCategory ? (
          <div className="empty-state">
            <Icon name="search" size={48} color="#CBD5E1" strokeWidth={1.5} />
            <h3 className="empty-title">No results found</h3>
            <p className="empty-text">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="search" size={48} color="#CBD5E1" strokeWidth={1.5} />
            <h3 className="empty-title">Search for products and services</h3>
            <p className="empty-text">Enter a search term above to get started</p>
          </div>
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
            const active = item.id === 'search';
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
        .search-page {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .search-page {
            padding-bottom: 0;
          }
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px 16px 40px;
        }

        /* ===== BACK BUTTON ===== */
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          margin-bottom: 16px;
        }

        .back-btn:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
        }

        /* ===== SEARCH HEADER ===== */
        .search-header {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .search-header-content {
          margin-bottom: 16px;
        }

        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .search-title {
          font-size: clamp(22px, 2.8vw, 26px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .search-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== SEARCH FORM ===== */
        .search-form {
          margin-bottom: 12px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8FAFC;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          padding: 4px 4px 4px 14px;
          transition: all 0.2s;
        }

        .search-input-wrapper:focus-within {
          border-color: #F59E0B;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.08);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 10px 0;
          font-size: 15px;
          font-family: inherit;
          color: #1E293B;
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        .search-btn {
          padding: 8px 16px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .search-btn:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        /* ===== FILTER TOGGLE ===== */
        .filter-toggle {
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          transition: all 0.2s;
        }

        .filter-toggle:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
        }

        /* ===== FILTERS PANEL ===== */
        .filters-panel {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
        }

        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        .filter-group {
          flex: 1;
          min-width: 140px;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 600;
          color: #94A3B8;
          display: block;
          margin-bottom: 4px;
        }

        .filter-select,
        .filter-input {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          color: #1E293B;
          background: #FFFFFF;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .filter-select:focus,
        .filter-input:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .filter-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-apply {
          padding: 8px 20px;
          background: #1E293B;
          border: none;
          border-radius: 8px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-apply:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .btn-clear {
          padding: 8px 20px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #64748B;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-clear:hover {
          background: #E2E8F0;
        }

        /* ===== RESULTS ===== */
        .result-count {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 12px;
          font-weight: 500;
        }

        .results-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .result-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .result-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .result-content {
          display: flex;
          gap: 12px;
        }

        .result-info {
          flex: 1;
          min-width: 0;
        }

        .result-title {
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 2px;
        }

        .result-business {
          font-size: 13px;
          color: #94A3B8;
          margin: 0 0 6px;
        }

        .result-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .badge-category {
          background: #EDE9F5;
          color: #1E293B;
        }

        .badge-price {
          background: #D1FAE5;
          color: #065F46;
        }

        .badge-negotiable {
          background: #FEF3C7;
          color: #92400E;
        }

        .badge-location {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .result-image {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          background: #F1F5F9;
        }

        .result-share {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #F1F5F9;
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          text-align: center;
          padding: 48px 20px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
        }

        .empty-title {
          font-size: 17px;
          font-weight: 600;
          color: #1E293B;
          margin: 12px 0 4px;
        }

        .empty-text {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
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
          .filter-row {
            flex-direction: column;
          }
          .filter-group {
            min-width: 100%;
          }
          .search-header {
            padding: 14px 16px;
          }
          .result-content {
            flex-direction: column;
          }
          .result-image {
            width: 100%;
            height: 100px;
          }
          .result-card {
            padding: 12px 14px;
          }
          .result-title {
            font-size: 14px;
          }
        }

        @media (max-width: 380px) {
          .main-content {
            padding: 12px 12px 32px;
          }
          .search-input-wrapper {
            flex-wrap: wrap;
            background: transparent;
            border: none;
            padding: 0;
            gap: 8px;
          }
          .search-input {
            width: 100%;
            background: #F8FAFC;
            border: 2px solid #E2E8F0;
            border-radius: 10px;
            padding: 10px 14px;
          }
          .search-btn {
            width: 100%;
            justify-content: center;
          }
          .filter-actions {
            flex-direction: column;
          }
          .btn-apply,
          .btn-clear {
            width: 100%;
            justify-content: center;
          }
          .result-image {
            height: 80px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .filter-row {
            flex-wrap: wrap;
          }
          .filter-group {
            min-width: 160px;
          }
        }
      `}</style>
    </div>
  );
};

export default Search;