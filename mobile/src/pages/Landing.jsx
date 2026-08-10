import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listingsAPI, businessAPI } from '../services/api';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../context/TranslationContext';

// --- HAND-DRAWN / MODERN SVG ICONS ---
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
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  farm: "M12 22V10M12 10C9 6 4 6 4 6s1 5 5 6M12 10c3-4 8-4 8-4s-1 5-5 6M12 15c-3-2-6-1-6-1s1 3 4 3M12 15c3-2 6-1 6-1s-1 3-4 3",
  hammer: "M15 5l4 4M13 3l6 6-3 3-6-6 3-3zM9 11L2 18l3 3 7-7",
  wrench: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  shopping: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  utensils: "M18 2v20M21 2v6a3 3 0 01-3 3M10 2v8a3 3 0 01-3 3H6a3 3 0 01-3-3V2M6 13v9",
  scissors: "M6 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM20 4L8.12 11.88M14.8 14.8L20 20M8.12 12.12L12 16",
  hardware: "M12 2v20M17 5H7M17 19H7M19 12H5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  delivery: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 16h6",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  about: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01"
};

const CATEGORIES = [
  { label: 'All', iconKey: 'store' },
  { label: 'Farm Inputs', iconKey: 'farm' },
  { label: 'Construction', iconKey: 'hammer' },
  { label: 'Plumber', iconKey: 'wrench' },
  { label: 'Retail', iconKey: 'shopping' },
  { label: 'Restaurant', iconKey: 'utensils' },
  { label: 'Tailor', iconKey: 'scissors' },
  { label: 'Hardware', iconKey: 'hardware' }
];

