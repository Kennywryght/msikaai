// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI } from '../services/api';
import { useTranslation } from '../context/TranslationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

const Icon = ({ d, size = 22, color = 'currentColor', strokeWidth = 1.75, className = '' }) => (
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

const ICONS = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  arrowRight: "M5 12h14m-7-7l7 7-7 7",
  chevronDown: "M19 9l-7 7-7-7",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
  hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
  wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
  bag: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
  coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
  shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
  award: "M12 15l-3.5 2 1.33-4.5-3.33-2.5h4.17L12 6l1.33 4h4.17l-3.33 2.5L15.5 17 12 15z",
  trending: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  check: "M20 6L9 17l-5-5",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  tool: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
};

const CATEGORIES = [
  { label: 'All', iconKey: 'store', color: '#6B7280' },
  { label: 'Farm Inputs', iconKey: 'wheat', color: '#10B981' },
  { label: 'Construction', iconKey: 'hammer', color: '#F59E0B' },
  { label: 'Plumber', iconKey: 'wrench', color: '#3B82F6' },
  { label: 'Retail', iconKey: 'bag', color: '#8B5CF6' },
  { label: 'Restaurant', iconKey: 'coffee', color: '#EF4444' },
  { label: 'Tailor', iconKey: 'shirt', color: '#EC4899' },
  { label: 'Hardware', iconKey: 'tool', color: '#F97316' },
];

const LOCATIONS = [
  'All Areas',
  'Mitundu Trading Centre',
  'Bunda',
  'Chimbiri',
  'Motolosi',
  'Chingala',
  'Mlale',
  'Surrounding Areas',
];

const FEATURED_SLIDES = [
  {
    id: 1,
    title: '🌾 Fresh Farm Produce',
    description: 'Direct from local farmers',
    cta: 'Explore',
    link: '/search?category=Farm Inputs',
    bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
    accent: '#10B981'
  },
  {
    id: 2,
    title: '🔧 Skilled Tradespeople',
    description: 'Plumbers, electricians & more',
    cta: 'Find Services',
    link: '/search?category=Plumber',
    bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
    accent: '#3B82F6'
  },
  {
    id: 3,
    title: '🛍️ Local Shopping',
    description: 'Shops, restaurants & tailors',
    cta: 'Shop Now',
    link: '/search?category=Retail',
    bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    accent: '#8B5CF6'
  },
];

