// mobile/src/pages/AISearch.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { aiAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
    dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
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
// MAIN COMPONENT
// ============================================================
const AISearch = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [relatedSearches, setRelatedSearches] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const searchRef = useRef();

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await performSearch(query.trim());
  };

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setErrorMsg('');
    setShowSuggestions(false);
    setAiResponse(null);
    setRelatedSearches([]);

    try {
      const response = await aiAPI.search({ 
        query: searchQuery,
        location: 'Malawi'
      });
      
      if (response.data.success) {
        setResults(response.data.results || []);
        setAiResponse(response.data.ai_response || null);
        setRelatedSearches(response.data.related_searches || []);
        setSuggestedCategory(response.data.suggested_category || '');
      } else {
        setErrorMsg(response.data.error || 'Search failed');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 2) {
      try {
        const response = await aiAPI.getSuggestions(value);
        if (response.data.success) {
          setSuggestions(response.data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Suggestion error:', err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Price on request';
    return `MK ${Number(price).toLocaleString()}`;
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
        <div className="skeleton-header" />
        <div className="skeleton-search" />
        <div className="skeleton-results">
          {[1,2,3].map(i => <div key={i} className="skeleton-result" />)}
        </div>
        <style jsx>{`
          .loading-skeleton {
            min-height: 100vh;
            background: #F8FAFC;
            padding: 20px 16px 80px;
            max-width: 800px;
            margin: 0 auto;
          }
          .skeleton-header {
            height: 80px;
            background: #E2E8F0;
            border-radius: 12px;
            margin-bottom: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-search {
            height: 50px;
            background: #E2E8F0;
            border-radius: 12px;
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
    <div className="ai-search">
      <div className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-icon">
            <Icon name="bot" size={28} color="#F59E0B" strokeWidth={1.75} />
          </div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Ask in English or Chichewa. Example: "Ndikufuna plumber pafupi"</p>
        </div>

        {/* Search Card */}
        <div className="search-card" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Icon name="search" size={18} color="#94A3B8" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Ask anything..."
                value={query}
                onChange={handleQueryChange}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-btn" disabled={loading}>
                <Icon name="search" size={16} color="#FFFFFF" strokeWidth={2} />
                {loading ? '...' : 'Search'}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Icon name="search" size={14} color="#94A3B8" strokeWidth={1.75} />
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="error-banner">
            <Icon name="search" size={16} color="#EF4444" strokeWidth={1.75} />
            {errorMsg}
          </div>
        )}

        {/* AI Response */}
        {aiResponse && (
          <div className="ai-response">
            <div className="ai-response-header">
              <Icon name="sparkles" size={16} color="#166534" strokeWidth={1.75} />
              <span>AI Suggestion</span>
            </div>
            <p className="ai-response-text">{aiResponse}</p>
            
            {relatedSearches.length > 0 && (
              <div className="related-searches">
                {relatedSearches.map((term, idx) => (
                  <button
                    key={idx}
                    className="related-tag"
                    onClick={() => {
                      setQuery(term);
                      performSearch(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
            
            {suggestedCategory && (
              <div className="category-tag">
                📂 {suggestedCategory}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="results-section">
            <p className="results-count">
              Found {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            {results.map((item) => (
              <div
                key={item.id}
                className="result-card"
                onClick={() => navigate(`/listing/${item.id}`)}
              >
                <div className="result-content">
                  <div className="result-info">
                    <h3 className="result-title">{item.title}</h3>
                    <p className="result-summary">{item.ai_summary || item.description}</p>
                    <p className="result-business">
                      {item.businesses?.business_name || 'Unknown Business'}
                    </p>
                    <div className="result-badges">
                      {item.category && (
                        <span className="badge badge-category">{item.category}</span>
                      )}
                      {item.price !== undefined && item.price !== null && (
                        <span className="badge badge-price">{formatPrice(item.price)}</span>
                      )}
                      {item.location_area && (
                        <span className="badge badge-location">
                          <Icon name="mapPin" size={10} color="#92400E" strokeWidth={1.75} />
                          {item.location_area}
                        </span>
                      )}
                      {item.relevance_score && item.relevance_score > 0.7 && (
                        <span className="badge badge-match">High Match</span>
                      )}
                    </div>
                  </div>
                  {item.images && item.images.length > 0 && (
                    <img src={item.images[0]} alt={item.title} className="result-image" loading="lazy" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State - No Results */}
        {!loading && results.length === 0 && query && !errorMsg && (
          <div className="empty-state">
            <Icon name="search" size={40} color="#CBD5E1" strokeWidth={1.5} />
            <h3 className="empty-title">No results found for "{query}"</h3>
            <p className="empty-text">Try using different keywords or check your spelling</p>
          </div>
        )}

        {/* Examples */}
        {!query && !loading && results.length === 0 && (
          <div className="examples-card">
            <h3 className="examples-title">💡 Try These Examples:</h3>
            <div className="examples-grid">
              <button className="example-btn" onClick={() => performSearch('Ndikufuna plumber pafupi')}>
                🔧 "Ndikufuna plumber pafupi" - Find nearby plumbers
              </button>
              <button className="example-btn" onClick={() => performSearch('chimanga chogulitsa')}>
                🌾 "chimanga chogulitsa" - Find maize sellers
              </button>
              <button className="example-btn" onClick={() => performSearch('zomanga nyumba')}>
                🏗️ "zomanga nyumba" - Building services
              </button>
              <button className="example-btn" onClick={() => performSearch('salon yatsitsi')}>
                💇 "salon yatsitsi" - Hair salons
              </button>
            </div>
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
            const active = item.id === 'home';
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
        .ai-search {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .ai-search {
            padding-bottom: 0;
          }
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== PAGE HEADER ===== */
        .page-header {
          margin-bottom: 24px;
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

        .page-title {
          font-size: clamp(24px, 2.8vw, 28px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== SEARCH CARD ===== */
        .search-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 18px 20px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
          position: relative;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .search-form {
          position: relative;
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
          padding: 8px 18px;
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

        .search-btn:hover:not(:disabled) {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .search-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== SUGGESTIONS ===== */
        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #FFFFFF;
          border-radius: 10px;
          box-shadow: 0 8px 24px rgba(30, 41, 59, 0.12);
          z-index: 100;
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #F1F5F9;
        }

        .suggestion-item {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748B;
          transition: all 0.15s;
          border-bottom: 1px solid #F1F5F9;
        }

        .suggestion-item:last-child {
          border-bottom: none;
        }

        .suggestion-item:hover {
          background: #F8FAFC;
        }

        /* ===== ERROR ===== */
        .error-banner {
          color: #EF4444;
          font-size: 13px;
          padding: 10px 14px;
          background: #FEF2F2;
          border-radius: 10px;
          border: 1px solid #FECACA;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        /* ===== AI RESPONSE ===== */
        .ai-response {
          background: #F0FDF4;
          padding: 16px 18px;
          border-radius: 12px;
          border: 1px solid #BBF7D0;
          margin-bottom: 16px;
        }

        .ai-response-header {
          font-size: 12px;
          font-weight: 600;
          color: #166534;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .ai-response-text {
          font-size: 15px;
          color: #1E293B;
          line-height: 1.6;
          margin: 0;
        }

        .related-searches {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .related-tag {
          padding: 4px 14px;
          background: #D1FAE5;
          color: #065F46;
          border-radius: 14px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.2s;
        }

        .related-tag:hover {
          background: #A7F3D0;
          transform: scale(0.98);
        }

        .category-tag {
          display: inline-block;
          padding: 4px 14px;
          background: #FEF3C7;
          color: #92400E;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
        }

        /* ===== RESULTS ===== */
        .results-section {
          margin-top: 4px;
        }

        .results-count {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 12px;
          font-weight: 500;
        }

        .result-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 10px;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
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

        .result-summary {
          font-size: 14px;
          color: #64748B;
          margin: 0 0 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .result-business {
          font-size: 13px;
          color: #94A3B8;
          margin: 0 0 6px;
          font-weight: 500;
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

        .badge-location {
          background: #FEF3C7;
          color: #92400E;
        }

        .badge-match {
          background: #E0E7FF;
          color: #3730A3;
        }

        .result-image {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 8px;
          flex-shrink: 0;
          background: #F1F5F9;
        }

        /* ===== EMPTY STATE ===== */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
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

        /* ===== EXAMPLES ===== */
        .examples-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          margin-top: 16px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .examples-title {
          font-size: 16px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 12px;
        }

        .examples-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .example-btn {
          padding: 10px 14px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: #64748B;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .example-btn:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
          transform: translateX(4px);
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
          .search-input-wrapper {
            padding: 4px 4px 4px 12px;
          }
          .search-input {
            font-size: 14px;
            padding: 8px 0;
          }
          .search-btn {
            padding: 6px 14px;
            font-size: 13px;
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
          .page-title {
            font-size: 22px;
          }
        }

        @media (max-width: 380px) {
          .main-content {
            padding: 12px 12px 32px;
          }
          .search-card {
            padding: 14px 16px;
          }
          .examples-card {
            padding: 14px 16px;
          }
          .example-btn {
            font-size: 13px;
            padding: 8px 12px;
          }
          .header-icon {
            width: 40px;
            height: 40px;
          }
          .header-icon svg {
            width: 22px;
            height: 22px;
          }
          .page-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default AISearch;