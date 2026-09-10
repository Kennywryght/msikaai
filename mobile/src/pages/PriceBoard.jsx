// mobile/src/pages/PriceBoard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
    trendingDown: "M23 18l-9.5-9.5-5 5L1 6",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    refresh: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15",
    share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  };

  const d = icons[name] || icons.store;
  
  return (
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
};

// ============================================================
// MOCK BOARD DATA
// ============================================================
const BOARD_DATA = {
  date: 'Monday, 8 September 2025',
  location: 'Mitundu Trading Centre',
  lastUpdated: '7:40 AM',
  categories: [
    {
      id: 'produce',
      name: 'Produce',
      emoji: '🥬',
      vendorCount: 6,
      items: [
        { name: 'Tomatoes, basket', price: 'MK500 - MK700', trend: 'up', change: '+MK50' },
        { name: 'Maize, 50kg bag', price: 'MK340 - MK360', trend: 'stable', change: '0' },
        { name: 'Onions, per kg', price: 'MK800', trend: 'down', change: '-MK30' },
        { name: 'Cabbage, head', price: 'MK400', trend: 'stable', change: '0' },
        { name: 'Potatoes, 10kg', price: 'MK1,200', trend: 'up', change: '+MK100' },
      ]
    },
    {
      id: 'grains',
      name: 'Grains & Cereals',
      emoji: '🌾',
      vendorCount: 4,
      items: [
        { name: 'Maize flour, 5kg', price: 'MK450 - MK500', trend: 'up', change: '+MK20' },
        { name: 'Rice, per kg', price: 'MK1,800', trend: 'stable', change: '0' },
        { name: 'Beans, per kg', price: 'MK1,500', trend: 'up', change: '+MK100' },
      ]
    },
    {
      id: 'clothing',
      name: 'Clothing',
      emoji: '👕',
      vendorCount: 3,
      items: [
        { name: 'Secondhand shirts', price: 'MK1,000 - MK2,500', trend: 'stable', change: '0' },
        { name: 'School shoes', price: 'MK4,500', trend: 'up', change: '+MK200' },
        { name: 'Chitenje fabric, 2m', price: 'MK3,000', trend: 'stable', change: '0' },
      ]
    },
    {
      id: 'services',
      name: 'Services',
      emoji: '🔧',
      vendorCount: 4,
      items: [
        { name: 'Electrician, home visit', price: 'MK5,000', trend: 'stable', change: '0' },
        { name: 'Tailoring, per item', price: 'MK1,500 - MK3,000', trend: 'up', change: '+MK500' },
        { name: 'Plumber, per hour', price: 'MK4,000', trend: 'stable', change: '0' },
      ]
    },
  ],
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const PriceBoard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(BOARD_DATA.lastUpdated);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    setRefreshing(false);
    success('Board updated!');
  };

  const handlePostStock = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/post-stock');
  };

  const handleShare = async () => {
    const shareText = `Today's Market Board - ${BOARD_DATA.date}\n\n` +
      BOARD_DATA.categories.map(cat => 
        `${cat.name}:\n${cat.items.map(i => `  • ${i.name}: ${i.price}`).join('\n')}`
      ).join('\n\n') +
      `\n\nView on Kumsika: ${window.location.href}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Today's Market Board",
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        success('Board copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
      }
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const filteredCategories = activeCategory === 'all' 
    ? BOARD_DATA.categories 
    : BOARD_DATA.categories.filter(c => c.id === activeCategory);

  return (
    <div className="price-board">
      {/* Header */}
      <div className="board-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={18} color="#1E293B" strokeWidth={1.75} />
          </button>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleRefresh} disabled={refreshing}>
              <Icon 
                name="refresh" 
                size={18} 
                color="#64748B" 
                strokeWidth={1.75}
                className={refreshing ? 'spinning' : ''}
              />
            </button>
            <button className="icon-btn" onClick={handleShare}>
              <Icon name="share" size={18} color="#64748B" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="trendingUp" size={14} color="#F59E0B" strokeWidth={1.75} />
            <span>Today's Board</span>
          </div>
          <h1 className="page-title">Market Prices</h1>
          <div className="header-meta">
            <span className="meta-item">
              <Icon name="mapPin" size={12} color="#94A3B8" strokeWidth={1.75} />
              {BOARD_DATA.location}
            </span>
            <span className="meta-divider">•</span>
            <span className="meta-item">
              <Icon name="clock" size={12} color="#94A3B8" strokeWidth={1.75} />
              Updated {lastUpdated}
            </span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button 
          className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {BOARD_DATA.categories.map(cat => (
          <button
            key={cat.id}
            className={`filter-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span>{cat.emoji}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Board Content */}
      <div className="board-content">
        {filteredCategories.map(category => (
          <div key={category.id} className="category-section">
            <div className="category-header">
              <div className="category-title-wrap">
                <span className="category-emoji">{category.emoji}</span>
                <h2 className="category-name">{category.name}</h2>
              </div>
              <span className="vendor-count">{category.vendorCount} vendors</span>
            </div>

            <div className="items-list">
              {category.items.map((item, idx) => (
                <div key={idx} className="item-row">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                  </div>
                  <div className="item-price-wrap">
                    <span className="item-price">{item.price}</span>
                    {item.trend !== 'stable' && (
                      <span className={`item-trend ${item.trend}`}>
                        <Icon 
                          name={item.trend === 'up' ? 'trendingUp' : 'trendingDown'} 
                          size={10} 
                          color={item.trend === 'up' ? '#EF4444' : '#10B981'} 
                          strokeWidth={2}
                        />
                        {item.change}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Post Today's Stock CTA */}
      <div className="post-cta-section">
        <div className="cta-card">
          <div className="cta-content">
            <div className="cta-icon">
              <Icon name="sparkles" size={20} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div className="cta-text">
              <h3 className="cta-title">Selling today?</h3>
              <p className="cta-desc">Post your stock to the board and reach more buyers</p>
            </div>
          </div>
          <button className="cta-btn" onClick={handlePostStock}>
            Post Today's Stock
          </button>
        </div>
      </div>

      {/* Info Footer */}
      <div className="info-footer">
        <Icon name="info" size={14} color="#94A3B8" strokeWidth={1.75} />
        <span>Prices are updated throughout the day by local vendors</span>
      </div>

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
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? '#FFFFFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .price-board {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .price-board {
            padding-bottom: 40px;
          }
        }

        /* ===== HEADER ===== */
        .board-header {
          background: #FFFFFF;
          padding: 14px 16px 20px;
          border-bottom: 1px solid #F1F5F9;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #F1F5F9;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: #F1F5F9;
        }

        .icon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .icon-btn .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.08);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #F59E0B;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .page-title {
          font-size: clamp(24px, 3vw, 30px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 6px;
          letter-spacing: -0.5px;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94A3B8;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .meta-divider {
          color: #E2E8F0;
        }

        /* ===== CATEGORY FILTER ===== */
        .category-filter {
          display: flex;
          gap: 8px;
          padding: 14px 16px;
          overflow-x: auto;
          scrollbar-width: none;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          position: sticky;
          top: 130px;
          z-index: 9;
        }

        .category-filter::-webkit-scrollbar {
          display: none;
        }

        .filter-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          font-family: inherit;
        }

        .filter-chip:hover {
          border-color: #94A3B8;
        }

        .filter-chip.active {
          background: #1E293B;
          border-color: #1E293B;
          color: #FFFFFF;
        }

        /* ===== BOARD CONTENT ===== */
        .board-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px;
        }

        .category-section {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          margin-bottom: 12px;
          border: 1px solid #F1F5F9;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .category-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .category-emoji {
          font-size: 20px;
        }

        .category-name {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .vendor-count {
          font-size: 12px;
          color: #94A3B8;
          background: #F1F5F9;
          padding: 3px 12px;
          border-radius: 12px;
          font-weight: 500;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #F8FAFC;
          gap: 12px;
        }

        .item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-name {
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }

        .item-price-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }

        .item-price {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
        }

        .item-trend {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 11px;
          font-weight: 600;
        }

        .item-trend.up {
          color: #EF4444;
        }

        .item-trend.down {
          color: #10B981;
        }

        /* ===== POST CTA ===== */
        .post-cta-section {
          max-width: 800px;
          margin: 16px auto 0;
          padding: 0 16px;
        }

        .cta-card {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          border-radius: 14px;
          padding: 20px;
          color: #FFFFFF;
          position: relative;
          overflow: hidden;
        }

        .cta-card::before {
          content: '';
          position: absolute;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          top: -80px;
          right: -60px;
          pointer-events: none;
        }

        .cta-content {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .cta-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cta-text {
          flex: 1;
        }

        .cta-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #FFFFFF;
        }

        .cta-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
          line-height: 1.4;
        }

        .cta-btn {
          width: 100%;
          padding: 12px;
          background: #F59E0B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          position: relative;
          z-index: 1;
        }

        .cta-btn:hover {
          background: #D97706;
          transform: scale(0.98);
        }

        /* ===== INFO FOOTER ===== */
        .info-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 24px 16px 16px;
          font-size: 12px;
          color: #94A3B8;
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.4);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }

        .nav-btn {
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

        .nav-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label.active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .board-header {
            padding: 12px 12px 16px;
          }
          .page-title {
            font-size: 22px;
          }
          .category-filter {
            padding: 12px;
            top: 118px;
          }
          .board-content {
            padding: 12px;
          }
          .category-section {
            padding: 14px;
          }
          .post-cta-section {
            padding: 0 12px;
          }
          .cta-card {
            padding: 16px;
          }
          .item-name {
            font-size: 13px;
          }
          .item-price {
            font-size: 13px;
          }
        }

        @media (max-width: 380px) {
          .category-section {
            padding: 12px;
          }
          .category-name {
            font-size: 15px;
          }
          .vendor-count {
            font-size: 11px;
            padding: 2px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default PriceBoard;