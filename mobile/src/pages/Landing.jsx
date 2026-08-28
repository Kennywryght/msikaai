// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingsAPI, businessAPI } from '../services/api';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../context/TranslationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

// ============================================================
// PREMIUM PENCIL-LIKE ICONS (Feather style)
// ============================================================
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
  // Navigation
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  arrowRight: "M5 12h14m-7-7l7 7-7 7",
  arrowUpRight: "M7 7h10v10M7 17L17 7",
  chevronDown: "M19 9l-7 7-7-7",
  chevronRight: "M9 5l7 7-7 7",
  
  // Categories
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
  hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
  wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
  bag: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
  coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
  shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
  tool: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
  
  // Features
  mic: "M19 10v2a7 7 0 01-14 0v-2M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM8 21h8",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4",
  
  // Actions
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  check: "M20 6L9 17l-5-5",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  award: "M12 15l-3.5 2 1.33-4.5-3.33-2.5h4.17L12 6l1.33 4h4.17l-3.33 2.5L15.5 17 12 15z",
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
};

// ============================================================
// DATA
// ============================================================
const CATEGORIES = [
  { label: 'All', iconKey: 'store' },
  { label: 'Farm Inputs', iconKey: 'wheat' },
  { label: 'Construction', iconKey: 'hammer' },
  { label: 'Plumber', iconKey: 'wrench' },
  { label: 'Retail', iconKey: 'bag' },
  { label: 'Restaurant', iconKey: 'coffee' },
  { label: 'Tailor', iconKey: 'shirt' },
  { label: 'Hardware', iconKey: 'tool' },
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

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Grace Mwale',
    role: 'Smallholder Farmer',
    image: null,
    quote: 'MsikaAI transformed how I buy farm inputs. I found quality suppliers at better prices within my community.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Peter Banda',
    role: 'Construction Contractor',
    image: null,
    quote: 'Finding reliable plumbers and hardware used to be a headache. Now I just search and connect in minutes.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Chifundo Mhango',
    role: 'Restaurant Owner',
    image: null,
    quote: 'I discovered local suppliers I never knew existed. The voice search saves me so much time!',
    rating: 4,
  },
];

const STATS = [
  { value: '500+', label: 'Listings' },
  { value: '50+', label: 'Sellers' },
  { value: '8', label: 'Categories' },
  { value: '24/7', label: 'Access' },
];

const FEATURES = [
  { icon: 'mic', title: 'Voice-Powered', desc: 'List and search using voice — no typing needed.' },
  { icon: 'mapPin', title: 'Hyperlocal', desc: 'Find sellers within walking distance.' },
  { icon: 'bot', title: 'AI Assistant', desc: 'Smart recommendations and personalized results.' },
  { icon: 'shield', title: 'Trust & Safety', desc: 'All sellers verified with community backing.' },
];