const LOCATIONS = [
  'All Areas',
  'Mitundu Trading Centre',
  'Mitundu Bunda',
  'Mitundu Chimbiri',
  'Mitundu Motolosi',
  'Mitundu Nkhoma',
  'Mitundu Town',
  'Mitundu Rural'
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('📤 Fetching listings for landing page...');
      const listingsRes = await listingsAPI.search({ limit: 50 });
      const listingsData = listingsRes.data?.listings || [];
      setAllListings(listingsData);

      if (listingsData.length === 0) {
        console.log('📤 No listings found, fetching businesses as fallback...');
        const bizResponse = await businessAPI.getAll({ limit: 20 });
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
          setAllListings(bizListings);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError('Could not load market listings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

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

  const formatTimeAgo = (date) => {
    if (!date) return 'Recently';
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const filteredListings = allListings.filter((item) => {
    const categoryMatch = selectedCategory === 'All' || 
      item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    const locationMatch = selectedLocation === 'All Areas' || 
      (item.location_area && item.location_area.includes(selectedLocation)) ||
      (item.address && item.address.includes(selectedLocation));
    return categoryMatch && locationMatch;
  });

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '600', tracking: '0.01em' }}>
          Discovering local products & services in Mitundu...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Dynamic Keyframe Injection */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .hover-lift { transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease; }
        .hover-lift:hover { transform: translateY(-4px); }
        .pill-scroll::-webkit-scrollbar { display: none; }
        .pill-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Modern Navigation Header */}
      <nav style={styles.nav}>
        <div style={styles.brandContainer}>
          <div style={styles.logoBadge}>
            <SketchIcon d={ICONS.store} size={22} color="#2563eb" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={styles.brandTitle}>
              Msika<span style={{ color: '#2563eb' }}>AI</span>
            </h1>
          </div>
          <span style={styles.locationTag}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', marginRight: '6px' }}></span>
            Mitundu 🇲🇼
          </span>
        </div>

        <div style={styles.navActions}>
          <LanguageToggle />
          <button onClick={() => navigate('/about')} style={styles.btnSecondary}>
            <SketchIcon d={ICONS.about} size={15} color="#475569" strokeWidth={2} />
            <span>About</span>
          </button>
          <button onClick={() => navigate('/search')} style={styles.btnSecondary}>
            Browse All
          </button>
          <Link to="/login" style={styles.btnOutline}>
            Sign In
          </Link>
          <Link to="/login" style={styles.btnPrimary}>
            + Post Listing
          </Link>
        </div>
      </nav>

      {/* Refined Hero Header */}
      <header style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroPill}>
            <SketchIcon d={ICONS.sparkles} size={15} color="#f59e0b" strokeWidth={2} />
            <span>Mitundu's Local Goods & Service Directory</span>
          </div>
          <h1 style={styles.heroTitle}>
            Buy Goods & Hire Local Pros in <span style={styles.heroHighlight}>Mitundu</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Find farmers, hardware supplies, plumbers, tailors, and fresh local produce—all in one place.
          </p>

          <form onSubmit={handleSearch} style={styles.searchBox}>
            <div style={{ paddingLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <SketchIcon d={ICONS.search} size={20} color="#94a3b8" strokeWidth={2.2} />
            </div>
            <input
              type="text"
              placeholder="Search maize, plumber, cement, hardware, tailor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>
              <span>Search</span>
              <SketchIcon d={ICONS.arrowRight} size={16} color="#ffffff" strokeWidth={2.5} />
            </button>
          </form>

          <div style={styles.heroActionGroup}>
            <button onClick={() => navigate('/login')} style={styles.heroChipButton}>
              <SketchIcon d={ICONS.mic} size={15} color="#60a5fa" strokeWidth={2} />
              <span>Voice Listing</span>
            </button>
            <button onClick={() => navigate('/login')} style={styles.heroChipButton}>
              <SketchIcon d={ICONS.bot} size={15} color="#34d399" strokeWidth={2} />
              <span>AI Assistant</span>
            </button>
            <button onClick={() => navigate('/search')} style={styles.heroChipButton}>
              <SketchIcon d={ICONS.mapPin} size={15} color="#f87171" strokeWidth={2} />
              <span>Near Me</span>
            </button>
          </div>
        </div>
      </header>

      {/* Metrics Bar */}
      <div style={styles.statsBar}>
        <div style={styles.statsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>{allListings.length}+</div>
            <div style={styles.statLabel}>Active Goods & Services</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>50+</div>
            <div style={styles.statLabel}>Local Businesses</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>10+</div>
            <div style={styles.statLabel}>Service Categories</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ ...styles.statNumber, color: '#16a34a' }}>100%</div>
            <div style={styles.statLabel}>Verified Local Traders</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filterSection}>
        <div style={styles.filterRow}>
          {/* Category Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <SketchIcon d={ICONS.tag} size={14} color="#64748b" strokeWidth={2} />
              <span>FILTER BY CATEGORY</span>
            </label>
            <div style={styles.filterScroll} className="pill-scroll">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.label;
                const iconPath = ICONS[cat.iconKey] || ICONS.store;
                return (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedCategory(cat.label)}
                    style={{
                      ...styles.filterPill,
                      backgroundColor: isActive ? '#2563eb' : '#ffffff',
                      color: isActive ? '#ffffff' : '#334155',
                      borderColor: isActive ? '#2563eb' : '#e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
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

          {/* Location Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              <SketchIcon d={ICONS.mapPin} size={14} color="#64748b" strokeWidth={2} />
              <span>FILTER BY LOCATION</span>
            </label>
            <div style={styles.filterScroll} className="pill-scroll">
              {LOCATIONS.map((loc) => {
                const isActive = selectedLocation === loc;
                return (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    style={{
                      ...styles.filterPill,
                      backgroundColor: isActive ? '#0f172a' : '#ffffff',
                      color: isActive ? '#ffffff' : '#475569',
                      borderColor: isActive ? '#0f172a' : '#e2e8f0',
                      boxShadow: isActive ? '0 4px 12px rgba(15, 23, 42, 0.15)' : 'none'
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

      {/* Main Grid Content */}
      <main style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Marketplace & Services in Mitundu</h2>
            <p style={styles.sectionSubtitle}>
              {filteredListings.length > 0
                ? `Showing ${filteredListings.length} verified listings`
                : 'No items match your selected filter.'}
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={fetchData} style={styles.retryBtn}>Retry</button>
          </div>
        )}

        {filteredListings.length > 0 ? (
          <div style={styles.grid}>
            {filteredListings.map((item) => {
              const isHovered = hoveredCard === item.id;
              const isService = item.category?.toLowerCase().includes('plumber') ||
                                item.category?.toLowerCase().includes('tailor') ||
                                item.category?.toLowerCase().includes('service');

              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.listingCard,
                    transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                    borderColor: isHovered ? '#bfdbfe' : '#e2e8f0',
                    boxShadow: isHovered
                      ? '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
                      : '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                  onClick={() => handleListingClick(item)}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={styles.imageWrapper}>
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        style={styles.listingImage}
                      />
                    ) : (
                      <div style={styles.imagePlaceholder}>
                        <SketchIcon d={ICONS.store} size={42} color="#94a3b8" strokeWidth={1.5} />
                      </div>
                    )}
                    
                    {/* Good vs Service Tag */}
                    <span style={{
                      ...styles.typeBadge,
                      backgroundColor: isService ? '#e0e7ff' : '#ecfdf5',
                      color: isService ? '#3730a3' : '#065f46',
                      borderColor: isService ? '#c7d2fe' : '#a7f3d0'
                    }}>
                      {isService ? 'SERVICE' : 'GOODS'}
                    </span>

                    {item.delivery_available && (
                      <span style={styles.deliveryBadge}>
                        <SketchIcon d={ICONS.delivery} size={11} color="#ffffff" strokeWidth={2} />
                        <span style={{ marginLeft: '3px' }}>Delivery</span>
                      </span>
                    )}

                    {item.location_area && (
                      <span style={styles.locationBadge}>
                        <SketchIcon d={ICONS.mapPin} size={11} color="#ffffff" strokeWidth={2} />
                        <span style={{ marginLeft: '3px' }}>{item.location_area}</span>
                      </span>
                    )}
                  </div>

                  <div style={styles.cardBody}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.cardTitle}>{item.title}</h3>
                    </div>

                    <p style={styles.businessName}>
                      {item.businesses?.business_name || 'Verified Local Trader'}
                    </p>

                    <div style={styles.cardFooter}>
                      <div>
                        <span style={styles.priceLabel}>
                          {isService ? 'ESTIMATED RATE' : 'PRICE'}
                        </span>
                        <span style={styles.priceTag}>
                          {formatPrice(item.price)}
                        </span>
                      </div>
                      
                      <button style={styles.cardActionButton}>
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
          <div style={styles.emptyState}>
            <div style={styles.emptyIconCircle}>
              <SketchIcon d={ICONS.store} size={36} color="#64748b" strokeWidth={1.5} />
            </div>
            <h3 style={styles.emptyTitle}>No listings found</h3>
            <p style={styles.emptySubtitle}>Try adjusting your filters or be the first to offer this product/service!</p>
            <Link to="/login" style={styles.btnPrimaryLarge}>
              + Post a Listing Now
            </Link>
          </div>
        )}
      </main>

      {/* Modern Call to Action Banner */}
      <div style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <div style={styles.ctaBadge}>
            <SketchIcon d={ICONS.sparkles} size={18} color="#f59e0b" strokeWidth={2} />
            <span>Join Local Sellers & Pros</span>
          </div>
          <h2 style={styles.ctaTitle}>Grow Your Local Business in Mitundu</h2>
          <p style={styles.ctaSubtitle}>
            Sell physical goods, advertise farm crops, or offer repair & trade services. Set up in less than 2 minutes for free.
          </p>
          <Link to="/login" style={styles.ctaButton}>
            <span>Start Listing Today</span>
            <SketchIcon d={ICONS.arrowRight} size={16} color="#0f172a" strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <Link to="/" style={styles.footerLink}>Home</Link>
          <Link to="/about" style={styles.footerLink}>About</Link>
          <Link to="/search" style={styles.footerLink}>Browse</Link>
          <Link to="/login" style={styles.footerLink}>Sell Goods</Link>
          <Link to="/login" style={styles.footerLink}>Offer Services</Link>
        </div>
        <p style={styles.copyrightText}>
          © {new Date().getFullYear()} MsikaAI — Dedicated to Empowering Mitundu Commerce 🇲🇼
        </p>
      </footer>
    </div>
  );
};

