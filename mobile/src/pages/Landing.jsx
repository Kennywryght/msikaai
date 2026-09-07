// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, reviewsAPI } from '../services/api';
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
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 18L18 6M6 6l12 12",
  arrowRight: "M5 12h14m-7-7l7 7-7 7",
  arrowUpRight: "M7 7h10v10M7 17L17 7",
  chevronDown: "M19 9l-7 7-7-7",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  heartFill: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  mic: "M19 10v2a7 7 0 01-14 0v-2M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM8 21h8",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  check: "M20 6L9 17l-5-5",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
  hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
  wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
  bag: "M6 2l1.5 5M18 2l-1.5 5M4 7h16l-1.5 13a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 7zM9 11v3M15 11v3",
  coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
  shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
  tool: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z",
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

// ============================================================
// FEATURED SLIDES FOR CAROUSEL
// ============================================================
const FEATURED_SLIDES = [
  {
    id: 1,
    title: 'Fresh Farm Produce',
    description: 'Direct from local farmers to your table. Fresh, affordable, and sustainable.',
    image: '🌾',
    color: '#FEF3C7',
    cta: 'Browse Farm Inputs',
    link: '/search?category=Farm Inputs',
  },
  {
    id: 2,
    title: 'Skilled Tradespeople',
    description: 'Find plumbers, electricians, carpenters, and more in your area.',
    image: '🔧',
    color: '#DBEAFE',
    cta: 'Find Services',
    link: '/search?category=Plumber',
  },
  {
    id: 3,
    title: 'Local Retail & Shopping',
    description: 'Discover shops, restaurants, and tailors near Mitundu.',
    image: '🛍️',
    color: '#FCE4EC',
    cta: 'Shop Local',
    link: '/search?category=Retail',
  },
  {
    id: 4,
    title: 'AI-Powered Marketplace',
    description: 'Search by voice, get smart recommendations, and connect instantly.',
    image: '🤖',
    color: '#EDE9FE',
    cta: 'Try AI Search',
    link: '/ai-search',
  },
];

