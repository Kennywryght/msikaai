// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, messagesAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import CommentSection from '../components/CommentSection';

/* ---------- Icons ---------- */
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
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
    flame: "M12 2s4 5 4 9a4 4 0 11-8 0c0-1.5.7-2.7 1.5-3.5C10 6 12 2 12 2z",
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
const ASPECT_RATIOS = ['4 / 5', '4 / 6.4', '4 / 4.4', '4 / 5.4'];

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

/* ---------- Reusable compact card ---------- */
const ProductCard = ({
  item, index, user, openingChatId, onLike, onOpen, onMessage, onOpenComments,
}) => {
  const isLiked = !!item.liked_by_me;
  const likeCount = item.likes ?? 0;
  const sellerUserId = item.businesses?.user_id || item.businesses?.userId || item.businesses?.owner_id || null;
  const canMessage = !!sellerUserId && sellerUserId !== user?.id;
  const commentCount = item.comment_count ?? 0;
  const catColor = getCategoryColor(item.category);
  const aspect = ASPECT_RATIOS[index % ASPECT_RATIOS.length];

  return (
    <article className="pcard">
      <div className="pcard-media" style={{ aspectRatio: aspect }} onClick={() => onOpen(item)}>
        {item.images?.length ? (
          <img src={item.images[0]} alt={item.title} className="pcard-img" loading="lazy" />
        ) : (
          <div className="pcard-placeholder">
            <Icon name="store" size={26} color="#C9BB98" strokeWidth={1.3} />
          </div>
        )}

        <button
          className={`pcard-heart ${isLiked ? 'liked' : ''}`}
          onClick={(e) => onLike(e, item)}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Icon name="heart" size={13} color="#F7F1E3" strokeWidth={isLiked ? 2.6 : 1.9} />
        </button>

        {item.delivery_available && (
          <span className="pcard-delivery" title="Delivery available">
            <Icon name="truck" size={10} color="#F7F1E3" strokeWidth={2} />
          </span>
        )}
      </div>

      <div className="pcard-body">
        <div className="pcard-price">
          {item.price != null && item.price !== '' ? (
            <span className="pcard-price-value">{`MK ${Number(item.price).toLocaleString()}`}</span>
          ) : (
            <span className="pcard-price-muted">On request</span>
          )}
        </div>

        <h3 className="pcard-title" onClick={() => onOpen(item)}>{item.title}</h3>

        <div className="pcard-meta">
          <span className="pcard-avatar" style={{ background: `${catColor}22`, color: catColor }}>
            {(item.businesses?.business_name || 'L').trim().charAt(0).toUpperCase()}
          </span>
          <span className="pcard-seller">{item.businesses?.business_name || 'Local seller'}</span>
          {item.location_area && (
            <>
              <span className="pcard-dot" />
              <span className="pcard-loc">{item.location_area}</span>
            </>
          )}
        </div>

        <div className="pcard-actions">
          <button
            className={`pcard-icon-btn ${isLiked ? 'liked' : ''}`}
            onClick={(e) => onLike(e, item)}
            aria-label="Like"
          >
            <Icon name="heart" size={13} color={isLiked ? '#BC5B34' : '#8A8578'} strokeWidth={isLiked ? 2.5 : 1.8} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          <button
            className="pcard-icon-btn"
            onClick={(e) => { e.stopPropagation(); onOpenComments(item); }}
            aria-label="Comments"
          >
            <Icon name="comment" size={13} color="#8A8578" strokeWidth={1.9} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          {canMessage && (
            <button
              className="pcard-msg"
              onClick={(e) => onMessage(e, item)}
              disabled={openingChatId === item.id}
              aria-label="Message seller"
            >
              <Icon name="message" size={12} color="#F7F1E3" strokeWidth={2} />
              <span>{openingChatId === item.id ? '…' : 'Message'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ---------- Featured (2-col wide hero card) ---------- */
const FeaturedCard = ({ item, user, openingChatId, onLike, onOpen, onMessage, onOpenComments }) => {
  const isLiked = !!item.liked_by_me;
  const likeCount = item.likes ?? 0;
  const sellerUserId = item.businesses?.user_id || item.businesses?.userId || item.businesses?.owner_id || null;
  const canMessage = !!sellerUserId && sellerUserId !== user?.id;
  const commentCount = item.comment_count ?? 0;
  const catColor = getCategoryColor(item.category);

  return (
    <article className="fcard">
      <div className="fcard-media" onClick={() => onOpen(item)}>
        {item.images?.length ? (
          <img src={item.images[0]} alt={item.title} className="fcard-img" loading="lazy" />
        ) : (
          <div className="fcard-placeholder">
            <Icon name="store" size={40} color="#C9BB98" strokeWidth={1.2} />
          </div>
        )}

        <div className="fcard-top">
          <span className="fchip fchip-spotlight">
            <Icon name="sparkle" size={11} color="#F0D9A8" strokeWidth={2} />
            Spotlight
          </span>
          {item.category && (
            <span className="fchip fchip-cat" style={{ background: `${catColor}E0` }}>
              {item.category}
            </span>
          )}
        </div>

        <button
          className={`fcard-heart ${isLiked ? 'liked' : ''}`}
          onClick={(e) => onLike(e, item)}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Icon name="heart" size={14} color="#F7F1E3" strokeWidth={isLiked ? 2.6 : 1.9} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <div className="fcard-glass" onClick={(e) => e.stopPropagation()}>
          <div className="fcard-glass-row">
            <h3 className="fcard-title" onClick={() => onOpen(item)}>{item.title}</h3>
            <span className="fcard-price">
              {item.price != null && item.price !== '' ? `MK ${Number(item.price).toLocaleString()}` : 'On request'}
            </span>
          </div>
          <div className="fcard-meta">
            <span className="fcard-seller">{item.businesses?.business_name || 'Local seller'}</span>
            {item.location_area && (
              <>
                <span className="fcard-dot" />
                <span className="fcard-loc">
                  <Icon name="mapPin" size={10} color="#EFE6CE" strokeWidth={1.9} />
                  {item.location_area}
                </span>
              </>
            )}
            {item.delivery_available && (
              <span className="fcard-delivery">
                <Icon name="truck" size={10} color="#F7F1E3" strokeWidth={2} />
                Delivery
              </span>
            )}
          </div>
          <div className="fcard-actions">
            <button
              className="fcard-action"
              onClick={(e) => { e.stopPropagation(); onOpenComments(item); }}
            >
              <Icon name="comment" size={13} color="#F7F1E3" strokeWidth={1.9} />
              <span>{commentCount > 0 ? `${commentCount} comments` : 'Comment'}</span>
            </button>
            {canMessage && (
              <button
                className="fcard-action fcard-msg"
                onClick={(e) => onMessage(e, item)}
                disabled={openingChatId === item.id}
              >
                <Icon name="message" size={12} color="#201F1B" strokeWidth={2} />
                <span>{openingChatId === item.id ? '…' : 'Message'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/* ---------- Spotlight tile (hero strip) ---------- */
const SpotlightTile = ({ item, onOpen }) => {
  const catColor = getCategoryColor(item.category);
  return (
    <button className="spot-tile" onClick={() => onOpen(item)}>
      <div className="spot-media">
        {item.images?.length ? (
          <img src={item.images[0]} alt={item.title} loading="lazy" />
        ) : (
          <div className="spot-placeholder">
            <Icon name="store" size={22} color="#C9BB98" strokeWidth={1.4} />
          </div>
        )}
        <span className="spot-cat" style={{ background: `${catColor}E6` }}>
          {item.category || 'New'}
        </span>
      </div>
      <div className="spot-info">
        <div className="spot-title">{item.title}</div>
        <div className="spot-price">
          {item.price != null && item.price !== '' ? `MK ${Number(item.price).toLocaleString()}` : 'On request'}
        </div>
      </div>
    </button>
  );
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
  const [commentsListing, setCommentsListing] = useState(null);

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

  useEffect(() => {
    if (commentsListing) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [commentsListing]);

  useEffect(() => {
    if (!commentsListing) return;
    const onKey = (e) => { if (e.key === 'Escape') setCommentsListing(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commentsListing]);

  /* ---------- LIKE ---------- */
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
  const isService = useCallback((item) => {
    const serviceCategories = ['Plumber', 'Electrician', 'Carpenter', 'Mechanic', 'Tailor', 'Hairdresser', 'Services'];
    return serviceCategories.some((cat) => item.category?.toLowerCase().includes(cat.toLowerCase()));
  }, []);

  const baseFiltered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
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
  }, [allListings, selectedCategory, searchQuery, activeTab, isService]);

  /* ---------- Split into sections ---------- */
  const spotlight = useMemo(() => {
    const recent = [...baseFiltered]
      .filter((l) => l.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return recent.slice(0, 6);
  }, [baseFiltered]);

  const featured = useMemo(() => {
    // most liked recent listing (last 48h) — fall back to most liked overall
    const recent = baseFiltered.filter(
      (l) => l.created_at && Date.now() - new Date(l.created_at).getTime() < NEW_WINDOW_MS
    );
    const pool = recent.length ? recent : baseFiltered;
    if (pool.length < 3) return null;
    return [...pool].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))[0] || null;
  }, [baseFiltered]);

  const featuredId = featured?.id;

  const freshListings = useMemo(
    () => baseFiltered.filter((l) => l.id !== featuredId && l.created_at && Date.now() - new Date(l.created_at).getTime() < NEW_WINDOW_MS),
    [baseFiltered, featuredId]
  );

  const freshIds = useMemo(() => new Set(freshListings.map((l) => l.id)), [freshListings]);

  const otherListings = useMemo(
    () => baseFiltered.filter((l) => l.id !== featuredId && !freshIds.has(l.id)),
    [baseFiltered, featuredId, freshIds]
  );

  const hasResults = baseFiltered.length > 0;

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
          .skeleton-hero { height: 200px; background: linear-gradient(160deg, #24453B, #16261F); }
          .skeleton-search { height: 52px; margin: -26px 20px 20px; border-radius: 12px; background: #FFFDF8; box-shadow: 0 12px 24px rgba(22,38,31,0.12); }
          .skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 20px; }
          .skeleton-card { aspect-ratio: 4 / 5; background: #ECE3CC; border-radius: 14px; animation: pulse 1.6s ease-in-out infinite; }
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
            Find what you need, <em>right here.</em>
          </h1>
          <p className="hero-desc">Local goods, services, and tradespeople — a step from your door.</p>
        </div>
      </div>

      {/* ============ STICKY SEARCH ============ */}
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

      {/* ============ SPOTLIGHT STRIP ============ */}
      {spotlight.length > 0 && (
        <div className="spotlight-section">
          <div className="spotlight-header">
            <h2 className="spotlight-heading">Spotlight</h2>
            <span className="spotlight-sub">Just arrived</span>
          </div>
          <div className="spotlight-scroll">
            {spotlight.map((item) => (
              <SpotlightTile key={item.id} item={item} onOpen={handleListingClick} />
            ))}
          </div>
        </div>
      )}

      {/* ============ CATEGORY PILL BAR (segmented, sliding) ============ */}
      <div className="cats-wrap">
        <div className="cats-bar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                className={`cat-pill ${active ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.label)}
                style={active ? { background: cat.color, borderColor: cat.color } : {}}
              >
                <Icon name={cat.icon} size={12} color={active ? '#F7F1E3' : cat.color} strokeWidth={2} />
                <span>{cat.label}</span>
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
      {featured && (
        <section className="featured-wrap">
          <FeaturedCard
            item={featured}
            user={user}
            openingChatId={openingChatId}
            onLike={handleLike}
            onOpen={handleListingClick}
            onMessage={handleQuickMessage}
            onOpenComments={(it) => setCommentsListing(it)}
          />
        </section>
      )}

      {/* ============ FEED ============ */}
      {hasResults ? (
        <>
          {freshListings.length > 0 && (
            <section className="section">
              <header className="section-head">
                <h2 className="section-title">
                  Fresh this week
                  <span className="section-title-count">{freshListings.length}</span>
                </h2>
                <span className="section-tag">
                  <Icon name="flame" size={12} color="#BC5B34" strokeWidth={2} />
                  new
                </span>
              </header>
              <div className="grid">
                {freshListings.map((item, i) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={i}
                    user={user}
                    openingChatId={openingChatId}
                    onLike={handleLike}
                    onOpen={handleListingClick}
                    onMessage={handleQuickMessage}
                    onOpenComments={(it) => setCommentsListing(it)}
                  />
                ))}
              </div>
            </section>
          )}

          {otherListings.length > 0 && (
            <section className="section">
              <header className="section-head">
                <h2 className="section-title">
                  {freshListings.length > 0 ? 'More from Mitundu' : 'All listings'}
                  <span className="section-title-count">{otherListings.length}</span>
                </h2>
                <button className="filter-btn" onClick={() => {}} aria-label="Filter">
                  <Icon name="filter" size={14} color="#3A362E" strokeWidth={1.9} />
                </button>
              </header>
              <div className="grid">
                {otherListings.map((item, i) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={i}
                    user={user}
                    openingChatId={openingChatId}
                    onLike={handleLike}
                    onOpen={handleListingClick}
                    onMessage={handleQuickMessage}
                    onOpenComments={(it) => setCommentsListing(it)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="section">
          <div className="empty-state">
            <Icon name="store" size={44} color="#BFA97B" strokeWidth={1.4} />
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-desc">
              {searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters' : 'Be the first to post something!'}
            </p>
          </div>
        </section>
      )}

      {/* ============ BUSINESSES NEAR YOU ============ */}
      {featuredBusinesses.length > 0 && (
        <section className="section biz-section">
          <header className="section-head">
            <h2 className="section-title">Businesses near you</h2>
          </header>
          <div className="biz-scroll">
            {featuredBusinesses.map((biz) => (
              <button key={biz.id} className="biz-card" onClick={() => handleBusinessClick(biz)}>
                <div className="biz-logo">
                  {biz.logo_url ? <img src={biz.logo_url} alt={biz.business_name} /> : <Icon name="store" size={16} color="#BFA97B" strokeWidth={1.5} />}
                </div>
                <div className="biz-text">
                  <div className="biz-name">{biz.business_name}</div>
                  {biz.category && <div className="biz-cat">{biz.category}</div>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ COMMENTS POP-UP ============ */}
      {commentsListing && (
        <div className="pop-overlay" onClick={() => setCommentsListing(null)} role="dialog" aria-modal="true">
          <div className="pop" onClick={(e) => e.stopPropagation()}>
            <div className="pop-handle" />
            <div className="pop-preview">
              <div className="pop-thumb">
                {commentsListing.images?.length ? (
                  <img src={commentsListing.images[0]} alt={commentsListing.title} />
                ) : (
                  <div className="pop-thumb-fallback">
                    <Icon name="store" size={18} color="#BFA97B" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="pop-preview-text">
                <div className="pop-preview-title">{commentsListing.title}</div>
                <div className="pop-preview-sub">
                  {commentsListing.businesses?.business_name || 'Local seller'}
                  {commentsListing.location_area ? ` · ${commentsListing.location_area}` : ''}
                </div>
              </div>
              <button className="pop-close" onClick={() => setCommentsListing(null)} aria-label="Close">
                <Icon name="close" size={16} color="#201F1B" strokeWidth={2.2} />
              </button>
            </div>
            <div className="pop-body">
              <CommentSection
                listingId={commentsListing.id}
                onCountChange={(count) => {
                  setAllListings((prev) =>
                    prev.map((l) => (l.id === commentsListing.id ? { ...l, comment_count: count } : l))
                  );
                  setCommentsListing((c) => (c ? { ...c, comment_count: count } : c));
                }}
              />
            </div>
          </div>
        </div>
      )}

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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Work+Sans:wght@400;500;600;700&display=swap');

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
          background: linear-gradient(155deg, #24453B 0%, #16261F 100%);
          padding: 30px 20px 60px;
          overflow: hidden;
        }
        .hero-texture {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(217, 154, 59, 0.15) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.55;
          mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
          pointer-events: none;
        }
        .hero-inner { position: relative; max-width: 1200px; margin: 0 auto; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em;
          text-transform: uppercase; color: #D99A3B;
          margin-bottom: 12px;
        }
        .hero-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #D99A3B; box-shadow: 0 0 0 3px rgba(217, 154, 59, 0.18);
        }
        .hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: clamp(26px, 4.2vw, 40px);
          letter-spacing: -0.02em;
          margin: 0 0 6px; line-height: 1.1;
          color: #F7F1E3;
          max-width: 620px;
        }
        .hero-title em { font-style: italic; font-weight: 500; color: #D99A3B; }
        .hero-desc {
          font-size: 13.5px; line-height: 1.5;
          color: rgba(247, 241, 227, 0.6);
          margin: 0; max-width: 440px;
        }

        /* ---------- Sticky search ---------- */
        .search-sticky {
          position: sticky;
          top: 64px;
          z-index: 50;
          padding: 0 20px;
          margin-top: -26px;
          padding-bottom: 10px;
          background: linear-gradient(to bottom, #F7F1E3 78%, rgba(247, 241, 227, 0.85));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .search-sticky-inner { max-width: 1200px; margin: 0 auto; }
        .search-form { max-width: 620px; }
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #FFFDF8; border-radius: 13px;
          padding: 5px 5px 5px 16px;
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.04),
            0 16px 34px rgba(22, 38, 31, 0.14),
            0 0 0 1px rgba(239, 230, 206, 0.9);
          transition: box-shadow 0.25s ease;
        }
        .search-wrapper:focus-within {
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.05),
            0 20px 44px rgba(22, 38, 31, 0.18),
            0 0 0 1px rgba(188, 91, 52, 0.5);
        }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 12px 0; font-size: 14px; font-family: inherit; color: #201F1B;
        }
        .search-input::placeholder { color: #9C9482; }
        .search-btn {
          padding: 10px 14px; background: #24453B; border: none;
          border-radius: 9px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .search-btn:hover { background: #BC5B34; transform: translateY(-1px); }

        /* ---------- Spotlight ---------- */
        .spotlight-section {
          max-width: 1200px;
          margin: 6px auto 0;
          padding: 4px 0 4px;
        }
        .spotlight-header {
          display: flex; align-items: baseline; gap: 10px;
          padding: 0 20px;
          margin-bottom: 10px;
        }
        .spotlight-heading {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600; font-size: 16px;
          margin: 0; color: #201F1B;
          letter-spacing: -0.01em;
        }
        .spotlight-sub {
          font-size: 11px; color: #9C9482;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .spotlight-scroll {
          display: flex; gap: 12px;
          overflow-x: auto; scrollbar-width: none;
          padding: 4px 20px 8px;
          scroll-snap-type: x mandatory;
        }
        .spotlight-scroll::-webkit-scrollbar { display: none; }
        .spot-tile {
          flex: 0 0 auto;
          width: 148px;
          background: transparent;
          border: none; padding: 0;
          text-align: left; cursor: pointer;
          font-family: inherit;
          scroll-snap-align: start;
          transition: transform 0.25s ease;
        }
        .spot-tile:hover { transform: translateY(-2px); }
        .spot-media {
          position: relative;
          width: 100%; aspect-ratio: 4 / 5;
          border-radius: 14px;
          overflow: hidden;
          background: #F0E9D6;
          box-shadow:
            0 1px 2px rgba(22, 38, 31, 0.05),
            0 10px 22px rgba(22, 38, 31, 0.1);
        }
        .spot-media img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .spot-tile:hover .spot-media img { transform: scale(1.06); }
        .spot-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .spot-cat {
          position: absolute; top: 8px; left: 8px;
          font-size: 9px; font-weight: 700;
          color: #F7F1E3;
          padding: 3px 7px; border-radius: 6px;
          letter-spacing: 0.04em;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .spot-info {
          padding: 8px 2px 0;
          display: flex; flex-direction: column; gap: 3px;
        }
        .spot-title {
          font-size: 12px; font-weight: 600;
          color: #201F1B;
          line-height: 1.3;
          overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
        .spot-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 12.5px; font-weight: 600;
          color: #24453B;
          letter-spacing: -0.01em;
        }

        /* ---------- Category pill bar ---------- */
        .cats-wrap {
          max-width: 1200px;
          margin: 14px auto 0;
          padding: 0 20px;
        }
        .cats-bar {
          display: flex; gap: 6px;
          overflow-x: auto; scrollbar-width: none;
          padding: 2px 0 2px;
        }
        .cats-bar::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 999px;
          border: 1.5px solid #EFE6CE;
          background: #FFFDF8;
          font-family: inherit; font-size: 11.5px; font-weight: 600;
          color: #3A362E;
          cursor: pointer; flex-shrink: 0;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .cat-pill:not(.active):hover {
          border-color: #D9C79E;
          background: #FFFDF8;
        }
        .cat-pill.active { color: #F7F1E3; }

        /* ---------- Tabs ---------- */
        .tabs-section {
          display: flex; gap: 22px;
          padding: 14px 20px 0;
          border-bottom: 1px solid #EFE6CE;
          margin: 12px auto 0;
          max-width: 1200px;
        }
        .tab-btn {
          position: relative; padding: 4px 2px 11px;
          border: none; background: transparent;
          font-size: 13px; font-weight: 600; color: #9C9482;
          cursor: pointer; font-family: inherit;
          transition: color 0.15s;
        }
        .tab-btn:hover { color: #3A362E; }
        .tab-btn.active { color: #201F1B; }
        .tab-btn.active::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
          height: 2px; background: #BC5B34; border-radius: 2px;
        }

        /* ---------- Featured card (2-col) ---------- */
        .featured-wrap {
          max-width: 1200px;
          margin: 16px auto 0;
          padding: 0 20px;
        }
        .fcard { position: relative; }
        .fcard-media {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 18px;
          overflow: hidden;
          background: #F0E9D6;
          cursor: pointer;
          box-shadow:
            0 2px 6px rgba(22, 38, 31, 0.06),
            0 22px 44px rgba(22, 38, 31, 0.14);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        @media (min-width: 640px) {
          .fcard-media { aspect-ratio: 16 / 7; }
        }
        .fcard:hover .fcard-media {
          transform: translateY(-3px);
          box-shadow:
            0 4px 8px rgba(22, 38, 31, 0.08),
            0 28px 56px rgba(22, 38, 31, 0.2);
        }
        .fcard-img {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: cover; display: block;
          animation: driftIn 24s ease-in-out infinite alternate;
          z-index: 0;
        }
        @keyframes driftIn {
          from { transform: scale(1.02); }
          to { transform: scale(1.1); }
        }
        .fcard-placeholder {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .fcard-top {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; gap: 6px; align-items: flex-start;
          pointer-events: none;
          z-index: 2;
        }
        .fchip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px;
          font-size: 10px; font-weight: 700;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          letter-spacing: 0.05em;
        }
        .fchip-spotlight {
          background: rgba(36, 69, 59, 0.9);
          color: #F0D9A8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .fchip-cat {
          color: #F7F1E3;
          text-transform: none;
          letter-spacing: 0.02em;
          font-weight: 600;
          font-size: 10px;
        }
        .fcard-heart {
          position: absolute;
          top: 12px; right: 12px;
          z-index: 3;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 7px 11px;
          border: none; cursor: pointer;
          border-radius: 999px;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #F7F1E3;
          font-size: 11.5px; font-weight: 600;
          font-family: inherit;
          transition: background 0.2s, transform 0.15s;
        }
        .fcard-heart:hover { background: rgba(22, 38, 31, 0.78); transform: scale(1.04); }
        .fcard-heart.liked { background: rgba(188, 91, 52, 0.95); }
        .fcard-glass {
          position: absolute;
          left: 12px; right: 12px; bottom: 12px;
          z-index: 2;
          padding: 13px 15px 12px;
          border-radius: 14px;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid rgba(247, 241, 227, 0.16);
          color: #F7F1E3;
          display: flex; flex-direction: column; gap: 8px;
        }
        .fcard-glass-row {
          display: flex; align-items: flex-start; gap: 12px;
        }
        .fcard-title {
          flex: 1;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px; font-weight: 600;
          line-height: 1.2;
          color: #FFFDF8; margin: 0;
          cursor: pointer;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          letter-spacing: -0.01em;
        }
        .fcard-title:hover { color: #F0D9A8; }
        .fcard-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 16px; font-weight: 600;
          color: #F0D9A8;
          white-space: nowrap;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
        }
        .fcard-meta {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px;
          color: rgba(247, 241, 227, 0.8);
          overflow: hidden;
        }
        .fcard-seller {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 160px; font-weight: 500;
        }
        .fcard-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(247, 241, 227, 0.5); flex-shrink: 0;
        }
        .fcard-loc {
          display: inline-flex; align-items: center; gap: 3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .fcard-delivery {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 7px; border-radius: 6px;
          background: rgba(247, 241, 227, 0.16);
          font-size: 10px; font-weight: 600;
        }
        .fcard-actions {
          display: flex; align-items: center; gap: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(247, 241, 227, 0.16);
        }
        .fcard-action {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px;
          background: rgba(247, 241, 227, 0.14);
          border: none; cursor: pointer;
          border-radius: 8px;
          font-family: inherit;
          font-size: 11.5px; font-weight: 600;
          color: #F7F1E3;
          transition: background 0.18s, transform 0.15s;
        }
        .fcard-action:hover { background: rgba(247, 241, 227, 0.24); }
        .fcard-msg {
          margin-left: auto;
          background: #F7F1E3; color: #201F1B;
        }
        .fcard-msg:hover { background: #F0D9A8; }
        .fcard-msg:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ---------- Feed sections ---------- */
        .section {
          max-width: 1200px;
          margin: 22px auto 0;
          padding: 0 20px;
        }
        .section-head {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 12px;
        }
        .section-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600; font-size: 17px;
          margin: 0; color: #201F1B;
          letter-spacing: -0.01em;
          display: inline-flex; align-items: baseline; gap: 8px;
        }
        .section-title-count {
          font-family: 'Work Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #9C9482;
        }
        .section-tag {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700;
          color: #BC5B34;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .filter-btn {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid #EFE6CE; background: #FFFDF8;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: border-color 0.2s, transform 0.15s;
        }
        .filter-btn:hover { border-color: #BC5B34; transform: translateY(-1px); }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; } }
        @media (min-width: 1024px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; } }

        /* ---------- Product compact card ---------- */
        .pcard {
          display: flex; flex-direction: column;
          background: #FFFDF8;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 1px 2px rgba(22, 38, 31, 0.04),
            0 0 0 1px rgba(239, 230, 206, 0.85);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .pcard:hover {
          transform: translateY(-3px);
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.05),
            0 18px 36px rgba(22, 38, 31, 0.1),
            0 0 0 1px rgba(217, 199, 158, 0.9);
        }
        .pcard-media {
          position: relative;
          width: 100%;
          background: #F0E9D6;
          overflow: hidden;
          cursor: pointer;
        }
        .pcard-img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .pcard:hover .pcard-img { transform: scale(1.05); }
        .pcard-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .pcard-heart {
          position: absolute;
          top: 8px; right: 8px;
          width: 28px; height: 28px;
          border: none; cursor: pointer;
          border-radius: 999px;
          background: rgba(22, 38, 31, 0.5);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .pcard-heart:hover { background: rgba(22, 38, 31, 0.72); transform: scale(1.06); }
        .pcard-heart.liked { background: rgba(188, 91, 52, 0.92); animation: heartPop 0.35s ease; }
        @keyframes heartPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .pcard-delivery {
          position: absolute;
          bottom: 8px; left: 8px;
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          border-radius: 6px;
          background: rgba(22, 38, 31, 0.75);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .pcard-body {
          padding: 10px 12px 11px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .pcard-price { display: flex; align-items: baseline; }
        .pcard-price-value {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15.5px; font-weight: 600;
          color: #24453B;
          letter-spacing: -0.015em;
          font-variant-numeric: tabular-nums;
        }
        .pcard-price-muted {
          font-size: 11.5px;
          color: #9C9482;
          font-style: italic;
          font-weight: 500;
        }
        .pcard-title {
          font-size: 13px; font-weight: 600; line-height: 1.32;
          color: #201F1B; margin: 0; cursor: pointer;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          letter-spacing: -0.005em;
        }
        .pcard-title:hover { color: #24453B; }
        .pcard-meta {
          display: flex; align-items: center; gap: 5px;
          font-size: 10.5px; color: #9C9482;
          overflow: hidden;
          margin-top: 1px;
        }
        .pcard-avatar {
          width: 18px; height: 18px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9.5px; font-weight: 700;
          flex-shrink: 0;
        }
        .pcard-seller {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 90px;
          font-weight: 500;
        }
        .pcard-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: #D9C79E; flex-shrink: 0;
        }
        .pcard-loc {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pcard-actions {
          display: flex; align-items: center; gap: 4px;
          margin-top: 3px; padding-top: 8px;
          border-top: 1px solid #F2EBD9;
        }
        .pcard-icon-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none;
          padding: 5px 7px; border-radius: 8px;
          font-size: 11px; font-weight: 500;
          color: #8A8578; cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, color 0.15s, transform 0.1s;
        }
        .pcard-icon-btn:hover { background: rgba(217, 154, 59, 0.09); color: #201F1B; }
        .pcard-icon-btn:active { transform: scale(0.96); }
        .pcard-icon-btn.liked { color: #BC5B34; font-weight: 600; }
        .pcard-msg {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 5px;
          background: #24453B; color: #F7F1E3;
          padding: 5px 10px; border-radius: 8px;
          border: none; cursor: pointer;
          font-family: inherit;
          font-size: 10.5px; font-weight: 600;
          transition: background 0.2s, transform 0.15s;
        }
        .pcard-msg:hover { background: #BC5B34; }
        .pcard-msg:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ---------- Businesses ---------- */
        .biz-section { padding-bottom: 10px; }
        .biz-scroll {
          display: flex; gap: 10px;
          overflow-x: auto; scrollbar-width: none;
          padding-bottom: 2px;
        }
        .biz-scroll::-webkit-scrollbar { display: none; }
        .biz-card {
          flex: 0 0 auto;
          display: flex; align-items: center; gap: 10px;
          width: 170px; background: #FFFDF8;
          border: 1px solid #EFE6CE; border-radius: 12px;
          padding: 9px 11px; text-align: left;
          cursor: pointer; font-family: inherit;
          transition: border-color 0.2s, transform 0.15s;
        }
        .biz-card:hover { border-color: #D9C79E; transform: translateY(-1px); }
        .biz-logo {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: #F7F1E3; border: 1px solid #EFE6CE;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .biz-logo img { width: 100%; height: 100%; object-fit: cover; }
        .biz-text { min-width: 0; }
        .biz-name {
          font-size: 12px; font-weight: 600; color: #201F1B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .biz-cat {
          font-size: 10px; color: #9C9482; margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ---------- Comments pop-up ---------- */
        .pop-overlay {
          position: fixed; inset: 0;
          z-index: 200;
          background: rgba(22, 38, 31, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: popFade 0.2s ease;
        }
        @keyframes popFade { from { opacity: 0; } to { opacity: 1; } }
        .pop {
          width: 100%;
          max-width: 560px;
          max-height: 78vh;
          background: #FFFDF8;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          box-shadow: 0 -20px 60px rgba(22, 38, 31, 0.3);
          display: flex; flex-direction: column;
          animation: popUp 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
          overflow: hidden;
        }
        @keyframes popUp {
          from { transform: translateY(40px); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          .pop { margin-bottom: 24px; border-radius: 20px; }
        }
        .pop-handle {
          width: 42px; height: 4px;
          background: #E4D9BD; border-radius: 4px;
          margin: 8px auto 0; flex-shrink: 0;
        }
        .pop-preview {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px 10px;
          border-bottom: 1px solid #EFE6CE;
          flex-shrink: 0;
        }
        .pop-thumb {
          width: 42px; height: 42px; border-radius: 10px;
          overflow: hidden; background: #F0E9D6;
          flex-shrink: 0; border: 1px solid #EFE6CE;
        }
        .pop-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pop-thumb-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .pop-preview-text { flex: 1; min-width: 0; }
        .pop-preview-title {
          font-size: 13px; font-weight: 600; color: #201F1B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pop-preview-sub {
          font-size: 11px; color: #9C9482; margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pop-close {
          width: 30px; height: 30px;
          border-radius: 8px;
          border: 1px solid #EFE6CE;
          background: #FFFDF8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.18s, border-color 0.18s;
        }
        .pop-close:hover { background: #F7F1E3; border-color: #D9C79E; }
        .pop-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 12px 14px 18px;
          background: #FFFDF8;
        }

        /* ---------- Empty state ---------- */
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
          .hero-block { padding: 22px 16px 48px; }
          .hero-title { font-size: 22px; }
          .hero-desc { font-size: 12.5px; }
          .search-sticky { padding: 0 16px 10px; }
          .spotlight-header { padding: 0 16px; }
          .spotlight-scroll { padding: 4px 16px 8px; }
          .spot-tile { width: 132px; }
          .cats-wrap { padding: 0 16px; }
          .tabs-section { padding: 12px 16px 0; }
          .featured-wrap { padding: 0 16px; }
          .section { padding: 0 16px; }
          .grid { gap: 10px; }
          .pcard-title { font-size: 12.5px; }
          .pcard-price-value { font-size: 14.5px; }
          .fcard-title { font-size: 15px; }
          .fcard-price { font-size: 14.5px; }
          .fcard-glass { left: 10px; right: 10px; bottom: 10px; padding: 11px 13px 10px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pcard, .pcard-img, .pcard-heart, .pcard-icon-btn, .pcard-msg,
          .fcard-media, .fcard-img, .fcard-heart, .fcard-action, .fcard-msg,
          .spot-tile, .spot-media img, .search-btn, .filter-btn, .biz-card,
          .nav-icon-wrap, .pop, .pop-overlay { transition: none; animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Landing;