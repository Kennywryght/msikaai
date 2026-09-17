// mobile/src/pages/CategoryBrowse.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { listingsAPI, messagesAPI } from '../services/api';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    filter: "M3 6h18M6 12h12M10 18h4",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    check: "M20 6L9 17l-5-5",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    arrowUpDown: "M7 15l5 5 5-5M7 9l5-5 5 5",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
  };
  const d = icons[name] || icons.store;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

const CATEGORY_DATA = {
  'all':          { name: 'All listings', description: 'Everything in one place', emoji: '🏷️', color: '#1E293B' },
  'food':         { name: 'Food & Groceries', emoji: '🍲', description: 'Fresh produce, grains, and everyday essentials', color: '#F59E0B', dbMatch: ['food', 'groceries'] },
  'clothing':     { name: 'Clothing & Fashion', emoji: '👕', description: 'Clothes, shoes, and fabric', color: '#EC4899', dbMatch: ['clothing', 'fashion'] },
  'services':     { name: 'Services', emoji: '🔧', description: 'Skilled tradespeople and professionals', color: '#8B5CF6', dbMatch: ['services', 'service'] },
  'farm':         { name: 'Farm Inputs', emoji: '🌾', description: 'Seeds, fertilizers, tools and farm supplies', color: '#10B981', dbMatch: ['farm'] },
  'electronics':  { name: 'Electronics', emoji: '📱', description: 'Phones, appliances, and gadgets', color: '#3B82F6', dbMatch: ['electronics'] },
  'construction': { name: 'Construction', emoji: '🏗️', description: 'Building materials and hardware', color: '#F97316', dbMatch: ['construction'] },
  'hardware':     { name: 'Hardware', emoji: '🛠️', description: 'Tools and hardware supplies', color: '#6B7280', dbMatch: ['hardware'] },
};

const LOCATIONS = ['All Areas', 'Mitundu Trading Centre', 'Bunda', 'Chimbiri', 'Motolosi', 'Chingala', 'Mlale'];
const SORT_OPTIONS = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
];

