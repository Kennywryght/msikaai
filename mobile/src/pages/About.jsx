// mobile/src/pages/About.jsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import LanguageToggle from '../components/LanguageToggle';

// ==========================================
// PREMIUM FEATHER ICONS
// ==========================================
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
};

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1E293B'
    },
    nav: {
      backgroundColor: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(16px)',
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid rgba(226,232,240,0.5)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '12px'
    },
    brandContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      textDecoration: 'none'
    },
    logoBadge: {
      width: '38px',
      height: '38px',
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
    },
    brandTitle: {
      fontSize: '20px',
      fontWeight: '800',
      color: '#1E293B',
      margin: 0,
      lineHeight: '1'
    },
    brandAccent: {
      color: '#F59E0B'
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    navBtn: {
      padding: '8px 16px',
      background: 'none',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#64748B',
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
    },
    navBtnPrimary: {
      padding: '8px 20px',
      background: '#1E293B',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'inherit',
      boxShadow: '0 2px 8px rgba(30,41,59,0.15)',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
    },
    hero: {
      background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)',
      padding: '48px 20px',
      textAlign: 'center',
      color: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden'
    },
    heroGlow: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
      borderRadius: '50%',
      top: '-150px',
      right: '-100px',
      pointerEvents: 'none'
    },
    heroTitle: {
      fontSize: 'clamp(28px, 5vw, 36px)',
      fontWeight: '800',
      marginBottom: '12px',
      lineHeight: '1.2',
      position: 'relative',
      zIndex: 1
    },
    heroSub: {
      fontSize: 'clamp(15px, 1.8vw, 17px)',
      opacity: 0.8,
      maxWidth: '600px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
      lineHeight: '1.6'
    },
    content: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: 'clamp(24px, 4vw, 40px) clamp(16px, 3vw, 24px)'
    },
    section: {
      marginBottom: 'clamp(32px, 5vw, 48px)'
    },
    sectionTitle: {
      fontSize: 'clamp(20px, 2.5vw, 24px)',
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: 'clamp(16px, 2vw, 24px)',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)'
    },
    contactCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      padding: 'clamp(20px, 2.5vw, 28px)',
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 16px rgba(245,158,11,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    contactRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      color: '#64748B',
      flexWrap: 'wrap'
    },
    contactLink: {
      color: '#F59E0B',
      textDecoration: 'none',
      fontWeight: '600',
      wordBreak: 'break-all',
      transition: 'color 0.2s'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 25vw, 250px), 1fr))',
      gap: '20px',
      marginTop: '16px'
    },
    valueCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: '14px',
      padding: 'clamp(16px, 1.5vw, 20px)',
      border: '1px solid #E2E8F0',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(30,41,59,0.02)'
    },
    valueIcon: {
      width: '48px',
      height: '48px',
      backgroundColor: '#F8FAFC',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px auto'
    },
    valueTitle: {
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: '4px'
    },
    valueDesc: {
      fontSize: 'clamp(12px, 1vw, 14px)',
      color: '#94A3B8',
      margin: 0,
      lineHeight: '1.5'
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 15vw, 120px), 1fr))',
      gap: '16px',
      marginTop: '16px'
    },
    statCard: {
      textAlign: 'center',
      padding: 'clamp(12px, 1.5vw, 16px)',
      backgroundColor: '#F8FAFC',
      borderRadius: '12px',
      border: '1px solid #E2E8F0'
    },
    statNumber: {
      fontSize: 'clamp(22px, 3vw, 28px)',
      fontWeight: '800',
      color: '#F59E0B'
    },
    statLabel: {
      fontSize: 'clamp(11px, 1vw, 13px)',
      color: '#94A3B8',
      marginTop: '2px'
    },
    teamGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(160px, 20vw, 200px), 1fr))',
      gap: '20px',
      marginTop: '16px'
    },
    teamCard: {
      textAlign: 'center',
      padding: 'clamp(16px, 1.5vw, 20px)',
      backgroundColor: '#F8FAFC',
      borderRadius: '12px',
      border: '1px solid #E2E8F0'
    },
    teamAvatar: {
      width: 'clamp(64px, 8vw, 80px)',
      height: 'clamp(64px, 8vw, 80px)',
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px auto',
      fontSize: 'clamp(28px, 3.5vw, 32px)',
      boxShadow: '0 4px 16px rgba(245,158,11,0.2)'
    },
    teamName: {
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: '2px'
    },
    teamRole: {
      fontSize: 'clamp(12px, 1vw, 13px)',
      color: '#94A3B8',
      margin: 0
    },
    footer: {
      backgroundColor: '#1E293B',
      color: '#94A3B8',
      padding: 'clamp(20px, 3vw, 24px)',
      textAlign: 'center',
      fontSize: 'clamp(12px, 1vw, 14px)',
      borderTop: '1px solid #334155'
    },
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.brandContainer}>
          <div style={styles.logoBadge}>
            <Icon d={ICONS.store} size={20} color="#1E293B" strokeWidth={2.5} />
          </div>
          <h1 style={styles.brandTitle}>
            Msika<span style={styles.brandAccent}>AI</span>
          </h1>
        </Link>
        <div style={styles.navActions}>
          <LanguageToggle />
          <button style={styles.navBtn} onClick={() => navigate('/')}>
            Home
          </button>
          <Link to="/login" style={styles.navBtnPrimary}>
            Sign In
          </Link>
        </div>
      </nav>

      <div style={styles.hero}>
        <div style={styles.heroGlow} />
        <h1 style={styles.heroTitle}>
          <Icon d={ICONS.sparkles} size={32} color="#F59E0B" strokeWidth={1.75} />
          <br />
          About MsikaAI
        </h1>
        <p style={styles.heroSub}>
          We're building Malawi's first AI-powered local marketplace — connecting buyers, sellers, and skilled laborers in one place.
        </p>
      </div>

      <div style={styles.content}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Icon d={ICONS.heart} size={22} color="#F59E0B" strokeWidth={1.75} />
            Our Mission
          </h2>
          <div style={styles.card}>
            <p style={{ fontSize: 'clamp(15px, 1.4vw, 16px)', color: '#64748B', lineHeight: '1.7', margin: 0 }}>
              <strong>MsikaAI</strong> exists to empower local businesses, farmers, and skilled laborers in Malawi 
              by providing a digital platform where they can be discovered, trusted, and connected with customers 
              — all powered by AI that works in Chichewa and English.
            </p>
            <p style={{ fontSize: 'clamp(15px, 1.4vw, 16px)', color: '#64748B', lineHeight: '1.7', marginTop: '16px' }}>
              We believe that technology should serve communities, not replace them. That's why we built MsikaAI 
              to be local-first, voice-friendly, and built for the way Malawians actually trade.
            </p>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Icon d={ICONS.mail} size={22} color="#F59E0B" strokeWidth={1.75} />
            Developer & Contact Info
          </h2>
          <div style={styles.contactCard}>
            <p style={{ margin: 0, fontSize: 'clamp(14px, 1.2vw, 15px)', color: '#64748B', lineHeight: '1.5' }}>
              Have questions, feedback, or custom development inquiries? Get in touch directly with the lead developer:
            </p>
            <div style={styles.contactRow}>
              <Icon d={ICONS.mail} size={20} color="#F59E0B" strokeWidth={1.75} />
              <span>
                <strong>Email:</strong>{' '}
                <a href="mailto:kennedybanda940@gmail.com" style={styles.contactLink}>
                  kennedybanda940@gmail.com
                </a>
              </span>
            </div>
            <div style={styles.contactRow}>
              <Icon d={ICONS.phone} size={20} color="#10B981" strokeWidth={1.75} />
              <span>
                <strong>WhatsApp:</strong>{' '}
                <a 
                  href="https://wa.me/265888921110" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ ...styles.contactLink, color: '#10B981' }}
                >
                  +265 888 921 110
                </a>
              </span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Icon d={ICONS.trendingUp} size={22} color="#F59E0B" strokeWidth={1.75} />
            Our Impact
          </h2>
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>100+</div>
              <div style={styles.statLabel}>Active Listings</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>50+</div>
              <div style={styles.statLabel}>Local Businesses</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>10+</div>
              <div style={styles.statLabel}>Categories</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNumber}>100%</div>
              <div style={styles.statLabel}>Free to Join</div>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Icon d={ICONS.check} size={22} color="#F59E0B" strokeWidth={1.75} />
            Our Values
          </h2>
          <div style={styles.grid}>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>
                <Icon d={ICONS.users} size={24} color="#F59E0B" strokeWidth={1.75} />
              </div>
              <h4 style={styles.valueTitle}>Community First</h4>
              <p style={styles.valueDesc}>Built for and with the people of Malawi</p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>
                <Icon d={ICONS.bot} size={24} color="#F59E0B" strokeWidth={1.75} />
              </div>
              <h4 style={styles.valueTitle}>AI for Everyone</h4>
              <p style={styles.valueDesc}>Voice and text AI that works in Chichewa</p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>
                <Icon d={ICONS.store} size={24} color="#F59E0B" strokeWidth={1.75} />
              </div>
              <h4 style={styles.valueTitle}>Local Commerce</h4>
              <p style={styles.valueDesc}>Supporting local businesses and traders</p>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <Icon d={ICONS.users} size={22} color="#F59E0B" strokeWidth={1.75} />
            Built with ❤️
          </h2>
          <div style={styles.teamGrid}>
            <div style={styles.teamCard}>
              <div style={styles.teamAvatar}>👨‍💻</div>
              <h4 style={styles.teamName}>Kennedy Banda</h4>
              <p style={styles.teamRole}>Lead Developer & Creator</p>
            </div>
            <div style={styles.teamCard}>
              <div style={styles.teamAvatar}>🌾</div>
              <h4 style={styles.teamName}>Our Community</h4>
              <p style={styles.teamRole}>Malawi Businesses & Farmers</p>
            </div>
            <div style={styles.teamCard}>
              <div style={styles.teamAvatar}>🤝</div>
              <h4 style={styles.teamName}>Our Partners</h4>
              <p style={styles.teamRole}>Local Leaders & Innovators</p>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p>© {new Date().getFullYear()} MsikaAI — Built for Malawi 🇲🇼</p>
      </div>
    </div>
  );
};

export default About;