// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingsAPI, businessAPI } from '../services/api';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../context/TranslationContext';

// --- ICONS ---
const SketchIcon = ({ d, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

const CATEGORIES = [
  { label: 'All', iconKey: 'store' },
  { label: 'Farm Inputs', iconKey: 'sparkles' },
  { label: 'Construction', iconKey: 'store' },
  { label: 'Plumber', iconKey: 'store' },
  { label: 'Retail', iconKey: 'store' },
  { label: 'Restaurant', iconKey: 'store' },
  { label: 'Tailor', iconKey: 'store' },
  { label: 'Hardware', iconKey: 'store' }
];

const LOCATIONS = [
  'All Areas',
  'Mitundu Trading Centre',
  'Bunda',
  'Chimbiri',
  'Motolosi',
  'Chingala',
  'Mlale',
  'Surrounding Areas'
];

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All Areas');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Auto-focus search input on desktop
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const filteredListings = useMemo(() => {
    // Also filter by search query if present
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

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const listingsRes = await listingsAPI.search({ limit: 50 });
        if (!mounted) return;
        
        const listingsData = listingsRes.data?.listings || [];
        setAllListings(listingsData);

        if (listingsData.length === 0) {
          const bizResponse = await businessAPI.getAll({ limit: 20 });
          if (!mounted) return;
          
          if (bizResponse.data?.businesses?.length > 0) {
            const bizListings = bizResponse.data.businesses.map((b) => ({
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
              business_id: b.id
            }));
            if (mounted) setAllListings(bizListings);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching data:', err);
        if (mounted) setError('Could not load market listings. Please refresh the page.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleListingClick = (item) => {
    if (item.is_business) {
      navigate(`/search?q=${encodeURIComponent(item.title)}`);
      return;
    }
    navigate(`/listing/${item.id}`);
  };

  const formatPrice = (price) => {
    if (!price) return 'Contact for price';
    return `MWK ${Number(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '600' }}>
          Discovering local products & services in Mitundu...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, -apple-system, sans-serif',
      color: '#0f172a',
      lineHeight: '1.5'
    }}>
      {/* ============================================
      PROFESSIONAL NAVIGATION BAR - FULLY RESPONSIVE
      ============================================ */}
      <nav style={{
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        minHeight: '64px'
      }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            flexShrink: 0
          }}>
            <SketchIcon d={ICONS.store} size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{
              fontSize: 'clamp(18px, 3vw, 22px)',
              fontWeight: '800',
              color: '#0f172a',
              margin: 0,
              letterSpacing: '-0.5px',
              lineHeight: '1.1'
            }}>
              Kum<span style={{ color: '#2563eb' }}>sika</span>
            </h1>
            <p style={{
              fontSize: '8px',
              color: '#94a3b8',
              margin: 0,
              fontWeight: '600',
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}>
              Marketplace
            </p>
          </div>
          <span style={{
            fontSize: '9px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            padding: '2px 10px',
            borderRadius: '20px',
            fontWeight: '600',
            border: '1px solid #e2e8f0',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              display: 'inline-block',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: '#22c55e'
            }}></span>
            Mitundu
          </span>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
            '@media (min-width: 768px)': {
              display: 'flex'
            }
          }} className="desktop-nav">
            <LanguageToggle />
            
            <button
              onClick={() => navigate('/about')}
              style={{
                padding: '6px 14px',
                backgroundColor: 'transparent',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <SketchIcon d={ICONS.store} size={13} color="#475569" strokeWidth={2} />
              <span>About</span>
            </button>

            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '6px 14px',
                backgroundColor: 'transparent',
                color: '#475569',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <SketchIcon d={ICONS.search} size={13} color="#475569" strokeWidth={2} />
              <span>Browse</span>
            </button>

            <Link
              to="/login"
              style={{
                padding: '6px 16px',
                backgroundColor: 'transparent',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#eff6ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Sign In
            </Link>

            <Link
              to="/login"
              style={{
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.25)';
              }}
            >
              <span>+ Post</span>
            </Link>
          </div>

          {/* Hamburger Menu Button - Visible on Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'background-color 0.2s',
              '@media (min-width: 768px)': {
                display: 'none'
              }
            }}
            className="hamburger-btn"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Toggle menu"
          >
            <span style={{
              display: 'block',
              width: '24px',
              height: '2px',
              backgroundColor: '#0f172a',
              borderRadius: '2px',
              transition: 'all 0.3s',
              transform: isMobileMenuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none'
            }}></span>
            <span style={{
              display: 'block',
              width: '24px',
              height: '2px',
              backgroundColor: '#0f172a',
              borderRadius: '2px',
              transition: 'all 0.3s',
              opacity: isMobileMenuOpen ? 0 : 1
            }}></span>
            <span style={{
              display: 'block',
              width: '24px',
              height: '2px',
              backgroundColor: '#0f172a',
              borderRadius: '2px',
              transition: 'all 0.3s',
              transform: isMobileMenuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none'
            }}></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          padding: '16px 20px',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
            <LanguageToggle />
          </div>

          <button
            onClick={() => {
              navigate('/about');
              setIsMobileMenuOpen(false);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <SketchIcon d={ICONS.store} size={18} color="#475569" strokeWidth={2} />
            About
          </button>

          <button
            onClick={() => {
              navigate('/search');
              setIsMobileMenuOpen(false);
            }}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <SketchIcon d={ICONS.search} size={18} color="#475569" strokeWidth={2} />
            Browse Listings
          </button>

          <Link
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              padding: '10px 16px',
              backgroundColor: 'transparent',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            Sign In
          </Link>

          <Link
            to="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <span>+ Post Listing</span>
          </Link>
        </div>
      )}

      {/* Hero Section - Fully Responsive */}
      <header style={{
        background: 'radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
        padding: 'clamp(48px, 10vh, 80px) clamp(16px, 4vw, 24px)',
        textAlign: 'center',
        color: '#ffffff',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.08)',
            padding: '6px 16px',
            borderRadius: '30px',
            fontSize: 'clamp(11px, 1.2vw, 13px)',
            fontWeight: '500',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <SketchIcon d={ICONS.sparkles} size={15} color="#f59e0b" strokeWidth={2} />
            <span>Mitundu's Local Goods & Service Directory</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 7vw, 52px)',
            fontWeight: '800',
            marginBottom: '18px',
            lineHeight: '1.15',
            letterSpacing: '-0.02em'
          }}>
            Buy Goods & Hire Local Pros in <span style={{
              background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Mitundu</span>
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 1.8vw, 18px)',
            marginBottom: '36px',
            color: '#94a3b8',
            fontWeight: '400',
            maxWidth: '640px',
            margin: '0 auto 36px auto'
          }}>
            Find farmers, hardware supplies, plumbers, tailors, and fresh local produce—all in one place.
          </p>

          <form onSubmit={handleSearch} style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.4)',
            padding: '6px',
            border: '1px solid rgba(255,255,255,0.2)',
            flexDirection: window.innerWidth < 480 ? 'column' : 'row'
          }}>
            <div style={{ paddingLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <SketchIcon d={ICONS.search} size={20} color="#94a3b8" strokeWidth={2.2} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search maize, plumber, cement, hardware, tailor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: 'none',
                fontSize: 'clamp(14px, 1.4vw, 16px)',
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#0f172a',
                width: '100%'
              }}
              autoComplete="off"
            />
            <button type="submit" style={{
              padding: '12px 26px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: 'clamp(13px, 1.2vw, 15px)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              width: window.innerWidth < 480 ? '100%' : 'auto',
              justifyContent: 'center',
              marginTop: window.innerWidth < 480 ? '8px' : '0'
            }}>
              <span>Search</span>
              <SketchIcon d={ICONS.arrowRight} size={16} color="#ffffff" strokeWidth={2.5} />
            </button>
          </form>

          {/* Keyboard shortcut hint - Desktop only */}
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#64748b',
            display: window.innerWidth < 768 ? 'none' : 'block'
          }}>
            Press <kbd style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>⌘K</kbd> or <kbd style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>Ctrl+K</kbd> to search
          </div>

          <div style={{
            marginTop: '28px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '8px 18px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <SketchIcon d={ICONS.mic} size={15} color="#60a5fa" strokeWidth={2} />
              <span>Voice Listing</span>
            </button>
            <button onClick={() => navigate('/login')} style={{
              padding: '8px 18px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <SketchIcon d={ICONS.bot} size={15} color="#34d399" strokeWidth={2} />
              <span>AI Assistant</span>
            </button>
            <button onClick={() => navigate('/search')} style={{
              padding: '8px 18px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '30px',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 1.2vw, 13px)',
              fontWeight: '500',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <SketchIcon d={ICONS.mapPin} size={15} color="#f87171" strokeWidth={2} />
              <span>Near Me</span>
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar - Responsive */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: 'clamp(16px, 3vw, 24px)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'clamp(16px, 2vw, 24px)',
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div>
            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: '800', color: '#2563eb' }}>
              {allListings.length}+
            </div>
            <div style={{ fontSize: 'clamp(10px, 1vw, 12px)', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Active Goods & Services
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: '800', color: '#2563eb' }}>50+</div>
            <div style={{ fontSize: 'clamp(10px, 1vw, 12px)', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Local Businesses
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: '800', color: '#2563eb' }}>10+</div>
            <div style={{ fontSize: 'clamp(10px, 1vw, 12px)', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Service Categories
            </div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: '800', color: '#16a34a' }}>100%</div>
            <div style={{ fontSize: 'clamp(10px, 1vw, 12px)', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Verified Local Traders
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Responsive */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 24px) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Categories */}
          <div>
            <label style={{
              fontSize: 'clamp(10px, 1vw, 12px)',
              fontWeight: '700',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              letterSpacing: '0.05em'
            }}>
              <SketchIcon d={ICONS.tag} size={14} color="#64748b" strokeWidth={2} />
              <span>FILTER BY CATEGORY</span>
            </label>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              flexWrap: 'wrap',
              WebkitOverflowScrolling: 'touch'
            }}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.label;
                const iconPath = ICONS[cat.iconKey] || ICONS.store;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(cat.label)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 'clamp(6px, 0.8vw, 8px) clamp(12px, 1.5vw, 16px)',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: 'clamp(11px, 1.2vw, 13px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      backgroundColor: isActive ? '#2563eb' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      borderColor: isActive ? '#2563eb' : '#e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    <SketchIcon
                      d={iconPath}
                      size={14}
                      color={isActive ? '#ffffff' : '#2563eb'}
                      strokeWidth={2}
                    />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Locations */}
          <div>
            <label style={{
              fontSize: 'clamp(10px, 1vw, 12px)',
              fontWeight: '700',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
              letterSpacing: '0.05em'
            }}>
              <SketchIcon d={ICONS.mapPin} size={14} color="#64748b" strokeWidth={2} />
              <span>FILTER BY LOCATION</span>
            </label>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              flexWrap: 'wrap',
              WebkitOverflowScrolling: 'touch'
            }}>
              {LOCATIONS.map((loc) => {
                const isActive = selectedLocation === loc;
                return (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 'clamp(6px, 0.8vw, 8px) clamp(12px, 1.5vw, 16px)',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: 'clamp(11px, 1.2vw, 13px)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      backgroundColor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      borderColor: isActive ? '#0f172a' : '#e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(15,23,42,0.15)' : 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    <SketchIcon
                      d={ICONS.mapPin}
                      size={14}
                      color={isActive ? '#ffffff' : '#64748b'}
                      strokeWidth={2}
                    />
                    <span>{loc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid - Responsive */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(20px, 3vw, 28px) clamp(16px, 4vw, 24px) clamp(48px, 8vw, 72px)' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: 'clamp(20px, 2.5vw, 26px)',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.01em'
          }}>
            Marketplace & Services in Mitundu
          </h2>
          <p style={{ fontSize: 'clamp(13px, 1.2vw, 15px)', color: '#64748b', margin: 0 }}>
            {filteredListings.length > 0
              ? `Showing ${filteredListings.length} verified listings`
              : 'No items match your selected filter.'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #fecaca',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'clamp(13px, 1.2vw, 14px)',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <span>{error}</span>
            <button onClick={() => window.location.reload()} style={{
              backgroundColor: '#991b1b',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600'
            }}>Retry</button>
          </div>
        )}

        {filteredListings.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 'clamp(16px, 2vw, 24px)'
          }}>
            {filteredListings.map((item) => {
              const isHovered = hoveredCard === item.id;
              const isService = item.category?.toLowerCase().includes('plumber') ||
                                item.category?.toLowerCase().includes('tailor') ||
                                item.category?.toLowerCase().includes('service');

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s',
                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                    borderColor: isHovered ? '#bfdbfe' : '#e2e8f0',
                    boxShadow: isHovered
                      ? '0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.01)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                    touchAction: 'manipulation'
                  }}
                  onClick={() => handleListingClick(item)}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 'clamp(160px, 20vw, 190px)',
                    backgroundColor: '#f1f5f9',
                    overflow: 'hidden'
                  }}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                      }}>
                        <SketchIcon d={ICONS.store} size={42} color="#94a3b8" strokeWidth={1.5} />
                      </div>
                    )}
                    
                    <span style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid',
                      backgroundColor: isService ? '#e0e7ff' : '#ecfdf5',
                      color: isService ? '#3730a3' : '#065f46',
                      borderColor: isService ? '#c7d2fe' : '#a7f3d0',
                      letterSpacing: '0.04em'
                    }}>
                      {isService ? 'SERVICE' : 'GOODS'}
                    </span>

                    {item.delivery_available && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        <SketchIcon d={ICONS.store} size={11} color="#ffffff" strokeWidth={2} />
                        <span style={{ marginLeft: '3px' }}>Delivery</span>
                      </span>
                    )}

                    {item.location_area && (
                      <span style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(15,23,42,0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        <SketchIcon d={ICONS.mapPin} size={11} color="#ffffff" strokeWidth={2} />
                        <span style={{ marginLeft: '3px' }}>{item.location_area}</span>
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 'clamp(14px, 1.5vw, 18px)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontSize: 'clamp(14px, 1.4vw, 16px)',
                      fontWeight: '700',
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                      lineHeight: '1.3'
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      fontSize: 'clamp(12px, 1.1vw, 13px)',
                      color: '#64748b',
                      margin: '0 0 18px 0',
                      fontWeight: '500'
                    }}>
                      {item.businesses?.business_name || 'Verified Local Trader'}
                    </p>

                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9'
                    }}>
                      <div>
                        <span style={{
                          display: 'block',
                          fontSize: '9px',
                          color: '#94a3b8',
                          fontWeight: '800',
                          letterSpacing: '0.05em'
                        }}>
                          {isService ? 'ESTIMATED RATE' : 'PRICE'}
                        </span>
                        <span style={{
                          fontSize: 'clamp(13px, 1.2vw, 15px)',
                          fontWeight: '800',
                          color: '#2563eb'
                        }}>
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      
                      <button 
                        style={{
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: 'clamp(11px, 1vw, 12px)',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          touchAction: 'manipulation'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.id && !item.is_business) {
                            navigate(`/listing/${item.id}`);
                          } else {
                            navigate(`/search?q=${encodeURIComponent(item.title)}`);
                          }
                        }}
                      >
                        <span>View</span>
                        <SketchIcon d={ICONS.arrowRight} size={12} color="#2563eb" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(40px, 6vw, 64px) clamp(20px, 3vw, 40px)',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: 'clamp(56px, 6vw, 72px)',
              height: 'clamp(56px, 6vw, 72px)',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <SketchIcon d={ICONS.store} size={36} color="#64748b" strokeWidth={1.5} />
            </div>
            <h3 style={{
              fontSize: 'clamp(16px, 1.6vw, 18px)',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 6px 0'
            }}>No listings found</h3>
            <p style={{
              color: '#64748b',
              fontSize: 'clamp(13px, 1.2vw, 14px)',
              marginBottom: '24px'
            }}>Try adjusting your filters or be the first to offer this product/service!</p>
            <Link to="/login" style={{
              padding: '12px 28px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: 'clamp(13px, 1.2vw, 14px)',
              fontWeight: '600',
              display: 'inline-block',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
            }}>
              + Post a Listing Now
            </Link>
          </div>
        )}
      </main>

      {/* CTA Banner - Responsive */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 56px auto', padding: '0 24px' }}>
        <div style={{
          background: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: 'clamp(32px, 5vw, 52px) clamp(16px, 3vw, 24px)',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            fontWeight: '600',
            color: '#f59e0b',
            marginBottom: '12px'
          }}>
            <SketchIcon d={ICONS.sparkles} size={18} color="#f59e0b" strokeWidth={2} />
            <span>Join Local Sellers & Pros</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 32px)',
            fontWeight: '800',
            margin: '0 0 12px 0',
            letterSpacing: '-0.01em'
          }}>Grow Your Local Business in Mitundu</h2>
          <p style={{
            color: '#94a3b8',
            maxWidth: '540px',
            margin: '0 auto 28px auto',
            fontSize: 'clamp(14px, 1.4vw, 16px)',
            lineHeight: '1.6'
          }}>
            Sell physical goods, advertise farm crops, or offer repair & trade services. Set up in less than 2 minutes for free.
          </p>
          <Link to="/login" style={{
            padding: 'clamp(12px, 1.2vw, 14px) clamp(24px, 3vw, 32px)',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: 'clamp(14px, 1.2vw, 15px)',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(255,255,255,0.15)'
          }}>
            <span>Start Listing Today</span>
            <SketchIcon d={ICONS.arrowRight} size={16} color="#0f172a" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Footer - Responsive */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: 'clamp(32px, 4vw, 48px) clamp(16px, 4vw, 24px)',
        textAlign: 'center',
        borderTop: '1px solid #1e293b'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(16px, 2vw, 24px)',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 'clamp(13px, 1.1vw, 14px)', fontWeight: '500' }}>Home</Link>
          <Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 'clamp(13px, 1.1vw, 14px)', fontWeight: '500' }}>About</Link>
          <Link to="/search" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 'clamp(13px, 1.1vw, 14px)', fontWeight: '500' }}>Browse</Link>
          <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 'clamp(13px, 1.1vw, 14px)', fontWeight: '500' }}>Sell Goods</Link>
          <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 'clamp(13px, 1.1vw, 14px)', fontWeight: '500' }}>Offer Services</Link>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: 'clamp(12px, 1vw, 13px)' }}>
          © {new Date().getFullYear()} Kumsika — Dedicated to Empowering Mitundu Commerce 🇲🇼
        </p>
      </footer>
    </div>
  );
};

export default Landing;