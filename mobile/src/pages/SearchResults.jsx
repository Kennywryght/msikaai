// mobile/src/pages/SearchResults.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { listingsAPI, messagesAPI } from '../services/api';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    close: "M18 6L6 18M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    arrowUpDown: "M7 15l5 5 5-5M7 9l5-5 5 5",
  };
  const d = icons[name] || icons.search;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

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
];

const SERVICE_KEYWORDS = ['plumber', 'electrician', 'carpenter', 'mechanic', 'tailor', 'hairdresser', 'service'];

const isServiceItem = (listing) => {
  const cat = (listing.category || '').toLowerCase();
  return SERVICE_KEYWORDS.some((kw) => cat.includes(kw));
};

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
  const [listings, setListings] = useState([]);
  const [recentSearches, setRecentSearches] = useState(['tomatoes', 'maize', 'plumber']);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [loading, setLoading] = useState(false);
  const [openingChatId, setOpeningChatId] = useState(null);
  const searchInputRef = useRef(null);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const performSearch = useCallback(async (query) => {
    setLoading(true);
    try {
      const res = await listingsAPI.search({ q: query, limit: 50 });
      setListings(res.data?.listings || []);
    } catch (err) {
      console.error('Search error:', err);
      setListings([]);
      showToast('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [location.search, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    navigate('/search-results', { replace: true });
    setListings([]);
    searchInputRef.current?.focus();
  };

  const handleRemoveRecentSearch = (query) => {
    setRecentSearches((prev) => prev.filter((q) => q !== query));
  };

  const handleResultClick = (item) => {
    navigate(`/listing/${item.id}`);
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

  const filteredListings = listings.filter((item) => {
    if (activeCategory === 'all') return true;
    const cat = (item.category || '').toLowerCase();
    return cat.includes(activeCategory.toLowerCase());
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (activeSort === 'price_low') return (Number(a.price) || 0) - (Number(b.price) || 0);
    if (activeSort === 'price_high') return (Number(b.price) || 0) - (Number(a.price) || 0);
    const at = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bt - at;
  });

  const goodsResults = sortedListings.filter((l) => !isServiceItem(l));
  const servicesResults = sortedListings.filter((l) => isServiceItem(l));
  const totalResults = sortedListings.length;
  const hasQuery = searchQuery.trim().length > 0;

  const renderCard = (item) => {
    const sellerUserId =
      item.businesses?.user_id ||
      item.businesses?.userId ||
      item.businesses?.owner_id || null;
    const canMessage = !!sellerUserId && sellerUserId !== user?.id;
    const image = item.images?.[0];

    return (
      <div key={item.id} className="result-card">
        <div className="result-content" onClick={() => handleResultClick(item)}>
          <div className="result-image">
            {image ? (
              <img src={image} alt={item.title} className="result-thumb" loading="lazy" />
            ) : (
              <Icon name="store" size={24} color="#CBD5E1" strokeWidth={1.5} />
            )}
          </div>
          <div className="result-info">
            <h4 className="result-title">{item.title}</h4>
            <div className="result-meta">
              <span className="result-vendor">
                <Icon name="store" size={10} color="#94A3B8" strokeWidth={1.75} />
                {item.businesses?.business_name || 'Local seller'}
              </span>
              {item.location_area && (
                <span className="result-distance">
                  <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                  {item.location_area}
                </span>
              )}
            </div>
            <div className="result-footer">
              <span className="result-price">{formatPrice(item.price)}</span>
              <div className="result-badges">
                {item.delivery_available && (
                  <span className="mini-badge delivery">
                    <Icon name="truck" size={10} color="#10B981" strokeWidth={2} />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {canMessage && (
          <button
            type="button"
            className="result-message-btn"
            onClick={(e) => handleMessage(e, item)}
            disabled={openingChatId === item.id}
          >
            <Icon name="message" size={13} color="#FFFFFF" strokeWidth={2} />
            {openingChatId === item.id ? 'Opening…' : 'Message'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="search-results">
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

        {hasQuery && (
          <div className="categories-scroll">
            {CATEGORIES.map((cat) => (
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

      <div className="main-content">
        {!hasQuery ? (
          <div className="discover-section">
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
                        navigate(`/search-results?q=${encodeURIComponent(query)}`, { replace: true });
                      }}
                    >
                      <Icon name="clock" size={14} color="#94A3B8" strokeWidth={1.75} />
                      <span className="recent-text">{query}</span>
                      <button
                        className="recent-remove"
                        onClick={(e) => { e.stopPropagation(); handleRemoveRecentSearch(query); }}
                      >
                        <Icon name="close" size={12} color="#94A3B8" strokeWidth={2} />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="trending-section">
              <div className="section-header">
                <h3 className="section-title">Trending Now</h3>
              </div>
              <div className="trending-tags">
                {['Fresh tomatoes', 'Maize flour', 'Plumber', 'Electrician', 'Chitenje fabric', 'Secondhand shoes'].map((tag, idx) => (
                  <button
                    key={idx}
                    className="trending-tag"
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/search-results?q=${encodeURIComponent(tag)}`, { replace: true });
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
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-card" />)}
          </div>
        ) : totalResults > 0 ? (
          <>
            <div className="results-toolbar">
              <span className="results-count">
                {totalResults} {totalResults === 1 ? 'result' : 'results'}
              </span>
              <div className="toolbar-actions">
                <button className="toolbar-btn" onClick={() => setShowSortMenu(!showSortMenu)}>
                  <Icon name="arrowUpDown" size={14} color="#64748B" strokeWidth={1.75} />
                  {SORT_OPTIONS.find((s) => s.id === activeSort)?.label}
                </button>
                <button className="toolbar-btn icon-only" onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                  <Icon name={viewMode === 'list' ? 'grid' : 'list'} size={16} color="#64748B" strokeWidth={1.75} />
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
            </div>

            {goodsResults.length > 0 && (
              <div className="result-section">
                <h3 className="result-section-title">Listings</h3>
                <div className={`results-list ${viewMode}`}>{goodsResults.map(renderCard)}</div>
              </div>
            )}

            {servicesResults.length > 0 && (
              <div className="result-section">
                <h3 className="result-section-title">Service Providers</h3>
                <div className={`results-list ${viewMode}`}>{servicesResults.map(renderCard)}</div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="search" size={40} color="#CBD5E1" strokeWidth={1.5} />
            </div>
            <h3 className="empty-title">No results found</h3>
            <p className="empty-text">We couldn't find anything for <strong>"{searchQuery}"</strong></p>
            <p className="empty-hint">Try a different search or browse categories</p>
            <button className="empty-btn" onClick={handleClearSearch}>Clear Search</button>
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
        .search-results { min-height: 100vh; background: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B; padding-bottom: 100px; }
        @media (min-width: 769px) { .search-results { padding-bottom: 40px; } }

        .search-header { background: #FFFFFF; border-bottom: 1px solid #F1F5F9; padding: 12px 16px; position: sticky; top: 0; z-index: 10; }
        .search-header-top { display: flex; align-items: center; gap: 10px; max-width: 900px; margin: 0 auto; }
        .back-btn { width: 40px; height: 40px; border-radius: 10px; border: none; background: #F8FAFC; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .back-btn:hover { background: #F1F5F9; }
        .search-form { flex: 1; min-width: 0; }
        .search-input-wrap { display: flex; align-items: center; gap: 10px; background: #F8FAFC; border: 1.5px solid #F1F5F9; border-radius: 12px; padding: 10px 14px; transition: all 0.2s; }
        .search-input-wrap:focus-within { background: #FFFFFF; border-color: #F59E0B; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06); }
        .search-input { flex: 1; border: none; outline: none; font-size: 14px; color: #1E293B; background: transparent; font-family: inherit; min-width: 0; }
        .search-input::placeholder { color: #94A3B8; }
        .clear-btn { width: 22px; height: 22px; border-radius: 50%; border: none; background: #E2E8F0; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .clear-btn:hover { background: #CBD5E1; }

        .categories-scroll { display: flex; gap: 6px; overflow-x: auto; padding: 12px 0 0; scrollbar-width: none; max-width: 900px; margin: 0 auto; }
        .categories-scroll::-webkit-scrollbar { display: none; }
        .category-chip { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 12px; font-weight: 500; color: #64748B; cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.2s; flex-shrink: 0; }
        .category-chip:hover { border-color: #94A3B8; }
        .category-chip.active { background: #1E293B; border-color: #1E293B; color: #FFFFFF; }
        .category-emoji { font-size: 13px; }

        .main-content { max-width: 900px; margin: 0 auto; padding: 16px; }

        .discover-section { display: flex; flex-direction: column; gap: 24px; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .section-title { font-size: 15px; font-weight: 700; color: #1E293B; margin: 0; display: flex; align-items: center; gap: 6px; }

        .recent-list { display: flex; flex-direction: column; gap: 2px; background: #FFFFFF; border-radius: 12px; border: 1px solid #F1F5F9; overflow: hidden; }
        .recent-item { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: none; background: transparent; cursor: pointer; font-family: inherit; text-align: left; border-bottom: 1px solid #F8FAFC; }
        .recent-item:last-child { border-bottom: none; }
        .recent-item:hover { background: #F8FAFC; }
        .recent-text { flex: 1; font-size: 14px; color: #1E293B; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .recent-remove { width: 24px; height: 24px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .recent-remove:hover { background: #F1F5F9; }

        .trending-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .trending-tag { padding: 8px 14px; border-radius: 20px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 13px; color: #475569; cursor: pointer; font-family: inherit; transition: all 0.2s; font-weight: 500; }
        .trending-tag:hover { border-color: #F59E0B; background: rgba(245, 158, 11, 0.04); color: #F59E0B; transform: translateY(-1px); }

        .loading-state { display: flex; flex-direction: column; gap: 10px; }
        .skeleton-card { height: 88px; background: #FFFFFF; border-radius: 12px; border: 1px solid #F1F5F9; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

        .results-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; position: relative; flex-wrap: wrap; gap: 8px; }
        .results-count { font-size: 13px; color: #94A3B8; font-weight: 500; }
        .toolbar-actions { display: flex; gap: 6px; }
        .toolbar-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 12px; font-weight: 500; color: #64748B; cursor: pointer; font-family: inherit; transition: all 0.2s; }
        .toolbar-btn:hover { border-color: #94A3B8; }
        .toolbar-btn.icon-only { padding: 6px 8px; }

        .sort-menu { position: absolute; top: calc(100% + 4px); right: 0; background: #FFFFFF; border: 1px solid #F1F5F9; border-radius: 12px; box-shadow: 0 8px 24px rgba(30, 41, 59, 0.12); min-width: 200px; padding: 6px; z-index: 20; animation: fadeIn 0.15s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .sort-item { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px 12px; border: none; background: transparent; font-size: 13px; color: #475569; cursor: pointer; font-family: inherit; text-align: left; border-radius: 8px; }
        .sort-item:hover { background: #F8FAFC; }
        .sort-item.active { color: #F59E0B; font-weight: 600; background: rgba(245, 158, 11, 0.06); }

        .result-section { margin-bottom: 24px; }
        .result-section-title { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 0.03em; }
        .results-list { display: flex; flex-direction: column; gap: 8px; }
        .results-list.grid { display: grid; grid-template-columns: repeat(2, 1fr); }
        @media (min-width: 640px) { .results-list.grid { grid-template-columns: repeat(3, 1fr); } }

        .result-card { display: flex; flex-direction: column; gap: 10px; padding: 12px; background: #FFFFFF; border-radius: 12px; border: 1px solid #F1F5F9; transition: all 0.2s; }
        .result-card:hover { border-color: #E2E8F0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
        .result-content { display: flex; gap: 12px; cursor: pointer; }
        .result-image { width: 72px; height: 72px; border-radius: 10px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
        .result-thumb { width: 100%; height: 100%; object-fit: cover; }
        .result-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .result-title { font-size: 14px; font-weight: 600; color: #1E293B; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .result-meta { display: flex; gap: 10px; font-size: 11px; color: #94A3B8; flex-wrap: wrap; }
        .result-vendor, .result-distance { display: flex; align-items: center; gap: 3px; }
        .result-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: auto; }
        .result-price { font-size: 14px; font-weight: 700; color: #10B981; }
        .result-badges { display: flex; gap: 4px; }
        .mini-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #1E293B; background: #F8FAFC; padding: 2px 6px; border-radius: 6px; }
        .mini-badge.delivery { background: rgba(16, 185, 129, 0.08); }

        .result-message-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 9px; background: #1E293B; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; color: #FFFFFF; font-family: inherit; cursor: pointer; transition: background 0.2s; }
        .result-message-btn:hover:not(:disabled) { background: #F59E0B; }
        .result-message-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .empty-state { text-align: center; padding: 60px 20px; background: #FFFFFF; border-radius: 14px; border: 1px solid #F1F5F9; }
        .empty-icon { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .empty-title { font-size: 17px; font-weight: 700; color: #1E293B; margin: 0 0 6px; }
        .empty-text { font-size: 14px; color: #64748B; margin: 0 0 4px; line-height: 1.5; }
        .empty-hint { font-size: 13px; color: #94A3B8; margin: 0 0 20px; }
        .empty-btn { padding: 10px 24px; background: #1E293B; border: none; border-radius: 10px; color: #FFFFFF; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .empty-btn:hover { background: #F59E0B; }

        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(12px); border-top: 1px solid rgba(226, 232, 240, 0.4); display: flex; justify-content: space-around; padding: 4px 0 8px; z-index: 100; }
        .nav-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; background: none; border: none; cursor: pointer; padding: 4px 8px; font-family: inherit; min-width: 44px; }
        .nav-icon-wrap { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .nav-icon-wrap.active { background: #1E293B; }
        .nav-label { font-size: 9px; font-weight: 500; color: #94A3B8; }
        .nav-label.active { color: #1E293B; font-weight: 600; }

        @media (max-width: 480px) {
          .search-header { padding: 10px 12px; }
          .main-content { padding: 12px; }
          .result-image { width: 64px; height: 64px; }
          .result-title { font-size: 13px; }
          .result-price { font-size: 13px; }
        }
        @media (max-width: 380px) {
          .result-image { width: 56px; height: 56px; }
          .toolbar-btn { font-size: 11px; padding: 5px 10px; }
          .results-list.grid { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-card, .sort-menu { animation: none; }
          .result-card, .trending-tag, .empty-btn { transition: none; }
        }
      `}</style>
    </div>
  );
};

export default SearchResults;