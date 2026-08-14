// mobile/src/pages/About.jsx
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../context/TranslationContext';
import LanguageToggle from '../components/LanguageToggle';
import Button from '../components/Button';

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
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 010 7.75",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  check: "M20 6L9 17l-5-5",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
};

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Auto-focus on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#0f172a'
    },
    nav: {
      backgroundColor: '#ffffff',
      padding: 'clamp(12px, 2vw, 14px) clamp(16px, 4vw, 28px)',
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
      width: 'clamp(34px, 4vw, 38px)',
      height: 'clamp(34px, 4vw, 38px)',
      backgroundColor: '#eff6ff',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #dbeafe'
    },
    brandTitle: {
      fontSize: 'clamp(18px, 2.5vw, 22px)',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0,
      lineHeight: '1'
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap'
    },
    hero: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #2563eb 100%)',
      padding: 'clamp(40px, 8vh, 60px) clamp(16px, 4vw, 24px)',
      textAlign: 'center',
      color: '#ffffff'
    },
    heroTitle: {
      fontSize: 'clamp(28px, 5vw, 36px)',
      fontWeight: '800',
      marginBottom: '12px',
      lineHeight: '1.2'
    },
    heroSub: {
      fontSize: 'clamp(15px, 1.8vw, 17px)',
      opacity: 0.85,
      maxWidth: '600px',
      margin: '0 auto'
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
      color: '#0f172a',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: 'clamp(16px, 2vw, 24px)',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    contactCard: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: 'clamp(20px, 2.5vw, 28px)',
      border: '1px solid #cbd5e1',
      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    contactRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      color: '#334155',
      flexWrap: 'wrap'
    },
    contactLink: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '600',
      wordBreak: 'break-all'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 25vw, 250px), 1fr))',
      gap: '20px',
      marginTop: '16px'
    },
    valueCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: 'clamp(16px, 1.5vw, 20px)',
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
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '4px'
    },
    valueDesc: {
      fontSize: 'clamp(12px, 1vw, 14px)',
      color: '#64748b',
      margin: 0
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
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    statNumber: {
      fontSize: 'clamp(22px, 3vw, 28px)',
      fontWeight: '800',
      color: '#2563eb'
    },
    statLabel: {
      fontSize: 'clamp(11px, 1vw, 13px)',
      color: '#64748b',
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
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      border: '1px solid #e2e8f0'
    },
    teamAvatar: {
      width: 'clamp(64px, 8vw, 80px)',
      height: 'clamp(64px, 8vw, 80px)',
      backgroundColor: '#dbeafe',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 12px auto',
      fontSize: 'clamp(28px, 3.5vw, 32px)'
    },
    teamName: {
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '2px'
    },
    teamRole: {
      fontSize: 'clamp(12px, 1vw, 13px)',
      color: '#64748b',
      margin: 0
    },
    footer: {
      backgroundColor: '#0f172a',
      color: '#94a3b8',
      padding: 'clamp(20px, 3vw, 24px)',
      textAlign: 'center',
      fontSize: 'clamp(12px, 1vw, 14px)',
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Link to="/login">
            <Button variant="primary" size="sm">
              Sign In
            </Button>
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
            <p style={{ fontSize: 'clamp(15px, 1.4vw, 16px)', color: '#475569', lineHeight: '1.7', margin: 0 }}>
              <strong>MsikaAI</strong> exists to empower local businesses, farmers, and skilled laborers in Mitundu 
              by providing a digital platform where they can be discovered, trusted, and connected with customers 
              — all powered by AI that works in Chichewa and English.
            </p>
            <p style={{ fontSize: 'clamp(15px, 1.4vw, 16px)', color: '#475569', lineHeight: '1.7', marginTop: '16px' }}>
              We believe that technology should serve communities, not replace them. That's why we built MsikaAI 
              to be local-first, voice-friendly, and built for the way Malawians actually trade.
            </p>
          </div>
        </div>

        {/* Developer Contact Info Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.mail} size={22} color="#2563eb" strokeWidth={2} />
            Developer & Contact Info
          </h2>
          <div style={styles.contactCard}>
            <p style={{ margin: 0, fontSize: 'clamp(14px, 1.2vw, 15px)', color: '#475569', lineHeight: '1.5' }}>
              Have questions, feedback, or custom development inquiries? Get in touch directly with the lead developer:
            </p>
            <div style={styles.contactRow}>
              <SketchIcon d={ICONS.mail} size={20} color="#2563eb" />
              <span>
                <strong>Email:</strong>{' '}
                <a href="mailto:kennedybanda940@gmail.com" style={styles.contactLink}>
                  kennedybanda940@gmail.com
                </a>
              </span>
            </div>
            <div style={styles.contactRow}>
              <SketchIcon d={ICONS.phone} size={20} color="#16a34a" />
              <span>
                <strong>WhatsApp:</strong>{' '}
                <a 
                  href="https://wa.me/265888921110" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ ...styles.contactLink, color: '#16a34a' }}
                >
                  +265 888 921 110
                </a>
              </span>
            </div>
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
              <h4 style={styles.teamName}>Kennedy Banda</h4>
              <p style={styles.teamRole}>Lead Developer & Creator</p>
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