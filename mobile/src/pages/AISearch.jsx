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
    globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
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

  // ★ PHASE 7A: translation state
  const [translation, setTranslation] = useState(null); // { original, translated, detectedLanguage, confidence }
  const [translating, setTranslating] = useState(false);

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

  // ★ PHASE 7A: translate before hitting the AI search
  const translateQuery = async (searchQuery) => {
    const trimmed = String(searchQuery || '').trim();
    if (!trimmed || trimmed.length < 3) {
      setTranslation(null);
      return { searchTerms: [trimmed], translated: trimmed };
    }

    setTranslating(true);
    try {
      const res = await aiAPI.translateSearch(trimmed);
      const data = res?.data || {};
      const translated = data.translated || trimmed;
      const keywords = Array.isArray(data.keywords) && data.keywords.length > 0
        ? data.keywords
        : [trimmed, translated].filter(Boolean);

      const lang = data.detectedLanguage || 'unknown';
      const confidence = Number(data.confidence) || 0;

      if (lang !== 'en' && translated.toLowerCase() !== trimmed.toLowerCase()) {
        setTranslation({
          original: trimmed,
          translated,
          detectedLanguage: lang,
          confidence,
        });
      } else {
        setTranslation(null);
      }

      return { searchTerms: keywords, translated };
    } catch (err) {
      console.warn('translateQuery failed:', err?.message || err);
      setTranslation(null);
      return { searchTerms: [trimmed], translated: trimmed };
    } finally {
      setTranslating(false);
    }
  };

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setErrorMsg('');
    setShowSuggestions(false);
    setAiResponse(null);
    setRelatedSearches([]);

    try {
      // ★ PHASE 7A: translate first
      const { searchTerms } = await translateQuery(searchQuery);

      // Send the joined keywords to AI search — the search backend can
      // match on any of them.
      const combinedQuery = searchTerms.length > 0
        ? searchTerms.join(' ')
        : searchQuery;

      const response = await aiAPI.search({
        query: combinedQuery,
        location: 'Malawi',
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
            background: var(--color-bg);
            padding: 20px 16px 80px;
            max-width: 800px;
            margin: 0 auto;
          }
          .skeleton-header {
            height: 80px;
            background: var(--color-border);
            border-radius: var(--radius-xl);
            margin-bottom: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-search {
            height: 50px;
            background: var(--color-border);
            border-radius: var(--radius-xl);
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
            background: var(--color-border);
            border-radius: var(--radius-xl);
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
        <div className="page-header">
          <div className="header-icon">
            <Icon name="bot" size={28} color="var(--color-accent)" strokeWidth={1.75} />
          </div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">Ask in English or Chichewa. Example: "Ndikufuna plumber pafupi"</p>
        </div>

        <div className="search-card" ref={searchRef}>
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Icon name="search" size={18} color="var(--color-text-muted)" strokeWidth={1.75} />
              <input
                type="text"
                placeholder="Ask anything in English or Chichewa..."
                value={query}
                onChange={handleQueryChange}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-btn" disabled={loading || translating}>
                <Icon name="search" size={16} color="var(--color-text-inverse)" strokeWidth={2} />
                {translating ? 'Translating…' : loading ? '...' : 'Search'}
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
                    <Icon name="search" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </form>

          {/* ★ PHASE 7A: translation chip */}
          {translation && (
            <div className="translation-chip">
              <Icon name="globe" size={14} color="#1E40AF" strokeWidth={2} />
              <span className="translation-text">
                Translated: <strong>{translation.original}</strong> → <strong>{translation.translated}</strong>
              </span>
            </div>
          )}

          {translating && !translation && (
            <div className="translation-chip translating">
              <div className="translation-spinner" />
              <span className="translation-text">Translating your query…</span>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="error-banner">
            <Icon name="search" size={16} color="var(--color-error)" strokeWidth={1.75} />
            {errorMsg}
          </div>
        )}

        {aiResponse && (
          <div className="ai-response">
            <div className="ai-response-header">
              <Icon name="sparkles" size={16} color="var(--color-success)" strokeWidth={1.75} />
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
                          <Icon name="mapPin" size={10} color="var(--color-warning)" strokeWidth={1.75} />
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

        {!loading && results.length === 0 && query && !errorMsg && (
          <div className="empty-state">
            <Icon name="search" size={40} color="var(--color-border-strong)" strokeWidth={1.5} />
            <h3 className="empty-title">No results found for "{query}"</h3>
            <p className="empty-text">
              {translation
                ? `We translated it to "${translation.translated}" but found nothing. Try different keywords.`
                : 'Try using different keywords or check your spelling'}
            </p>
          </div>
        )}

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
                  <Icon name={item.icon} size={20} color={active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)'} strokeWidth={1.75} />
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
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .ai-search { padding-bottom: 0; }
        }

        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        .page-header { margin-bottom: 24px; }

        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--color-accent-tint);
          border-radius: var(--radius-2xl);
          margin-bottom: 8px;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: clamp(24px, 2.8vw, 28px);
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .search-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: 18px 20px;
          border: 1px solid var(--color-border);
          margin-bottom: 16px;
          position: relative;
          box-shadow: var(--shadow-xs);
        }

        .search-form { position: relative; }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--color-surface-alt);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 4px 4px 4px 14px;
          transition: all 0.2s;
        }

        .search-input-wrapper:focus-within {
          border-color: var(--color-accent);
          background: var(--color-surface);
          box-shadow: 0 0 0 4px var(--color-accent-tint);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 10px 0;
          font-size: 15px;
          font-family: inherit;
          color: var(--color-text);
        }

        .search-input::placeholder { color: var(--color-text-muted); }

        .search-btn {
          padding: 8px 18px;
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-lg);
          color: var(--color-text-inverse);
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
          background: var(--color-accent);
          transform: scale(0.98);
        }

        .search-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ★ PHASE 7A: translation chip */
        .translation-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
          padding: 10px 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: var(--radius-lg);
          font-size: 13px;
          color: #1E40AF;
          animation: fadeIn 0.25s ease-out;
        }

        .translation-chip.translating {
          background: #F3F4F6;
          border-color: #E5E7EB;
          color: #6B7280;
        }

        .translation-chip strong { font-weight: 700; }
        .translation-text { font-weight: 500; }

        .translation-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #E5E7EB;
          border-top-color: #6B7280;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .suggestions-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          z-index: 100;
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid var(--color-border);
        }

        .suggestion-item {
          padding: 10px 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: var(--color-text-secondary);
          transition: all 0.15s;
          border-bottom: 1px solid var(--color-border);
        }

        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: var(--color-surface-alt); }

        .error-banner {
          color: var(--color-error);
          font-size: 13px;
          padding: 10px 14px;
          background: var(--color-error-bg);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-error);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .ai-response {
          background: var(--color-success-bg);
          padding: 16px 18px;
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          margin-bottom: 16px;
        }

        .ai-response-header {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-success);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .ai-response-text {
          font-size: 15px;
          color: var(--color-text);
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
          background: var(--color-success-bg);
          color: var(--color-success);
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: all 0.2s;
        }

        .related-tag:hover {
          background: var(--color-accent-tint);
          transform: scale(0.98);
        }

        .category-tag {
          display: inline-block;
          padding: 4px 14px;
          background: var(--color-warning-bg);
          color: var(--color-warning);
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
        }

        .results-section { margin-top: 4px; }

        .results-count {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0 0 12px;
          font-weight: 500;
        }

        .result-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: 14px 16px;
          margin-bottom: 10px;
          border: 1px solid var(--color-border);
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-xs);
        }

        .result-card:hover {
          border-color: var(--color-border-strong);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .result-content { display: flex; gap: 12px; }
        .result-info { flex: 1; min-width: 0; }

        .result-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 2px;
        }

        .result-summary {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin: 0 0 4px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .result-business {
          font-size: 13px;
          color: var(--color-text-muted);
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
          border-radius: var(--radius-full);
          font-size: 11px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .badge-category { background: var(--color-primary-tint); color: var(--color-primary); }
        .badge-price { background: var(--color-success-bg); color: var(--color-success); }
        .badge-location { background: var(--color-warning-bg); color: var(--color-warning); }
        .badge-match { background: var(--color-primary-tint); color: var(--color-primary); }

        .result-image {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: var(--radius-md);
          flex-shrink: 0;
          background: var(--color-surface-alt);
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
        }

        .empty-title {
          font-family: var(--font-serif);
          font-size: 17px;
          font-weight: 600;
          color: var(--color-text);
          margin: 12px 0 4px;
        }

        .empty-text {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }

        .examples-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: 16px 18px;
          border: 1px solid var(--color-border);
          margin-top: 16px;
          box-shadow: var(--shadow-xs);
        }

        .examples-title {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 12px;
        }

        .examples-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .example-btn {
          padding: 10px 14px;
          background: var(--color-surface-alt);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          color: var(--color-text-secondary);
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .example-btn:hover {
          background: var(--color-border);
          border-color: var(--color-border-strong);
          transform: translateX(4px);
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--color-border);
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
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .nav-label.active { color: var(--color-text); font-weight: 600; }

        @media (max-width: 480px) {
          .search-input-wrapper { padding: 4px 4px 4px 12px; }
          .search-input { font-size: 14px; padding: 8px 0; }
          .search-btn { padding: 6px 14px; font-size: 13px; }
          .result-content { flex-direction: column; }
          .result-image { width: 100%; height: 100px; }
          .result-card { padding: 12px 14px; }
          .result-title { font-size: 14px; }
          .page-title { font-size: 22px; }
          .translation-chip { font-size: 12px; padding: 8px 12px; }
        }

        @media (max-width: 380px) {
          .main-content { padding: 12px 12px 32px; }
          .search-card { padding: 14px 16px; }
          .examples-card { padding: 14px 16px; }
          .example-btn { font-size: 13px; padding: 8px 12px; }
          .header-icon { width: 40px; height: 40px; }
          .header-icon svg { width: 22px; height: 22px; }
          .page-title { font-size: 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .translation-chip, .translation-spinner { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default AISearch;