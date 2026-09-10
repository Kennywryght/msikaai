// mobile/src/pages/NotFound.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    dashboard: "M3 12h3m6-6h3m-9 12h3m6-6h3m-6 6h3M3 6h3M3 18h3M12 6h3M12 18h3M21 6h3M21 18h3M12 12h3M21 12h3",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    plus: "M12 4v16m8-8H4",
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
// MAIN COMPONENT
// ============================================================
const NotFound = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <div className="not-found">
      <div className="main-content">
        <div className="error-container">
          {/* 404 Number */}
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
              <Icon name={user ? 'dashboard' : 'home'} size={16} color="#FFFFFF" strokeWidth={1.75} />
              {user ? 'Go to Dashboard' : 'Go Home'}
            </Link>

            <Link to="/search" className="btn-secondary">
              <Icon name="search" size={16} color="#1E293B" strokeWidth={1.75} />
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
                <Icon name="search" size={14} color="#F59E0B" strokeWidth={1.75} />
                <span>Browse products</span>
              </Link>
              <Link to="/landing" className="suggestion-item">
                <Icon name="home" size={14} color="#F59E0B" strokeWidth={1.75} />
                <span>Home page</span>
              </Link>
              <Link to={user ? '/dashboard' : '/login'} className="suggestion-item">
                <Icon name="store" size={14} color="#F59E0B" strokeWidth={1.75} />
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
          font-family: 'Georgia', serif;
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
          font-family: 'Georgia', serif;
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
          background: #1E293B;
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
          background: #F59E0B;
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
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
          border-radius: 10px;
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
          .error-title {
            font-size: 22px;
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
          .error-title {
            font-size: 20px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .suggestions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .digit.zero {
            animation: none;
          }
          .suggestion-item {
            transition: none;
          }
          .suggestion-item:hover {
            transform: none;
          }
          .btn-primary,
          .btn-secondary {
            transition: none;
          }
          .btn-primary:hover,
          .btn-secondary:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;