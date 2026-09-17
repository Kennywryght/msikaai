// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, messagesAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import CommentSection from '../components/CommentSection';

/* ---------- Icons (unchanged set, add a few) ---------- */
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
    shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
    wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
    hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    close: "M6 18L18 6M6 6l12 12",
    comment: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
    check: "M20 6L9 17l-5-5",
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

/* ---------- Category color resolver ---------- */
const getCategoryColor = (category) => {
  if (!category) return '#6B6259';
  const c = category.toLowerCase();
  if (c.includes('food') || c.includes('coffee') || c.includes('drink')) return '#BC5B34';
  if (c.includes('cloth') || c.includes('shirt') || c.includes('fashion')) return '#8B5A83';
  if (c.includes('service') || c.includes('plumber') || c.includes('electric') || c.includes('mechanic') || c.includes('tailor') || c.includes('hair')) return '#3E6C76';
  if (c.includes('farm') || c.includes('wheat') || c.includes('seed') || c.includes('fert')) return '#5B7B5E';
  if (c.includes('hardware') || c.includes('tool') || c.includes('hammer')) return '#6B6259';
  return '#BC5B34';
};

const Landing = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [activeTab, setActiveTab] = useState('all');
  const [openingChatId, setOpeningChatId] = useState(null);
  const [openCommentsId, setOpenCommentsId] = useState(null);

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

  /* ---------- ★ LIKE PERSISTENCE ---------- */
  const handleLike = useCallback(async (e, item) => {
    e.stopPropagation();
    if (!isAuthenticated) { showToast('Please sign in to like', 'warning'); return; }

    const wasLiked = !!item.liked_by_me;
    const prevLikes = item.likes ?? 0;

    setAllListings((prev) =>
      prev.map((l) =>
        l.id === item.id
          ? { ...l, liked_by_me: !wasLiked, likes: prevLikes + (wasLiked ? -1 : 1) }
          : l
      )
    );

    try {
      if (wasLiked) await listingsAPI.unlike(item.id);
      else await listingsAPI.like(item.id);
    } catch (err) {
      console.error('like error:', err);
      setAllListings((prev) =>
        prev.map((l) =>
          l.id === item.id
            ? { ...l, liked_by_me: wasLiked, likes: prevLikes }
            : l
        )
      );
      showToast('Failed to update like', 'error');
    }
  }, [isAuthenticated, showToast]);

  const handleQuickMessage = useCallback(async (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) { showToast('Please sign in to message the seller', 'warning'); navigate('/login'); return; }

    const sellerUserId = item?.businesses?.user_id || item?.businesses?.userId || item?.businesses?.owner_id || null;
    if (!sellerUserId) { showToast('Seller information is unavailable', 'error'); return; }
    if (sellerUserId === user.id) { showToast("You can't message yourself about your own listing", 'warning'); return; }
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

  /* ---------- Fetch ---------- */
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
            likes: b.likes ?? 0,
            liked_by_me: b.liked_by_me ?? false,
            comment_count: b.comment_count ?? 0,
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

  /* ---------- Filtering ---------- */
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

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, navigate]);

  const handleListingClick = useCallback((item) => {
    if (item.is_business) navigate(`/search?q=${encodeURIComponent(item.title)}`);
    else navigate(`/listing/${item.id}`);
  }, [navigate]);

  const handleBusinessClick = useCallback((business) => {
    navigate(`/search?q=${encodeURIComponent(business.business_name)}`);
  }, [navigate]);

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
        <div className="skeleton-search" />
        <div className="skeleton-grid">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton-card" />)}
        </div>
        <style jsx>{`
          .loading-skeleton { min-height: 100vh; background: #F7F1E3; padding-bottom: 80px; }
          .skeleton-hero { height: 260px; background: linear-gradient(160deg, #24453B, #16261F); }
          .skeleton-search { height: 52px; margin: -26px 20px 20px; border-radius: 12px; background: #FFFDF8; box-shadow: 0 12px 24px rgba(22,38,31,0.12); }
          .skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 20px; }
          .skeleton-card { aspect-ratio: 4 / 5; background: #ECE3CC; border-radius: 6px; animation: pulse 1.6s ease-in-out infinite; }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
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
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            Mitundu Trading Centre
          </div>
          <h1 className="hero-title">
            Find what you need,<br />
            <em>right here.</em>
          </h1>
          <p className="hero-desc">
            Local goods, services, and tradespeople — a step from your door.
          </p>
        </div>
      </div>

      {/* ============ ★ STICKY SEARCH (pins just below the top bar at 64px) ============ */}
      <div className="search-sticky">
        <div className="search-sticky-inner">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-wrapper">
              <Icon name="search" size={17} color="#7C9083" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search the marketplace…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <Icon name="arrowRight" size={16} color="#F7F1E3" strokeWidth={2} />
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

      {/* ============ FEATURED ============ */}
      {featuredBusinesses.length > 0 && (
        <div className="featured-section">
          <div className="section-heading">
            <h2 className="section-title">Businesses near you</h2>
          </div>
          <div className="featured-scroll">
            {featuredBusinesses.map((biz) => (
              <button key={biz.id} className="featured-card" onClick={() => handleBusinessClick(biz)}>
                <div className="featured-logo">
                  {biz.logo_url ? <img src={biz.logo_url} alt={biz.business_name} /> : <Icon name="store" size={17} color="#BFA97B" strokeWidth={1.5} />}
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
              const isLiked = !!item.liked_by_me;
              const likeCount = item.likes ?? 0;
              const isBusiness = item.is_business || !!item.business_id;
              const sellerUserId = item.businesses?.user_id || item.businesses?.userId || item.businesses?.owner_id || null;
              const canMessage = !!sellerUserId && sellerUserId !== user?.id;
              const commentCount = item.comment_count ?? 0;
              const commentsOpen = openCommentsId === item.id;
              const catColor = getCategoryColor(item.category);
              const sellerName = item.businesses?.business_name || 'Local seller';
              const sellerInitial = sellerName.trim().charAt(0).toUpperCase() || 'L';

              return (
                <article key={item.id} className="card">
                  {/* -------- Image -------- */}
                  <div
                    className="card-media"
                    style={{ aspectRatio: getAspect(index) }}
                    onClick={() => handleListingClick(item)}
                  >
                    {item.images?.length ? (
                      <img src={item.images[0]} alt={item.title} className="card-img" loading="lazy" />
                    ) : (
                      <div className="card-placeholder">
                        <Icon name="store" size={28} color="#C9BB98" strokeWidth={1.3} />
                      </div>
                    )}

                    {/* top overlay row */}
                    <div className="card-media-top">
                      {isRecent(item) && <span className="chip chip-new">NEW</span>}
                      {item.category && (
                        <span className="chip chip-cat" style={{ background: `${catColor}E6` }}>
                          {item.category}
                        </span>
                      )}
                    </div>

                    {/* bottom overlay row */}
                    <div className="card-media-bottom">
                      {item.delivery_available && (
                        <span className="chip chip-delivery" title="Delivery available">
                          <Icon name="truck" size={10} color="#F7F1E3" strokeWidth={2} />
                          Delivery
                        </span>
                      )}
                    </div>
                  </div>

                  {/* -------- Body -------- */}
                  <div className="card-body">
                    <h3 className="card-title" onClick={() => handleListingClick(item)}>
                      {item.title}
                    </h3>

                    {item.price != null && item.price !== '' ? (
                      <div className="card-price">
                        <span className="price-value">{formatPrice(item.price)}</span>
                      </div>
                    ) : (
                      <div className="card-price card-price-muted">Price on request</div>
                    )}

                    <div className="card-seller">
                      <span className="seller-avatar" style={{ background: `${catColor}1F`, color: catColor }}>
                        {sellerInitial}
                      </span>
                      <span className="seller-name">{sellerName}</span>
                      {item.rating != null && item.rating > 0 && (
                        <span className="seller-rating">
                          <Icon name="star" size={11} color="#D99A3B" strokeWidth={2.2} />
                          {Number(item.rating).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {item.location_area && (
                      <div className="card-location">
                        <Icon name="mapPin" size={11} color="#B0A88F" strokeWidth={1.8} />
                        <span>{item.location_area}</span>
                      </div>
                    )}

                    {/* -------- Footer actions -------- */}
                    <div className="card-actions">
                      <button
                        className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                        onClick={(e) => handleLike(e, item)}
                        aria-label={isLiked ? 'Unlike' : 'Like'}
                      >
                        <Icon name="heart" size={15} color={isLiked ? '#BC5B34' : '#9C9482'} strokeWidth={isLiked ? 2.5 : 1.7} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                      </button>

                      <button
                        className="action-btn comment-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCommentsId(commentsOpen ? null : item.id);
                        }}
                        aria-label="Comments"
                      >
                        <Icon name="comment" size={14} color={commentsOpen ? '#24453B' : '#9C9482'} strokeWidth={1.8} />
                        {commentCount > 0 && <span>{commentCount}</span>}
                      </button>

                      {canMessage && (
                        <button
                          type="button"
                          className="action-btn msg-btn"
                          onClick={(e) => handleQuickMessage(e, item)}
                          disabled={openingChatId === item.id}
                          aria-label="Message seller"
                        >
                          <Icon name="message" size={13} color="#F7F1E3" strokeWidth={2} />
                          <span>{openingChatId === item.id ? '…' : 'Message'}</span>
                        </button>
                      )}
                    </div>

                    {commentsOpen && (
                      <div className="card-comments" onClick={(e) => e.stopPropagation()}>
                        <CommentSection
                          listingId={item.id}
                          compact
                          onCountChange={(count) => {
                            setAllListings((prev) =>
                              prev.map((l) => (l.id === item.id ? { ...l, comment_count: count } : l))
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Icon name="store" size={44} color="#BFA97B" strokeWidth={1.4} />
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-desc">
              {searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters' : 'Be the first to post something!'}
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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap');

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
          padding: 44px 20px 76px;
          overflow: hidden;
        }
        .hero-texture {
          position: absolute; inset: 0;
          background-image:
            radial-gradient(rgba(217, 154, 59, 0.16) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.55;
          mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
          pointer-events: none;
        }
        .hero-inner { position: relative; max-width: 1200px; margin: 0 auto; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11.5px; font-weight: 600; letter-spacing: 0.14em;
          text-transform: uppercase; color: #D99A3B;
          margin-bottom: 20px;
        }
        .hero-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #D99A3B; box-shadow: 0 0 0 4px rgba(217, 154, 59, 0.18);
        }
        .hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-optical-sizing: auto;
          font-weight: 500;
          font-size: clamp(32px, 5vw, 48px);
          letter-spacing: -0.02em;
          margin: 0 0 14px;
          line-height: 1.08;
          color: #F7F1E3;
          max-width: 520px;
        }
        .hero-title em {
          font-style: italic; font-weight: 500;
          color: #D99A3B;
        }
        .hero-desc {
          font-size: 15px; line-height: 1.5;
          color: rgba(247, 241, 227, 0.68);
          margin: 0; max-width: 400px;
        }

        /* ---------- ★ STICKY SEARCH ---------- */
        .search-sticky {
          position: sticky;
          top: 64px;
          z-index: 50;
          padding: 0 20px;
          margin-top: -30px;
          padding-bottom: 12px;
          background: linear-gradient(to bottom, #F7F1E3 78%, rgba(247, 241, 227, 0.85));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .search-sticky-inner { max-width: 1200px; margin: 0 auto; }
        .search-form { max-width: 620px; }
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #FFFDF8; border-radius: 14px;
          padding: 6px 6px 6px 18px;
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.04),
            0 18px 40px rgba(22, 38, 31, 0.16),
            0 0 0 1px rgba(239, 230, 206, 0.9);
          transition: box-shadow 0.25s ease;
        }
        .search-wrapper:focus-within {
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.05),
            0 22px 48px rgba(22, 38, 31, 0.2),
            0 0 0 1px rgba(188, 91, 52, 0.5);
        }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 13px 0; font-size: 14.5px; font-family: inherit; color: #201F1B;
        }
        .search-input::placeholder { color: #9C9482; }
        .search-btn {
          padding: 11px 15px; background: #24453B; border: none;
          border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .search-btn:hover { background: #BC5B34; transform: translateY(-1px); }

        /* ---------- Categories ---------- */
        .categories-section { padding: 14px 20px 4px; }
        .categories-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
        .categories-scroll::-webkit-scrollbar { display: none; }
        .category-tag {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          border: 1.5px solid; background: transparent;
          font-family: inherit; font-size: 12.5px; font-weight: 600;
          cursor: pointer; flex-shrink: 0;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .category-tag:not(.active):hover { background: rgba(255, 253, 248, 0.7); }

        /* ---------- Tabs ---------- */
        .tabs-section {
          display: flex; gap: 24px; padding: 18px 20px 0;
          border-bottom: 1px solid #EFE6CE; margin-bottom: 6px;
          max-width: 1200px; margin-left: auto; margin-right: auto;
        }
        .tab-btn {
          position: relative; padding: 4px 2px 12px;
          border: none; background: transparent;
          font-size: 13.5px; font-weight: 600; color: #9C9482;
          cursor: pointer; font-family: inherit;
          transition: color 0.15s;
        }
        .tab-btn:hover { color: #3A362E; }
        .tab-btn.active { color: #201F1B; }
        .tab-btn.active::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
          height: 2px; background: #BC5B34; border-radius: 2px;
        }

        /* ---------- Featured ---------- */
        .featured-section { padding: 20px 20px 6px; max-width: 1200px; margin: 0 auto; }
        .section-heading { margin-bottom: 12px; }
        .section-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600; font-size: 17px; margin: 0; color: #201F1B;
        }
        .featured-scroll { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
        .featured-scroll::-webkit-scrollbar { display: none; }
        .featured-card {
          flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
          width: 180px; background: #FFFDF8;
          border: 1px solid #EFE6CE; border-radius: 12px;
          padding: 10px 12px; text-align: left;
          cursor: pointer; font-family: inherit;
          transition: border-color 0.2s, transform 0.15s;
        }
        .featured-card:hover { border-color: #D9C79E; transform: translateY(-1px); }
        .featured-logo {
          width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
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

        /* ---------- Listings grid ---------- */
        .listings { padding: 10px 20px 16px; max-width: 1200px; margin: 0 auto; }
        .listings-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .listings-header-left { display: flex; align-items: baseline; gap: 8px; }
        .listings-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600; font-size: 18px; margin: 0; color: #201F1B;
        }
        .listings-count { font-size: 12px; color: #9C9482; }
        .filter-btn {
          width: 34px; height: 34px; border-radius: 9px;
          border: 1px solid #EFE6CE; background: #FFFDF8;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: border-color 0.2s, transform 0.15s;
        }
        .filter-btn:hover { border-color: #BC5B34; transform: translateY(-1px); }

        .listings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 14px;
        }
        @media (min-width: 640px) { .listings-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; } }
        @media (min-width: 1024px) { .listings-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; } }

        /* ---------- ★ Modern editorial card ---------- */
        .card {
          display: flex; flex-direction: column;
          background: #FFFDF8;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 1px 2px rgba(22, 38, 31, 0.04),
            0 0 0 1px rgba(239, 230, 206, 0.85);
          transition: box-shadow 0.28s ease, transform 0.28s ease;
        }
        .card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.05),
            0 20px 40px rgba(22, 38, 31, 0.12),
            0 0 0 1px rgba(217, 199, 158, 0.9);
        }

        /* -------- Media -------- */
        .card-media {
          position: relative;
          width: 100%;
          background: #F0E9D6;
          overflow: hidden;
          cursor: pointer;
        }
        .card-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .card:hover .card-img { transform: scale(1.06); }
        .card-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }

        .card-media-top {
          position: absolute; top: 10px; left: 10px; right: 10px;
          display: flex; align-items: flex-start; gap: 6px;
          pointer-events: none;
        }
        .chip {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 8px; border-radius: 6px;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .chip-new {
          background: rgba(36, 69, 59, 0.92);
          color: #F7F1E3;
        }
        .chip-cat {
          margin-left: auto;
          color: #F7F1E3;
          letter-spacing: 0.04em;
          text-transform: none;
          font-weight: 600;
          font-size: 10px;
        }
        .card-media-bottom {
          position: absolute; bottom: 10px; left: 10px; right: 10px;
          display: flex; justify-content: flex-start;
          pointer-events: none;
        }
        .chip-delivery {
          background: rgba(22, 38, 31, 0.82);
          color: #F7F1E3;
          letter-spacing: 0.04em;
          text-transform: none;
          font-size: 10px;
          font-weight: 600;
        }

        /* -------- Body -------- */
        .card-body {
          padding: 12px 13px 11px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .card-title {
          font-size: 13.5px; font-weight: 600; line-height: 1.3;
          color: #201F1B; margin: 0; cursor: pointer;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          letter-spacing: -0.005em;
        }
        .card-title:hover { color: #24453B; }

        .card-price { display: flex; align-items: baseline; gap: 6px; }
        .price-value {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px; font-weight: 600;
          color: #24453B;
          letter-spacing: -0.015em;
          font-variant-numeric: tabular-nums;
        }
        .card-price-muted {
          font-size: 12px; color: #9C9482; font-style: italic;
        }

        .card-seller {
          display: flex; align-items: center; gap: 7px;
          font-size: 11.5px; color: #6B6259;
          margin-top: 2px;
        }
        .seller-avatar {
          width: 20px; height: 20px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          flex-shrink: 0;
        }
        .seller-name {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 110px; font-weight: 500;
        }
        .seller-rating {
          display: inline-flex; align-items: center; gap: 3px;
          margin-left: auto; font-size: 11px; font-weight: 600; color: #201F1B;
        }

        .card-location {
          display: flex; align-items: center; gap: 4px;
          font-size: 10.5px; color: #9C9482;
        }
        .card-location span {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* -------- Actions footer -------- */
        .card-actions {
          display: flex; align-items: center; gap: 4px;
          margin-top: 6px; padding-top: 8px;
          border-top: 1px solid #F2EBD9;
        }
        .action-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none;
          padding: 5px 7px; border-radius: 8px;
          font-size: 11.5px; font-weight: 500;
          color: #7C7A70; cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, color 0.15s, transform 0.1s;
        }
        .action-btn:hover { background: rgba(217, 154, 59, 0.09); color: #201F1B; }
        .action-btn:active { transform: scale(0.96); }

        .like-btn.liked { color: #BC5B34; font-weight: 600; }

        .msg-btn {
          margin-left: auto;
          background: #24453B;
          color: #F7F1E3;
          padding: 5px 10px;
          font-weight: 600;
          font-size: 11px;
          border-radius: 8px;
          transition: background 0.2s, transform 0.15s;
        }
        .msg-btn:hover:not(:disabled) { background: #BC5B34; color: #F7F1E3; }
        .msg-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .card-comments {
          margin-top: 8px; padding-top: 8px;
          border-top: 1px solid #F2EBD9;
          animation: slideDown 0.22s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .empty-state { text-align: center; padding: 56px 20px; }
        .empty-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px; font-weight: 600; color: #201F1B; margin: 12px 0 4px;
        }
        .empty-desc { font-size: 13px; color: #9C9482; margin: 0; }

        /* ---------- Bottom nav ---------- */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 253, 248, 0.97);
          backdrop-filter: blur(14px);
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
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-icon-wrap.active { background: #24453B; }
        .nav-btn:hover .nav-icon-wrap:not(.active) { background: #F0E9D6; }
        .nav-label { font-size: 9px; font-weight: 500; color: #9C9482; }
        .nav-label.active { color: #201F1B; font-weight: 600; }

        @media (max-width: 480px) {
          .hero-block { padding: 34px 16px 68px; }
          .hero-title { font-size: 27px; }
          .search-sticky { padding: 0 16px 12px; }
          .categories-section { padding: 12px 16px 4px; }
          .tabs-section { padding: 16px 16px 0; }
          .featured-section { padding: 18px 16px 4px; }
          .listings { padding: 10px 16px 12px; }
          .listings-grid { gap: 12px; }
          .card-title { font-size: 12.5px; }
          .price-value { font-size: 15.5px; }
          .seller-name { max-width: 80px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .card, .card-img, .search-btn, .filter-btn, .featured-card,
          .action-btn, .msg-btn, .nav-icon-wrap { transition: none; }
          .card-comments { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Landing;