const Landing = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [showFilters, setShowFilters] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCarousel, setShowCarousel] = useState(true);
  const [likedItems, setLikedItems] = useState({});
  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  
  const searchInputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  // Auto-play carousel
  useEffect(() => {
    if (!showCarousel) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURED_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [showCarousel]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleLike = (itemId) => {
    setLikedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleCommentSubmit = (itemId) => {
    const text = commentText[itemId]?.trim();
    if (!text) return;
    setComments(prev => ({
      ...prev,
      [itemId]: [
        ...(prev[itemId] || []),
        { id: Date.now(), user: user?.email?.split('@')[0] || 'User', text, time: 'Just now' }
      ]
    }));
    setCommentText(prev => ({ ...prev, [itemId]: '' }));
  };

  const toggleComments = (itemId) => {
    setShowComments(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, bizResponse] = await Promise.all([
          listingsAPI.search({ limit: 50 }),
          businessAPI.getAll({ limit: 20 }).catch(() => ({ data: { businesses: [] } }))
        ]);
        
        if (!mounted) return;
        
        let listingsData = listingsRes.data?.listings || [];
        
        if (listingsData.length === 0 && bizResponse.data?.businesses?.length > 0) {
          listingsData = bizResponse.data.businesses.map((b) => ({
            id: `biz-${b.id}`,
            title: b.business_name,
            description: b.description || 'Business in Mitundu',
            category: b.category,
            price: null,
            images: b.logo_url ? [b.logo_url] : [],
            businesses: { business_name: b.business_name },
            created_at: b.created_at,
            is_business: true,
            location_area: b.location_text || 'Mitundu Trading Centre',
            delivery_available: b.delivery_available || false,
            business_id: b.id,
            likes: Math.floor(Math.random() * 20),
            comments_count: Math.floor(Math.random() * 5),
          }));
        }
        
        listingsData = listingsData.map(item => ({
          ...item,
          likes: item.likes || Math.floor(Math.random() * 15),
          comments_count: item.comments_count || Math.floor(Math.random() * 5),
        }));
        
        if (mounted) setAllListings(listingsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, []);

  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allListings.filter((item) => {
      const categoryMatch = selectedCategory === 'All' || 
        item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const locationMatch = selectedLocation === 'All Areas' ||
        (item.location_area && item.location_area.includes(selectedLocation)) ||
        (item.address && item.address.includes(selectedLocation));
      const searchMatch = !query ||
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.businesses?.business_name?.toLowerCase().includes(query);
      return categoryMatch && locationMatch && searchMatch;
    });
  }, [allListings, selectedCategory, selectedLocation, searchQuery]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }, [searchQuery, navigate]);

  const handleListingClick = useCallback((item) => {
    if (item.is_business) {
      navigate(`/search?q=${encodeURIComponent(item.title)}`);
    } else {
      navigate(`/listing/${item.id}`);
    }
  }, [navigate]);

  const formatPrice = useCallback((price) => {
    if (!price) return 'Price on request';
    return `MWK ${Number(price).toLocaleString()}`;
  }, []);

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading marketplace..." />;
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/landing" className="logo">
            <span className="logo-icon">K</span>
            <span className="logo-text">Kumsika</span>
          </Link>
          <div className="nav-actions">
            <span className="greeting">👋 {user?.email?.split('@')[0] || 'User'}</span>
            <button onClick={handleLogout} className="logout-btn">
              <Icon d={ICONS.logout} size={16} color="#EF4444" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Find what you need,<br />
            <span className="hero-highlight">right here.</span>
          </h1>
          <p className="hero-subtitle">Local products, services, and tradespeople in Mitundu.</p>
          <form onSubmit={handleSearch} className="search-box">
            <Icon d={ICONS.search} size={18} color="#94A3B8" strokeWidth={1.75} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Go</button>
          </form>
        </div>
      </section>

      {/* Carousel */}
      {showCarousel && (
        <div className="carousel-wrap">
          <div className="carousel">
            <button className="carousel-skip" onClick={() => setShowCarousel(false)}>✕</button>
            <div 
              className="carousel-slide"
              style={{ background: FEATURED_SLIDES[currentSlide].bg }}
            >
              <div className="slide-content">
                <h2 className="slide-title">{FEATURED_SLIDES[currentSlide].title}</h2>
                <p className="slide-desc">{FEATURED_SLIDES[currentSlide].description}</p>
                <button 
                  className="slide-cta"
                  style={{ background: FEATURED_SLIDES[currentSlide].accent }}
                  onClick={() => navigate(FEATURED_SLIDES[currentSlide].link)}
                >
                  {FEATURED_SLIDES[currentSlide].cta}
                </button>
              </div>
            </div>
            <div className="carousel-dots">
              {FEATURED_SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === currentSlide ? 'dot-active' : ''}`}
                  onClick={() => setCurrentSlide(i)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <section className="categories">
        <div className="categories-scroll">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                className={`category-item ${active ? 'category-active' : ''}`}
                onClick={() => setSelectedCategory(cat.label)}
                style={active ? { background: cat.color, color: '#fff' } : {}}
              >
                <Icon d={ICONS[cat.iconKey]} size={16} color={active ? '#fff' : cat.color} strokeWidth={1.75} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Listings */}
      <section className="listings">
        <div className="listings-header">
          <div>
            <h2 className="listings-title">Latest</h2>
            <span className="listings-count">{filteredListings.length} items</span>
          </div>
          <button className="filter-btn" onClick={() => setShowFilters(!showFilters)}>
            <Icon d={ICONS.filter} size={16} color="#1E293B" strokeWidth={1.75} />
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Location</label>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <button className="apply-filters" onClick={() => setShowFilters(false)}>Apply</button>
          </div>
        )}

        <div className="listings-grid">
          {filteredListings.length > 0 ? (
            filteredListings.map((item) => {
              const isLiked = likedItems[item.id] || false;
              const itemComments = comments[item.id] || [];
              const showCommentsForItem = showComments[item.id] || false;

              return (
                <div key={item.id} className="listing-card" onClick={() => handleListingClick(item)}>
                  <div className="card-media">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="card-img" loading="lazy" />
                    ) : (
                      <div className="card-placeholder">
                        <Icon d={ICONS.store} size={32} color="#CBD5E1" strokeWidth={1.5} />
                      </div>
                    )}
                    {item.delivery_available && (
                      <span className="delivery-badge">
                        <Icon d={ICONS.truck} size={10} color="#FFF" strokeWidth={2} />
                      </span>
                    )}
                    <button 
                      className="like-btn"
                      onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                    >
                      <Icon 
                        d={ICONS.heart} 
                        size={14} 
                        color={isLiked ? '#EF4444' : '#94A3B8'} 
                        strokeWidth={isLiked ? 2.5 : 1.5}
                        fill={isLiked ? '#EF4444' : 'none'}
                      />
                    </button>
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{item.title}</h3>
                    <span className="card-category">{item.category}</span>
                    <div className="card-footer">
                      <span className="card-price">{formatPrice(item.price)}</span>
                      <div className="card-stats">
                        <button 
                          className="stat-btn"
                          onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                        >
                          ♥ {item.likes + (isLiked ? 1 : 0)}
                        </button>
                        <button 
                          className="stat-btn"
                          onClick={(e) => { e.stopPropagation(); toggleComments(item.id); }}
                        >
                          💬 {item.comments_count + itemComments.length}
                        </button>
                      </div>
                    </div>
                    {showCommentsForItem && (
                      <div className="comments" onClick={(e) => e.stopPropagation()}>
                        {itemComments.map((comment) => (
                          <div key={comment.id} className="comment">
                            <strong>{comment.user}</strong> {comment.text}
                          </div>
                        ))}
                        <div className="comment-input">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentText[item.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCommentSubmit(item.id); }}
                          />
                          <button onClick={() => handleCommentSubmit(item.id)}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">
              <Icon d={ICONS.store} size={48} color="#CBD5E1" strokeWidth={1.5} />
              <h3>No listings found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </section>

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
            const active = item.id === 'home';
            return (
              <button key={item.id} className="nav-item" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon ${active ? 'nav-icon-active' : ''}`}>
                  <Icon d={ICONS[item.icon]} size={20} color={active ? '#FFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'nav-label-active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="footer-logo-icon">K</span>
              <span className="footer-logo-name">Kumsika</span>
            </div>
            <p className="footer-desc">Local marketplace for Mitundu and surrounding areas.</p>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Kumsika</span>
            <span>📍 Mitundu, Malawi</span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .app {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .app { padding-bottom: 0; }
        }

        /* ===== NAVBAR ===== */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
          transition: all 0.2s;
        }

        .navbar-scrolled {
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: #1E293B;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F59E0B;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: -0.5px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .greeting {
          font-size: 13px;
          color: #64748B;
          display: none;
        }

        @media (min-width: 640px) {
          .greeting { display: inline; }
        }

        .logout-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #FEF2F2;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #FEE2E2;
        }

        /* ===== HERO ===== */
        .hero {
          background: #FFFFFF;
          padding: 32px 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .hero-inner {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .hero-title {
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 700;
          letter-spacing: -0.5px;
          margin: 0 0 8px;
          line-height: 1.1;
        }

        .hero-highlight {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 15px;
          color: #64748B;
          margin: 0 0 20px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 480px;
          margin: 0 auto;
          background: #F1F5F9;
          border-radius: 12px;
          padding: 4px 4px 4px 12px;
          border: 2px solid transparent;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #F59E0B;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.08);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 8px 0;
          font-size: 15px;
          font-family: inherit;
          color: #1E293B;
        }

        .search-btn {
          padding: 8px 20px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .search-btn:hover {
          background: #F59E0B;
        }

        /* ===== CAROUSEL ===== */
        .carousel-wrap {
          padding: 0 16px;
          max-width: 1200px;
          margin: 16px auto 0;
        }

        .carousel {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .carousel-skip {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 10;
          background: rgba(255,255,255,0.85);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .carousel-slide {
          padding: 28px 24px;
          min-height: 140px;
          display: flex;
          align-items: center;
        }

        .slide-content {
          max-width: 70%;
        }

        .slide-title {
          font-size: clamp(18px, 2vw, 24px);
          font-weight: 700;
          margin: 0 0 4px;
        }

        .slide-desc {
          font-size: 14px;
          color: #475569;
          margin: 0 0 12px;
        }

        .slide-cta {
          padding: 6px 18px;
          border: none;
          border-radius: 8px;
          color: #FFF;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .slide-cta:hover {
          transform: scale(0.97);
          opacity: 0.9;
        }

        .carousel-dots {
          display: flex;
          gap: 6px;
          justify-content: center;
          padding: 10px 0 12px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          border: none;
          background: #E2E8F0;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s;
        }

        .dot-active {
          background: #F59E0B;
          width: 20px;
          border-radius: 3px;
        }

        /* ===== CATEGORIES ===== */
        .categories {
          padding: 12px 0;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
        }

        .categories-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 0 16px;
          max-width: 1200px;
          margin: 0 auto;
          scrollbar-width: none;
        }

        .categories-scroll::-webkit-scrollbar {
          display: none;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s;
          font-family: inherit;
        }

        .category-item:hover {
          border-color: #94A3B8;
        }

        .category-active {
          border-color: transparent;
          color: #FFF !important;
        }

        /* ===== LISTINGS ===== */
        .listings {
          padding: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .listings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .listings-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
        }

        .listings-count {
          font-size: 13px;
          color: #94A3B8;
          margin-left: 8px;
        }

        .filter-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          border-color: #94A3B8;
        }

        .filters-panel {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #E2E8F0;
        }

        .filter-group {
          margin-bottom: 12px;
        }

        .filter-group label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 4px;
        }

        .filter-group select {
          width: 100%;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          font-size: 14px;
          font-family: inherit;
          background: #FFFFFF;
          outline: none;
        }

        .apply-filters {
          width: 100%;
          padding: 10px;
          background: #1E293B;
          border: none;
          border-radius: 8px;
          color: #FFF;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .apply-filters:hover {
          background: #F59E0B;
        }

        /* ===== LISTINGS GRID ===== */
        .listings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
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

        /* ===== LISTING CARD ===== */
        .listing-card {
          background: #FFFFFF;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #F1F5F9;
          cursor: pointer;
          transition: all 0.2s;
        }

        .listing-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }

        .card-media {
          position: relative;
          height: 120px;
          background: #F8FAFC;
          overflow: hidden;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F1F5F9;
        }

        .delivery-badge {
          position: absolute;
          top: 6px;
          left: 6px;
          background: #10B981;
          border-radius: 6px;
          padding: 2px 6px;
        }

        .like-btn {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(4px);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .like-btn:hover {
          transform: scale(1.05);
        }

        .card-body {
          padding: 10px 12px 12px;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          margin: 0 0 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-category {
          font-size: 11px;
          color: #94A3B8;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
        }

        .card-price {
          font-size: 13px;
          font-weight: 700;
          color: #10B981;
        }

        .card-stats {
          display: flex;
          gap: 8px;
        }

        .stat-btn {
          background: none;
          border: none;
          font-size: 11px;
          color: #94A3B8;
          cursor: pointer;
          font-family: inherit;
          padding: 2px 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .stat-btn:hover {
          background: #F1F5F9;
        }

        /* ===== COMMENTS ===== */
        .comments {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #F1F5F9;
        }

        .comment {
          font-size: 12px;
          color: #475569;
          padding: 2px 0;
        }

        .comment strong {
          color: #1E293B;
        }

        .comment-input {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }

        .comment-input input {
          flex: 1;
          padding: 4px 10px;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          font-size: 12px;
          outline: none;
          font-family: inherit;
        }

        .comment-input input:focus {
          border-color: #F59E0B;
        }

        .comment-input button {
          padding: 4px 14px;
          background: #1E293B;
          border: none;
          border-radius: 6px;
          color: #FFF;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        /* ===== EMPTY ===== */
        .empty {
          text-align: center;
          padding: 48px 20px;
          grid-column: 1 / -1;
        }

        .empty h3 {
          margin: 8px 0 4px;
          font-size: 16px;
        }

        .empty p {
          color: #94A3B8;
          font-size: 14px;
          margin: 0;
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226,232,240,0.4);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }

        .nav-item {
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

        .nav-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label-active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== FOOTER ===== */
        .footer {
          background: #1E293B;
          padding: 24px 16px 12px;
          margin-top: 16px;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-brand {
          margin-bottom: 16px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-logo-icon {
          width: 28px;
          height: 28px;
          background: #F59E0B;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: #1E293B;
        }

        .footer-logo-name {
          font-size: 16px;
          font-weight: 700;
          color: #FFFFFF;
        }

        .footer-desc {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          margin: 4px 0 0;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 380px) {
          .listings-grid {
            gap: 8px;
          }
          .card-media {
            height: 100px;
          }
          .card-body {
            padding: 8px 10px 10px;
          }
          .card-title {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;