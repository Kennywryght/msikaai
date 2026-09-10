// mobile/src/pages/CategoryBrowse.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    filter: "M3 6h18M6 12h12M10 18h4",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    check: "M20 6L9 17l-5-5",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    arrowUpDown: "M7 15l5 5 5-5M7 9l5-5 5 5",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
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
// CATEGORY DATA
// ============================================================
const CATEGORY_DATA = {
  'farm-inputs': {
    name: 'Farm Inputs',
    emoji: '🌾',
    description: 'Seeds, fertilizers, tools and farm supplies',
    color: '#10B981',
    subCategories: ['Seeds', 'Fertilizer', 'Pesticides', 'Farm Tools', 'Livestock Feed'],
  },
  'food': {
    name: 'Food & Groceries',
    emoji: '🍲',
    description: 'Fresh produce, grains, and everyday essentials',
    color: '#F59E0B',
    subCategories: ['Vegetables', 'Fruits', 'Grains', 'Meat', 'Beverages'],
  },
  'clothing': {
    name: 'Clothing & Fashion',
    emoji: '👕',
    description: 'Clothes, shoes, and fabric',
    color: '#EC4899',
    subCategories: ['Men', 'Women', 'Kids', 'Shoes', 'Fabric'],
  },
  'construction': {
    name: 'Construction',
    emoji: '🏗️',
    description: 'Building materials and hardware',
    color: '#F97316',
    subCategories: ['Cement', 'Iron Sheets', 'Paint', 'Timber', 'Hardware'],
  },
  'electronics': {
    name: 'Electronics',
    emoji: '📱',
    description: 'Phones, appliances, and gadgets',
    color: '#3B82F6',
    subCategories: ['Phones', 'Audio', 'Home Appliances', 'Accessories'],
  },
  'services': {
    name: 'Services',
    emoji: '🔧',
    description: 'Skilled tradespeople and professionals',
    color: '#8B5CF6',
    subCategories: ['Plumber', 'Electrician', 'Carpenter', 'Tailor', 'Salon'],
  },
};

const LOCATIONS = [
  'All Areas',
  'Mitundu Trading Centre',
  'Bunda',
  'Chimbiri',
  'Motolosi',
  'Chingala',
  'Mlale',
];

const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
  { id: 'nearest', label: 'Nearest First' },
];

