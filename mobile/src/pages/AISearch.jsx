// mobile/src/pages/AISearch.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { aiAPI } from '../services/api';

// --- HAND-DRAWN STYLE INLINE SVG ICONS ---
const SketchIcon = ({ d, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
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

const ICONS = {
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z"
};

const AISearch = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [relatedSearches, setRelatedSearches] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const searchRef = useRef();

  // Close suggestions popover when clicking outside
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    await performSearch(query.trim());
  };

  const performSearch = async (searchQuery) => {
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    setAiResponse(null);
    setRelatedSearches([]);

    try {
      const response = await aiAPI.search({ 
        query: searchQuery,
        location: 'Mitundu'
      });
      
      if (response.data.success) {
        setResults(response.data.results || []);
        setAiResponse(response.data.ai_response || null);
        setRelatedSearches(response.data.related_searches || []);
        setSuggestedCategory(response.data.suggested_category || '');
      } else {
        setError(response.data.error || 'Search failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
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
    return `MWK ${Number(price).toLocaleString()}`;
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '16px',
      transition: 'all 0.2s'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    title: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#0f172a',
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0 0 16px 0'
    },
    searchRow: {
      display: 'flex',
      gap: '12px',
      position: 'relative'
    },
    input: {
      flex: 1,
      padding: '12px 16px',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '15px',
      outline: 'none',
      backgroundColor: '#ffffff',
      color: '#0f172a',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s'
    },
    inputFocus: {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37,99,235,0.1)'
    },
    searchBtn: {
      padding: '12px 24px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s'
    },
    searchBtnDisabled: {
      padding: '12px 24px',
      backgroundColor: '#93c5fd',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'not-allowed',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    },
    suggestions: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      zIndex: 1000,
      marginTop: '6px',
      maxHeight: '220px',
      overflowY: 'auto',
      border: '1px solid #e2e8f0'
    },
    suggestionItem: {
      padding: '12px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '14px',
      color: '#334155',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.15s'
    },
    error: {
      color: '#dc2626',
      padding: '12px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginBottom: '16px',
      fontSize: '14px'
    },
    resultCount: {
      color: '#64748b',
      marginBottom: '12px',
      fontSize: '14px',
      fontWeight: '500'
    },
    resultCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e2e8f0',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    },
    resultTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 4px 0'
    },
    resultSummary: {
      fontSize: '14px',
      color: '#475569',
      margin: '0 0 6px 0',
      lineHeight: '1.4'
    },
    resultBusiness: {
      fontSize: '13px',
      color: '#64748b',
      margin: '0 0 8px 0',
      fontWeight: '500'
    },
    badgeGroup: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    badge: {
      display: 'inline-block',
      padding: '3px 12px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500'
    },
    resultImage: {
      width: '80px',
      height: '80px',
      objectFit: 'cover',
      borderRadius: '8px',
      marginLeft: '12px',
      flexShrink: 0
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#64748b',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    examples: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    exampleBtn: {
      padding: '12px 14px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      textAlign: 'left',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#334155',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    aiResponseBox: {
      backgroundColor: '#f0fdf4',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid #bbf7d0',
      marginBottom: '16px'
    },
    aiResponseLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#166534',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    aiResponseText: {
      fontSize: '15px',
      color: '#0f172a',
      lineHeight: '1.6'
    },
    relatedSearches: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginTop: '8px'
    },
    relatedTag: {
      padding: '4px 12px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    categoryTag: {
      display: 'inline-block',
      padding: '4px 14px',
      backgroundColor: '#fef3c7',
      color: '#92400e',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '600',
      marginTop: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => navigate('/dashboard')} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
      >
        <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
        Back to Dashboard
      </button>

      <div style={styles.card} ref={searchRef}>
        <h2 style={styles.title}>
          <SketchIcon d={ICONS.bot} size={24} color="#8b5cf6" strokeWidth={2} />
          AI Assistant
        </h2>
        <p style={styles.subtitle}>Ask in English or Chichewa. Example: "Ndikufuna plumber pafupi"</p>

        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="Ask anything..."
              value={query}
              onChange={handleQueryChange}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              style={styles.input}
              onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={loading}
              style={loading ? styles.searchBtnDisabled : styles.searchBtn}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#2563eb';
              }}
            >
              <SketchIcon d={ICONS.search} size={16} color="#ffffff" strokeWidth={2} />
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <SketchIcon d={ICONS.search} size={14} color="#64748b" strokeWidth={2} />
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* AI Response */}
      {aiResponse && (
        <div style={styles.aiResponseBox}>
          <div style={styles.aiResponseLabel}>
            <SketchIcon d={ICONS.sparkles} size={14} color="#166534" strokeWidth={2} />
            AI Suggestion
          </div>
          <p style={styles.aiResponseText}>{aiResponse}</p>
          
          {/* Related Searches */}
          {relatedSearches.length > 0 && (
            <div style={styles.relatedSearches}>
              {relatedSearches.map((term, idx) => (
                <button
                  key={idx}
                  style={styles.relatedTag}
                  onClick={() => {
                    setQuery(term);
                    performSearch(term);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bfdbfe'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
          
          {/* Suggested Category */}
          {suggestedCategory && (
            <div style={{ marginTop: '8px' }}>
              <span style={styles.categoryTag}>
                📂 {suggestedCategory}
              </span>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p style={styles.resultCount}>
            Found {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          {results.map((item) => (
            <div
              key={item.id}
              style={styles.resultCard}
              onClick={() => navigate(`/listing/${item.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.resultRow}>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.resultTitle}>{item.title}</h3>
                  <p style={styles.resultSummary}>{item.ai_summary || item.description}</p>
                  <p style={styles.resultBusiness}>
                    {item.businesses?.business_name || 'Unknown Business'}
                  </p>
                  <div style={styles.badgeGroup}>
                    {item.category && (
                      <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        {item.category}
                      </span>
                    )}
                    {item.price !== undefined && item.price !== null && (
                      <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#065f46' }}>
                        {formatPrice(item.price)}
                      </span>
                    )}
                    {item.location_area && (
                      <span style={{ ...styles.badge, backgroundColor: '#fef3c7', color: '#92400e' }}>
                        <SketchIcon d={ICONS.mapPin} size={10} color="#92400e" strokeWidth={2} />
                        {item.location_area}
                      </span>
                    )}
                    {item.relevance_score && item.relevance_score > 0.7 && (
                      <span style={{ ...styles.badge, backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                        High Match
                      </span>
                    )}
                  </div>
                </div>
                {item.images && item.images.length > 0 && (
                  <img src={item.images[0]} alt={item.title} style={styles.resultImage} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && !error && (
        <div style={styles.emptyState}>
          <p style={{ fontWeight: '600', color: '#0f172a', margin: '0 0 4px 0' }}>No results found for "{query}"</p>
          <p style={{ fontSize: '14px', margin: 0 }}>Try using different keywords or check your spelling</p>
        </div>
      )}

      {!query && !loading && results.length === 0 && (
        <div style={styles.card}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>
            💡 Try These Examples:
          </h3>
          <div style={styles.examples}>
            <button 
              onClick={() => performSearch('Ndikufuna plumber pafupi')} 
              style={styles.exampleBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              🔧 "Ndikufuna plumber pafupi" - Find nearby plumbers
            </button>
            <button 
              onClick={() => performSearch('chimanga chogulitsa')} 
              style={styles.exampleBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              🌾 "chimanga chogulitsa" - Find maize sellers
            </button>
            <button 
              onClick={() => performSearch('zomanga nyumba')} 
              style={styles.exampleBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              🏗️ "zomanga nyumba" - Building services
            </button>
            <button 
              onClick={() => performSearch('salon yatsitsi')} 
              style={styles.exampleBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            >
              💇 "salon yatsitsi" - Hair salons
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearch;