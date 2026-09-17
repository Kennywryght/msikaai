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
  { label: 'All', icon: 'layers', color: '#BC5B34' },
  { label: 'Food', icon: 'coffee', color: '#BC5B34' },
  { label: 'Clothing', icon: 'shirt', color: '#8B5A83' },
  { label: 'Services', icon: 'wrench', color: '#3E6C76' },
  { label: 'Farm Inputs', icon: 'wheat', color: '#5B7B5E' },
  { label: 'Hardware', icon: 'hammer', color: '#6B6259' },
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
          .loading-skeleton { min-height: 100vh; background: #F7F1E3; padding-bottom: 80px; }
          .skeleton-hero { height: 220px; background: linear-gradient(160deg, #24453B, #16261F); margin-bottom: 28px; animation: pulse 1.6s ease-in-out infinite; }
          .skeleton-categories { display: flex; gap: 10px; padding: 0 20px; margin-bottom: 20px; }
          .skeleton-chip { width: 92px; height: 40px; border-radius: 10px; background: #ECE3CC; animation: pulse 1.6s ease-in-out infinite; }
          .skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 20px; }
          .skeleton-card { aspect-ratio: 4 / 5; background: #ECE3CC; border-radius: 4px; animation: pulse 1.6s ease-in-out infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      {/* ============ HERO ============ */}
      <div className="hero-block">
        <div className="hero-texture" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-seal" aria-hidden="true">
            <svg viewBox="0 0 120 120" width="76" height="76">
              <defs>
                <path id="sealArc" d="M 12,60 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0" />
              </defs>
              <circle cx="60" cy="60" r="57" fill="none" stroke="#D99A3B" strokeWidth="1" opacity="0.55" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#D99A3B" strokeWidth="1" opacity="0.85" />
              <text fill="#F7F1E3" fontSize="10.2" letterSpacing="1.5" fontFamily="'Work Sans', sans-serif">
                <textPath href="#sealArc" startOffset="2%">Mitundu Trading Centre</textPath>
              </text>
              <g transform="translate(60,60)">
                <path d="M-11,3 l1.5,-9h19l1.5,9M-11,3v13a2 2 0 002 2h14a2 2 0 002-2V3M-11,3h22M-5,18v-9h10v9"
                  fill="none" stroke="#D99A3B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </div>

          <h1 className="hero-title">
            Find what you need,<br />right here.
          </h1>
          <p className="hero-desc">Local goods, services, and tradespeople in Mitundu — a step from your door.</p>
        </div>
      </div>

      {/* ============ SEARCH ============ */}
      <div className="search-card-wrap">
        <div className="search-card-wrap-inner">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-wrapper">
              <Icon name="search" size={17} color="#7C9083" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search the marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <Icon name="search" size={16} color="#F7F1E3" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ============ CATEGORIES ============ */}
      <div className="categories-section">
        <div className="categories-scroll">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                className={`category-tag ${active ? 'active' : ''}`}
                style={active ? { background: cat.color, borderColor: cat.color } : { borderColor: `${cat.color}45` }}
                onClick={() => setSelectedCategory(cat.label)}
              >
                <Icon name={cat.icon} size={14} color={active ? '#F7F1E3' : cat.color} strokeWidth={1.9} />
                <span style={{ color: active ? '#F7F1E3' : '#3A362E' }}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ TABS ============ */}
      <div className="tabs-section">
        {[
          { id: 'all', label: 'All' },
          { id: 'goods', label: 'Goods' },
          { id: 'services', label: 'Services' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ FEATURED BUSINESSES ============ */}
      {featuredBusinesses.length > 0 && (
        <div className="featured-section">
          <div className="section-heading">
            <h2 className="section-title">Businesses near you</h2>
          </div>
          <div className="featured-scroll">
            {featuredBusinesses.map((biz) => (
              <button key={biz.id} className="featured-card" onClick={() => handleBusinessClick(biz)}>
                <div className="featured-logo">
                  {biz.logo_url ? (
                    <img src={biz.logo_url} alt={biz.business_name} />
                  ) : (
                    <Icon name="store" size={17} color="#BFA97B" strokeWidth={1.5} />
                  )}
                </div>
                <div className="featured-text">
                  <div className="featured-name">{biz.business_name}</div>
                  {biz.category && <div className="featured-cat">{biz.category}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ LISTINGS ============ */}
      <section className="listings">
        <div className="listings-header">
          <div className="listings-header-left">
            <h2 className="listings-title">Recent</h2>
            <span className="listings-count">{filteredListings.length}</span>
          </div>
          <button className="filter-btn" onClick={() => {}} aria-label="Filter">
            <Icon name="filter" size={15} color="#3A362E" strokeWidth={1.75} />
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
                        <Icon name="store" size={26} color="#BFA97B" strokeWidth={1.4} />
                      </div>
                    )}

                    <div className="badge-row">
                      <div className="badge-row-left">
                        {isRecent(item) && <span className="badge feed-new">New</span>}
                      </div>
                      <div className="badge-row-right">
                        {item.delivery_available && (
                          <span className="badge feed-delivery" aria-label="Delivery available">
                            <Icon name="truck" size={10} color="#F7F1E3" strokeWidth={2} />
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="feed-price-tag">{formatPrice(item.price)}</span>
                  </div>

                  <div className="feed-content">
                    <h3 className="feed-title">{item.title}</h3>

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
                      {item.rating != null && item.rating > 0 && (
                        <span className="feed-rating">
                          <Icon name="star" size={11} color="#D99A3B" strokeWidth={2} />
                          {Number(item.rating).toFixed(1)}
                        </span>
                      )}
                      <button
                        className="like-btn"
                        onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                      >
                        <Icon name="heart" size={13}
                          color={isLiked ? '#BC5B34' : '#9C9482'}
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
                        <Icon name="message" size={13} color="#F7F1E3" strokeWidth={2} />
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
            <Icon name="store" size={44} color="#BFA97B" strokeWidth={1.4} />
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-desc">
              {searchQuery || selectedCategory !== 'All'
                ? 'Try adjusting your filters'
                : 'Be the first to post something!'}
            </p>
          </div>
        )}
      </section>

      {/* ============ BOTTOM NAV ============ */}
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
                  <Icon name={item.icon} size={19} color={active ? '#F7F1E3' : '#9C9482'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Work+Sans:wght@400;500;600;700&display=swap');

        .app {
          min-height: 100vh;
          background: #F7F1E3;
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #201F1B;
          padding-bottom: 84px;
        }
        @media (min-width: 769px) { .app { padding-bottom: 0; } }

        /* ---------- Hero ---------- */
        .hero-block {
          position: relative;
          background: linear-gradient(160deg, #24453B 0%, #16261F 100%);
          padding: 36px 20px 60px;
          overflow: hidden;
        }
        .hero-texture {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(217, 154, 59, 0.14) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.5;
          pointer-events: none;
        }
        .hero-inner { position: relative; max-width: 1200px; margin: 0 auto; }
        .hero-seal { margin-bottom: 18px; opacity: 0.92; }
        .hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 600;
          font-size: clamp(28px, 4.4vw, 40px);
          letter-spacing: -0.01em;
          margin: 0 0 10px;
          line-height: 1.14;
          color: #F7F1E3;
          max-width: 480px;
        }
        .hero-desc { font-size: 14.5px; line-height: 1.5; color: rgba(247, 241, 227, 0.7); margin: 0; max-width: 380px; }

        /* ---------- Search ---------- */
        .search-card-wrap {
          position: sticky;
          top: 0;
          z-index: 40;
          margin-top: -28px;
          padding: 0 20px 14px;
          background: #F7F1E3;
          box-shadow: 0 6px 14px rgba(32, 31, 27, 0.04);
        }
        .search-card-wrap-inner { max-width: 1200px; margin: 0 auto; }
        .search-form { max-width: 560px; }
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #FFFDF8; border-radius: 12px;
          padding: 5px 5px 5px 16px;
          box-shadow: 0 16px 32px rgba(22, 38, 31, 0.22);
          border: 1px solid #EFE6CE;
        }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 12px 0; font-size: 14.5px; font-family: inherit; color: #201F1B;
        }
        .search-input::placeholder { color: #9C9482; }
        .search-btn {
          padding: 10px 14px; background: #24453B; border: none;
          border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .search-btn:hover { background: #BC5B34; }

        /* ---------- Categories ---------- */
        .categories-section { padding: 26px 20px 4px; }
        .categories-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
        .categories-scroll::-webkit-scrollbar { display: none; }
        .category-tag {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 13px; border-radius: 9px;
          border: 1.5px solid; background: transparent;
          font-family: inherit; font-size: 12.5px; font-weight: 600;
          cursor: pointer; flex-shrink: 0; transition: all 0.15s;
          white-space: nowrap;
        }

        /* ---------- Tabs ---------- */
        .tabs-section {
          display: flex; gap: 22px; padding: 16px 20px 0;
          border-bottom: 1px solid #EFE6CE; margin-bottom: 6px;
        }
        .tab-btn {
          position: relative; padding: 4px 2px 12px;
          border: none; background: transparent;
          font-size: 13.5px; font-weight: 600; color: #9C9482;
          cursor: pointer; font-family: inherit;
        }
        .tab-btn.active { color: #201F1B; }
        .tab-btn.active::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
          height: 2px; background: #BC5B34; border-radius: 2px;
        }

        /* ---------- Featured businesses ---------- */
        .featured-section { padding: 20px 20px 6px; }
        .section-heading { margin-bottom: 12px; }
        .section-title { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 16.5px; margin: 0; color: #201F1B; }
        .featured-scroll { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
        .featured-scroll::-webkit-scrollbar { display: none; }
        .featured-card {
          flex: 0 0 auto; display: flex; align-items: center; gap: 9px;
          width: 168px; background: #FFFDF8;
          border: 1px solid #EFE6CE; border-radius: 10px;
          padding: 9px 11px; text-align: left;
          cursor: pointer; font-family: inherit; transition: border-color 0.2s;
        }
        .featured-card:hover { border-color: #BC5B34; }
        .featured-logo {
          width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
          background: #F7F1E3; border: 1px solid #EFE6CE;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .featured-logo img { width: 100%; height: 100%; object-fit: cover; }
        .featured-text { min-width: 0; }
        .featured-name {
          font-size: 12.5px; font-weight: 600; color: #201F1B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .featured-cat {
          font-size: 10.5px; color: #9C9482; margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ---------- Listings ---------- */
        .listings { padding: 10px 20px 16px; max-width: 1200px; margin: 0 auto; }
        .listings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .listings-header-left { display: flex; align-items: baseline; gap: 8px; }
        .listings-title { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 18px; margin: 0; color: #201F1B; }
        .listings-count { font-size: 12px; color: #9C9482; }
        .filter-btn {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid #EFE6CE; background: #FFFDF8;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center; transition: border-color 0.2s;
        }
        .filter-btn:hover { border-color: #BC5B34; }

        .listings-grid { column-count: 2; column-gap: 12px; }
        @media (min-width: 640px) { .listings-grid { column-count: 3; } }
        @media (min-width: 1024px) { .listings-grid { column-count: 4; } }

        .feed-card {
          background: #FFFDF8; border-radius: 4px;
          border: 1px solid #EFE6CE; overflow: hidden;
          cursor: pointer; break-inside: avoid;
          -webkit-column-break-inside: avoid; margin-bottom: 12px;
          transition: border-color 0.2s;
        }
        .feed-card:hover { border-color: #D9C79E; }

        .feed-image { position: relative; width: 100%; background: #F0E9D6; overflow: hidden; }
        .feed-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .feed-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

        .badge-row {
          position: absolute; top: 8px; left: 8px; right: 8px;
          display: flex; justify-content: space-between;
          align-items: flex-start; pointer-events: none;
        }
        .badge {
          display: flex; align-items: center; justify-content: center;
          border-radius: 5px; font-size: 10px; font-weight: 600;
        }
        .feed-new { background: #24453B; color: #F7F1E3; padding: 3px 8px; }
        .feed-delivery { background: rgba(22, 38, 31, 0.72); width: 20px; height: 20px; border-radius: 5px; }

        .feed-price-tag {
          position: absolute; left: 8px; bottom: 8px;
          background: #BC5B34; color: #F7F1E3;
          font-size: 12px; font-weight: 700;
          padding: 4px 9px; border-radius: 5px;
          letter-spacing: -0.01em;
        }

        .feed-content { padding: 10px 12px 12px; display: flex; flex-direction: column; gap: 6px; }
        .feed-title {
          font-size: 13px; font-weight: 600; margin: 0; line-height: 1.32; color: #201F1B;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .feed-meta-row {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; color: #9C9482; flex-wrap: wrap;
        }
        .feed-seller-text, .feed-location-text {
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; max-width: 100px;
        }
        .feed-dot { width: 3px; height: 3px; border-radius: 50%; background: #D9C79E; flex-shrink: 0; }
        .business-tag {
          font-size: 9.5px; font-weight: 700; color: #BC5B34;
          background: rgba(188, 91, 52, 0.1);
          padding: 1px 6px; border-radius: 4px; flex-shrink: 0;
        }

        .feed-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 2px; padding-top: 7px; border-top: 1px solid #F2EBD9;
        }
        .feed-rating { display: flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #201F1B; }
        .like-btn {
          display: flex; align-items: center; gap: 4px;
          background: none; border: none; font-size: 11px;
          color: #9C9482; cursor: pointer; font-family: inherit;
          padding: 2px 3px; margin-left: auto;
        }

        .feed-message-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; width: 100%; padding: 8px 12px; margin-top: 5px;
          background: #24453B; border: none; border-radius: 7px;
          font-size: 12px; font-weight: 600; color: #F7F1E3;
          font-family: inherit; cursor: pointer; transition: background 0.2s;
        }
        .feed-message-btn:hover:not(:disabled) { background: #BC5B34; }
        .feed-message-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .empty-state { text-align: center; padding: 48px 20px; }
        .empty-title { font-family: 'Fraunces', Georgia, serif; font-size: 16px; font-weight: 600; color: #201F1B; margin: 10px 0 4px; }
        .empty-desc { font-size: 13px; color: #9C9482; margin: 0; }

        /* ---------- Bottom nav ---------- */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 253, 248, 0.97);
          backdrop-filter: blur(12px);
          border-top: 1px solid #EFE6CE;
          display: flex; justify-content: space-around;
          padding: 6px 0 10px; z-index: 100;
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; background: none; border: none;
          cursor: pointer; padding: 4px 8px;
          font-family: inherit; min-width: 44px;
        }
        .nav-icon-wrap {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .nav-icon-wrap.active { background: #24453B; }
        .nav-label { font-size: 9px; font-weight: 500; color: #9C9482; }
        .nav-label.active { color: #201F1B; font-weight: 600; }

        @media (max-width: 480px) {
          .hero-block { padding: 30px 16px 52px; }
          .hero-title { font-size: 25px; }
          .search-card-wrap { padding: 0 16px 14px; }
          .categories-section { padding: 24px 16px 4px; }
          .tabs-section { padding: 16px 16px 0; }
          .featured-section { padding: 18px 16px 4px; }
          .listings { padding: 10px 16px 12px; }
          .listings-grid { column-gap: 10px; }
          .feed-card { margin-bottom: 10px; }
          .feed-title { font-size: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-hero, .skeleton-chip, .skeleton-card { animation: none; }
          .feed-card, .search-btn, .filter-btn, .featured-card, .feed-message-btn, .nav-icon-wrap { transition: none; }
        }
      `}</style>
    </div>
  );
};

export default Landing;