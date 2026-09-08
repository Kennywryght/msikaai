// mobile/src/pages/About.jsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';

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
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  check: "M20 6L9 17l-5-5",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  award: "M12 15l-3.5 2 1.33-4.5-3.33-2.5h4.17L12 6l1.33 4h4.17l-3.33 2.5L15.5 17 12 15z",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  return (
    <div className="about-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Icon d={ICONS.sparkles} size={28} color="#F59E0B" strokeWidth={1.75} />
          </div>
          <h1 className="hero-title">
            About <span className="hero-highlight">Kumsika</span>
          </h1>
          <p className="hero-subtitle">
            Malawi's first AI powered local marketplace connecting buyers, sellers and skilled laborers in one place.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Mission */}
        <section className="section">
          <div className="section-header">
            <Icon d={ICONS.heart} size={22} color="#F59E0B" strokeWidth={1.75} />
            <h2 className="section-title">Our Mission</h2>
          </div>
          <div className="card">
            <p className="card-text">
              <strong>Kumsika</strong> exists to empower local businesses, farmers and skilled laborers in Malawi by providing a digital platform where they can be discovered, trusted and connected with customers all powered by AI that works in Chichewa and English.
            </p>
            <p className="card-text" style={{ marginTop: '12px' }}>
              We believe that technology should serve communities, not replace them. That is why we built Kumsika to be local first, voice friendly and built for the way Malawians actually trade.
            </p>
          </div>
        </section>

        {/* Developer & Contact */}
        <section className="section">
          <div className="section-header">
            <Icon d={ICONS.mail} size={22} color="#F59E0B" strokeWidth={1.75} />
            <h2 className="section-title">Developer and Contact</h2>
          </div>
          <div className="contact-card">
            <p className="contact-text">
              Have questions, feedback or custom development inquiries? Get in touch directly:
            </p>
            <div className="contact-item">
              <Icon d={ICONS.mail} size={18} color="#F59E0B" strokeWidth={1.75} />
              <span>
                <strong>Email:</strong>{' '}
                <a href="mailto:kennedybanda940@gmail.com" className="contact-link">
                  kennedybanda940@gmail.com
                </a>
              </span>
            </div>
            <div className="contact-item">
              <Icon d={ICONS.phone} size={18} color="#10B981" strokeWidth={1.75} />
              <span>
                <strong>WhatsApp:</strong>{' '}
                <a 
                  href="https://wa.me/265888921110" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="contact-link whatsapp"
                >
                  +265 888 921 110
                </a>
              </span>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="section">
          <div className="section-header">
            <Icon d={ICONS.trendingUp} size={22} color="#F59E0B" strokeWidth={1.75} />
            <h2 className="section-title">Our Impact</h2>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Local Businesses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10+</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Free to Join</div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section">
          <div className="section-header">
            <Icon d={ICONS.check} size={22} color="#F59E0B" strokeWidth={1.75} />
            <h2 className="section-title">Our Values</h2>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Icon d={ICONS.users} size={22} color="#F59E0B" strokeWidth={1.75} />
              </div>
              <h4 className="value-title">Community First</h4>
              <p className="value-desc">Built for and with the people of Malawi</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Icon d={ICONS.bot} size={22} color="#3B82F6" strokeWidth={1.75} />
              </div>
              <h4 className="value-title">AI for Everyone</h4>
              <p className="value-desc">Voice and text AI that works in Chichewa</p>
            </div>
            <div className="value-card">
              <div className="value-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <Icon d={ICONS.store} size={22} color="#10B981" strokeWidth={1.75} />
              </div>
              <h4 className="value-title">Local Commerce</h4>
              <p className="value-desc">Supporting local businesses and traders</p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="section">
          <div className="section-header">
            <Icon d={ICONS.users} size={22} color="#F59E0B" strokeWidth={1.75} />
            <h2 className="section-title">Built with Love</h2>
          </div>
          <div className="team-grid">
            <div className="team-card">
              <div className="team-avatar">👨‍💻</div>
              <h4 className="team-name">Kennedy Banda</h4>
              <p className="team-role">Lead Developer and Creator</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">🌾</div>
              <h4 className="team-name">Our Community</h4>
              <p className="team-role">Malawi Businesses and Farmers</p>
            </div>
            <div className="team-card">
              <div className="team-avatar">🤝</div>
              <h4 className="team-name">Our Partners</h4>
              <p className="team-role">Local Leaders and Innovators</p>
            </div>
          </div>
        </section>
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
          <p className="footer-text">© {new Date().getFullYear()} Kumsika — Built for Malawi 🇲🇼</p>
        </div>
      </footer>

      <style jsx>{`
        .about-page {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .about-page {
            padding-bottom: 0;
          }
        }

        /* ===== HERO ===== */
        .hero {
          background: linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%);
          padding: 60px 20px 64px;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin-top: 0;
        }

        .hero::before {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%);
          border-radius: 50%;
          top: -150px;
          right: -100px;
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 700px;
          margin: 0 auto;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(245, 158, 11, 0.12);
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .hero-title {
          font-size: clamp(30px, 4.5vw, 40px);
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .hero-highlight {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(16px, 1.4vw, 18px);
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto;
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 1000px;
          margin: 0 auto;
          padding: 32px 16px 40px;
        }

        /* ===== SECTION ===== */
        .section {
          margin-bottom: 36px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: clamp(20px, 2.2vw, 24px);
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        /* ===== CARDS ===== */
        .card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 20px 24px;
          border: 1px solid #F1F5F9;
        }

        .card-text {
          font-size: clamp(15px, 1.2vw, 16px);
          color: #64748B;
          line-height: 1.8;
          margin: 0;
        }

        /* ===== CONTACT ===== */
        .contact-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 20px 24px;
          border: 1px solid #F1F5F9;
        }

        .contact-text {
          font-size: 15px;
          color: #64748B;
          margin: 0 0 14px;
          line-height: 1.6;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          font-size: 15px;
          color: #64748B;
        }

        .contact-link {
          color: #F59E0B;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .contact-link:hover {
          color: #D97706;
        }

        .contact-link.whatsapp {
          color: #10B981;
        }

        .contact-link.whatsapp:hover {
          color: #059669;
        }

        /* ===== STATS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        @media (min-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-item {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 18px 14px;
          border: 1px solid #F1F5F9;
          text-align: center;
          transition: all 0.2s;
        }

        .stat-item:hover {
          border-color: #E2E8F0;
          transform: translateY(-2px);
        }

        .stat-number {
          font-size: clamp(24px, 2.5vw, 30px);
          font-weight: 800;
          color: #F59E0B;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #94A3B8;
          margin-top: 4px;
        }

        /* ===== VALUES ===== */
        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
        }

        .value-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 20px 18px;
          border: 1px solid #F1F5F9;
          text-align: center;
          transition: all 0.2s;
        }

        .value-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .value-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
        }

        .value-title {
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
        }

        .value-desc {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
          line-height: 1.5;
        }

        /* ===== TEAM ===== */
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 14px;
        }

        .team-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 20px 16px;
          border: 1px solid #F1F5F9;
          text-align: center;
          transition: all 0.2s;
        }

        .team-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-2px);
        }

        .team-avatar {
          width: clamp(64px, 7vw, 76px);
          height: clamp(64px, 7vw, 76px);
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: clamp(28px, 3vw, 32px);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
        }

        .team-name {
          font-size: 15px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 2px;
        }

        .team-role {
          font-size: 13px;
          color: #94A3B8;
          margin: 0;
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

        /* ===== FOOTER ===== */
        .footer {
          background: #1E293B;
          padding: 20px 16px;
          text-align: center;
        }

        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        .footer-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 380px) {
          .hero {
            padding: 40px 16px 44px;
          }
          .hero-title {
            font-size: 26px;
          }
          .stats-grid {
            gap: 8px;
          }
          .stat-item {
            padding: 12px 8px;
          }
          .stat-number {
            font-size: 20px;
          }
          .values-grid {
            grid-template-columns: 1fr;
          }
          .team-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .card {
            padding: 16px 18px;
          }
          .contact-card {
            padding: 16px 18px;
          }
          .value-card {
            padding: 16px 14px;
          }
          .team-card {
            padding: 16px 14px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .values-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .team-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default About;