const CategoryBrowse = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const initialCategory = categoryId || 'all';
  const category = CATEGORY_DATA[initialCategory] || CATEGORY_DATA['all'];

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [activeSort, setActiveSort] = useState('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [likedItems, setLikedItems] = useState({});
  const [openingChatId, setOpeningChatId] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listingsAPI.search({ limit: 60 });
      const items = res.data?.listings || [];
      const keywords = category.dbMatch || [];
      const filtered = keywords.length === 0
        ? items
        : items.filter((item) => {
            const cat = (item.category || '').toLowerCase();
            return keywords.some((kw) => cat.includes(kw));
          });
      setListings(filtered);
    } catch (err) {
      console.error('Fetch listings error:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, initialCategory]);

  const processedListings = useMemo(() => {
    let filtered = [...listings];
    if (selectedLocation !== 'All Areas') {
      filtered = filtered.filter((item) => item.location_area === selectedLocation);
    }
    switch (activeSort) {
      case 'price_low':
        return filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price_high':
        return filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      default:
        return filtered;
    }
  }, [listings, activeSort, selectedLocation]);

  const handleLike = (e, itemId) => {
    e.stopPropagation();
    setLikedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleMessage = useCallback(async (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to message the seller', 'warning');
      navigate('/login');
      return;
    }
    const sellerUserId =
      item?.businesses?.user_id ||
      item?.businesses?.userId ||
      item?.businesses?.owner_id || null;
    if (!sellerUserId) { showToast('Seller information is unavailable', 'error'); return; }
    if (sellerUserId === user.id) { showToast("You can't message yourself", 'warning'); return; }
    if (openingChatId === item.id) return;
    setOpeningChatId(item.id);

    try {
      const res = await messagesAPI.createConversation(sellerUserId, item.id);
      const conversationId = res?.data?.conversation?.id;
      if (!conversationId) throw new Error('Could not open conversation');
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Quick message error:', err);
      showToast(err?.response?.data?.error || 'Failed to open chat', 'error');
    } finally {
      setOpeningChatId(null);
    }
  }, [user, navigate, showToast, openingChatId]);

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'Price on request';
    return `MK ${Number(price).toLocaleString()}`;
  };

  return (
    <div className="category-browse">
      <div className="browse-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
          </button>
          <div className="header-actions">
            <button className="header-btn" onClick={fetchListings}>
              <Icon name="refresh" size={18} color="#64748B" strokeWidth={1.75} />
            </button>
            <button className="header-btn" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              <Icon name={viewMode === 'grid' ? 'list' : 'grid'} size={18} color="#64748B" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="header-content">
          <div className="category-badge" style={{ background: `${category.color}15`, color: category.color }}>
            <span className="category-emoji">{category.emoji}</span>
            <span>{category.name}</span>
          </div>
          <h1 className="page-title">{category.name}</h1>
          <p className="page-subtitle">{category.description}</p>
        </div>

        <div className="category-pills">
          {Object.entries(CATEGORY_DATA).map(([id, cat]) => (
            <button
              key={id}
              className={`cat-pill ${id === initialCategory ? 'active' : ''}`}
              onClick={() => navigate(`/category/${id}`)}
              style={id === initialCategory ? { background: cat.color, borderColor: cat.color } : {}}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="results-toolbar">
        <div className="results-info">
          <span className="results-count">
            {processedListings.length} {processedListings.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-btn" onClick={() => setShowFilters(!showFilters)}>
            <Icon name="filter" size={14} color="#64748B" strokeWidth={1.75} />
            {selectedLocation !== 'All Areas' ? selectedLocation : 'Filters'}
          </button>
          <button className="toolbar-btn" onClick={() => setShowSortMenu(!showSortMenu)}>
            <Icon name="arrowUpDown" size={14} color="#64748B" strokeWidth={1.75} />
            {SORT_OPTIONS.find((s) => s.id === activeSort)?.label}
          </button>
        </div>

        {showSortMenu && (
          <div className="sort-menu">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`sort-item ${activeSort === opt.id ? 'active' : ''}`}
                onClick={() => { setActiveSort(opt.id); setShowSortMenu(false); }}
              >
                {opt.label}
                {activeSort === opt.id && <Icon name="check" size={14} color="#F59E0B" strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        )}

        {showFilters && (
          <div className="filters-panel">
            <label className="filter-label">Location</label>
            <div className="filter-chips">
              {LOCATIONS.map((loc) => (
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
              <button className="filter-apply-btn" onClick={() => setShowFilters(false)}>Apply Filters</button>
              <button
                className="filter-clear-btn"
                onClick={() => { setSelectedLocation('All Areas'); setActiveSort('recent'); }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="main-content">
        {loading ? (
          <div className="loading-grid">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : processedListings.length > 0 ? (
          <div className={`listings-grid ${viewMode}`}>
            {processedListings.map((item) => {
              const isLiked = likedItems[item.id] || false;
              const image = item.images?.[0];
              const sellerUserId =
                item.businesses?.user_id ||
                item.businesses?.userId ||
                item.businesses?.owner_id || null;
              const canMessage = !!sellerUserId && sellerUserId !== user?.id;

              return (
                <div key={item.id} className="listing-card" onClick={() => navigate(`/listing/${item.id}`)}>
                  <div className="listing-image">
                    {image ? (
                      <img src={image} alt={item.title} className="listing-img" loading="lazy" />
                    ) : (
                      <Icon name="store" size={28} color="#CBD5E1" strokeWidth={1.5} />
                    )}
                    <button className="like-btn" onClick={(e) => handleLike(e, item.id)}>
                      <Icon name="heart" size={14}
                        color={isLiked ? '#EF4444' : '#64748B'}
                        strokeWidth={isLiked ? 2.5 : 1.5}
                        fill={isLiked ? '#EF4444' : 'none'} />
                    </button>
                  </div>
                  <div className="listing-body">
                    <h3 className="listing-title">{item.title}</h3>
                    <div className="listing-vendor">
                      <Icon name="store" size={10} color="#94A3B8" strokeWidth={1.75} />
                      <span>{item.businesses?.business_name || 'Local seller'}</span>
                    </div>
                    <div className="listing-footer">
                      <span className="listing-price">{formatPrice(item.price)}</span>
                      <div className="listing-badges">
                        {item.delivery_available && (
                          <span className="mini-badge delivery">
                            <Icon name="truck" size={10} color="#10B981" strokeWidth={2} />
                          </span>
                        )}
                      </div>
                    </div>
                    {item.location_area && (
                      <div className="listing-location">
                        <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                        <span>{item.location_area}</span>
                      </div>
                    )}
                    {canMessage && (
                      <button
                        type="button"
                        className="listing-message-btn"
                        onClick={(e) => handleMessage(e, item)}
                        disabled={openingChatId === item.id}
                      >
                        <Icon name="message" size={12} color="#FFFFFF" strokeWidth={2} />
                        {openingChatId === item.id ? 'Opening…' : 'Message'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="store" size={40} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-text">Try a different category or location</p>
            <button
              className="empty-btn"
              onClick={() => setSelectedLocation('All Areas')}
            >
              Clear Filters
            </button>
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
        .category-browse { min-height: 100vh; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B; padding-bottom: 100px; }
        @media (min-width: 769px) { .category-browse { padding-bottom: 40px; } }

        .browse-header { background: #FFFFFF; border-bottom: 1px solid #F1F5F9; padding: 14px 16px 16px; position: sticky; top: 0; z-index: 10; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; max-width: 1200px; margin-left: auto; margin-right: auto; }
        .header-actions { display: flex; gap: 8px; }
        .header-btn { width: 38px; height: 38px; border-radius: 10px; border: none; background: #F8FAFC; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .header-btn:hover { background: #F1F5F9; }
        .header-content { max-width: 1200px; margin: 0 auto 14px; }
        .category-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
        .category-emoji { font-size: 14px; }
        .page-title { font-size: clamp(22px, 3vw, 28px); font-weight: 700; color: #1E293B; margin: 0 0 4px; letter-spacing: -0.5px; }
        .page-subtitle { font-size: 13px; color: #94A3B8; margin: 0; }

        .category-pills { display: flex; gap: 6px; overflow-x: auto; padding: 4px 0; scrollbar-width: none; max-width: 1200px; margin: 0 auto; }
        .category-pills::-webkit-scrollbar { display: none; }
        .cat-pill { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 20px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 12px; font-weight: 500; color: #475569; cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.2s; flex-shrink: 0; }
        .cat-pill:hover { border-color: #94A3B8; }
        .cat-pill.active { color: #FFFFFF; }

        .results-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #FFFFFF; border-bottom: 1px solid #F1F5F9; max-width: 1200px; margin: 0 auto; position: relative; flex-wrap: wrap; gap: 8px; }
        .results-info { flex: 1; min-width: 0; }
        .results-count { font-size: 13px; color: #94A3B8; font-weight: 500; }
        .toolbar-actions { display: flex; gap: 6px; }
        .toolbar-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 12px; font-weight: 500; color: #64748B; cursor: pointer; font-family: inherit; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .toolbar-btn:hover { border-color: #94A3B8; }

        .sort-menu { position: absolute; top: calc(100% + 4px); right: 16px; background: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 12px; box-shadow: 0 8px 24px rgba(30, 41, 59, 0.12); min-width: 200px; padding: 6px; z-index: 20; }
        .sort-item { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 12px; border: none; background: transparent; font-size: 13px; color: #475569; cursor: pointer; font-family: inherit; text-align: left; border-radius: 8px; }
        .sort-item:hover { background: #F8FAFC; }
        .sort-item.active { color: #F59E0B; font-weight: 600; background: rgba(245, 158, 11, 0.06); }

        .filters-panel { position: absolute; top: calc(100% + 4px); left: 16px; right: 16px; background: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 12px; box-shadow: 0 8px 24px rgba(30, 41, 59, 0.12); padding: 16px; z-index: 20; }
        .filter-label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 8px; }
        .filter-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .filter-chip { padding: 6px 12px; border-radius: 20px; border: 1px solid #E2E8F0; background: #F8FAFC; font-size: 12px; font-weight: 500; color: #64748B; cursor: pointer; font-family: inherit; }
        .filter-chip:hover { border-color: #94A3B8; }
        .filter-chip.active { background: rgba(245, 158, 11, 0.08); border-color: #F59E0B; color: #F59E0B; }
        .filter-actions { display: flex; gap: 8px; }
        .filter-apply-btn { flex: 1; padding: 10px; background: #1E293B; border: none; border-radius: 10px; color: #FFFFFF; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .filter-apply-btn:hover { background: #F59E0B; }
        .filter-clear-btn { padding: 10px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; color: #64748B; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .filter-clear-btn:hover { background: #F1F5F9; }

        .main-content { max-width: 1200px; margin: 0 auto; padding: 16px; }

        .loading-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .skeleton-card { aspect-ratio: 4 / 5; background: #E2E8F0; border-radius: 12px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .listings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 480px) { .listings-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 768px) { .listings-grid { grid-template-columns: repeat(4, 1fr); } }
        .listings-grid.list { grid-template-columns: 1fr; }

        .listing-card { background: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #F1F5F9; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; }
        .listing-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); border-color: #E2E8F0; }
        .listings-grid.list .listing-card { flex-direction: row; }

        .listing-image { position: relative; width: 100%; height: 120px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .listings-grid.list .listing-image { width: 100px; height: auto; min-height: 100px; }
        .listing-img { width: 100%; height: 100%; object-fit: cover; }

        .like-btn { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; border-radius: 50%; border: none; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px); cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); transition: all 0.2s; }
        .like-btn:hover { transform: scale(1.1); background: #FFFFFF; }

        .listing-body { padding: 10px 12px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .listings-grid.list .listing-body { padding: 12px 14px; }
        .listing-title { font-size: 13px; font-weight: 600; color: #1E293B; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .listing-vendor { display: flex; align-items: center; gap: 3px; font-size: 11px; color: #94A3B8; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .listing-footer { display: flex; justify-content: space-between; align-items: center; gap: 6px; padding-top: 6px; border-top: 1px solid #F1F5F9; margin-top: auto; }
        .listing-price { font-size: 14px; font-weight: 700; color: #10B981; }
        .listing-badges { display: flex; gap: 4px; }
        .mini-badge { display: inline-flex; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #1E293B; background: #F8FAFC; padding: 2px 6px; border-radius: 6px; }
        .mini-badge.delivery { background: rgba(16, 185, 129, 0.08); }

        .listing-location { display: flex; align-items: center; gap: 3px; font-size: 10px; color: #94A3B8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .listings-grid.list .listing-location { font-size: 11px; }

        .listing-message-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: 100%; padding: 8px 10px; margin-top: 6px; background: #1E293B; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; color: #FFFFFF; font-family: inherit; cursor: pointer; transition: background 0.2s; }
        .listing-message-btn:hover:not(:disabled) { background: #F59E0B; }
        .listing-message-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .empty-state { text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: 14px; border: 1px solid #F1F5F9; }
        .empty-icon { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .empty-title { font-size: 17px; font-weight: 700; color: #1E293B; margin: 0 0 4px; }
        .empty-text { font-size: 14px; color: #94A3B8; margin: 0 0 20px; }
        .empty-btn { padding: 10px 24px; background: #1E293B; border: none; border-radius: 10px; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .empty-btn:hover { background: #F59E0B; }

        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(12px); border-top: 1px solid rgba(226, 232, 240, 0.4); display: flex; justify-content: space-around; padding: 4px 0 8px; z-index: 100; }
        .nav-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; padding: 4px 8px; font-family: inherit; min-width: 44px; }
        .nav-icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .nav-icon-wrap.active { background: #1E293B; }
        .nav-label { font-size: 9px; font-weight: 500; color: #94A3B8; }
        .nav-label.active { color: #1E293B; font-weight: 600; }

        @media (max-width: 480px) {
          .browse-header { padding: 12px 12px 14px; }
          .results-toolbar { padding: 10px 12px; }
          .main-content { padding: 12px; }
          .page-title { font-size: 20px; }
          .listings-grid { gap: 8px; }
          .listing-image { height: 100px; }
        }
        @media (max-width: 380px) {
          .listings-grid { grid-template-columns: 1fr; }
          .toolbar-btn { padding: 5px 10px; font-size: 11px; max-width: 100px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sort-menu, .filters-panel { animation: none; }
          .listing-card, .toolbar-btn, .header-btn, .like-btn, .listing-message-btn { transition: none; }
          .listing-card:hover, .like-btn:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default CategoryBrowse;