// ============================================================
// MAIN LANDING COMPONENT
// ============================================================
const Landing = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [showFilters, setShowFilters] = useState(false);
  const [userRole, setUserRole] = useState('buyer');
  
  // ✅ Carousel / Slideshow state
  const [showCarousel, setShowCarousel] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [likedItems, setLikedItems] = useState({});
  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});
  const [showComments, setShowComments] = useState({});
  
  const searchInputRef = useRef(null);
  const carouselRef = useRef(null);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth <= 1024;
  const isDesktop = windowWidth > 1024;

  // ============================================================
  // AUTO-PLAY CAROUSEL
  // ============================================================
  useEffect(() => {
    if (!showCarousel) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURED_SLIDES.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [showCarousel]);

  // ============================================================
  // SET USER ROLE
  // ============================================================
  useEffect(() => {
    if (user) {
      setUserRole(user?.role || 'buyer');
    }
  }, [user]);

  // ============================================================
  // REDIRECT TO LOGIN IF NOT AUTHENTICATED
  // ============================================================
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ============================================================
  // HANDLE LOGOUT
  // ============================================================
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // ============================================================
  // LIKE HANDLER
  // ============================================================
  const handleLike = (itemId) => {
    setLikedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    // Track like event
    if (user?.id) {
      try {
        // analyticsAPI.trackUserActivity(user.id, 'like_listing', { listingId: itemId });
      } catch (err) {}
    }
  };

  // ============================================================
  // COMMENT HANDLERS
  // ============================================================
  const handleCommentSubmit = (itemId) => {
    const text = commentText[itemId]?.trim();
    if (!text) return;

    setComments(prev => ({
      ...prev,
      [itemId]: [
        ...(prev[itemId] || []),
        {
          id: Date.now(),
          user: user?.email?.split('@')[0] || 'User',
          text: text,
          time: 'Just now',
        }
      ]
    }));
    setCommentText(prev => ({ ...prev, [itemId]: '' }));
    success('Comment added! 💬');
  };

  const toggleComments = (itemId) => {
    setShowComments(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
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
      setErrorMsg('');
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
        
        // Add mock likes/comments for demo
        listingsData = listingsData.map(item => ({
          ...item,
          likes: item.likes || Math.floor(Math.random() * 15),
          comments_count: item.comments_count || Math.floor(Math.random() * 5),
        }));
        
        if (mounted) setAllListings(listingsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (mounted) {
          setErrorMsg('Could not load market listings. Please refresh the page.');
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
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Discovering local products..." />;
  }

  // ============================================================
  // STYLES
  // ============================================================
  const styles = {
    app: {
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1E293B',
      paddingBottom: isMobile ? '70px' : '0',
    },

    // ===== NAVBAR =====
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
      background: 'linear-gradient(135deg, #1E293B, #F59E0B)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
    },
    navLogoText: {
      color: '#FFFFFF',
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '18px',
      fontWeight: '700',
    },
    navLogoName: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#1E293B',
      letterSpacing: '-0.02em',
    },
    navLogoAccent: {
      color: '#F59E0B',
    },
    navRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexShrink: 0,
    },
    userGreeting: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#64748B',
      display: 'none',
      '@media (min-width: 768px)': {
        display: 'inline',
      },
    },
    logoutBtn: {
      padding: '6px 12px',
      background: '#FEF2F2',
      color: '#EF4444',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '600',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },

    // ===== HERO - Clean & Simple =====
    hero: {
      padding: 'clamp(24px, 3vw, 40px) 0',
      background: '#FFFFFF',
      borderBottom: '1px solid #F1F5F9',
    },
    heroContainer: {
      padding: '0 16px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    heroContent: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      textAlign: 'center',
    },
    heroTitle: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: 'clamp(24px, 3.5vw, 36px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      lineHeight: '1.1',
    },
    heroHighlight: {
      color: '#F59E0B',
    },
    heroDesc: {
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      lineHeight: '1.6',
      color: '#64748B',
      maxWidth: '500px',
      margin: '0 auto',
    },
    heroSearch: {
      display: 'flex',
      gap: '8px',
      width: '100%',
      maxWidth: '480px',
      background: '#F8FAFC',
      borderRadius: '12px',
      padding: '4px',
      border: '2px solid #E2E8F0',
      transition: 'all 0.2s ease',
    },
    heroSearchInput: {
      flex: 1,
      padding: '10px 14px',
      border: 'none',
      outline: 'none',
      fontSize: '15px',
      background: 'transparent',
      color: '#1E293B',
      fontFamily: 'inherit',
    },
    heroSearchBtn: {
      padding: '10px 20px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
    },

    // ===== CAROUSEL / SLIDESHOW =====
    carousel: {
      position: 'relative',
      margin: '16px 0',
      borderRadius: '16px',
      overflow: 'hidden',
      background: '#FFFFFF',
      border: '1px solid #F1F5F9',
    },
    carouselSlide: {
      padding: 'clamp(24px, 3vw, 40px)',
      minHeight: 'clamp(140px, 20vh, 200px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: '8px',
      position: 'relative',
    },
    carouselImage: {
      fontSize: 'clamp(40px, 6vw, 56px)',
    },
    carouselTitle: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: 'clamp(18px, 2vw, 22px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
    },
    carouselDesc: {
      fontSize: 'clamp(13px, 1vw, 15px)',
      color: '#64748B',
      margin: 0,
      maxWidth: '80%',
    },
    carouselCta: {
      padding: '6px 16px',
      background: '#1E293B',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      marginTop: '4px',
    },
    carouselDots: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      padding: '12px 0',
    },
    carouselDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: '#E2E8F0',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      transition: 'all 0.3s ease',
    },
    carouselDotActive: {
      background: '#F59E0B',
      width: '24px',
      borderRadius: '4px',
    },
    carouselSkip: {
      position: 'absolute',
      top: '12px',
      right: '16px',
      background: 'rgba(255,255,255,0.8)',
      border: 'none',
      borderRadius: '8px',
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#64748B',
      cursor: 'pointer',
      fontFamily: 'inherit',
      backdropFilter: 'blur(4px)',
    },

    // ===== CATEGORY SCROLL =====
    categorySection: {
      padding: '16px 0',
      background: '#FFFFFF',
      borderBottom: '1px solid #F1F5F9',
    },
    categoryContainer: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      padding: '0 16px',
      scrollbarWidth: 'none',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    categoryChip: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      borderRadius: '20px',
      border: '1px solid rgba(226,232,240,0.6)',
      background: '#FFFFFF',
      fontSize: '13px',
      fontWeight: '500',
      color: '#64748B',
      cursor: 'pointer',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: 'all 0.2s ease',
    },
    categoryChipActive: {
      background: '#1E293B',
      borderColor: '#1E293B',
      color: '#FFFFFF',
      boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
    },

    // ===== LISTINGS =====
    listingsSection: {
      padding: 'clamp(16px, 2vw, 24px) 0',
      background: '#F8FAFC',
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
      flexWrap: 'wrap',
      gap: '12px',
    },
    listingsTitle: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: 'clamp(18px, 2vw, 22px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
    },
    listingsSubtitle: {
      fontSize: '13px',
      color: '#94A3B8',
    },
    listingsFilterBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '8px',
      border: '1px solid rgba(226,232,240,0.6)',
      background: '#FFFFFF',
      fontSize: '13px',
      fontWeight: '600',
      color: '#1E293B',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    mobileFilters: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      border: '1px solid #E2E8F0',
    },
    mobileFilterGroup: {
      marginBottom: '12px',
    },
    mobileFilterLabel: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748B',
      marginBottom: '4px',
    },
    mobileFilterSelect: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
      fontSize: '14px',
      fontFamily: 'inherit',
      background: '#FFFFFF',
      color: '#1E293B',
      outline: 'none',
    },
    mobileFilterApply: {
      width: '100%',
      padding: '10px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
    },
    listingsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '12px',
    },
    listingCard: {
      background: '#FFFFFF',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      border: '1px solid rgba(226,232,240,0.4)',
      transition: 'all 0.2s ease',
    },
    cardImageWrapper: {
      position: 'relative',
      height: 'clamp(120px, 15vw, 160px)',
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
      background: '#F59E0B',
      color: '#FFFFFF',
    },
    cardBadgeProduct: {
      background: '#1E293B',
      color: '#FFFFFF',
    },
    cardDeliveryBadge: {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '9px',
      fontWeight: '600',
      background: '#10B981',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
    },
    cardActions: {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
      display: 'flex',
      gap: '6px',
    },
    cardActionBtn: {
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
      fontSize: '14px',
    },
    cardContent: {
      padding: '10px',
    },
    cardTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1E293B',
      margin: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    cardCategory: {
      fontSize: '11px',
      color: '#94A3B8',
      margin: '2px 0',
    },
    cardBusiness: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: '#94A3B8',
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
      color: '#10B981',
    },
    cardInteractions: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    cardLike: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: '#94A3B8',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      padding: '2px 4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
    },
    cardLikeActive: {
      color: '#EF4444',
    },
    cardComment: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: '#94A3B8',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
      padding: '2px 4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease',
    },
    cardViewBtn: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: '#1E293B',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
      transition: 'all 0.2s ease',
    },
    commentSection: {
      padding: '8px 10px',
      background: '#F8FAFC',
      borderRadius: '8px',
      marginTop: '8px',
      borderTop: '1px solid #F1F5F9',
    },
    commentItem: {
      padding: '4px 0',
      borderBottom: '1px solid #F1F5F9',
      fontSize: '12px',
    },
    commentItemLast: {
      borderBottom: 'none',
    },
    commentUser: {
      fontWeight: '600',
      color: '#1E293B',
    },
    commentText: {
      color: '#64748B',
    },
    commentTime: {
      fontSize: '10px',
      color: '#94A3B8',
    },
    commentInput: {
      display: 'flex',
      gap: '6px',
      marginTop: '6px',
    },
    commentInputField: {
      flex: 1,
      padding: '6px 10px',
      border: '1px solid #E2E8F0',
      borderRadius: '6px',
      fontSize: '12px',
      outline: 'none',
      fontFamily: 'inherit',
      background: '#FFFFFF',
    },
    commentSendBtn: {
      padding: '6px 12px',
      background: '#1E293B',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '600',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },

    // ===== EMPTY STATE =====
    emptyState: {
      textAlign: 'center',
      padding: 'clamp(32px, 4vw, 48px) 20px',
      background: '#FFFFFF',
      borderRadius: '12px',
      border: '2px dashed rgba(226,232,240,0.6)',
    },
    emptyTitle: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '18px',
      fontWeight: '600',
      color: '#1E293B',
      margin: '12px 0 4px',
    },
    emptyText: {
      fontSize: '14px',
      color: '#94A3B8',
      margin: '0 0 16px',
    },
    emptyBtn: {
      padding: '10px 20px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
    },

    // ===== BOTTOM NAV =====
    bottomNav: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(226,232,240,0.5)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '4px 0 8px',
      zIndex: 100,
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
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    },
    bottomNavIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
    },
    bottomNavIconActive: {
      background: '#1E293B',
      boxShadow: '0 2px 12px rgba(30,41,59,0.15)',
    },
    bottomNavLabel: {
      fontSize: '9px',
      fontWeight: '500',
      color: '#94A3B8',
    },
    bottomNavLabelActive: {
      color: '#1E293B',
      fontWeight: '600',
    },

    // ===== ERROR BANNER =====
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
      background: '#1E293B',
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      fontFamily: 'inherit',
    },

    // ===== FOOTER =====
    footer: {
      background: '#1E293B',
      padding: 'clamp(24px, 3vw, 32px) 0 16px',
      marginTop: '16px',
    },
    footerContainer: {
      padding: '0 16px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    footerContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '16px',
    },
    footerBrand: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    footerLogo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    footerLogoText: {
      width: '32px',
      height: '32px',
      background: '#F59E0B',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1E293B',
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '16px',
      fontWeight: '700',
    },
    footerLogoName: {
      fontFamily: '"Fraunces", Georgia, serif',
      fontSize: '18px',
      fontWeight: '700',
      color: '#FFFFFF',
    },
    footerLogoAccent: {
      color: '#F59E0B',
    },
    footerDesc: {
      fontSize: '13px',
      lineHeight: '1.5',
      color: 'rgba(255,255,255,0.6)',
      margin: 0,
    },
    footerBottom: {
      paddingTop: '12px',
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
      color: '#F59E0B',
      margin: 0,
    },
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.app}>
      {/* ===== NAVBAR ===== */}
      <nav style={{ ...styles.navbar, ...(isScrolled ? styles.navbarScrolled : {}) }}>
        <div style={styles.navbarContainer}>
          <Link to="/landing" style={styles.navLogo}>
            <div style={styles.navLogoIcon}>
              <span style={styles.navLogoText}>K</span>
            </div>
            <span style={styles.navLogoName}>Kum<span style={styles.navLogoAccent}>sika</span></span>
          </Link>

          <div style={styles.navRight}>
            <span style={styles.userGreeting}>
              👋 {user?.email?.split('@')[0] || 'User'}
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <Icon d={ICONS.logout} size={14} color="#EF4444" strokeWidth={1.75} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section style={styles.hero}>
        <div style={styles.heroContainer}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
              The stall next door,<br />
              <span style={styles.heroHighlight}>now online.</span>
            </h1>
            <p style={styles.heroDesc}>
              Find real traders, tailors, and tradespeople in your area.
            </p>
            <form onSubmit={handleSearch} style={styles.heroSearch}>
              <Icon d={ICONS.search} size={18} color="#94A3B8" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.heroSearchInput}
              />
              <button type="submit" style={styles.heroSearchBtn}>
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ===== CAROUSEL / SLIDESHOW ===== */}
      {showCarousel && (
        <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={styles.carousel}>
            <button
              style={styles.carouselSkip}
              onClick={() => setShowCarousel(false)}
            >
              Skip
            </button>
            <div
              style={{
                ...styles.carouselSlide,
                background: FEATURED_SLIDES[currentSlide].color,
              }}
            >
              <div style={styles.carouselImage}>
                {FEATURED_SLIDES[currentSlide].image}
              </div>
              <h3 style={styles.carouselTitle}>
                {FEATURED_SLIDES[currentSlide].title}
              </h3>
              <p style={styles.carouselDesc}>
                {FEATURED_SLIDES[currentSlide].description}
              </p>
              <button
                style={styles.carouselCta}
                onClick={() => navigate(FEATURED_SLIDES[currentSlide].link)}
              >
                {FEATURED_SLIDES[currentSlide].cta} →
              </button>
            </div>
            <div style={styles.carouselDots}>
              {FEATURED_SLIDES.map((_, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.carouselDot,
                    ...(currentSlide === index ? styles.carouselDotActive : {}),
                  }}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORY SCROLL ===== */}
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
                <Icon d={ICONS[cat.iconKey]} size={14} color={isActive ? '#FFFFFF' : '#64748B'} strokeWidth={1.75} />
                <span style={isActive ? { color: '#FFFFFF' } : { color: '#475569' }}>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== LISTINGS ===== */}
      <section style={styles.listingsSection}>
        <div style={styles.listingsContainer}>
          <div style={styles.listingsHeader}>
            <div>
              <h2 style={styles.listingsTitle}>Browse Products</h2>
              <p style={styles.listingsSubtitle}>{filteredListings.length} items</p>
            </div>
            <button
              style={styles.listingsFilterBtn}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Icon d={ICONS.filter} size={16} color="#1E293B" strokeWidth={1.75} />
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
              <button style={styles.mobileFilterApply} onClick={() => setShowFilters(false)}>Apply</button>
            </div>
          )}

          {errorMsg && (
            <div style={styles.errorBanner}>
              <span>{errorMsg}</span>
              <button style={styles.errorBtn} onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}

          {filteredListings.length > 0 ? (
            <div style={styles.listingsGrid}>
              {filteredListings.map((item) => {
                const isService = item.category?.toLowerCase().includes('plumber') ||
                  item.category?.toLowerCase().includes('tailor') ||
                  item.category?.toLowerCase().includes('service');
                const isLiked = likedItems[item.id] || false;
                const itemComments = comments[item.id] || [];
                const showCommentsForItem = showComments[item.id] || false;

                return (
                  <div
                    key={item.id}
                    style={styles.listingCard}
                    onMouseEnter={() => setHoveredCard(item.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={styles.cardImageWrapper}>
                      {item.images && item.images.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} style={styles.cardImage} loading="lazy" />
                      ) : (
                        <div style={styles.cardImagePlaceholder}>
                          <Icon d={ICONS.store} size={28} color="#F59E0B" strokeWidth={1.5} />
                        </div>
                      )}

                      <div style={styles.cardBadges}>
                        <span style={{ ...styles.cardBadge, ...(isService ? styles.cardBadgeService : styles.cardBadgeProduct) }}>
                          {isService ? 'Service' : 'Product'}
                        </span>
                        {item.delivery_available && (
                          <span style={styles.cardDeliveryBadge}>
                            <Icon d={ICONS.truck} size={8} color="#FFFFFF" strokeWidth={2} /> Delivery
                          </span>
                        )}
                      </div>

                      <div style={styles.cardActions}>
                        <button
                          style={styles.cardActionBtn}
                          onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                          aria-label="Like"
                        >
                          <Icon
                            d={isLiked ? ICONS.heart : ICONS.heart}
                            size={14}
                            color={isLiked ? '#EF4444' : '#64748B'}
                            strokeWidth={isLiked ? 2 : 1.5}
                          />
                        </button>
                        <button
                          style={styles.cardActionBtn}
                          onClick={(e) => { e.stopPropagation(); toggleComments(item.id); }}
                          aria-label="Comments"
                        >
                          💬
                        </button>
                      </div>
                    </div>

                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{item.title}</h3>
                      <p style={styles.cardCategory}>{item.category}</p>
                      <p style={styles.cardBusiness}>
                        <Icon d={ICONS.store} size={10} color="#F59E0B" strokeWidth={1.75} />
                        {item.businesses?.business_name || 'Local trader'}
                      </p>

                      <div style={styles.cardFooter}>
                        <span style={styles.cardPrice}>{formatPrice(item.price)}</span>
                        <div style={styles.cardInteractions}>
                          <button
                            style={{
                              ...styles.cardLike,
                              ...(isLiked ? styles.cardLikeActive : {}),
                            }}
                            onClick={(e) => { e.stopPropagation(); handleLike(item.id); }}
                          >
                            <Icon
                              d={isLiked ? ICONS.heart : ICONS.heart}
                              size={12}
                              color={isLiked ? '#EF4444' : '#94A3B8'}
                              strokeWidth={isLiked ? 2 : 1.5}
                            />
                            {item.likes + (isLiked ? 1 : 0)}
                          </button>
                          <button
                            style={styles.cardComment}
                            onClick={(e) => { e.stopPropagation(); toggleComments(item.id); }}
                          >
                            💬 {item.comments_count + itemComments.length}
                          </button>
                          <button
                            style={styles.cardViewBtn}
                            onClick={(e) => { e.stopPropagation(); handleListingClick(item); }}
                          >
                            <Icon d={ICONS.arrowRight} size={14} color="#FFFFFF" strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {showCommentsForItem && (
                        <div style={styles.commentSection} onClick={(e) => e.stopPropagation()}>
                          {itemComments.length > 0 && (
                            <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
                              {itemComments.map((comment, idx) => (
                                <div
                                  key={comment.id}
                                  style={{
                                    ...styles.commentItem,
                                    ...(idx === itemComments.length - 1 ? styles.commentItemLast : {}),
                                  }}
                                >
                                  <span style={styles.commentUser}>{comment.user}</span>
                                  <span style={styles.commentText}>{comment.text}</span>
                                  <span style={styles.commentTime}> · {comment.time}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={styles.commentInput}>
                            <input
                              type="text"
                              placeholder="Write a comment..."
                              value={commentText[item.id] || ''}
                              onChange={(e) => setCommentText(prev => ({ ...prev, [item.id]: e.target.value }))}
                              style={styles.commentInputField}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.stopPropagation();
                                  handleCommentSubmit(item.id);
                                }
                              }}
                            />
                            <button
                              style={styles.commentSendBtn}
                              onClick={(e) => { e.stopPropagation(); handleCommentSubmit(item.id); }}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Icon d={ICONS.store} size={40} color="#F59E0B" strokeWidth={1.5} />
              <h3 style={styles.emptyTitle}>No listings found</h3>
              <p style={styles.emptyText}>Try adjusting your filters or check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* ===== BOTTOM NAV ===== */}
      {isMobile && (
        <div style={styles.bottomNav}>
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'message' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const isActive = item.id === 'home';
            return (
              <button
                key={item.id}
                style={styles.bottomNavItem}
                onClick={() => handleBottomNav(item.id)}
              >
                <div style={{ ...styles.bottomNavIcon, ...(isActive ? styles.bottomNavIconActive : {}) }}>
                  <Icon d={ICONS[item.icon]} size={20} color={isActive ? '#FFFFFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span style={{ ...styles.bottomNavLabel, ...(isActive ? styles.bottomNavLabelActive : {}) }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerContent}>
            <div style={styles.footerBrand}>
              <div style={styles.footerLogo}>
                <span style={styles.footerLogoText}>K</span>
                <span style={styles.footerLogoName}>Kum<span style={styles.footerLogoAccent}>sika</span></span>
              </div>
              <p style={styles.footerDesc}>Your trusted local marketplace in Mitundu.</p>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p style={styles.footerCopyright}>© {new Date().getFullYear()} Kumsika</p>
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

export default Landing;