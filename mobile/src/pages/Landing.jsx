// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, notificationsAPI, messagesAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 18L18 6M6 6l12 12",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    check: "M20 6L9 17l-5-5",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
    hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
    wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
    shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
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

// ============================================================
// CATEGORIES
// ============================================================
const CATEGORIES = [
  { label: 'All', icon: 'layers', color: '#E8A33D' },
  { label: 'Food', icon: 'coffee', color: '#C9603C' },
  { label: 'Clothing', icon: 'shirt', color: '#8B5A83' },
  { label: 'Services', icon: 'wrench', color: '#3E5C76' },
  { label: 'Farm Inputs', icon: 'wheat', color: '#5B7B5E' },
  { label: 'Hardware', icon: 'hammer', color: '#6B7280' },
];

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;
const ASPECT_RATIOS = ['4 / 5', '4 / 6.6', '4 / 4.2', '4 / 5.8'];

// ============================================================
// MAIN COMPONENT
// ============================================================
const Landing = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { success, showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [likedItems, setLikedItems] = useState({});
  const [activeTab, setActiveTab] = useState('all');
  const [openingChatId, setOpeningChatId] = useState(null);

  const searchInputRef = useRef(null);
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLike = (itemId) => {
    setLikedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuickMessage = useCallback(
    async (e, item) => {
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
        item?.businesses?.owner_id ||
        null;

      if (!sellerUserId) {
        showToast('Seller information is unavailable', 'error');
        return;
      }
      if (sellerUserId === user.id) {
        showToast("You can't message yourself about your own listing", 'warning');
        return;
      }
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
    },
    [user, navigate, showToast, openingChatId]
  );

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, bizRes] = await Promise.all([
          listingsAPI.search({ limit: 50 }).catch(() => ({ data: { listings: [] } })),
          businessAPI.getAll({ limit: 20 }).catch(() => ({ data: { businesses: [] } })),
        ]);

        if (!mounted) return;

        let listingsData = listingsRes.data?.listings || [];
        const businessesData = bizRes.data?.businesses || [];

        if (listingsData.length === 0 && businessesData.length > 0) {
          listingsData = businessesData.map((b) => ({
            id: `biz-${b.id}`,
            title: b.business_name,
            description: b.description || '',
            category: b.category,
            price: null,
            images: b.logo_url ? [b.logo_url] : [],
            businesses: { business_name: b.business_name, id: b.id, user_id: b.user_id },
            created_at: b.created_at,
            is_business: true,
            location_area: b.location_text || '',
            delivery_available: b.delivery_available || false,
            business_id: b.id,
          }));
        }

        if (mounted) {
          setAllListings(listingsData);
          setFeaturedBusinesses(businessesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (mounted) setAllListings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const isService = (item) => {
      const serviceCategories = ['Plumber', 'Electrician', 'Carpenter', 'Mechanic', 'Tailor', 'Hairdresser', 'Services'];
      return serviceCategories.some((cat) => item.category?.toLowerCase().includes(cat.toLowerCase()));
    };

    return allListings.filter((item) => {
      const categoryMatch = selectedCategory === 'All' || item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const searchMatch = !query ||
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.businesses?.business_name?.toLowerCase().includes(query);

      let tabMatch = true;
      if (activeTab === 'goods') tabMatch = !isService(item);
      else if (activeTab === 'services') tabMatch = isService(item);

      return categoryMatch && searchMatch && tabMatch;
    });
  }, [allListings, selectedCategory, searchQuery, activeTab]);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    },
    [searchQuery, navigate]
  );

  const handleListingClick = useCallback(
    (item) => {
      if (item.is_business) navigate(`/search?q=${encodeURIComponent(item.title)}`);
      else navigate(`/listing/${item.id}`);
    },
    [navigate]
  );

  const handleBusinessClick = useCallback(
    (business) => navigate(`/search?q=${encodeURIComponent(business.business_name)}`),
    [navigate]
  );

  const formatPrice = useCallback((price) => {
    if (!price) return 'Price on request';
    return `MK ${Number(price).toLocaleString()}`;
  }, []);

  const isRecent = useCallback((item) => {
    if (!item.created_at) return false;
    return Date.now() - new Date(item.created_at).getTime() < NEW_WINDOW_MS;
  }, []);

  const getAspect = useCallback((index) => ASPECT_RATIOS[index % ASPECT_RATIOS.length], []);

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
        <div className="skeleton-hero" />
        <div className="skeleton-categories">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton-chip" />)}
        </div>
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton-card" />)}
        </div>
        <style jsx>{`
          .loading-skeleton { min-height: 100vh; background: #fbf8f2; padding-bottom: 80px; }
          .skeleton-hero { height: 150px; background: linear-gradient(135deg, #244f43, #1c2b26); margin-bottom: 24px; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-categories { display: flex; gap: 16px; padding: 0 16px; margin-bottom: 16px; }
          .skeleton-chip { width: 48px; height: 48px; border-radius: 50%; background: #e7e2d4; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 16px; }
          .skeleton-card { aspect-ratio: 4 / 5; background: #e7e2d4; border-radius: 16px; animation: pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="hero-block">
        <div className="hero-inner">
          <h1 className="hero-title">
            Find what you need,
            <br />
            <span className="hero-highlight">right here.</span>
          </h1>
          <p className="hero-desc">Local products, services, and tradespeople in Mitundu</p>
        </div>
      </div>

      <div className="search-card-wrap">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-wrapper">
            <Icon name="search" size={18} color="#8A9A93" strokeWidth={1.75} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Mitundu marketplace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">
              <Icon name="search" size={16} color="#FBF8F2" strokeWidth={2} />
            </button>
          </div>
        </form>
      </div>

      <div className="categories-section">
        <div className="categories-scroll">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button key={cat.label} className="category-chip" onClick={() => setSelectedCategory(cat.label)}>
                <span className="category-circle" style={{ background: active ? cat.color : `${cat.color}1F` }}>
                  <Icon name={cat.icon} size={17} color={active ? '#FBF8F2' : cat.color} strokeWidth={1.75} />
                </span>
                <span className="category-label" style={{ color: active ? cat.color : '#6B7A73' }}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tabs-section">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
        <button className={`tab-btn ${activeTab === 'goods' ? 'active' : ''}`} onClick={() => setActiveTab('goods')}>Goods</button>
        <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button>
      </div>

      {featuredBusinesses.length > 0 && (
        <div className="featured-section">
          <h2 className="featured-title">Businesses near you</h2>
          <div className="featured-scroll">
            {featuredBusinesses.map((biz) => (
              <button key={biz.id} className="featured-card" onClick={() => handleBusinessClick(biz)}>
                <div className="featured-logo">
                  {biz.logo_url ? (
                    <img src={biz.logo_url} alt={biz.business_name} />
                  ) : (
                    <Icon name="store" size={18} color="#C7BFA8" strokeWidth={1.5} />
                  )}
                </div>
                <div className="featured-name">{biz.business_name}</div>
                {biz.category && <div className="featured-cat">{biz.category}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      <section className="listings">
        <div className="listings-header">
          <div className="listings-header-left">
            <h2 className="listings-title">Recent</h2>
            <span className="listings-count">{filteredListings.length}</span>
          </div>
          <button className="filter-btn" onClick={() => {}}>
            <Icon name="filter" size={16} color="#6B7A73" strokeWidth={1.75} />
          </button>
        </div>

        {filteredListings.length > 0 ? (
          <div className="listings-grid">
            {filteredListings.map((item, index) => {
              const isLiked = likedItems[item.id] || false;
              const realLikeCount = item.likes ?? 0;
              const isBusiness = item.is_business || !!item.business_id;

              const sellerUserId =
                item.businesses?.user_id ||
                item.businesses?.userId ||
                item.businesses?.owner_id ||
                null;
              const canMessage = !!sellerUserId && sellerUserId !== user?.id;

              return (
                <div key={item.id} className="feed-card" onClick={() => handleListingClick(item)}>
                  <div className="feed-image" style={{ aspectRatio: getAspect(index) }}>
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="feed-img" loading="lazy" />
                    ) : (
                      <div className="feed-placeholder">
                        <Icon name="store" size={28} color="#C7BFA8" strokeWidth={1.5} />
                      </div>
                    )}

                    <div className="badge-row">
                      <div className="badge-row-left">
                        {isRecent(item) && <span className="badge feed-new">New</span>}
                      </div>
                      <div className="badge-row-right">
                        {item.delivery_available && (
                          <span className="badge feed-delivery">
                            <Icon name="truck" size={10} color="#FBF8F2" strokeWidth={2} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="feed-content">
                    <h3 className="feed-title">{item.title}</h3>

                    <div className="feed-price-row">
                      <span className="feed-price">{formatPrice(item.price)}</span>
                      {item.rating != null && item.rating > 0 && (
                        <span className="feed-rating">
                          <Icon name="star" size={11} color="#E8A33D" strokeWidth={2} />
                          {Number(item.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="feed-meta-row">
                      {isBusiness && <span className="business-tag">Business</span>}
                      <span className="feed-seller-text">
                        {item.businesses?.business_name || 'Local seller'}
                      </span>
                      {item.location_area && (
                        <>
                          <span className="feed-dot" />
                          <span className="feed-location-text">{item.location_area}</span>
                        </>
                      )}
                    </div>

                    <div className="feed-footer">
                      <button
                        className="like-btn"
                        onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                      >
                        <Icon name="heart" size={13}
                          color={isLiked ? '#EF4444' : '#8A9A93'}
                          strokeWidth={isLiked ? 2.5 : 1.5} />
                        <span>{realLikeCount + (isLiked ? 1 : 0)}</span>
                      </button>
                    </div>

                    {canMessage && (
                      <button
                        type="button"
                        className="feed-message-btn"
                        onClick={(e) => handleQuickMessage(e, item)}
                        disabled={openingChatId === item.id}
                      >
                        <Icon name="message" size={13} color="#FBF8F2" strokeWidth={2} />
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
            <Icon name="store" size={48} color="#C7BFA8" strokeWidth={1.5} />
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-desc">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your filters'
                : 'Be the first to post something!'}
            </p>
          </div>
        )}
      </section>

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
                  <Icon name={item.icon} size={20} color={active ? '#FBF8F2' : '#8A9A93'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&display=swap');

        .app {
          min-height: 100vh;
          background: #fbf8f2;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #16231f;
          padding-bottom: 80px;
        }
        @media (min-width: 769px) { .app { padding-bottom: 0; } }

        .hero-block { background: linear-gradient(135deg, #244f43 0%, #16231f 100%); padding: 30px 16px 56px; }
        .hero-inner { max-width: 1200px; margin: 0 auto; }
        .hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600;
          font-size: clamp(26px, 4vw, 38px);
          letter-spacing: -0.01em;
          margin: 0 0 8px;
          line-height: 1.15;
          color: #fbf8f2;
        }
        .hero-highlight { color: #e8a33d; }
        .hero-desc { font-size: 14px; color: rgba(251, 248, 242, 0.72); margin: 0; }

        .search-card-wrap { max-width: 1200px; margin: -30px auto 0; padding: 0 16px; position: relative; }
        .search-form { max-width: 560px; }
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #ffffff; border-radius: 14px;
          padding: 6px 6px 6px 16px;
          box-shadow: 0 14px 30px rgba(22, 35, 31, 0.2);
          border: 2px solid transparent; transition: all 0.2s;
        }
        .search-wrapper:focus-within { border-color: #e8a33d; }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 11px 0; font-size: 15px; font-family: inherit; color: #16231f;
        }
        .search-input::placeholder { color: #8a9a93; }
        .search-btn {
          padding: 9px 15px; background: #16231f; border: none;
          border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .search-btn:hover { background: #e8a33d; }

        .categories-section { padding: 22px 16px 8px; background: #fbf8f2; }
        .categories-scroll { display: flex; gap: 18px; overflow-x: auto; scrollbar-width: none; }
        .categories-scroll::-webkit-scrollbar { display: none; }
        .category-chip {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; background: none; border: none;
          cursor: pointer; font-family: inherit; flex-shrink: 0;
        }
        .category-circle {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .category-label { font-size: 11px; font-weight: 600; white-space: nowrap; transition: color 0.2s; }

        .tabs-section { display: flex; gap: 8px; padding: 10px 16px 14px; background: #fbf8f2; }
        .tab-btn {
          padding: 7px 16px; border-radius: 20px;
          border: 1.5px solid #e7e2d4; background: transparent;
          font-size: 13px; font-weight: 600; color: #6b7a73;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .tab-btn:hover { border-color: #e8a33d; }
        .tab-btn.active { background: #16231f; border-color: #16231f; color: #fbf8f2; }

        .featured-section { padding: 6px 16px 18px; background: #fbf8f2; }
        .featured-title { font-size: 13px; font-weight: 700; margin: 0 0 10px; color: #16231f; }
        .featured-scroll { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
        .featured-scroll::-webkit-scrollbar { display: none; }
        .featured-card {
          flex: 0 0 auto; width: 104px; background: #ffffff;
          border: 1px solid #eee7d6; border-radius: 14px;
          padding: 10px 8px; text-align: center;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .featured-card:hover { border-color: #e8a33d; }
        .featured-logo {
          width: 42px; height: 42px; border-radius: 50%;
          margin: 0 auto 6px; background: #fbf8f2;
          border: 1px solid #eee7d6; display: flex;
          align-items: center; justify-content: center; overflow: hidden;
        }
        .featured-logo img { width: 100%; height: 100%; object-fit: cover; }
        .featured-name {
          font-size: 11px; font-weight: 600; color: #16231f;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .featured-cat {
          font-size: 9px; color: #8a9a93; margin-top: 2px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .listings { padding: 4px 16px 14px; max-width: 1200px; margin: 0 auto; }
        .listings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .listings-header-left { display: flex; align-items: center; gap: 8px; }
        .listings-title { font-size: 16px; font-weight: 700; margin: 0; }
        .listings-count {
          font-size: 12px; color: #8a9a93; background: #eee7d6;
          padding: 1px 10px; border-radius: 12px;
        }
        .filter-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #eee7d6; background: #ffffff;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: all 0.2s;
        }
        .filter-btn:hover { background: #f3efe2; }

        .listings-grid { column-count: 2; column-gap: 12px; }
        @media (min-width: 640px) { .listings-grid { column-count: 3; } }
        @media (min-width: 1024px) { .listings-grid { column-count: 4; } }

        .feed-card {
          background: #ffffff; border-radius: 16px;
          border: 1px solid #eee7d6; overflow: hidden;
          cursor: pointer; break-inside: avoid;
          -webkit-column-break-inside: avoid; margin-bottom: 12px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .feed-card:hover { box-shadow: 0 10px 26px rgba(22, 35, 31, 0.12); transform: translateY(-2px); }

        .feed-image { position: relative; width: 100%; background: #f3efe2; overflow: hidden; }
        .feed-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .feed-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

        .badge-row {
          position: absolute; top: 8px; left: 8px; right: 8px;
          display: flex; justify-content: space-between;
          align-items: flex-start; pointer-events: none;
        }
        .badge {
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; font-size: 10px; font-weight: 700;
        }
        .feed-new { background: #c9603c; color: #fbf8f2; padding: 3px 7px; }
        .feed-delivery {
          background: #244f43; width: 20px; height: 20px; border-radius: 6px;
        }

        .feed-content {
          padding: 10px 12px 12px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .feed-title {
          font-size: 13px; font-weight: 600; margin: 0; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .feed-price-row {
          display: flex; align-items: center;
          justify-content: space-between; gap: 6px;
        }
        .feed-price { font-size: 14px; font-weight: 700; color: #c9603c; }
        .feed-rating {
          display: flex; align-items: center; gap: 2px;
          font-size: 11px; font-weight: 600; color: #e8a33d; flex-shrink: 0;
        }
        .feed-meta-row {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #8a9a93; flex-wrap: wrap;
        }
        .feed-seller-text, .feed-location-text {
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; max-width: 100px;
        }
        .feed-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: #d8d0bb; flex-shrink: 0;
        }
        .business-tag {
          font-size: 9px; font-weight: 700; color: #e8a33d;
          background: rgba(232, 163, 61, 0.14);
          padding: 1px 6px; border-radius: 5px; flex-shrink: 0;
        }

        .feed-footer {
          display: flex; align-items: center; justify-content: flex-end;
          margin-top: 2px; padding-top: 6px; border-top: 1px solid #f3efe2;
        }
        .like-btn {
          display: flex; align-items: center; gap: 4px;
          background: none; border: none; font-size: 11px;
          color: #8a9a93; cursor: pointer; font-family: inherit;
          padding: 2px 4px; border-radius: 6px; transition: all 0.2s;
        }
        .like-btn:hover { background: #f3efe2; color: #ef4444; }

        .feed-message-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; width: 100%; padding: 8px 12px; margin-top: 6px;
          background: #244f43; border: none; border-radius: 10px;
          font-size: 12px; font-weight: 600; color: #fbf8f2;
          font-family: inherit; cursor: pointer; transition: background 0.2s;
        }
        .feed-message-btn:hover:not(:disabled) { background: #e8a33d; }
        .feed-message-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .empty-state { text-align: center; padding: 40px 20px; }
        .empty-title { font-size: 16px; font-weight: 600; color: #16231f; margin: 8px 0 4px; }
        .empty-desc { font-size: 13px; color: #8a9a93; margin: 0; }

        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(238, 231, 214, 0.7);
          display: flex; justify-content: space-around;
          padding: 4px 0 8px; z-index: 100;
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; background: none; border: none;
          cursor: pointer; padding: 4px 8px;
          font-family: inherit; min-width: 44px;
        }
        .nav-icon-wrap {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .nav-icon-wrap.active { background: #244f43; }
        .nav-label { font-size: 9px; font-weight: 500; color: #8a9a93; }
        .nav-label.active { color: #16231f; font-weight: 600; }

        @media (max-width: 480px) {
          .hero-block { padding: 24px 12px 52px; }
          .hero-title { font-size: 24px; }
          .listings { padding: 4px 12px 12px; }
          .listings-grid { column-gap: 10px; }
          .feed-card { margin-bottom: 10px; }
          .feed-title { font-size: 12px; }
          .feed-price { font-size: 13px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-hero, .skeleton-chip, .skeleton-card { animation: none; }
          .feed-card, .like-btn, .nav-icon-wrap, .category-circle,
          .tab-btn, .featured-card, .feed-message-btn { transition: none; }
          .feed-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default Landing;