const BOTTOM_NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'sell', label: 'Sell', icon: 'plus' },
  { id: 'messages', label: 'Messages', icon: 'message' },
  { id: 'profile', label: 'Profile', icon: 'user' },
];

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [activeTab, setActiveTab] = useState('buy');
  const [showFilters, setShowFilters] = useState(false);
  
  const searchInputRef = useRef(null);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024;

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

  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setShowFilters(false);
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

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
        item.businesses?.business_name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);
      return categoryMatch && locationMatch && searchMatch;
    });
  }, [allListings, selectedCategory, selectedLocation, searchQuery]);

  const trendingListings = useMemo(() => {
    return allListings.filter(item => item.images && item.images.length > 0).slice(0, 6);
  }, [allListings]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
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
          }));
        }
        
        if (mounted) setAllListings(listingsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (mounted) {
          setError('Could not load market listings. Please refresh the page.');
          showToast('Could not load market listings. Please refresh the page.', 'error');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchData();
    return () => { mounted = false; };
  }, [showToast]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
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
    if (id === 'home') navigate('/');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/login');
    else if (id === 'messages') navigate('/login');
    else if (id === 'profile') navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Discovering local products..." />;
  }

  return (
    <div style={styles.app}>
      <GlobalStyle isMobile={isMobile} />

      {/* ============================================================
      TOP NAVBAR - Glass effect
      ============================================================ */}
      <nav style={{ ...styles.navbar, ...(isScrolled ? styles.navbarScrolled : {}) }}>
        <div style={styles.navbarContainer}>
          <Link to="/" style={styles.navLogo}>
            <div style={styles.navLogoIcon}>
              <span style={styles.navLogoText}>M</span>
            </div>
            <span style={styles.navLogoName}>Msika<span style={styles.navLogoAccent}>AI</span></span>
          </Link>

          {!isMobile && (
            <form onSubmit={handleSearch} style={styles.navSearch}>
              <Icon d={ICONS.search} size={18} color="#94A3B8" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.navSearchInput}
              />
              <kbd style={styles.navSearchKbd}>⌘K</kbd>
            </form>
          )}

          <div style={styles.navActions}>
            {!isMobile && (
              <>
                <LanguageToggle />
                <Link to="/login">
                  <button style={styles.navActionBtnOutline}>Sign In</button>
                </Link>
              </>
            )}
            <Link to="/login">
              <button style={styles.navActionBtnPrimary}>
                <Icon d={ICONS.plus} size={isMobile ? 18 : 16} color="#FFFFFF" strokeWidth={2} />
                {!isMobile && 'Sell'}
              </button>
            </Link>
            {isMobile && (
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={styles.hamburgerBtn}>
                <Icon d={ICONS.menu} size={24} color="#1E293B" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>

        {isMobile && (
          <form onSubmit={handleSearch} style={styles.mobileSearchBar}>
            <Icon d={ICONS.search} size={18} color="#94A3B8" strokeWidth={1.75} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.mobileSearchInput}
            />
            <button type="submit" style={styles.mobileSearchBtn}>
              <Icon d={ICONS.search} size={18} color="#FFFFFF" strokeWidth={1.75} />
            </button>
          </form>
        )}
      </nav>

      {/* ============================================================
      MOBILE MENU OVERLAY - Smooth
      ============================================================ */}
      {isMobileMenuOpen && (
        <div style={styles.mobileMenuOverlay} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div style={styles.mobileMenuHeader}>
              <span style={styles.mobileMenuTitle}>Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} style={styles.mobileMenuClose}>
                <Icon d={ICONS.close} size={24} color="#1E293B" strokeWidth={1.75} />
              </button>
            </div>
            
            <div style={styles.mobileMenuItems}>
              <button style={styles.mobileMenuItem} onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
                <Icon d={ICONS.home} size={20} color="#1E293B" strokeWidth={1.75} /> Home
              </button>
              <button style={styles.mobileMenuItem} onClick={() => { navigate('/search'); setIsMobileMenuOpen(false); }}>
                <Icon d={ICONS.search} size={20} color="#1E293B" strokeWidth={1.75} /> Browse
              </button>
              <button style={styles.mobileMenuItem} onClick={() => { navigate('/about'); setIsMobileMenuOpen(false); }}>
                <Icon d={ICONS.globe} size={20} color="#1E293B" strokeWidth={1.75} /> About
              </button>
            </div>
            
            <div style={styles.mobileMenuDivider} />
            
            <div style={styles.mobileMenuAuth}>
              <LanguageToggle />
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ width: '100%' }}>
                <button style={styles.mobileNavBtnOutline}>Sign In</button>
              </Link>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} style={{ width: '100%' }}>
                <button style={styles.mobileNavBtnPrimary}>
                  <Icon d={ICONS.plus} size={16} color="#FFFFFF" strokeWidth={2} />
                  Start Selling
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
      HERO - Gradient background
      ============================================================ */}
      <section style={styles.hero}>
        <div style={styles.heroGradient} />
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>
              <Icon d={ICONS.zap} size={14} color="#1E293B" strokeWidth={2.5} />
              <span>Mitundu's Marketplace</span>
            </div>
            
            <h1 style={styles.heroTitle}>
              The stall next door,<br />
              <span style={styles.heroHighlight}>now online.</span>
            </h1>
            
            <p style={styles.heroDesc}>
              Find real traders, tailors, and tradespeople around Mitundu — 
              search by voice, browse by area, and buy locally.
            </p>
            
            <div style={styles.heroActions}>
              <Link to="/login" style={{ flex: 1 }}>
                <button style={styles.heroBtnPrimary}>
                  <Icon d={ICONS.search} size={18} color="#1E293B" strokeWidth={1.75} />
                  Browse
                </button>
              </Link>
              <Link to="/login" style={{ flex: 1 }}>
                <button style={styles.heroBtnSecondary}>
                  <Icon d={ICONS.plus} size={18} color="#FFFFFF" strokeWidth={2} />
                  Sell
                </button>
              </Link>
            </div>

            <div style={styles.heroStats}>
              {STATS.map((stat, i) => (
                <div key={i} style={styles.heroStat}>
                  <span style={styles.heroStatValue}>{stat.value}</span>
                  <span style={styles.heroStatLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
      CATEGORY SCROLL - Smooth horizontal
      ============================================================ */}
      <section style={styles.categorySection}>
        <div style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                style={{ ...styles.categoryChip, ...(isActive ? styles.categoryChipActive : {}) }}
              >
                <Icon d={ICONS[cat.iconKey]} size={16} color={isActive ? '#FFFFFF' : '#64748B'} strokeWidth={1.75} />
                <span style={isActive ? { color: '#FFFFFF' } : { color: '#475569' }}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================
      FEATURES - Clean cards
      ============================================================ */}
      <section style={styles.features}>
        <div style={styles.featuresContainer}>
          <div style={styles.featuresHeader}>
            <span style={styles.featuresBadge}>Why MsikaAI</span>
            <h2 style={styles.featuresTitle}>
              Built for <span style={styles.featuresHighlight}>local trade</span>
            </h2>
          </div>
          
          <div style={styles.featuresGrid}>
            {FEATURES.map((feature, i) => (
              <div key={i} style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <Icon d={ICONS[feature.icon]} size={24} color="#10B981" strokeWidth={1.5} />
                </div>
                <h4 style={styles.featureCardTitle}>{feature.title}</h4>
                <p style={styles.featureCardDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
      TRENDING - Smooth cards
      ============================================================ */}
      {trendingListings.length > 0 && (
        <section style={styles.trending}>
          <div style={styles.trendingContainer}>
            <div style={styles.trendingHeader}>
              <div>
                <span style={styles.trendingBadge}>🔥 Trending</span>
                <h2 style={styles.trendingTitle}>Popular now</h2>
              </div>
              <Link to="/search">
                <button style={styles.trendingViewAll}>See all</button>
              </Link>
            </div>
            
            <div style={styles.trendingGrid}>
              {trendingListings.slice(0, isMobile ? 4 : 6).map((item) => (
                <div key={item.id} style={styles.trendingCard} onClick={() => handleListingClick(item)}>
                  <div style={styles.trendingCardImage}>
                    {item.images && item.images[0] ? (
                      <img src={item.images[0]} alt={item.title} style={styles.trendingCardImg} />
                    ) : (
                      <div style={styles.trendingCardPlaceholder}>
                        <Icon d={ICONS.store} size={28} color="#F59E0B" strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={styles.trendingCardBadge}>Hot</div>
                  </div>
                  <div style={styles.trendingCardContent}>
                    <h4 style={styles.trendingCardTitle}>{item.title}</h4>
                    <p style={styles.trendingCardCategory}>{item.category}</p>
                    <span style={styles.trendingCardPrice}>{formatPrice(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
      LISTINGS - With smooth filters
      ============================================================ */}
      <section style={styles.listingsSection}>
        <div style={styles.listingsContainer}>
          <div style={styles.listingsHeader}>
            <div>
              <h2 style={styles.listingsTitle}>All listings</h2>
              <p style={styles.listingsSubtitle}>{filteredListings.length} items</p>
            </div>
            <button 
              style={styles.listingsFilterBtn}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icon d={ICONS.filter} size={18} color="#1E293B" strokeWidth={1.75} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div style={styles.mobileFilters}>
              <div style={styles.mobileFilterGroup}>
                <label style={styles.mobileFilterLabel}>Category</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={styles.mobileFilterSelect}
                >
                  {CATEGORIES.map((cat) => <option key={cat.label} value={cat.label}>{cat.label}</option>)}
                </select>
              </div>
              <div style={styles.mobileFilterGroup}>
                <label style={styles.mobileFilterLabel}>Location</label>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={styles.mobileFilterSelect}
                >
                  {LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <button style={styles.mobileFilterApply} onClick={() => setShowFilters(false)}>Apply Filters</button>
            </div>
          )}

          {error && (
            <div style={styles.errorBanner}>
              <span>{error}</span>
              <button style={styles.errorBtn} onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {filteredListings.length > 0 ? (
            <div style={styles.listingsGrid}>
              {filteredListings.map((item, index) => {
                const isService = item.category?.toLowerCase().includes('plumber') ||
                  item.category?.toLowerCase().includes('tailor') ||
                  item.category?.toLowerCase().includes('service');
                
                return (
                  <div
                    key={item.id}
                    style={styles.listingCard}
                    onClick={() => handleListingClick(item)}
                  >
                    <div style={styles.cardImageWrapper}>
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} style={styles.cardImage} loading="lazy" />
                      ) : (
                        <div style={styles.cardImagePlaceholder}>
                          <Icon d={ICONS.store} size={32} color="#F59E0B" strokeWidth={1.5} />
                        </div>
                      )}
                      
                      <div style={styles.cardBadges}>
                        <span style={{ ...styles.cardBadge, ...(isService ? styles.cardBadgeService : styles.cardBadgeProduct) }}>
                          {isService ? 'Service' : 'Product'}
                        </span>
                        {item.delivery_available && (
                          <span style={styles.cardDeliveryBadge}>
                            <Icon d={ICONS.truck} size={10} color="#FFFFFF" strokeWidth={2} /> Delivery
                          </span>
                        )}
                      </div>
                      
                      <button style={styles.wishlistBtn} onClick={(e) => e.stopPropagation()}>
                        <Icon d={ICONS.heart} size={16} color="#EF4444" strokeWidth={1.75} />
                      </button>
                    </div>
                    
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{item.title}</h3>
                      <p style={styles.cardCategory}>{item.category}</p>
                      <p style={styles.cardBusiness}>
                        <Icon d={ICONS.store} size={12} color="#F59E0B" strokeWidth={1.75} />
                        {item.businesses?.business_name || 'Local trader'}
                      </p>
                      
                      <div style={styles.cardFooter}>
                        <span style={styles.cardPrice}>{formatPrice(item.price)}</span>
                        <button style={styles.cardActionBtn} onClick={(e) => { e.stopPropagation(); handleListingClick(item); }}>
                          <Icon d={ICONS.arrowRight} size={16} color="#FFFFFF" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Icon d={ICONS.store} size={40} color="#F59E0B" strokeWidth={1.5} />
              <h3 style={styles.emptyTitle}>No listings found</h3>
              <p style={styles.emptyText}>Try adjusting your filters</p>
              <Link to="/login">
                <button style={styles.emptyBtn}>
                  <Icon d={ICONS.plus} size={16} color="#FFFFFF" strokeWidth={2} />
                  Post a listing
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
      TESTIMONIALS - Smooth cards
      ============================================================ */}
      <section style={styles.testimonials}>
        <div style={styles.testimonialsContainer}>
          <div style={styles.testimonialsHeader}>
            <span style={styles.testimonialsBadge}>Testimonials</span>
            <h2 style={styles.testimonialsTitle}>
              What our <span style={styles.testimonialsHighlight}>community</span> says
            </h2>
          </div>
          
          <div style={styles.testimonialsGrid}>
            {TESTIMONIALS.slice(0, isMobile ? 2 : 3).map((t) => (
              <div key={t.id} style={styles.testimonialCard}>
                <div style={styles.testimonialStars}>
                  {[...Array(5)].map((_, i) => (
                    <Icon key={i} d={ICONS.star} size={14} color={i < t.rating ? '#F59E0B' : '#E5E7EB'} strokeWidth={1.5} />
                  ))}
                </div>
                <p style={styles.testimonialQuote}>"{t.quote}"</p>
                <div style={styles.testimonialAuthor}>
                  <div style={styles.testimonialAvatar}>
                    <span style={styles.testimonialAvatarText}>{t.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <div style={styles.testimonialName}>{t.name}</div>
                    <div style={styles.testimonialRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
      CTA - Smooth gradient
      ============================================================ */}
      <section style={styles.cta}>
        <div style={styles.ctaContainer}>
          <div style={styles.ctaContent}>
            <span style={styles.ctaBadge}>
              <Icon d={ICONS.sparkles} size={14} color="#F59E0B" strokeWidth={1.75} />
              Free forever
            </span>
            
            <h2 style={styles.ctaTitle}>Ready to grow?</h2>
            <p style={styles.ctaText}>
              Join 50+ local traders already reaching customers.
            </p>
            
            <div style={styles.ctaButtons}>
              <Link to="/login" style={{ width: '100%' }}>
                <button style={styles.ctaBtnPrimary}>
                  Start selling free
                  <Icon d={ICONS.arrowRight} size={16} color="#1E293B" strokeWidth={2} />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
      BOTTOM NAVIGATION - Smooth glass effect
      ============================================================ */}
      {isMobile && (
        <div style={styles.bottomNav}>
          {BOTTOM_NAV.map((item) => {
            const isActive = item.id === 'home';
            return (
              <button
                key={item.id}
                style={styles.bottomNavItem}
                onClick={() => handleBottomNav(item.id)}
              >
                <div style={{ ...styles.bottomNavIcon, ...(isActive ? styles.bottomNavIconActive : {}) }}>
                  <Icon d={ICONS[item.icon]} size={22} color={isActive ? '#FFFFFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span style={{ ...styles.bottomNavLabel, ...(isActive ? styles.bottomNavLabelActive : {}) }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ============================================================
      FOOTER - Clean
      ============================================================ */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerContent}>
            <div style={styles.footerBrand}>
              <div style={styles.footerLogo}>
                <span style={styles.footerLogoText}>M</span>
                <span style={styles.footerLogoName}>Msika<span style={styles.footerLogoAccent}>AI</span></span>
              </div>
              <p style={styles.footerDesc}>Your trusted local marketplace in Mitundu.</p>
            </div>
            
            <div style={styles.footerLinks}>
              <div style={styles.footerColumn}>
                <h4 style={styles.footerTitle}>Marketplace</h4>
                <Link to="/search" style={styles.footerLink}>Browse</Link>
                <Link to="/create-listing" style={styles.footerLink}>Sell</Link>
              </div>
              <div style={styles.footerColumn}>
                <h4 style={styles.footerTitle}>Support</h4>
                <a href="#" style={styles.footerLink}>Help</a>
                <a href="#" style={styles.footerLink}>Contact</a>
              </div>
            </div>
          </div>
          
          <div style={styles.footerBottom}>
            <p style={styles.footerCopyright}>© {new Date().getFullYear()} MsikaAI</p>
            <p style={styles.footerLocation}>
              <Icon d={ICONS.mapPin} size={12} color="#F59E0B" strokeWidth={1.75} />
              Mitundu, Malawi
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================
// GLOBAL STYLES
// ============================================================
const GlobalStyle = ({ isMobile }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #F8FAFC;
      color: #1E293B;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      ${isMobile ? 'padding-bottom: 80px;' : ''}
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .listing-card { animation: fadeInUp 0.4s ease forwards; }
    .category-chip { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; }
    
    @media (prefers-reduced-motion: reduce) {
      * { animation: none !important; transition: none !important; }
    }
  `}</style>
);

// ============================================================
// STYLES - Production Grade
// ============================================================
const COLORS = {
  primary: '#1E293B',
  primaryLight: '#334155',
  secondary: '#F59E0B',
  accent: '#10B981',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
  shadow: 'rgba(30,41,59,0.06)',
};

const FONTS = {
  display: '"Fraunces", Georgia, serif',
  body: '"Inter", -apple-system, sans-serif',
};

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },

  // ============================================================
  // NAVBAR - Glass effect
  // ============================================================
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(226,232,240,0.5)',
    transition: 'all 0.3s ease',
  },
  navbarScrolled: {
    background: 'rgba(255,255,255,0.95)',
    boxShadow: '0 4px 24px rgba(30,41,59,0.06)',
  },
  navbarContainer: {
    padding: '10px 16px',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  navLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  navLogoIcon: {
    width: '36px',
    height: '36px',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
  },
  navLogoText: {
    color: COLORS.white,
    fontFamily: FONTS.display,
    fontSize: '18px',
    fontWeight: '700',
  },
  navLogoName: {
    fontFamily: FONTS.display,
    fontSize: '18px',
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: '-0.02em',
  },
  navLogoAccent: {
    color: COLORS.secondary,
  },
  navSearch: {
    flex: 1,
    maxWidth: '400px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: COLORS.white,
    borderRadius: '12px',
    padding: '6px 12px',
    border: '1px solid rgba(226,232,240,0.8)',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  navSearchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    background: 'transparent',
    color: COLORS.text,
    fontFamily: FONTS.body,
  },
  navSearchKbd: {
    padding: '2px 8px',
    background: COLORS.background,
    borderRadius: '4px',
    fontSize: '10px',
    color: COLORS.textLight,
    fontFamily: FONTS.body,
    border: '1px solid rgba(226,232,240,0.5)',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  navActionBtnOutline: {
    padding: '6px 16px',
    background: 'transparent',
    border: '1.5px solid rgba(30,41,59,0.12)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease',
  },
  navActionBtnPrimary: {
    padding: '6px 16px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.white,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
  },
  hamburgerBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mobile Search
  mobileSearchBar: {
    padding: '8px 16px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: COLORS.background,
    borderTop: '1px solid rgba(226,232,240,0.3)',
  },
  mobileSearchInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid rgba(226,232,240,0.8)',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    background: COLORS.white,
    color: COLORS.text,
    fontFamily: FONTS.body,
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  mobileSearchBtn: {
    padding: '10px 16px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
  },

  // ============================================================
  // MOBILE MENU
  // ============================================================
  mobileMenuOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(30,41,59,0.4)',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    zIndex: 200,
    animation: 'fadeIn 0.2s ease',
  },
  mobileMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '80%',
    maxWidth: '320px',
    height: '100%',
    background: COLORS.white,
    padding: '20px 20px 30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    animation: 'slideIn 0.3s ease',
    boxShadow: '-4px 0 24px rgba(30,41,59,0.08)',
  },
  mobileMenuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(226,232,240,0.5)',
  },
  mobileMenuTitle: {
    fontFamily: FONTS.display,
    fontSize: '20px',
    fontWeight: '600',
    color: COLORS.primary,
  },
  mobileMenuClose: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
  },
  mobileMenuItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px 0',
  },
  mobileMenuItem: {
    padding: '14px 16px',
    background: 'none',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    color: COLORS.text,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'background 0.15s ease',
  },
  mobileMenuDivider: {
    height: '1px',
    backgroundColor: 'rgba(226,232,240,0.5)',
    margin: '8px 0',
  },
  mobileMenuAuth: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid rgba(226,232,240,0.5)',
  },
  mobileNavBtnOutline: {
    padding: '14px',
    background: 'transparent',
    border: '1.5px solid rgba(30,41,59,0.12)',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.primary,
    width: '100%',
    cursor: 'pointer',
    fontFamily: FONTS.body,
  },
  mobileNavBtnPrimary: {
    padding: '14px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.white,
    width: '100%',
    cursor: 'pointer',
    fontFamily: FONTS.body,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
  },

  // ============================================================
  // HERO - Gradient background
  // ============================================================
  hero: {
    padding: '24px 0 32px',
    background: COLORS.background,
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    position: 'absolute',
    top: '-40%',
    right: '-20%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  heroContainer: {
    padding: '0 16px',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: 'rgba(245,158,11,0.12)',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    color: COLORS.primary,
    width: 'fit-content',
  },
  heroTitle: {
    fontFamily: FONTS.display,
    fontSize: '28px',
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: '1.1',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  heroHighlight: {
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  heroDesc: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: COLORS.textLight,
    margin: 0,
    maxWidth: '480px',
  },
  heroActions: {
    display: 'flex',
    gap: '10px',
  },
  heroBtnPrimary: {
    padding: '12px 20px',
    background: COLORS.secondary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    color: COLORS.primary,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 12px rgba(245,158,11,0.25)',
  },
  heroBtnSecondary: {
    padding: '12px 20px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    color: COLORS.white,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 12px rgba(30,41,59,0.2)',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    paddingTop: '4px',
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  heroStatValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: FONTS.display,
  },
  heroStatLabel: {
    fontSize: '11px',
    color: COLORS.textLight,
  },

  // ============================================================
  // CATEGORY SCROLL
  // ============================================================
  categorySection: {
    padding: '4px 0 16px',
    background: COLORS.background,
  },
  categoryContainer: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    padding: '0 16px',
    scrollbarWidth: 'none',
    WebkitOverflowScrolling: 'touch',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  categoryChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(226,232,240,0.6)',
    background: COLORS.white,
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.textLight,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  categoryChipActive: {
    background: COLORS.primary,
    borderColor: COLORS.primary,
    color: COLORS.white,
    boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
  },

  // ============================================================
  // FEATURES
  // ============================================================
  features: {
    padding: '32px 0',
    background: COLORS.white,
  },
  featuresContainer: {
    padding: '0 16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featuresHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  featuresBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(16,185,129,0.1)',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  featuresTitle: {
    fontFamily: FONTS.display,
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.primary,
    margin: 0,
  },
  featuresHighlight: {
    color: COLORS.secondary,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  featureCard: {
    textAlign: 'center',
    padding: '20px 14px',
    background: COLORS.background,
    borderRadius: '12px',
    border: '1px solid rgba(226,232,240,0.4)',
    transition: 'all 0.2s ease',
  },
  featureIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(16,185,129,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 10px',
  },
  featureCardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: COLORS.primary,
    margin: '0 0 4px',
  },
  featureCardDesc: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: COLORS.textLight,
    margin: 0,
  },

  // ============================================================
  // TRENDING
  // ============================================================
  trending: {
    padding: '32px 0',
    background: COLORS.background,
  },
  trendingContainer: {
    padding: '0 16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  trendingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  trendingBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: '700',
    color: COLORS.secondary,
  },
  trendingTitle: {
    fontFamily: FONTS.display,
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.primary,
    margin: '2px 0 0',
  },
  trendingViewAll: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
    padding: '6px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(226,232,240,0.6)',
    background: COLORS.white,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease',
  },
  trendingGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  trendingCard: {
    background: COLORS.white,
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid rgba(226,232,240,0.4)',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  trendingCardImage: {
    position: 'relative',
    height: '120px',
    background: 'rgba(226,232,240,0.3)',
    overflow: 'hidden',
  },
  trendingCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  trendingCardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(226,232,240,0.2)',
  },
  trendingCardBadge: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    padding: '2px 8px',
    background: COLORS.secondary,
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '700',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  trendingCardContent: {
    padding: '10px',
  },
  trendingCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trendingCardCategory: {
    fontSize: '11px',
    color: COLORS.textLight,
    margin: '2px 0 6px',
  },
  trendingCardPrice: {
    fontSize: '13px',
    fontWeight: '700',
    color: COLORS.accent,
  },

  // ============================================================
  // LISTINGS
  // ============================================================
  listingsSection: {
    padding: '32px 0 40px',
    background: COLORS.white,
  },
  listingsContainer: {
    padding: '0 16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  listingsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  listingsTitle: {
    fontFamily: FONTS.display,
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.primary,
    margin: 0,
  },
  listingsSubtitle: {
    fontSize: '13px',
    color: COLORS.textLight,
    margin: '2px 0 0',
  },
  listingsFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    border: '1px solid rgba(226,232,240,0.6)',
    background: COLORS.background,
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease',
  },
  mobileFilters: {
    background: COLORS.background,
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid rgba(226,232,240,0.4)',
  },
  mobileFilterGroup: {
    marginBottom: '12px',
  },
  mobileFilterLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: '4px',
  },
  mobileFilterSelect: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(226,232,240,0.6)',
    fontSize: '14px',
    fontFamily: FONTS.body,
    background: COLORS.white,
    color: COLORS.text,
    outline: 'none',
  },
  mobileFilterApply: {
    width: '100%',
    padding: '10px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.white,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
  },
  listingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  listingCard: {
    background: COLORS.white,
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid rgba(226,232,240,0.4)',
    transition: 'all 0.3s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  cardImageWrapper: {
    position: 'relative',
    height: '140px',
    background: 'rgba(226,232,240,0.3)',
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(226,232,240,0.2)',
  },
  cardBadges: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    display: 'flex',
    gap: '4px',
  },
  cardBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  cardBadgeService: {
    background: COLORS.secondary,
    color: COLORS.white,
  },
  cardBadgeProduct: {
    background: COLORS.primary,
    color: COLORS.white,
  },
  cardDeliveryBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '600',
    background: COLORS.accent,
    color: COLORS.white,
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  wishlistBtn: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.9)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s ease',
  },
  cardContent: {
    padding: '10px',
  },
  cardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardCategory: {
    fontSize: '11px',
    color: COLORS.textLight,
    margin: '2px 0',
  },
  cardBusiness: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: COLORS.textLight,
    margin: 0,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    marginTop: '4px',
    borderTop: '1px solid rgba(226,232,240,0.4)',
  },
  cardPrice: {
    fontSize: '14px',
    fontWeight: '700',
    color: COLORS.accent,
  },
  cardActionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: COLORS.primary,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
    transition: 'all 0.2s ease',
  },

  // ============================================================
  // EMPTY STATE
  // ============================================================
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    background: COLORS.background,
    borderRadius: '12px',
    border: '2px dashed rgba(226,232,240,0.6)',
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: '18px',
    fontWeight: '600',
    color: COLORS.primary,
    margin: '12px 0 4px',
  },
  emptyText: {
    fontSize: '14px',
    color: COLORS.textLight,
    margin: '0 0 16px',
  },
  emptyBtn: {
    padding: '10px 20px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.white,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
  },

  // ============================================================
  // TESTIMONIALS
  // ============================================================
  testimonials: {
    padding: '32px 0',
    background: COLORS.background,
  },
  testimonialsContainer: {
    padding: '0 16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  testimonialsHeader: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  testimonialsBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    background: 'rgba(245,158,11,0.1)',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  testimonialsTitle: {
    fontFamily: FONTS.display,
    fontSize: '22px',
    fontWeight: '700',
    color: COLORS.primary,
    margin: 0,
  },
  testimonialsHighlight: {
    color: COLORS.accent,
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
  testimonialCard: {
    padding: '16px',
    background: COLORS.white,
    borderRadius: '12px',
    border: '1px solid rgba(226,232,240,0.4)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  testimonialStars: {
    display: 'flex',
    gap: '2px',
    marginBottom: '8px',
  },
  testimonialQuote: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: COLORS.text,
    margin: 0,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
  },
  testimonialAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${COLORS.secondary}, ${COLORS.accent})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  testimonialAvatarText: {
    fontSize: '12px',
    fontWeight: '700',
    color: COLORS.white,
  },
  testimonialName: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
  },
  testimonialRole: {
    fontSize: '11px',
    color: COLORS.textLight,
  },

  // ============================================================
  // CTA
  // ============================================================
  cta: {
    padding: '32px 0',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
  },
  ctaContainer: {
    padding: '0 16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  ctaContent: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  ctaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    background: 'rgba(245,158,11,0.15)',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    color: COLORS.secondary,
  },
  ctaTitle: {
    fontFamily: FONTS.display,
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.white,
    margin: 0,
  },
  ctaText: {
    fontSize: '15px',
    lineHeight: '1.5',
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
  },
  ctaButtons: {
    width: '100%',
    maxWidth: '320px',
  },
  ctaBtnPrimary: {
    width: '100%',
    padding: '14px 24px',
    background: COLORS.secondary,
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    color: COLORS.primary,
    cursor: 'pointer',
    fontFamily: FONTS.body,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
  },

  // ============================================================
  // BOTTOM NAVIGATION
  // ============================================================
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(226,232,240,0.5)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '6px 0 10px',
    zIndex: 100,
    boxShadow: '0 -2px 20px rgba(30,41,59,0.04)',
  },
  bottomNavItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    background: 'none',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: FONTS.body,
    transition: 'all 0.2s ease',
  },
  bottomNavIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  bottomNavIconActive: {
    background: COLORS.primary,
    boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
  },
  bottomNavLabel: {
    fontSize: '10px',
    fontWeight: '500',
    color: COLORS.textLight,
  },
  bottomNavLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ============================================================
  // FOOTER
  // ============================================================
  footer: {
    background: COLORS.primary,
    padding: '32px 0 16px',
  },
  footerContainer: {
    padding: '0 16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginBottom: '20px',
  },
  footerBrand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footerLogoText: {
    width: '32px',
    height: '32px',
    background: COLORS.secondary,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.primary,
    fontFamily: FONTS.display,
    fontSize: '16px',
    fontWeight: '700',
  },
  footerLogoName: {
    fontFamily: FONTS.display,
    fontSize: '18px',
    fontWeight: '700',
    color: COLORS.white,
  },
  footerLogoAccent: {
    color: COLORS.secondary,
  },
  footerDesc: {
    fontSize: '13px',
    lineHeight: '1.5',
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
  },
  footerLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  footerTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: '0 0 4px',
  },
  footerLink: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  },
  footerBottom: {
    paddingTop: '16px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  footerCopyright: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
  },
  footerLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: COLORS.secondary,
    margin: 0,
  },
  errorBanner: {
    background: '#FEF3C7',
    color: '#92400E',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #FDE68A',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '13px',
  },
  errorBtn: {
    padding: '4px 12px',
    background: COLORS.primary,
    color: COLORS.white,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: FONTS.body,
  },
};

export default Landing;