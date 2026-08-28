// mobile/src/pages/Search.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

// ==========================================
// BRAND COLORS
// ==========================================
const COLORS = {
  championBlue: '#151130',
  championBlueLight: '#2A2438',
  championBlueDark: '#0A081F',
  lavenderTonic: '#C8BEFA',
  lavenderLight: '#D8CFFF',
  lavenderDark: '#B8A8F0',
  white: '#FFFFFF',
  gray50: '#F8F7FA',
  gray100: '#EEECF5',
  gray200: '#DDD9EB',
  gray300: '#C5C0D6',
  gray400: '#9E97B3',
  gray500: '#787090',
  gray600: '#5C5470',
  gray700: '#3F384F',
  gray800: '#2A2438',
  gray900: '#151130',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
};

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
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  filter: "M3 6h18M6 12h12M10 18h4",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
};

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef(null);

  const categories = [
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      performSearch(0, q);
    }
    if (searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
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
    performSearch(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setResults([]);
    setTotalResults(0);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `MWK ${price.toLocaleString()}`;
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Searching..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: COLORS.gray50,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 'clamp(16px, 2vw, 24px) clamp(12px, 2vw, 16px)'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: COLORS.gray200,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      color: COLORS.gray700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '16px',
      transition: 'background-color 0.2s'
    },
    searchHeader: {
      backgroundColor: COLORS.white,
      padding: 'clamp(16px, 2vw, 20px)',
      borderRadius: '12px',
      border: '1px solid ' + COLORS.gray200,
      marginBottom: '20px'
    },
    searchRow: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      flexWrap: 'wrap'
    },
    searchInput: {
      flex: 1,
      padding: 'clamp(10px, 1vw, 12px) clamp(14px, 1.5vw, 16px)',
      border: '2px solid ' + COLORS.gray200,
      borderRadius: '8px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
      outline: 'none',
      backgroundColor: COLORS.white,
      color: COLORS.gray900,
      fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      minWidth: '180px'
    },
    filterToggle: {
      backgroundColor: COLORS.gray100,
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(12px, 1vw, 13px)',
      fontWeight: '500',
      color: COLORS.gray700,
      marginTop: '12px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    },
    filterRow: {
      marginTop: '16px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px'
    },
    filterGroup: {
      flex: 1,
      minWidth: 'clamp(120px, 30vw, 150px)'
    },
    filterLabel: {
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '600',
      color: COLORS.gray500,
      display: 'block',
      marginBottom: '4px'
    },
    filterSelect: {
      width: '100%',
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid ' + COLORS.gray300,
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: COLORS.gray900,
      backgroundColor: COLORS.white,
      fontFamily: 'inherit',
      outline: 'none'
    },
    filterInput: {
      width: '100%',
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid ' + COLORS.gray300,
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: COLORS.gray900,
      backgroundColor: COLORS.white,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      outline: 'none'
    },
    filterActions: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      flexWrap: 'wrap'
    },
    resultCount: {
      color: COLORS.gray500,
      marginBottom: '12px',
      fontSize: 'clamp(13px, 1.1vw, 14px)'
    },
    resultCard: {
      backgroundColor: COLORS.white,
      borderRadius: '12px',
      padding: 'clamp(14px, 1.5vw, 16px)',
      marginBottom: '12px',
      border: '1px solid ' + COLORS.gray200,
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      gap: '12px'
    },
    resultTitle: {
      fontSize: 'clamp(15px, 1.3vw, 16px)',
      fontWeight: '600',
      color: COLORS.gray900,
      margin: '0 0 2px 0'
    },
    resultBusiness: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: COLORS.gray500,
      margin: '0 0 8px 0'
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
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '500'
    },
    resultImage: {
      width: 'clamp(60px, 8vw, 80px)',
      height: 'clamp(60px, 8vw, 80px)',
      objectFit: 'cover',
      borderRadius: '8px',
      flexShrink: 0
    },
    emptyState: {
      textAlign: 'center',
      padding: 'clamp(32px, 4vw, 40px) clamp(16px, 2vw, 20px)',
      color: COLORS.gray500
    },
    shareSection: {
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid ' + COLORS.gray100
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        .search-input-focus:focus {
          border-color: ${COLORS.lavenderTonic};
          box-shadow: 0 0 0 3px rgba(200, 190, 250, 0.2);
        }
      `}</style>

      <button 
        onClick={() => navigate('/dashboard')} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.gray300}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.gray200}
      >
        <SketchIcon d={ICONS.arrowRight} size={16} color={COLORS.gray600} strokeWidth={2.5} />
        Back to Dashboard
      </button>

      <div style={styles.searchHeader}>
        <form onSubmit={handleSearch}>
          <div style={styles.searchRow}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              className="search-input-focus"
              autoComplete="off"
            />
            <PrimaryButton
              type="submit"
              variant="primary"
              size="md"
            >
              <SketchIcon d={ICONS.search} size={16} color={COLORS.championBlue} strokeWidth={2} />
              Search
            </PrimaryButton>
          </div>
        </form>

        <button onClick={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
          <SketchIcon d={ICONS.filter} size={14} color={COLORS.gray500} strokeWidth={2} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={styles.filterSelect}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Min Price (MWK)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="1000"
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Max Price (MWK)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="10000"
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterActions}>
              <PrimaryButton variant="success" size="sm" onClick={() => performSearch(0)}>
                Apply
              </PrimaryButton>
              <PrimaryButton variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      {results.length > 0 ? (
        <>
          <p style={styles.resultCount}>Found {totalResults} results</p>
          {results.map((listing) => (
            <div
              key={listing.id}
              style={styles.resultCard}
              onClick={() => navigate(`/listing/${listing.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(21, 17, 48, 0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.resultRow}>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.resultTitle}>{listing.title}</h3>
                  <p style={styles.resultBusiness}>{listing.businesses?.business_name || 'Unknown Business'}</p>
                  <div style={styles.badgeGroup}>
                    <span style={{ ...styles.badge, backgroundColor: '#EEECF5', color: COLORS.championBlue }}>
                      {listing.category}
                    </span>
                    {listing.price && (
                      <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#065f46' }}>
                        {formatPrice(listing.price)}
                      </span>
                    )}
                    {listing.price_type === 'negotiable' && (
                      <span style={{ ...styles.badge, backgroundColor: '#fef3c7', color: '#92400e' }}>
                        Negotiable
                      </span>
                    )}
                    {listing.location_area && (
                      <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
                        <SketchIcon d={ICONS.mapPin} size={10} color="#1e40af" strokeWidth={2} />
                        {listing.location_area}
                      </span>
                    )}
                  </div>
                </div>
                {listing.images && listing.images.length > 0 && (
                  <img src={listing.images[0]} alt={listing.title} style={styles.resultImage} loading="lazy" />
                )}
              </div>

              <div style={styles.shareSection}>
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
        </>
      ) : searchQuery || selectedCategory ? (
        <div style={styles.emptyState}>
          <p style={{ fontWeight: '600', color: COLORS.gray900, fontSize: 'clamp(16px, 1.6vw, 18px)' }}>No results found</p>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <SketchIcon d={ICONS.search} size={48} color={COLORS.gray400} strokeWidth={1.5} />
          <p style={{ marginTop: '12px', fontWeight: '600', color: COLORS.gray900, fontSize: 'clamp(16px, 1.6vw, 18px)' }}>
            Search for products and services
          </p>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Enter a search term above to get started</p>
        </div>
      )}
    </div>
  );
};

export default Search;