// --- ELEVATED STYLESHEET ---
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#0f172a',
    lineHeight: '1.5'
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: '#f8fafc'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  nav: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
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
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #dbeafe',
    boxShadow: '0 2px 4px rgba(37,99,235,0.06)'
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.5px'
  },
  locationTag: {
    fontSize: '12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '5px 12px',
    borderRadius: '20px',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
    display: 'inline-flex',
    alignItems: 'center'
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  btnPrimary: {
    padding: '9px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
  },
  btnPrimaryLarge: {
    padding: '12px 28px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-block',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
  },
  btnSecondary: {
    padding: '9px 16px',
    backgroundColor: '#f8fafc',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  btnOutline: {
    padding: '9px 16px',
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600'
  },
  hero: {
    background: 'radial-gradient(circle at top right, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
    padding: '72px 24px 80px 24px',
    textAlign: 'center',
    color: '#ffffff',
    position: 'relative'
  },
  heroContent: {
    maxWidth: '820px',
    margin: '0 auto'
  },
  heroPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: '6px 16px',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '24px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(4px)'
  },
  heroTitle: {
    fontSize: '44px',
    fontWeight: '800',
    marginBottom: '18px',
    lineHeight: '1.15',
    letterSpacing: '-0.02em'
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none'
  },
  heroSubtitle: {
    fontSize: '17px',
    marginBottom: '36px',
    color: '#94a3b8',
    fontWeight: '400',
    maxWidth: '640px',
    margin: '0 auto 36px auto'
  },
  searchBox: {
    maxWidth: '640px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.4)',
    padding: '6px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  searchInput: {
    flex: 1,
    padding: '14px 16px',
    border: 'none',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#0f172a'
  },
  searchButton: {
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
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
  },
  heroActionGroup: {
    marginTop: '28px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  heroChipButton: {
    padding: '8px 18px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  statsBar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '24px',
    textAlign: 'center',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  statBox: {
    padding: '4px'
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: '-0.5px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
    fontWeight: '600',
    letterSpacing: '0.02em'
  },
  filterSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '28px 24px 0 24px'
  },
  filterRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  filterGroup: {
    width: '100%'
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
    letterSpacing: '0.05em'
  },
  filterScroll: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '8px',
    flexWrap: 'wrap'
  },
  filterPill: {
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
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '28px 24px 72px 24px'
  },
  sectionHeader: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 6px 0',
    letterSpacing: '-0.01em'
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: '24px'
  },
  listingCard: {
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '190px',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden'
  },
  listingImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
  },
  typeBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    fontSize: '10px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid',
    letterSpacing: '0.04em'
  },
  deliveryBadge: {
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
  },
  locationBadge: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(4px)',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-flex',
    alignItems: 'center'
  },
  cardBody: {
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  cardHeader: {
    marginBottom: '4px'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.3'
  },
  businessName: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 18px 0',
    fontWeight: '500'
  },
  cardFooter: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  priceLabel: {
    display: 'block',
    fontSize: '9px',
    color: '#94a3b8',
    fontWeight: '800',
    letterSpacing: '0.05em'
  },
  priceTag: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#2563eb'
  },
  cardActionButton: {
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
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '64px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  emptyIconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 6px 0'
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '24px'
  },
  errorBanner: {
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
  },
  retryBtn: {
    backgroundColor: '#991b1b',
    color: '#ffffff',
    border: 'none',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600'
  },
  ctaSection: {
    maxWidth: '1200px',
    margin: '0 auto 56px auto',
    padding: '0 24px'
  },
  ctaCard: {
    background: 'radial-gradient(circle at top left, #1e293b 0%, #0f172a 100%)',
    color: '#ffffff',
    borderRadius: '24px',
    padding: '52px 24px',
    textAlign: 'center',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  ctaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: '12px'
  },
  ctaTitle: {
    fontSize: '30px',
    fontWeight: '800',
    margin: '0 0 12px 0',
    letterSpacing: '-0.01em'
  },
  ctaSubtitle: {
    color: '#94a3b8',
    maxWidth: '540px',
    margin: '0 auto 28px auto',
    fontSize: '15px',
    lineHeight: '1.6'
  },
  ctaButton: {
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
    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)'
  },
  footer: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '40px 24px',
    textAlign: 'center',
    borderTop: '1px solid #1e293b'
  },
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  footerLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500'
  },
  copyrightText: {
    margin: 0,
    color: '#64748b',
    fontSize: '13px'
  }
};

export default Landing;