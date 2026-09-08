// mobile/src/pages/NotFound.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  dashboard: "M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3",
};

const NotFound = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

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
    try {
      await logout();
      success('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Failed to logout', 'error');
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <div className="not-found">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">K</span>
            <span className="logo-text">Kumsika</span>
          </Link>
          {user && (
            <div className="nav-actions">
              <span className="greeting">👋 {user?.email?.split('@')[0] || 'User'}</span>
              <button onClick={handleLogout} className="logout-btn">
                <Icon d={ICONS.home} size={16} color="#EF4444" strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="main-content">
        <div className="error-container">
          {/* Animated 404 */}
          <div className="error-number">
            <span className="digit">4</span>
            <span className="digit zero">0</span>
            <span className="digit">4</span>
          </div>

          <div className="error-icon">🔍</div>

          <h1 className="error-title">Page Not Found</h1>
          <p className="error-description">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="error-actions">
            <Link to={user ? '/dashboard' : '/'} className="btn-primary">
              <Icon d={user ? ICONS.dashboard : ICONS.home} size={16} color="#FFFFFF" strokeWidth={1.75} />
              {user ? 'Go to Dashboard' : 'Go Home'}
            </Link>

            <Link to="/search" className="btn-secondary">
              <Icon d={ICONS.search} size={16} color="#1E293B" strokeWidth={1.75} />
              Browse Listings
            </Link>
          </div>

          <div className="error-support">
            <p>
              Need help?{' '}
              <a href="mailto:support@kumsika.com" className="support-link">
                Contact Support
              </a>
            </p>
          </div>

          {/* Suggestions */}
          <div className="suggestions">
            <p className="suggestions-title">You might be looking for:</p>
            <div className="suggestions-grid">
              <Link to="/search" className="suggestion-item">
                <Icon d={ICONS.search} size={14} color="#F59E0B" strokeWidth={1.75} />
                <span>Browse products</span>
              </Link>
              <Link to="/landing" className="suggestion-item">
                <Icon d={ICONS.home} size={14} color="#F59E0B" strokeWidth={1.75} />
                <span>Home page</span>
              </Link>
              <Link to={user ? '/dashboard' : '/login'} className="suggestion-item">
                <Icon d={ICONS.store} size={14} color="#F59E0B" strokeWidth={1.75} />
                <span>{user ? 'Dashboard' : 'Sign in'}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      {isMobile && user && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'store' },
            { id: 'messages', label: 'Chat', icon: 'home' },
            { id: 'profile', label: 'Profile', icon: 'home' },
          ].map((item) => {
            const active = item.id === 'search';
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

      <style jsx>{`
        .not-found {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .not-found {
            padding-bottom: 0;
          }
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

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 16px;
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-container {
          max-width: 480px;
          width: 100%;
          text-align: center;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== 404 NUMBER ===== */
        .error-number {
          display: flex;
          justify-content: center;
          gap: 4px;
          margin-bottom: 8px;
          font-family: "Fraunces", Georgia, serif;
        }

        .digit {
          font-size: clamp(72px, 14vw, 110px);
          font-weight: 900;
          color: #E2E8F0;
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .digit.zero {
          color: #F59E0B;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* ===== ERROR ICON ===== */
        .error-icon {
          font-size: clamp(48px, 8vw, 64px);
          margin-bottom: 16px;
          display: block;
        }

        /* ===== ERROR TITLE ===== */
        .error-title {
          font-size: clamp(24px, 4vw, 28px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 8px;
          font-family: "Fraunces", Georgia, serif;
        }

        .error-description {
          font-size: clamp(14px, 1.3vw, 16px);
          color: #94A3B8;
          margin: 0 0 32px;
          line-height: 1.6;
        }

        /* ===== ACTIONS ===== */
        .error-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-bottom: 24px;
        }

        .btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, #1E293B, #F59E0B);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.2s;
          width: 100%;
        }

        .btn-primary:hover {
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .btn-secondary {
          padding: 12px 24px;
          background: #FFFFFF;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          color: #1E293B;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          transition: all 0.2s;
          width: 100%;
        }

        .btn-secondary:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          transform: scale(0.98);
        }

        /* ===== SUPPORT ===== */
        .error-support {
          margin-bottom: 32px;
        }

        .error-support p {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        .support-link {
          color: #F59E0B;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .support-link:hover {
          color: #D97706;
          text-decoration: underline;
        }

        /* ===== SUGGESTIONS ===== */
        .suggestions {
          padding-top: 24px;
          border-top: 1px solid #F1F5F9;
        }

        .suggestions-title {
          font-size: 13px;
          font-weight: 600;
          color: #94A3B8;
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .suggestions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .suggestion-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          text-decoration: none;
          color: #1E293B;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .suggestion-item:hover {
          border-color: #F59E0B;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .suggestion-item span {
          font-size: 11px;
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

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .main-content {
            padding: 24px 16px;
          }
          .suggestions-grid {
            grid-template-columns: 1fr;
          }
          .suggestion-item {
            flex-direction: row;
            justify-content: center;
            padding: 10px 12px;
          }
          .suggestion-item span {
            font-size: 13px;
          }
          .digit {
            font-size: 60px;
          }
        }

        @media (max-width: 380px) {
          .digit {
            font-size: 48px;
          }
          .error-actions {
            gap: 8px;
          }
          .btn-primary,
          .btn-secondary {
            padding: 10px 20px;
            font-size: 14px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .suggestions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;