// ============================================================
// MOCK LISTINGS
// ============================================================
const MOCK_LISTINGS = [
  { id: 1, title: 'Fresh Tomatoes, basket', price: 650, vendor: 'Grace M.', image: '🍅', rating: 4.8, distance: '0.4 km', verified: true, delivery: true, location: 'Mitundu Trading Centre' },
  { id: 2, title: 'Maize, 50kg bag', price: 350, vendor: 'Peter K.', image: '🌽', rating: 4.5, distance: '0.8 km', verified: true, delivery: false, location: 'Bunda' },
  { id: 3, title: 'Onions, per kg', price: 800, vendor: 'Sarah M.', image: '🧅', rating: 4.2, distance: '0.6 km', verified: false, delivery: true, location: 'Chimbiri' },
  { id: 4, title: 'Fresh Cabbage, head', price: 400, vendor: 'Mary T.', image: '🥬', rating: 4.7, distance: '1.2 km', verified: true, delivery: false, location: 'Motolosi' },
  { id: 5, title: 'Potatoes, 10kg bag', price: 1200, vendor: 'James N.', image: '🥔', rating: 4.4, distance: '1.5 km', verified: true, delivery: true, location: 'Chingala' },
  { id: 6, title: 'Fresh Avocados, 6 pack', price: 900, vendor: 'Grace M.', image: '🥑', rating: 4.9, distance: '0.4 km', verified: true, delivery: true, location: 'Mitundu Trading Centre' },
  { id: 7, title: 'Green Beans, 1kg', price: 550, vendor: 'Peter K.', image: '🫛', rating: 4.3, distance: '0.8 km', verified: false, delivery: false, location: 'Bunda' },
  { id: 8, title: 'Sweet Potatoes, bunch', price: 700, vendor: 'Sarah M.', image: '🍠', rating: 4.6, distance: '0.6 km', verified: true, delivery: true, location: 'Chimbiri' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const CategoryBrowse = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Get category from URL or default
  const initialCategory = categoryId || 'food';
  const category = CATEGORY_DATA[initialCategory] || CATEGORY_DATA['food'];

  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [filteredListings, setFilteredListings] = useState(MOCK_LISTINGS);
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [activeSort, setActiveSort] = useState('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [likedItems, setLikedItems] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  
  const loadMoreRef = useRef(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter & sort listings
  useEffect(() => {
    let filtered = [...listings];

    // Filter by location
    if (selectedLocation !== 'All Areas') {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }

    // Sort
    switch (activeSort) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'nearest':
        filtered.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
      default:
        // recent — keep as is
        break;
    }

    setFilteredListings(filtered);
  }, [listings, activeSort, selectedLocation]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    setLoading(true);
    // Simulate loading more
    setTimeout(() => {
      const newListings = MOCK_LISTINGS.map(item => ({
        ...item,
        id: item.id + listings.length,
      }));
      setListings(prev => [...prev, ...newListings]);
      setPage(prev => prev + 1);
      setLoading(false);
      // Stop after 3 pages
      if (page >= 3) setHasMore(false);
    }, 600);
  };

  const handleLike = (e, itemId) => {
    e.stopPropagation();
    setLikedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleListingClick = (item) => {
    navigate(`/listing/${item.id}`);
  };

  const handleCategoryChange = (catId) => {
    navigate(`/category/${catId}`);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Refreshed!', 'success');
    }, 600);
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const formatPrice = (price) => `MK ${price.toLocaleString()}`;

  return (
    <div className="category-browse">
      {/* Header */}
      <div className="browse-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
          </button>
          <div className="header-actions">
            <button className="header-btn" onClick={handleRefresh}>
              <Icon name="refresh" size={18} color="#64748B" strokeWidth={1.75} />
            </button>
            <button 
              className="header-btn" 
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              <Icon name={viewMode === 'grid' ? 'list' : 'grid'} size={18} color="#64748B" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="header-content">
          <div 
            className="category-badge"
            style={{ background: `${category.color}15`, color: category.color }}
          >
            <span className="category-emoji">{category.emoji}</span>
            <span>{category.name}</span>
          </div>
          <h1 className="page-title">{category.name}</h1>
          <p className="page-subtitle">{category.description}</p>
        </div>

        {/* Category Pills */}
        <div className="category-pills">
          {Object.entries(CATEGORY_DATA).map(([id, cat]) => (
            <button
              key={id}
              className={`cat-pill ${id === initialCategory ? 'active' : ''}`}
              onClick={() => handleCategoryChange(id)}
              style={id === initialCategory ? { background: cat.color, borderColor: cat.color } : {}}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sub Categories */}
        {category.subCategories && (
          <div className="sub-categories">
            <button
              className={`sub-chip ${activeSubCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveSubCategory('all')}
            >
              All
            </button>
            {category.subCategories.map(sub => (
              <button
                key={sub}
                className={`sub-chip ${activeSubCategory === sub ? 'active' : ''}`}
                onClick={() => setActiveSubCategory(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="results-toolbar">
        <div className="results-info">
          <span className="results-count">
            {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="toolbar-actions">
          <button 
            className="toolbar-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter" size={14} color="#64748B" strokeWidth={1.75} />
            {selectedLocation !== 'All Areas' ? selectedLocation : 'Filters'}
          </button>
          <button 
            className="toolbar-btn"
            onClick={() => setShowSortMenu(!showSortMenu)}
          >
            <Icon name="arrowUpDown" size={14} color="#64748B" strokeWidth={1.75} />
            {SORT_OPTIONS.find(s => s.id === activeSort)?.label}
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

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <label className="filter-label">Location</label>
            <div className="filter-chips">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  className={`filter-chip ${selectedLocation === loc ? 'active' : ''}`}
                  onClick={() => setSelectedLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
            <div className="filter-actions">
              <button 
                className="filter-apply-btn"
                onClick={() => setShowFilters(false)}
              >
                Apply Filters
              </button>
              <button 
                className="filter-clear-btn"
                onClick={() => {
                  setSelectedLocation('All Areas');
                  setActiveSort('recent');
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      <div className="main-content">
        {filteredListings.length > 0 ? (
          <>
            <div className={`listings-grid ${viewMode}`}>
              {filteredListings.map(item => {
                const isLiked = likedItems[item.id] || false;
                return (
                  <div
                    key={item.id}
                    className="listing-card"
                    onClick={() => handleListingClick(item)}
                  >
                    <div className="listing-image">
                      <span className="listing-emoji">{item.image}</span>
                      {item.verified && (
                        <span className="verified-badge">
                          <Icon name="check" size={10} color="#FFFFFF" strokeWidth={3} />
                        </span>
                      )}
                      <button 
                        className="like-btn"
                        onClick={(e) => handleLike(e, item.id)}
                      >
                        <Icon 
                          name="heart" 
                          size={14} 
                          color={isLiked ? '#EF4444' : '#64748B'} 
                          strokeWidth={isLiked ? 2.5 : 1.5}
                          fill={isLiked ? '#EF4444' : 'none'}
                        />
                      </button>
                    </div>
                    <div className="listing-body">
                      <h3 className="listing-title">{item.title}</h3>
                      <div className="listing-vendor">
                        <Icon name="store" size={10} color="#94A3B8" strokeWidth={1.75} />
                        <span>{item.vendor}</span>
                      </div>
                      <div className="listing-footer">
                        <span className="listing-price">{formatPrice(item.price)}</span>
                        <div className="listing-badges">
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
                      <div className="listing-location">
                        <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                        <span>{item.distance}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {hasMore && (
              <div ref={loadMoreRef} className="load-more">
                {loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <span className="load-more-text">Scroll for more</span>
                )}
              </div>
            )}

            {!hasMore && (
              <div className="end-of-list">
                <span>You've seen all {filteredListings.length} listings</span>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="store" size={40} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-text">Try adjusting your filters or location</p>
            <button 
              className="empty-btn"
              onClick={() => {
                setSelectedLocation('All Areas');
                setActiveSubCategory('all');
              }}
            >
              Clear Filters
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
        .category-browse {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .category-browse {
            padding-bottom: 40px;
          }
        }

        /* ===== HEADER ===== */
        .browse-header {
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          padding: 14px 16px 16px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .header-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-btn:hover {
          background: #F1F5F9;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto 14px;
        }

        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .category-emoji {
          font-size: 14px;
        }

        .page-title {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
        }

        /* Category Pills */
        .category-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none;
          max-width: 1200px;
          margin: 0 auto 10px;
        }

        .category-pills::-webkit-scrollbar {
          display: none;
        }

        .cat-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .cat-pill:hover {
          border-color: #94A3B8;
        }

        .cat-pill.active {
          color: #FFFFFF;
        }

        /* Sub Categories */
        .sub-categories {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          max-width: 1200px;
          margin: 0 auto;
        }

        .sub-categories::-webkit-scrollbar {
          display: none;
        }

        .sub-chip {
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid #F1F5F9;
          background: #F8FAFC;
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          white-space: nowrap;
          font-family: inherit;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .sub-chip:hover {
          background: #F1F5F9;
        }

        .sub-chip.active {
          background: rgba(245, 158, 11, 0.08);
          border-color: #F59E0B;
          color: #F59E0B;
        }

        /* ===== TOOLBAR ===== */
        .results-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          flex-wrap: wrap;
          gap: 8px;
        }

        .results-info {
          flex: 1;
          min-width: 0;
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
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .toolbar-btn:hover {
          border-color: #94A3B8;
        }

        /* Sort Menu */
        .sort-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 16px;
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

        /* Filters Panel */
        .filters-panel {
          position: absolute;
          top: calc(100% + 4px);
          left: 16px;
          right: 16px;
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(30, 41, 59, 0.12);
          padding: 16px;
          z-index: 20;
          animation: fadeIn 0.15s ease-out;
        }

        .filter-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .filter-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 14px;
        }

        .filter-chip {
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .filter-chip:hover {
          border-color: #94A3B8;
        }

        .filter-chip.active {
          background: rgba(245, 158, 11, 0.08);
          border-color: #F59E0B;
          color: #F59E0B;
        }

        .filter-actions {
          display: flex;
          gap: 8px;
        }

        .filter-apply-btn {
          flex: 1;
          padding: 10px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .filter-apply-btn:hover {
          background: #F59E0B;
        }

        .filter-clear-btn {
          padding: 10px 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          color: #64748B;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .filter-clear-btn:hover {
          background: #F1F5F9;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        /* ===== GRID ===== */
        .listings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 480px) {
          .listings-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 768px) {
          .listings-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .listings-grid.list {
          grid-template-columns: 1fr;
        }

        /* ===== LISTING CARD ===== */
        .listing-card {
          background: #FFFFFF;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }

        .listing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          border-color: #E2E8F0;
        }

        .listings-grid.list .listing-card {
          flex-direction: row;
        }

        .listing-image {
          position: relative;
          width: 100%;
          height: 120px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .listings-grid.list .listing-image {
          width: 100px;
          height: auto;
          min-height: 100px;
        }

        .listing-emoji {
          font-size: 36px;
        }

        .listings-grid.list .listing-emoji {
          font-size: 32px;
        }

        .verified-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3B82F6;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
        }

        .like-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .like-btn:hover {
          transform: scale(1.1);
          background: #FFFFFF;
        }

        .listing-body {
          padding: 10px 12px 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }

        .listings-grid.list .listing-body {
          padding: 12px 14px;
        }

        .listing-title {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .listings-grid.list .listing-title {
          font-size: 14px;
        }

        .listing-vendor {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: #94A3B8;
          margin-bottom: 8px;
        }

        .listing-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
        }

        .listing-price {
          font-size: 14px;
          font-weight: 700;
          color: #10B981;
        }

        .listing-badges {
          display: flex;
          gap: 4px;
        }

        .mini-badge {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10px;
          font-weight: 600;
          color: #1E293B;
          background: #F8FAFC;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .mini-badge.delivery {
          background: rgba(16, 185, 129, 0.08);
        }

        .listing-location {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #94A3B8;
          margin-top: 6px;
        }

        .listings-grid.list .listing-location {
          font-size: 11px;
        }

        /* ===== LOAD MORE ===== */
        .load-more {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px 0;
          min-height: 60px;
        }

        .load-more-text {
          font-size: 13px;
          color: #94A3B8;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #E2E8F0;
          border-top-color: #F59E0B;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .end-of-list {
          text-align: center;
          padding: 24px 0;
        }

        .end-of-list span {
          font-size: 12px;
          color: #94A3B8;
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
          margin: 0 0 4px;
        }

        .empty-text {
          font-size: 14px;
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
          .browse-header {
            padding: 12px 12px 14px;
          }
          .results-toolbar {
            padding: 10px 12px;
          }
          .main-content {
            padding: 12px;
          }
          .page-title {
            font-size: 20px;
          }
          .listings-grid {
            gap: 8px;
          }
          .listing-image {
            height: 100px;
          }
          .listing-emoji {
            font-size: 30px;
          }
        }

        @media (max-width: 380px) {
          .listings-grid {
            grid-template-columns: 1fr;
          }
          .listing-image {
            height: 120px;
          }
          .toolbar-btn {
            padding: 5px 10px;
            font-size: 11px;
            max-width: 100px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sort-menu,
          .filters-panel {
            animation: none;
          }
          .listing-card,
          .toolbar-btn,
          .header-btn,
          .like-btn {
            transition: none;
          }
          .listing-card:hover,
          .like-btn:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryBrowse;