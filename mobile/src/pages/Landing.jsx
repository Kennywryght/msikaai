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
      <div className="marketplace-shell">
        <div className="loading-page">
          <div className="loading-top">
            <div className="loading-line loading-line-lg" />
            <div className="loading-line loading-line-sm" />
          </div>
          <div className="loading-search" />
          <div className="loading-pills">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="loading-pill" />)}
          </div>
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="loading-card" />)}
          </div>
        </div>
        <style jsx>{`
          .marketplace-shell { min-height: 100vh; background: #f6f7f5; }
          .loading-page { max-width: 1280px; margin: 0 auto; padding: 34px 24px 60px; }
          .loading-top { margin-bottom: 28px; }
          .loading-line, .loading-search, .loading-pill, .loading-card {
            background: linear-gradient(90deg, #e7ebe7 25%, #f2f4f2 50%, #e7ebe7 75%);
            background-size: 200% 100%;
            animation: shimmer 1.4s infinite;
          }
          .loading-line { height: 16px; border-radius: 8px; margin-bottom: 10px; }
          .loading-line-lg { width: 230px; height: 32px; }
          .loading-line-sm { width: 340px; max-width: 80%; }
          .loading-search { height: 64px; border-radius: 18px; margin-bottom: 24px; }
          .loading-pills { display: flex; gap: 10px; overflow: hidden; margin-bottom: 30px; }
          .loading-pill { width: 108px; min-width: 108px; height: 54px; border-radius: 15px; }
          .loading-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
          .loading-card { height: 340px; border-radius: 20px; }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @media (max-width: 900px) { .loading-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (max-width: 640px) {
            .loading-page { padding: 22px 14px 90px; }
            .loading-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
            .loading-card { height: 280px; }
          }
        `}</style>
      </div>
    );
  }  return (
    <div className="marketplace-shell">
      <header className="marketplace-header">
        <div className="header-inner">
          <div className="brand-mark">
            <div className="brand-icon"><Icon name="store" size={19} color="#ffffff" strokeWidth={2} /></div>
            <div>
              <div className="brand-name">Mitundu</div>
              <div className="brand-caption">Local marketplace</div>
            </div>
          </div>

          <div className="header-actions">
            <button type="button" className="header-action" onClick={() => navigate('/messages')} aria-label="Messages">
              <Icon name="message" size={18} color="currentColor" strokeWidth={1.8} />
              <span>Messages</span>
            </button>
            <button type="button" className="header-profile" onClick={() => navigate('/profile')} aria-label="Profile">
              <Icon name="user" size={18} color="currentColor" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Your local market, simplified
            </div>
            <h1 className="hero-title">
              Find exactly what<br className="desktop-break" />
              <span>you need.</span>
            </h1>
            <p className="hero-desc">
              Discover products, trusted businesses, and skilled local services around Mitundu.
            </p>

            <form onSubmit={handleSearch} className="hero-search-form">
              <div className="hero-search">
                <div className="hero-search-icon">
                  <Icon name="search" size={20} color="#65736d" strokeWidth={1.9} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="hero-search-input"
                />
                <button type="submit" className="hero-search-btn">
                  Search
                  <Icon name="arrowRight" size={17} color="#ffffff" strokeWidth={2} />
                </button>
              </div>
            </form>

            <div className="quick-searches">
              <span>Popular:</span>
              <button type="button" onClick={() => { setSearchQuery('food'); navigate('/search?q=food'); }}>Food</button>
              <button type="button" onClick={() => { setSearchQuery('hardware'); navigate('/search?q=hardware'); }}>Hardware</button>
              <button type="button" onClick={() => { setSearchQuery('tailor'); navigate('/search?q=tailor'); }}>Tailors</button>
              <button type="button" onClick={() => { setSearchQuery('farm inputs'); navigate('/search?q=farm%20inputs'); }}>Farm inputs</button>
            </div>
          </div>
        </section>

        <section className="category-section page-width">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Browse</span>
              <h2>Shop by category</h2>
            </div>
            <button type="button" className="text-link" onClick={() => { setSelectedCategory('All'); setActiveTab('all'); }}>
              View all <Icon name="arrowRight" size={15} color="currentColor" strokeWidth={2} />
            </button>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  className={`category-card ${active ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.label)}
                >
                  <span
                    className="category-icon-box"
                    style={{ background: active ? cat.color : `${cat.color}14`, color: active ? '#fff' : cat.color }}
                  >
                    <Icon name={cat.icon} size={20} color="currentColor" strokeWidth={1.8} />
                  </span>
                  <span className="category-copy">
                    <strong>{cat.label}</strong>
                    <small>{cat.label === 'All' ? 'Everything' : `Browse ${cat.label.toLowerCase()}`}</small>
                  </span>
                  <Icon name="arrowRight" size={15} color={active ? '#ffffff' : '#a0aaa5'} strokeWidth={1.8} className="category-arrow" />
                </button>
              );
            })}
          </div>
        </section>

        {featuredBusinesses.length > 0 && (
          <section className="business-section page-width">
            <div className="section-heading-row compact">
              <div>
                <span className="section-kicker">Local network</span>
                <h2>Businesses to discover</h2>
              </div>
              <button type="button" className="text-link" onClick={() => navigate('/search')}>
                Explore <Icon name="arrowRight" size={15} color="currentColor" strokeWidth={2} />
              </button>
            </div>

            <div className="business-rail">
              {featuredBusinesses.map((biz) => (
                <button key={biz.id} type="button" className="business-card" onClick={() => handleBusinessClick(biz)}>
                  <div className="business-logo">
                    {biz.logo_url ? (
                      <img src={biz.logo_url} alt={biz.business_name} />
                    ) : (
                      <Icon name="store" size={20} color="#738079" strokeWidth={1.7} />
                    )}
                  </div>
                  <div className="business-info">
                    <strong>{biz.business_name}</strong>
                    <span>{biz.category || 'Local business'}</span>
                    {biz.location_text && (
                      <span className="business-location">
                        <Icon name="mapPin" size={12} color="#87928c" strokeWidth={1.8} />
                        {biz.location_text}
                      </span>
                    )}
                  </div>
                  <span className="business-arrow">
                    <Icon name="arrowRight" size={15} color="#53625b" strokeWidth={1.8} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="listings-section page-width">
          <div className="listings-top">
            <div>
              <span className="section-kicker">Marketplace</span>
              <div className="listings-heading">
                <h2>{activeTab === 'goods' ? 'Latest goods' : activeTab === 'services' ? 'Local services' : 'Fresh from the market'}</h2>
                <span className="result-count">{filteredListings.length}</span>
              </div>
            </div>

            <div className="view-controls">
              <div className="listing-tabs">
                <button type="button" className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All</button>
                <button type="button" className={activeTab === 'goods' ? 'active' : ''} onClick={() => setActiveTab('goods')}>Goods</button>
                <button type="button" className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>Services</button>
              </div>
              <button type="button" className="filter-btn premium-filter" onClick={() => {}}>
                <Icon name="filter" size={16} color="currentColor" strokeWidth={1.8} />
                <span>Filter</span>
              </button>
            </div>
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
                  <article key={item.id} className="product-card" onClick={() => handleListingClick(item)}>
                    <div className="product-media" style={{ aspectRatio: getAspect(index) }}>
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} className="product-image" loading="lazy" />
                      ) : (
                        <div className="product-placeholder">
                          <Icon name={isBusiness ? 'store' : 'layers'} size={30} color="#aeb7b2" strokeWidth={1.45} />
                        </div>
                      )}

                      <div className="media-top">
                        <div>
                          {isRecent(item) && <span className="product-badge new-badge">NEW</span>}
                          {isBusiness && <span className="product-badge business-badge">BUSINESS</span>}
                        </div>
                        <button
                          type="button"
                          className={`heart-btn ${isLiked ? 'liked' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                          aria-label={isLiked ? 'Unlike' : 'Like'}
                        >
                          <Icon name="heart" size={17} color={isLiked ? '#d94b45' : '#ffffff'} strokeWidth={isLiked ? 2.5 : 1.8} />
                        </button>
                      </div>

                      {item.delivery_available && (
                        <span className="delivery-badge">
                          <Icon name="truck" size={12} color="#ffffff" strokeWidth={1.9} />
                          Delivery
                        </span>
                      )}
                    </div>

                    <div className="product-body">
                      <div className="product-category">{item.category || 'Marketplace'}</div>
                      <h3>{item.title}</h3>

                      <div className="product-price-row">
                        <strong>{formatPrice(item.price)}</strong>
                        {item.rating != null && item.rating > 0 && (
                          <span className="product-rating">
                            <Icon name="star" size={12} color="#d89b2b" strokeWidth={2} />
                            {Number(item.rating).toFixed(1)}
                          </span>
                        )}
                      </div>

                      <div className="product-seller">
                        <span className="seller-avatar">
                          <Icon name="store" size={12} color="#6d7973" strokeWidth={1.7} />
                        </span>
                        <span>{item.businesses?.business_name || 'Local seller'}</span>
                        {item.location_area && (
                          <>
                            <span className="seller-divider" />
                            <span className="seller-location">
                              <Icon name="mapPin" size={11} color="#8b9690" strokeWidth={1.7} />
                              {item.location_area}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="product-actions">
                        <span className="like-count">
                          <Icon name="heart" size={13} color={isLiked ? '#d94b45' : '#8b9690'} strokeWidth={1.7} />
                          {realLikeCount + (isLiked ? 1 : 0)}
                        </span>

                        {canMessage && (
                          <button
                            type="button"
                            className="message-btn"
                            onClick={(e) => handleQuickMessage(e, item)}
                            disabled={openingChatId === item.id}
                          >
                            <Icon name="message" size={13} color="#ffffff" strokeWidth={1.9} />
                            {openingChatId === item.id ? 'Opening…' : 'Message seller'}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="search" size={28} color="#718079" strokeWidth={1.5} /></div>
              <h3>No matches yet</h3>
              <p>
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try another search or browse a different category.'
                  : 'Be the first to add something to the marketplace.'}
              </p>
              {(searchQuery || selectedCategory !== 'All') && (
                <button type="button" className="empty-reset" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setActiveTab('all'); }}>
                  Clear search
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {isMobile && (
        <nav className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'message' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const active = item.id === 'home';
            return (
              <button key={item.id} type="button" className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <span className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={19} color={active ? '#ffffff' : '#78847e'} strokeWidth={1.8} />
                </span>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

        .marketplace-shell {
          min-height: 100vh;
          background: #f6f7f5;
          color: #15201b;
          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding-bottom: 36px;
        }

        button, input { font: inherit; }
        button { -webkit-tap-highlight-color: transparent; }
        .page-width { width: min(1240px, calc(100% - 48px)); margin: 0 auto; }

        .marketplace-header {
          height: 72px;
          background: rgba(255,255,255,.94);
          border-bottom: 1px solid #e7ebe8;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(18px);
        }

        .header-inner {
          height: 100%;
          width: min(1240px, calc(100% - 48px));
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-mark { display: flex; align-items: center; gap: 10px; }
        .brand-icon {
          width: 38px; height: 38px; border-radius: 11px;
          background: #173f34; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 16px rgba(23,63,52,.18);
        }
        .brand-name { font-family: 'Manrope', sans-serif; font-size: 15px; font-weight: 800; line-height: 1.1; }
        .brand-caption { font-size: 10px; color: #89938e; margin-top: 3px; }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .header-action, .header-profile {
          border: 1px solid #e5eae7; background: #fff; color: #51605a; cursor: pointer;
          transition: .2s ease;
        }
        .header-action {
          height: 38px; padding: 0 13px; border-radius: 11px;
          display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700;
        }
        .header-profile {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
        }
        .header-action:hover, .header-profile:hover { border-color: #cbd6d0; background: #f7f9f8; }

        .hero-section {
          position: relative; overflow: hidden;
          background: #173f34;
          min-height: 420px;
          display: flex; align-items: center;
        }
        .hero-section::after {
          content: ''; position: absolute; inset: auto -5% -120px;
          height: 220px; background: #f6f7f5; border-radius: 50% 50% 0 0 / 100% 100% 0 0;
        }
        .hero-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(1px); }
        .hero-glow-one { width: 440px; height: 440px; right: -110px; top: -190px; background: rgba(82,145,120,.22); }
        .hero-glow-two { width: 300px; height: 300px; left: -160px; bottom: -160px; background: rgba(216,155,43,.12); }
        .hero-content { width: min(980px, calc(100% - 48px)); margin: 0 auto; position: relative; z-index: 2; padding: 58px 0 105px; }
        .eyebrow {
          display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,.68);
          font-size: 11px; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 17px;
        }
        .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #dca13a; box-shadow: 0 0 0 5px rgba(220,161,58,.12); }
        .hero-title {
          font-family: 'Manrope', sans-serif; color: #fff; font-size: clamp(38px, 6vw, 68px);
          line-height: 1.02; letter-spacing: -.045em; font-weight: 800; margin: 0;
        }
        .hero-title span { color: #e0a13a; }
        .hero-desc { max-width: 560px; color: rgba(255,255,255,.69); font-size: 15px; line-height: 1.65; margin: 18px 0 26px; }
        .hero-search-form { width: min(760px, 100%); }
        .hero-search {
          height: 66px; background: #fff; border-radius: 17px; padding: 7px 7px 7px 17px;
          display: flex; align-items: center; gap: 10px; box-shadow: 0 20px 48px rgba(0,0,0,.22);
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .hero-search:focus-within { box-shadow: 0 22px 54px rgba(0,0,0,.27); transform: translateY(-1px); }
        .hero-search-icon { display: flex; align-items: center; }
        .hero-search-input { flex: 1; min-width: 0; border: 0; outline: 0; color: #1c2923; font-size: 14px; background: transparent; }
        .hero-search-input::placeholder { color: #9aa39f; }
        .hero-search-btn {
          height: 52px; border: 0; border-radius: 12px; background: #173f34; color: #fff;
          padding: 0 18px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; font-weight: 700;
        }
        .hero-search-btn:hover { background: #225647; }
        .quick-searches { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 13px; color: rgba(255,255,255,.5); font-size: 11px; }
        .quick-searches button {
          border: 0; background: rgba(255,255,255,.08); color: rgba(255,255,255,.78); border-radius: 8px;
          padding: 5px 9px; cursor: pointer; transition: .2s ease;
        }
        .quick-searches button:hover { background: rgba(255,255,255,.15); color: #fff; }

        .category-section { padding-top: 7px; }
        .section-heading-row, .listings-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
        .section-heading-row { margin-bottom: 17px; }
        .section-heading-row.compact { margin-bottom: 17px; }
        .section-kicker { display: block; color: #9a6b20; text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: .13em; margin-bottom: 5px; }
        .section-heading-row h2, .listings-heading h2 {
          font-family: 'Manrope', sans-serif; font-size: 20px; letter-spacing: -.025em; margin: 0; font-weight: 800;
        }
        .text-link {
          border: 0; background: transparent; color: #53635c; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; padding: 5px 0;
        }
        .text-link:hover { color: #173f34; }

        .category-grid {
          display: grid; grid-template-columns: repeat(6, 1fr); gap: 11px;
          margin-bottom: 52px;
        }
        .category-card {
          min-height: 86px; border: 1px solid #e3e8e5; border-radius: 16px; background: #fff;
          padding: 12px; display: flex; align-items: center; gap: 10px; text-align: left;
          cursor: pointer; color: #26332e; transition: .2s ease; box-shadow: 0 4px 14px rgba(22,37,30,.025);
        }
        .category-card:hover { transform: translateY(-2px); border-color: #cbd7d0; box-shadow: 0 10px 24px rgba(22,37,30,.07); }
        .category-card.selected { background: #173f34; border-color: #173f34; color: #fff; box-shadow: 0 10px 25px rgba(23,63,52,.16); }
        .category-icon-box {
          width: 42px; height: 42px; min-width: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .category-copy { min-width: 0; flex: 1; }
        .category-copy strong { display: block; font-size: 11px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .category-copy small { display: block; font-size: 9px; color: #99a29e; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .category-card.selected .category-copy small { color: rgba(255,255,255,.5); }
        .category-arrow { opacity: .75; }

        .business-section { margin-bottom: 50px; }
        .business-rail { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .business-card {
          min-width: 0; border: 1px solid #e3e8e5; background: #fff; border-radius: 17px; padding: 13px;
          display: flex; align-items: center; gap: 11px; text-align: left; cursor: pointer; transition: .2s ease;
        }
        .business-card:hover { transform: translateY(-2px); border-color: #cbd7d0; box-shadow: 0 12px 25px rgba(22,37,30,.07); }
        .business-logo {
          width: 48px; height: 48px; min-width: 48px; border-radius: 14px; background: #f1f4f2;
          border: 1px solid #e3e8e5; overflow: hidden; display: flex; align-items: center; justify-content: center;
        }
        .business-logo img { width: 100%; height: 100%; object-fit: cover; }
        .business-info { min-width: 0; flex: 1; }
        .business-info strong { display: block; font-size: 12px; font-weight: 800; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .business-info > span { display: block; font-size: 10px; color: #8b9690; margin-top: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .business-info .business-location { display: flex; align-items: center; gap: 4px; }
        .business-arrow {
          width: 30px; height: 30px; min-width: 30px; border-radius: 9px; background: #f5f7f6;
          display: flex; align-items: center; justify-content: center;
        }

        .listings-section { padding-bottom: 40px; }
        .listings-top { align-items: center; margin-bottom: 18px; }
        .listings-heading { display: flex; align-items: center; gap: 9px; }
        .result-count { min-width: 25px; height: 21px; padding: 0 7px; border-radius: 20px; background: #e9eeeb; color: #69766f; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; }
        .view-controls { display: flex; align-items: center; gap: 9px; }
        .listing-tabs { display: flex; background: #e9eeeb; border-radius: 10px; padding: 3px; }
        .listing-tabs button {
          border: 0; background: transparent; color: #7b8781; border-radius: 8px; padding: 7px 12px;
          cursor: pointer; font-size: 10px; font-weight: 700; transition: .2s ease;
        }
        .listing-tabs button.active { background: #fff; color: #173f34; box-shadow: 0 2px 6px rgba(20,40,30,.08); }
        .premium-filter {
          height: 34px; border: 1px solid #e0e6e2; background: #fff; color: #64716b; border-radius: 10px;
          padding: 0 11px; display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 10px; font-weight: 700;
        }
        .premium-filter:hover { border-color: #c9d4ce; background: #fafcfb; }

        .listings-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; align-items: start;
        }
        .product-card {
          background: #fff; border: 1px solid #e3e8e5; border-radius: 19px; overflow: hidden; cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
          min-width: 0;
        }
        .product-card:hover { transform: translateY(-4px); border-color: #d2dbd6; box-shadow: 0 18px 35px rgba(20,38,30,.10); }
        .product-media { position: relative; overflow: hidden; background: #edf1ef; }
        .product-image { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .35s ease; }
        .product-card:hover .product-image { transform: scale(1.035); }
        .product-placeholder { width: 100%; height: 100%; min-height: 230px; display: flex; align-items: center; justify-content: center; background: linear-gradient(145deg,#eef2ef,#e3e9e5); }
        .media-top { position: absolute; left: 11px; right: 11px; top: 11px; display: flex; justify-content: space-between; align-items: flex-start; }
        .product-badge {
          display: inline-flex; align-items: center; height: 23px; padding: 0 8px; border-radius: 7px; margin-right: 5px;
          font-size: 8px; font-weight: 900; letter-spacing: .06em; backdrop-filter: blur(8px);
        }
        .new-badge { background: #d95d47; color: #fff; }
        .business-badge { background: rgba(255,255,255,.88); color: #173f34; }
        .heart-btn {
          width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.38); border-radius: 10px;
          background: rgba(19,31,26,.30); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: .2s ease;
        }
        .heart-btn:hover { background: rgba(19,31,26,.55); transform: scale(1.04); }
        .delivery-badge {
          position: absolute; bottom: 10px; left: 10px; height: 24px; padding: 0 8px; border-radius: 7px;
          display: inline-flex; align-items: center; gap: 5px; color: #fff; background: rgba(23,63,52,.9);
          font-size: 8px; font-weight: 800; backdrop-filter: blur(8px);
        }

        .product-body { padding: 13px 13px 12px; }
        .product-category { color: #a07836; font-size: 8px; text-transform: uppercase; font-weight: 900; letter-spacing: .1em; margin-bottom: 5px; }
        .product-body h3 {
          font-family: 'Manrope', sans-serif; font-size: 13px; line-height: 1.35; font-weight: 800; margin: 0 0 9px;
          color: #1d2a25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 35px;
        }
        .product-price-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .product-price-row strong { color: #173f34; font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 800; }
        .product-rating { display: inline-flex; align-items: center; gap: 3px; color: #a87620; font-size: 10px; font-weight: 800; }
        .product-seller {
          display: flex; align-items: center; gap: 5px; min-width: 0; margin-top: 10px; color: #7f8b85; font-size: 9px;
        }
        .seller-avatar {
          width: 22px; height: 22px; min-width: 22px; border-radius: 7px; background: #f0f3f1; display: flex; align-items: center; justify-content: center;
        }
        .product-seller > span:nth-child(2) { min-width: 0; max-width: 105px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .seller-divider { width: 3px; height: 3px; background: #c5ccc8; border-radius: 50%; flex-shrink: 0; }
        .seller-location { display: inline-flex; align-items: center; gap: 3px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .product-actions {
          display: flex; align-items: center; justify-content: space-between; gap: 7px; margin-top: 11px; padding-top: 10px; border-top: 1px solid #edf0ee;
        }
        .like-count { display: flex; align-items: center; gap: 4px; color: #89948e; font-size: 9px; font-weight: 700; }
        .message-btn {
          flex: 1; min-width: 0; height: 31px; border: 0; border-radius: 9px; background: #173f34; color: #fff;
          display: flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; font-size: 9px; font-weight: 800; transition: .2s ease;
        }
        .message-btn:hover:not(:disabled) { background: #225647; }
        .message-btn:disabled { opacity: .6; cursor: wait; }

        .empty-state {
          border: 1px dashed #d6ded9; border-radius: 20px; background: rgba(255,255,255,.55);
          padding: 70px 20px; text-align: center;
        }
        .empty-icon { width: 58px; height: 58px; margin: 0 auto 13px; border-radius: 17px; background: #e9efeb; display: flex; align-items: center; justify-content: center; }
        .empty-state h3 { font-family: 'Manrope', sans-serif; font-size: 17px; margin: 0 0 6px; }
        .empty-state p { margin: 0; color: #8a9690; font-size: 12px; }
        .empty-reset { margin-top: 16px; border: 0; border-radius: 9px; background: #173f34; color: #fff; padding: 9px 13px; cursor: pointer; font-size: 10px; font-weight: 800; }

        .bottom-nav {
          position: fixed; left: 12px; right: 12px; bottom: 10px; height: 62px; z-index: 100;
          background: rgba(255,255,255,.96); border: 1px solid #e1e7e3; border-radius: 18px;
          box-shadow: 0 12px 35px rgba(20,38,30,.15); backdrop-filter: blur(16px);
          display: flex; justify-content: space-around; align-items: center;
        }
        .nav-btn { background: transparent; border: 0; min-width: 54px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 3px 5px; }
        .nav-icon-wrap { width: 34px; height: 29px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
        .nav-icon-wrap.active { background: #173f34; }
        .nav-label { color: #87928d; font-size: 8px; font-weight: 700; }
        .nav-label.active { color: #173f34; }

        @media (min-width: 769px) { .bottom-nav { display: none; } }

        @media (max-width: 1050px) {
          .category-grid { grid-template-columns: repeat(3, 1fr); }
          .listings-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .business-rail { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 760px) {
          .page-width, .header-inner, .hero-content { width: calc(100% - 28px); }
          .marketplace-header { height: 64px; }
          .brand-caption { display: none; }
          .brand-name { font-size: 14px; }
          .header-action span { display: none; }
          .header-action { width: 38px; padding: 0; justify-content: center; }
          .hero-section { min-height: 430px; }
          .hero-content { padding: 44px 0 108px; }
          .desktop-break { display: none; }
          .hero-title { font-size: 42px; }
          .hero-desc { font-size: 13px; margin-top: 15px; }
          .hero-search { height: 58px; border-radius: 15px; padding-left: 14px; }
          .hero-search-btn { height: 44px; padding: 0 13px; }
          .quick-searches { overflow: hidden; flex-wrap: nowrap; }
          .quick-searches button { white-space: nowrap; }
          .category-grid { display: flex; overflow-x: auto; gap: 9px; margin: 0 -14px 38px; padding: 2px 14px 7px; scrollbar-width: none; }
          .category-grid::-webkit-scrollbar { display: none; }
          .category-card { min-width: 145px; min-height: 75px; padding: 10px; }
          .category-icon-box { width: 38px; height: 38px; min-width: 38px; }
          .section-heading-row h2, .listings-heading h2 { font-size: 18px; }
          .business-rail { display: flex; overflow-x: auto; gap: 10px; margin: 0 -14px; padding: 2px 14px 8px; scrollbar-width: none; }
          .business-rail::-webkit-scrollbar { display: none; }
          .business-card { min-width: 270px; }
          .listings-top { align-items: flex-start; flex-direction: column; gap: 13px; }
          .view-controls { width: 100%; justify-content: space-between; }
          .listing-tabs { flex: 1; }
          .listing-tabs button { flex: 1; }
          .listings-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
          .product-card { border-radius: 15px; }
          .product-body { padding: 10px; }
          .product-body h3 { font-size: 11px; min-height: 30px; margin-bottom: 7px; }
          .product-price-row strong { font-size: 12px; }
          .product-seller { margin-top: 8px; }
          .product-seller > span:nth-child(2) { max-width: 80px; }
          .seller-location { display: none; }
          .seller-divider { display: none; }
          .product-actions { margin-top: 8px; padding-top: 8px; }
          .message-btn { height: 29px; font-size: 8px; }
          .like-count { font-size: 8px; }
          .product-badge { height: 20px; padding: 0 6px; font-size: 7px; }
          .heart-btn { width: 29px; height: 29px; }
          .delivery-badge { height: 21px; font-size: 7px; }
          .listings-section { padding-bottom: 25px; }
        }

        @media (max-width: 390px) {
          .hero-title { font-size: 37px; }
          .hero-search-input { font-size: 12px; }
          .hero-search-btn { padding: 0 10px; font-size: 10px; }
          .listings-grid { gap: 9px; }
          .premium-filter span { display: none; }
          .premium-filter { width: 34px; justify-content: center; padding: 0; }
          .product-body h3 { font-size: 10.5px; }
          .product-price-row strong { font-size: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );

export default Landing;