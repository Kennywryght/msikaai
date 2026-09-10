// mobile/src/pages/SearchResults.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

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
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    close: "M18 6L6 18M6 6l12 12",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    arrowUpDown: "M7 15l5 5 5-5M7 9l5-5 5 5",
    x: "M18 6L6 18M6 6l12 12",
  };

  const d = icons[name] || icons.search;
  
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
  { id: 'all', label: 'All', emoji: '🏷️' },
  { id: 'food', label: 'Food', emoji: '🍲' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'services', label: 'Services', emoji: '🔧' },
  { id: 'farm', label: 'Farm', emoji: '🌾' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'nearest', label: 'Nearest First' },
];

// Mock results
const MOCK_RESULTS = {
  listings: [
    { id: 1, title: 'Fresh Tomatoes, basket', price: 650, category: 'Food', vendor: 'Grace M.', image: '🍅', rating: 4.8, distance: '0.4 km', verified: true, delivery: true },
    { id: 2, title: 'Maize, 50kg bag', price: 350, category: 'Farm', vendor: 'Peter K.', image: '🌽', rating: 4.5, distance: '0.8 km', verified: true, delivery: false },
    { id: 3, title: 'Onions, per kg', price: 800, category: 'Food', vendor: 'Sarah M.', image: '🧅', rating: 4.2, distance: '0.6 km', verified: false, delivery: true },
    { id: 4, title: 'Fresh Cabbage, head', price: 400, category: 'Food', vendor: 'Mary T.', image: '🥬', rating: 4.7, distance: '1.2 km', verified: true, delivery: false },
  ],
  services: [
    { id: 5, title: 'Electrician, home wiring', price: 5000, category: 'Services', vendor: 'Chikondi B.', image: '⚡', rating: 4.7, distance: '1.1 km', verified: true, delivery: false, isService: true },
    { id: 6, title: 'Tailoring, per item', price: 1500, category: 'Services', vendor: 'Grace T.', image: '🧵', rating: 4.6, distance: '0.9 km', verified: true, delivery: false, isService: true },
  ],
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const SearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSort, setActiveSort] = useState('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [results, setResults] = useState(MOCK_RESULTS);
  const [recentSearches, setRecentSearches] = useState(['tomatoes', 'maize', 'plumber']);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [location.search]);

  const performSearch = async (query) => {
    setLoading(true);
    // Simulate search
    await new Promise(resolve => setTimeout(resolve, 400));
    setResults(MOCK_RESULTS);
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
      performSearch(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/search', { replace: true });
    setResults({ listings: [], services: [] });
    searchInputRef.current?.focus();
  };

  const handleRemoveRecentSearch = (query) => {
    setRecentSearches(prev => prev.filter(q => q !== query));
  };

  const handleResultClick = (item) => {
    navigate(`/listing/${item.id}`);
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const formatPrice = (price) => `MK ${Number(price).toLocaleString()}`;

  const totalResults = results.listings.length + results.services.length;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className="search-results">
      {/* Header */}
      <div className="search-header">
        <div className="search-header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
          </button>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrap">
              <Icon name="search" size={16} color="#94A3B8" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Mitundu marketplace..."
                className="search-input"
                autoComplete="off"
              />
              {searchQuery && (
                <button type="button" className="clear-btn" onClick={handleClearSearch}>
                  <Icon name="close" size={14} color="#94A3B8" strokeWidth={2} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories */}
        {hasQuery && (
          <div className="categories-scroll">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className="category-emoji">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="main-content">
        {!hasQuery ? (
          <div className="discover-section">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="recent-section">
                <div className="section-header">
                  <h3 className="section-title">Recent Searches</h3>
                </div>
                <div className="recent-list">
                  {recentSearches.map((query, idx) => (
                    <button
                      key={idx}
                      className="recent-item"
                      onClick={() => {
                        setSearchQuery(query);
                        navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
                        performSearch(query);
                      }}
                    >
                      <Icon name="clock" size={14} color="#94A3B8" strokeWidth={1.75} />
                      <span className="recent-text">{query}</span>
                      <button
                        className="recent-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRecentSearch(query);
                        }}
                      >
                        <Icon name="close" size={12} color="#94A3B8" strokeWidth={2} />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending / Suggestions */}
            <div className="trending-section">
              <div className="section-header">
                <h3 className="section-title">
                  <Icon name="trendingUp" size={14} color="#F59E0B" strokeWidth={1.75} />
                  Trending Now
                </h3>
              </div>
              <div className="trending-tags">
                {['Fresh tomatoes', 'Maize flour', 'Plumber', 'Electrician', 'Chitenje fabric', 'Secondhand shoes'].map((tag, idx) => (
                  <button
                    key={idx}
                    className="trending-tag"
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/search?q=${encodeURIComponent(tag)}`, { replace: true });
                      performSearch(tag);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="loading-state">
            {[1,2,3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : totalResults > 0 ? (
          <>
            {/* Results Toolbar */}
            <div className="results-toolbar">
              <span className="results-count">
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
              </span>
              <div className="toolbar-actions">
                <button 
                  className="toolbar-btn"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  <Icon name="arrowUpDown" size={14} color="#64748B" strokeWidth={1.75} />
                  {SORT_OPTIONS.find(s => s.id === activeSort)?.label}
                </button>
                <button 
                  className="toolbar-btn icon-only"
                  onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                >
                  <Icon name={viewMode === 'list' ? 'grid' : 'list'} size={16} color="#64748B" strokeWidth={1.75} />
                </button>
              </div>

              {/* Sort Menu */}
              {showSortMenu && (
                <div className="sort-menu">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={`sort-item ${activeSort === opt.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveSort(opt.id);
                        setShowSortMenu(false);
                      }}
                    >
                      {opt.label}
                      {activeSort === opt.id && <Icon name="check" size={14} color="#F59E0B" strokeWidth={2.5} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listings */}
            {results.listings.length > 0 && (
              <div className="result-section">
                <h3 className="result-section-title">Listings</h3>
                <div className={`results-list ${viewMode}`}>
                  {results.listings.map(item => (
                    <div
                      key={item.id}
                      className="result-card"
                      onClick={() => handleResultClick(item)}
                    >
                      <div className="result-image">
                        <span className="result-emoji">{item.image}</span>
                        {item.verified && (
                          <span className="verified-badge">
                            <Icon name="check" size={10} color="#FFFFFF" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="result-info">
                        <h4 className="result-title">{item.title}</h4>
                        <div className="result-meta">
                          <span className="result-vendor">
                            <Icon name="store" size={10} color="#94A3B8" strokeWidth={1.75} />
                            {item.vendor}
                          </span>
                          <span className="result-distance">
                            <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                            {item.distance}
                          </span>
                        </div>
                        <div className="result-footer">
                          <span className="result-price">{formatPrice(item.price)}</span>
                          <div className="result-badges">
                            <span className="mini-badge">
                              <Icon name="star" size={10} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                              {item.rating}
                            </span>
                            {item.delivery && (
                              <span className="mini-badge delivery">
                                <Icon name="truck" size={10} color="#10B981" strokeWidth={2} />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            {results.services.length > 0 && (
              <div className="result-section">
                <h3 className="result-section-title">Service Providers</h3>
                <div className={`results-list ${viewMode}`}>
                  {results.services.map(item => (
                    <div
                      key={item.id}
                      className="result-card"
                      onClick={() => handleResultClick(item)}
                    >
                      <div className="result-image service-image">
                        <span className="result-emoji">{item.image}</span>
                      </div>
                      <div className="result-info">
                        <h4 className="result-title">{item.title}</h4>
                        <div className="result-meta">
                          <span className="result-vendor">
                            <Icon name="user" size={10} color="#94A3B8" strokeWidth={1.75} />
                            {item.vendor}
                          </span>
                          <span className="result-distance">
                            <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                            {item.distance}
                          </span>
                        </div>
                        <div className="result-footer">
                          <span className="result-price">{formatPrice(item.price)}</span>
                          <div className="result-badges">
                            <span className="mini-badge">
                              <Icon name="star" size={10} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                              {item.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="search" size={40} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No results found</h3>
            <p className="empty-text">
              We couldn't find anything for <strong>"{searchQuery}"</strong>
            </p>
            <p className="empty-hint">Try a different search or browse categories</p>
            <button className="empty-btn" onClick={handleClearSearch}>
              Clear Search
            </button>
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
        .search-results {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .search-results {
            padding-bottom: 40px;
          }
        }

        /* ===== SEARCH HEADER ===== */
        .search-header {
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          padding: 12px 16px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .search-header-top {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 900px;
          margin: 0 auto;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #F1F5F9;
        }

        .search-form {
          flex: 1;
          min-width: 0;
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #F8FAFC;
          border: 1.5px solid #F1F5F9;
          border-radius: 12px;
          padding: 10px 14px;
          transition: all 0.2s;
        }

        .search-input-wrap:focus-within {
          background: #FFFFFF;
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1E293B;
          background: transparent;
          font-family: inherit;
          min-width: 0;
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        .clear-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: #CBD5E1;
        }

        /* ===== CATEGORIES ===== */
        .categories-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 12px 0 0;
          scrollbar-width: none;
          max-width: 900px;
          margin: 0 auto;
        }

        .categories-scroll::-webkit-scrollbar {
          display: none;
        }

        .category-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .category-chip:hover {
          border-color: #94A3B8;
        }

        .category-chip.active {
          background: #1E293B;
          border-color: #1E293B;
          color: #FFFFFF;
        }

        .category-emoji {
          font-size: 13px;
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 900px;
          margin: 0 auto;
          padding: 16px;
        }

        /* ===== DISCOVER ===== */
        .discover-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Recent */
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          overflow: hidden;
        }

        .recent-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.15s;
          border-bottom: 1px solid #F8FAFC;
        }

        .recent-item:last-child {
          border-bottom: none;
        }

        .recent-item:hover {
          background: #F8FAFC;
        }

        .recent-text {
          flex: 1;
          font-size: 14px;
          color: #1E293B;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recent-remove {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .recent-remove:hover {
          background: #F1F5F9;
        }

        /* Trending */
        .trending-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .trending-tag {
          padding: 8px 14px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 13px;
          color: #475569;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          font-weight: 500;
        }

        .trending-tag:hover {
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.04);
          color: #F59E0B;
          transform: translateY(-1px);
        }

        /* ===== LOADING ===== */
        .loading-state {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .skeleton-card {
          height: 88px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* ===== RESULTS TOOLBAR ===== */
        .results-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          position: relative;
          flex-wrap: wrap;
          gap: 8px;
        }

        .results-count {
          font-size: 13px;
          color: #94A3B8;
          font-weight: 500;
        }

        .toolbar-actions {
          display: flex;
          gap: 6px;
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .toolbar-btn:hover {
          border-color: #94A3B8;
        }

        .toolbar-btn.icon-only {
          padding: 6px 8px;
        }

        /* Sort Menu */
        .sort-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(30, 41, 59, 0.12);
          min-width: 200px;
          padding: 6px;
          z-index: 20;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sort-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: transparent;
          font-size: 13px;
          color: #475569;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .sort-item:hover {
          background: #F8FAFC;
        }

        .sort-item.active {
          color: #F59E0B;
          font-weight: 600;
          background: rgba(245, 158, 11, 0.06);
        }

        /* ===== RESULT SECTIONS ===== */
        .result-section {
          margin-bottom: 24px;
        }

        .result-section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .results-list.grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        @media (min-width: 640px) {
          .results-list.grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* ===== RESULT CARD ===== */
        .result-card {
          display: flex;
          gap: 12px;
          padding: 12px;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .result-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .results-list.grid .result-card {
          flex-direction: column;
          padding: 0;
          overflow: hidden;
        }

        .result-image {
          width: 72px;
          height: 72px;
          border-radius: 10px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .results-list.grid .result-image {
          width: 100%;
          height: 120px;
          border-radius: 0;
        }

        .result-emoji {
          font-size: 32px;
        }

        .results-list.grid .result-emoji {
          font-size: 44px;
        }

        .verified-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3B82F6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .result-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .results-list.grid .result-info {
          padding: 10px;
        }

        .result-title {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .results-list.grid .result-title {
          white-space: normal;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .result-meta {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: #94A3B8;
          margin-bottom: 6px;
          flex-wrap: wrap;
        }

        .result-vendor,
        .result-distance {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .result-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .result-price {
          font-size: 14px;
          font-weight: 700;
          color: #10B981;
        }

        .result-badges {
          display: flex;
          gap: 4px;
        }

        .mini-badge {
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

        .mini-badge.delivery {
          background: rgba(16, 185, 129, 0.08);
        }

        /* ===== EMPTY ===== */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #F1F5F9;
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-title {
          font-size: 17px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 6px;
        }

        .empty-text {
          font-size: 14px;
          color: #64748B;
          margin: 0 0 4px;
          line-height: 1.5;
        }

        .empty-hint {
          font-size: 13px;
          color: #94A3B8;
          margin: 0 0 20px;
        }

        .empty-btn {
          padding: 10px 24px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .empty-btn:hover {
          background: #F59E0B;
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
          .search-header {
            padding: 10px 12px;
          }
          .main-content {
            padding: 12px;
          }
          .result-image {
            width: 64px;
            height: 64px;
          }
          .result-emoji {
            font-size: 28px;
          }
          .result-title {
            font-size: 13px;
          }
          .result-price {
            font-size: 13px;
          }
        }

        @media (max-width: 380px) {
          .result-image {
            width: 56px;
            height: 56px;
          }
          .result-emoji {
            font-size: 24px;
          }
          .toolbar-btn {
            font-size: 11px;
            padding: 5px 10px;
          }
          .results-list.grid {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-card,
          .sort-menu {
            animation: none;
          }
          .result-card,
          .trending-tag,
          .empty-btn {
            transition: none;
          }
          .result-card:hover,
          .trending-tag:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchResults;