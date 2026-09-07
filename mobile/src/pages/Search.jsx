// mobile/src/pages/Search.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

// ============================================
// PREMIUM FEATHER ICONS
// ============================================
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  filter: "M3 6h18M6 12h12M10 18h4",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
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
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 'clamp(16px, 2vw, 24px) clamp(12px, 2vw, 16px)',
      paddingTop: 'clamp(72px, 10vh, 80px)',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      color: '#64748B',
      marginBottom: '12px',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    },
    searchHeader: {
      background: '#FFFFFF',
      padding: 'clamp(16px, 2vw, 20px)',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      marginBottom: '16px',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
    },
    searchRow: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    searchInput: {
      flex: 1,
      padding: 'clamp(10px, 1vw, 12px) clamp(14px, 1.5vw, 16px)',
      border: '2px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
      outline: 'none',
      background: '#FFFFFF',
      color: '#1E293B',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      minWidth: '160px',
    },
    filterToggle: {
      background: '#F8FAFC',
      border: 'none',
      padding: '6px 14px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(12px, 1vw, 13px)',
      fontWeight: '500',
      color: '#64748B',
      marginTop: '10px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    },
    filterRow: {
      marginTop: '14px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
    },
    filterGroup: {
      flex: 1,
      minWidth: 'clamp(120px, 30vw, 150px)',
    },
    filterLabel: {
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '600',
      color: '#94A3B8',
      display: 'block',
      marginBottom: '4px',
    },
    filterSelect: {
      width: '100%',
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#1E293B',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      outline: 'none',
    },
    filterInput: {
      width: '100%',
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#1E293B',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      outline: 'none',
    },
    filterActions: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px',
      flexWrap: 'wrap',
    },
    resultCount: {
      color: '#94A3B8',
      marginBottom: '12px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
    },
    resultCard: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: 'clamp(14px, 1.5vw, 16px)',
      marginBottom: '10px',
      border: '1px solid #E2E8F0',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 8px rgba(30,41,59,0.02)',
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '12px',
    },
    resultTitle: {
      fontSize: 'clamp(15px, 1.3vw, 16px)',
      fontWeight: '600',
      color: '#1E293B',
      margin: '0 0 2px 0',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    resultBusiness: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#94A3B8',
      margin: '0 0 6px 0',
    },
    badgeGroup: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
    },
    badge: {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '500',
    },
    resultImage: {
      width: 'clamp(60px, 8vw, 80px)',
      height: 'clamp(60px, 8vw, 80px)',
      objectFit: 'cover',
      borderRadius: '8px',
      flexShrink: 0,
    },
    emptyState: {
      textAlign: 'center',
      padding: 'clamp(32px, 4vw, 48px) 20px',
      color: '#94A3B8',
    },
    shareSection: {
      marginTop: '6px',
      paddingTop: '6px',
      borderTop: '1px solid #F1F5F9',
    },
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => navigate('/dashboard')} 
        style={styles.backButton}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
      >
        <Icon d={ICONS.arrowLeft} size={16} color="#64748B" strokeWidth={1.75} />
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
              onFocus={(e) => { e.currentTarget.style.borderColor = '#F59E0B'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
            />
            <PrimaryButton
              type="submit"
              variant="primary"
              size="md"
            >
              <Icon d={ICONS.search} size={16} color="#FFFFFF" strokeWidth={1.75} />
              Search
            </PrimaryButton>
          </div>
        </form>

        <button 
          onClick={() => setShowFilters(!showFilters)} 
          style={styles.filterToggle}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
        >
          <Icon d={ICONS.filter} size={14} color="#64748B" strokeWidth={1.75} />
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
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,41,59,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,41,59,0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.resultRow}>
                <div style={{ flex: 1 }}>
                  <h3 style={styles.resultTitle}>{listing.title}</h3>
                  <p style={styles.resultBusiness}>{listing.businesses?.business_name || 'Unknown Business'}</p>
                  <div style={styles.badgeGroup}>
                    <span style={{ ...styles.badge, background: '#EDE9F5', color: '#1E293B' }}>
                      {listing.category}
                    </span>
                    {listing.price && (
                      <span style={{ ...styles.badge, background: '#D1FAE5', color: '#065F46' }}>
                        {formatPrice(listing.price)}
                      </span>
                    )}
                    {listing.price_type === 'negotiable' && (
                      <span style={{ ...styles.badge, background: '#FEF3C7', color: '#92400E' }}>
                        Negotiable
                      </span>
                    )}
                    {listing.location_area && (
                      <span style={{ ...styles.badge, background: '#DBEAFE', color: '#1E40AF' }}>
                        <Icon d={ICONS.mapPin} size={10} color="#1E40AF" strokeWidth={1.75} />
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
          <p style={{ fontWeight: '600', color: '#1E293B', fontSize: 'clamp(16px, 1.6vw, 18px)' }}>No results found</p>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <Icon d={ICONS.search} size={48} color="#94A3B8" strokeWidth={1.5} />
          <p style={{ marginTop: '12px', fontWeight: '600', color: '#1E293B', fontSize: 'clamp(16px, 1.6vw, 18px)' }}>
            Search for products and services
          </p>
          <p style={{ fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Enter a search term above to get started</p>
        </div>
      )}
    </div>
  );
};

export default Search;