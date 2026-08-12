// mobile/src/pages/Landing.jsx - COMPLETE FIX
import React, { useState, useEffect, useMemo } from 'react';
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

  // ✅ Use useMemo to prevent unnecessary re-renders
  const filteredListings = useMemo(() => {
    return allListings.filter((item) => {
      const categoryMatch = selectedCategory === 'All' || 
        item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const locationMatch = selectedLocation === 'All Areas' || 
        (item.location_area && item.location_area.includes(selectedLocation)) ||
        (item.address && item.address.includes(selectedLocation));
      return categoryMatch && locationMatch;
    });
  }, [allListings, selectedCategory, selectedLocation]);

  // ✅ Only fetch data once on mount
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('📤 Fetching listings for landing page...');
        const listingsRes = await listingsAPI.search({ limit: 50 });
        if (!mounted) return;
        
        const listingsData = listingsRes.data?.listings || [];
        setAllListings(listingsData);

        if (listingsData.length === 0) {
          console.log('📤 No listings found, fetching businesses as fallback...');
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

  // ✅ Loading state with cleaner design
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
      {/* Navigation - Simplified */}
      <nav style={{
        backgroundColor: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#eff6ff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #dbeafe'
          }}>
            <SketchIcon d={ICONS.store} size={22} color="#2563eb" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Kum<span style={{ color: '#2563eb' }}>sika</span>
          </h1>
          <span style={{
            fontSize: '12px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            padding: '5px 12px',
            borderRadius: '20px',
            fontWeight: '600',
            border: '1px solid #e2e8f0'
          }}>
            Mitundu 🇲🇼
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <LanguageToggle />
          <button onClick={() => navigate('/about')} style={{
            padding: '9px 16px',
            backgroundColor: '#f8fafc',
            color: '#334155',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            About
          </button>
          <button onClick={() => navigate('/search')} style={{
            padding: '9px 16px',
            backgroundColor: '#f8fafc',
            color: '#334155',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Browse All
          </button>
          <Link to="/login" style={{
            padding: '9px 16px',
            backgroundColor: 'transparent',
            color: '#2563eb',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Sign In
          </Link>
          <Link to="/login" style={{
            padding: '9px 18px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}>
            + Post Listing
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        background: 'radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
        padding: '72px 24px 80px 24px',
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
            fontSize: '13px',
            fontWeight: '500',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <SketchIcon d={ICONS.sparkles} size={15} color="#f59e0b" strokeWidth={2} />
            <span>Mitundu's Local Goods & Service Directory</span>
          </div>
          <h1 style={{
            fontSize: '44px',
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
            fontSize: '17px',
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
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ paddingLeft: '20px' }}>
              <SketchIcon d={ICONS.search} size={20} color="#94a3b8" strokeWidth={2.2} />
            </div>
            <input
              type="text"
              placeholder="Search maize, plumber, cement, hardware, tailor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: 'none',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: 'transparent',
                color: '#0f172a'
              }}
            />
            <button type="submit" style={{
              padding: '12px 26px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}>
              <span>Search</span>
              <SketchIcon d={ICONS.arrowRight} size={16} color="#ffffff" strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '24px',
          textAlign: 'center',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>
              {allListings.length}+
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Active Goods & Services
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>50+</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Local Businesses
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb' }}>10+</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Service Categories
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a' }}>100%</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
              Verified Local Traders
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 0 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Categories */}
          <div>
            <label style={{
              fontSize: '11px',
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
              flexWrap: 'wrap'
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
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      backgroundColor: isActive ? '#2563eb' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      borderColor: isActive ? '#2563eb' : '#e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.25)' : 'none'
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
              fontSize: '11px',
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
              flexWrap: 'wrap'
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
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                      backgroundColor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      borderColor: isActive ? '#0f172a' : '#e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(15,23,42,0.15)' : 'none'
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

      {/* Listings Grid */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 24px 72px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '800',
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.01em'
          }}>
            Marketplace & Services in Mitundu
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
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
            fontSize: '14px'
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '24px'
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
                      : '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  onClick={() => handleListingClick(item)}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '190px',
                    backgroundColor: '#f1f5f9',
                    overflow: 'hidden'
                  }}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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

                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                      lineHeight: '1.3'
                    }}>
                      {item.title}
                    </h3>
                    <p style={{
                      fontSize: '13px',
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
                          fontSize: '15px',
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
                          fontSize: '12px',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
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
            padding: '64px 20px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
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
              fontSize: '18px',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 6px 0'
            }}>No listings found</h3>
            <p style={{
              color: '#64748b',
              fontSize: '14px',
              marginBottom: '24px'
            }}>Try adjusting your filters or be the first to offer this product/service!</p>
            <Link to="/login" style={{
              padding: '12px 28px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-block',
              boxShadow: '0 4px 14px rgba(37,99,235,0.25)'
            }}>
              + Post a Listing Now
            </Link>
          </div>
        )}
      </main>

      {/* CTA Banner */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 56px auto', padding: '0 24px' }}>
        <div style={{
          background: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          borderRadius: '24px',
          padding: '52px 24px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#f59e0b',
            marginBottom: '12px'
          }}>
            <SketchIcon d={ICONS.sparkles} size={18} color="#f59e0b" strokeWidth={2} />
            <span>Join Local Sellers & Pros</span>
          </div>
          <h2 style={{
            fontSize: '30px',
            fontWeight: '800',
            margin: '0 0 12px 0',
            letterSpacing: '-0.01em'
          }}>Grow Your Local Business in Mitundu</h2>
          <p style={{
            color: '#94a3b8',
            maxWidth: '540px',
            margin: '0 auto 28px auto',
            fontSize: '15px',
            lineHeight: '1.6'
          }}>
            Sell physical goods, advertise farm crops, or offer repair & trade services. Set up in less than 2 minutes for free.
          </p>
          <Link to="/login" style={{
            padding: '14px 32px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '15px',
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

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '40px 24px',
        textAlign: 'center',
        borderTop: '1px solid #1e293b'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Home</Link>
          <Link to="/about" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>About</Link>
          <Link to="/search" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Browse</Link>
          <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Sell Goods</Link>
          <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Offer Services</Link>
        </div>
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
          © {new Date().getFullYear()} Kumsika — Dedicated to Empowering Mitundu Commerce 🇲🇼
        </p>
      </footer>
    </div>
  );
};

export default Landing;