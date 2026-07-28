import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import SocialShare from '../components/SocialShare';

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
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2"
};

const Search = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

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

  const performSearch = async (page = 0) => {
    setLoading(true);

    try {
      const params = {
        limit: 20,
        offset: page * 20
      };

      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (minPrice) params.minPrice = parseFloat(minPrice);
      if (maxPrice) params.maxPrice = parseFloat(maxPrice);

      const response = await listingsAPI.search(params);
      setResults(response.data.listings || []);
      setTotalResults(response.data.total || 0);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
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
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `MWK ${price.toLocaleString()}`;
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#e2e8f0',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '16px'
    },
    searchHeader: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '20px'
    },
    searchRow: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    searchInput: {
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
      gap: '6px'
    },
    filterToggle: {
      backgroundColor: '#f1f5f9',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      color: '#334155',
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
      minWidth: '150px'
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      display: 'block',
      marginBottom: '4px'
    },
    filterSelect: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit'
    },
    filterInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      boxSizing: 'border-box'
    },
    filterActions: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: '8px'
    },
    applyBtn: {
      padding: '8px 16px',
      backgroundColor: '#16a34a',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600'
    },
    clearBtn: {
      padding: '8px 16px',
      backgroundColor: '#e2e8f0',
      color: '#334155',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500'
    },
    resultCount: {
      color: '#64748b',
      marginBottom: '12px',
      fontSize: '14px'
    },
    resultCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e2e8f0',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    resultRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start'
    },
    resultTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#0f172a',
      margin: '0 0 2px 0'
    },
    resultBusiness: {
      fontSize: '14px',
      color: '#64748b',
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
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: '#64748b'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#64748b'
    },
    shareSection: {
      marginTop: '8px',
      paddingTop: '8px',
      borderTop: '1px solid #f1f5f9'
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
        <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
        Back to Dashboard
      </button>

      <div style={styles.searchHeader}>
        <form onSubmit={handleSearch}>
          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchBtn}>
              <SketchIcon d={ICONS.search} size={16} color="#ffffff" strokeWidth={2} />
              Search
            </button>
          </div>
        </form>

        <button onClick={() => setShowFilters(!showFilters)} style={styles.filterToggle}>
          <SketchIcon d={ICONS.filter} size={14} color="#64748b" strokeWidth={2} />
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
              <button onClick={() => performSearch(0)} style={styles.applyBtn}>
                Apply
              </button>
              <button onClick={clearFilters} style={styles.clearBtn}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <SketchIcon d={ICONS.search} size={32} color="#94a3b8" strokeWidth={1.5} />
          <p>Searching...</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <p style={styles.resultCount}>Found {totalResults} results</p>
          {results.map((listing) => (
            <div
              key={listing.id}
              style={styles.resultCard}
              onClick={() => navigate(`/listing/${listing.id}`)}
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
                <div>
                  <h3 style={styles.resultTitle}>{listing.title}</h3>
                  <p style={styles.resultBusiness}>{listing.businesses?.business_name || 'Unknown Business'}</p>
                  <div style={styles.badgeGroup}>
                    <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
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
                  </div>
                </div>
                {listing.images && listing.images.length > 0 && (
                  <img src={listing.images[0]} alt={listing.title} style={styles.resultImage} />
                )}
              </div>

              {/* Share Section - New */}
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
          <p>No results found</p>
          <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <SketchIcon d={ICONS.search} size={48} color="#94a3b8" strokeWidth={1.5} />
          <p style={{ marginTop: '12px' }}>Search for products and services in Mitundu</p>
          <p style={{ fontSize: '14px' }}>Enter a search term above to get started</p>
        </div>
      )}
    </div>
  );
};

export default Search;