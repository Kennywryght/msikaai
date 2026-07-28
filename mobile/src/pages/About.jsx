import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import LanguageToggle from '../components/LanguageToggle';

// --- HAND-DRAWN ICONS ---
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
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  check: "M20 6L9 17l-5-5"
};

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0f172a'
    },
    nav: {
      backgroundColor: '#ffffff',
      padding: '14px 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      flexWrap: 'wrap',
      gap: '12px'
    },
    brandContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    logoBadge: {
      width: '38px',
      height: '38px',
      backgroundColor: '#eff6ff',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #dbeafe'
    },
    brandTitle: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0,
      lineHeight: '1'
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap'
    },
    btnPrimary: {
      padding: '8px 18px',
      backgroundColor: '#2563eb',
      color: '#ffffff',
      borderRadius: '8px',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '600',
      display: 'inline-block'
    },
    btnSecondary: {
      padding: '8px 16px',
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600'
    },
    hero: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
      padding: '60px 24px',
      textAlign: 'center',
      color: '#ffffff'
    },
    heroTitle: {
      fontSize: '36px',
      fontWeight: '800',
      marginBottom: '12px',
      lineHeight: '1.2'
    },
    heroSub: {
      fontSize: '17px',
      opacity: 0.85,
      maxWidth: '600px',
      margin: '0 auto'
    },
    content: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 24px'
    },
    section: {
      marginBottom: '48px'
    },
    sectionTitle: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginTop: '16px'
    },
    valueCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      textAlign: 'center'
    },
    valueIcon: {
      width: '48px',
      height: '48px',
      backgroundColor: '#eff6ff',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px auto'
    },
    valueTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '4px'
    },
    valueDesc: {
      fontSize: '14px',
      color: '#64748b',
      margin: 0
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '16px',
      marginTop: '16px'
    },
    statCard: {
      textAlign: 'center',
      padding: '16px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: '800',
      color: '#2563eb'
    },
    statLabel: {
      fontSize: '13px',
      color: '#64748b',
      marginTop: '2px'
    },
    teamGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginTop: '16px'
    },
    teamCard: {
      textAlign: 'center',
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    teamAvatar: {
      width: '80px',
      height: '80px',
      backgroundColor: '#dbeafe',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px auto',
      fontSize: '32px'
    },
    teamName: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '2px'
    },
    teamRole: {
      fontSize: '13px',
      color: '#64748b',
      margin: 0
    },
    footer: {
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      padding: '24px',
      textAlign: 'center',
      fontSize: '14px',
      borderTop: '1px solid #1e293b'
    }
  };

  return (
    <div style={styles.container}>
      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.brandContainer}>
          <div style={styles.logoBadge}>
            <SketchIcon d={ICONS.store} size={22} color="#2563eb" strokeWidth={2.5} />
          </div>
          <h1 style={styles.brandTitle}>
            Msika<span style={{ color: '#2563eb' }}>AI</span>
          </h1>
        </div>
        <div style={styles.navActions}>
          <LanguageToggle />
          <button onClick={() => navigate('/')} style={styles.btnSecondary}>
            Home
          </button>
          <Link to="/login" style={styles.btnPrimary}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>
          <SketchIcon d={ICONS.sparkles} size={32} color="#fcd34d" strokeWidth={2} />
          <br />
          About MsikaAI
        </h1>
        <p style={styles.heroSub}>
          We're building Mitundu's first AI-powered local marketplace — connecting buyers, sellers, and skilled laborers in one place.
        </p>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Mission Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.heart} size={22} color="#2563eb" strokeWidth={2} />
            Our Mission
          </h2>
          <div style={styles.card}>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              <strong>MsikaAI</strong> exists to empower local businesses, farmers, and skilled laborers in Mitundu 
              by providing a digital platform where they can be discovered, trusted, and connected with customers 
              — all powered by AI that works in Chichewa and English.
            </p>
            <p style={{ fontSize: '16px', color: '#475569', lineHeight: '1.7', marginTop: '16px' }}>
              We believe that technology should serve communities, not replace them. That's why we built MsikaAI 
              to be local-first, voice-friendly, and built for the way Malawians actually trade.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.mapPin} size={22} color="#2563eb" strokeWidth={2} />
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

        {/* Values */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.check} size={22} color="#2563eb" strokeWidth={2} />
            Our Values
          </h2>
          <div style={styles.grid}>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>
                <SketchIcon d={ICONS.users} size={24} color="#2563eb" strokeWidth={2} />
              </div>
              <h4 style={styles.valueTitle}>Community First</h4>
              <p style={styles.valueDesc}>Built for and with the people of Mitundu</p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>
                <SketchIcon d={ICONS.bot} size={24} color="#2563eb" strokeWidth={2} />
              </div>
              <h4 style={styles.valueTitle}>AI for Everyone</h4>
              <p style={styles.valueDesc}>Voice and text AI that works in Chichewa</p>
            </div>
            <div style={styles.valueCard}>
              <div style={styles.valueIcon}>
                <SketchIcon d={ICONS.store} size={24} color="#2563eb" strokeWidth={2} />
              </div>
              <h4 style={styles.valueTitle}>Local Commerce</h4>
              <p style={styles.valueDesc}>Supporting local businesses and traders</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.users} size={22} color="#2563eb" strokeWidth={2} />
            Built with ❤️
          </h2>
          <div style={styles.teamGrid}>
            <div style={styles.teamCard}>
              <div style={styles.teamAvatar}>👨‍💻</div>
              <h4 style={styles.teamName}>The MsikaAI Team</h4>
              <p style={styles.teamRole}>Local Developers & Innovators</p>
            </div>
            <div style={styles.teamCard}>
              <div style={styles.teamAvatar}>🌾</div>
              <h4 style={styles.teamName}>Our Community</h4>
              <p style={styles.teamRole}>Mitundu Businesses & Farmers</p>
            </div>
            <div style={styles.teamCard}>
              <div style={styles.teamAvatar}>🤝</div>
              <h4 style={styles.teamName}>Our Partners</h4>
              <p style={styles.teamRole}>Local Leaders & Innovators</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>© {new Date().getFullYear()} MsikaAI — Built for Mitundu, Malawi 🇲🇼</p>
      </div>
    </div>
  );
};

export default About;