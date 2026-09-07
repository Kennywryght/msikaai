// mobile/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

// ============================================
// PREMIUM FEATHER ICONS
// ============================================
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
};

const NotFound = () => {
  const { user } = useAuth();

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center',
    },
    content: {
      maxWidth: '480px',
      animation: 'fadeIn 0.5s ease-out',
    },
    number: {
      fontSize: 'clamp(80px, 15vw, 120px)',
      fontWeight: '900',
      color: '#E2E8F0',
      lineHeight: 1,
      marginBottom: '8px',
      letterSpacing: '-0.05em',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    icon: {
      fontSize: 'clamp(48px, 8vw, 64px)',
      marginBottom: '16px',
    },
    title: {
      fontSize: 'clamp(24px, 4vw, 28px)',
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: '8px',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    description: {
      color: '#94A3B8',
      fontSize: 'clamp(15px, 1.4vw, 16px)',
      marginBottom: '32px',
      lineHeight: '1.6',
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      alignItems: 'center',
      width: '100%',
    },
    support: {
      marginTop: '24px',
      color: '#94A3B8',
      fontSize: '14px',
    },
    link: {
      color: '#F59E0B',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div style={styles.content}>
        <div style={styles.number}>404</div>
        <div style={styles.icon}>🔍</div>
        <h1 style={styles.title}>Page Not Found</h1>
        <p style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div style={styles.actions}>
          <Link to={user ? '/dashboard' : '/'} style={{ width: '100%' }}>
            <PrimaryButton variant="primary" size="lg" fullWidth>
              <Icon d={ICONS.home} size={16} color="#FFFFFF" strokeWidth={1.75} />
              {user ? 'Go to Dashboard' : 'Go Home'}
            </PrimaryButton>
          </Link>
          
          <Link to="/search" style={{ width: '100%' }}>
            <PrimaryButton variant="outline" size="lg" fullWidth>
              <Icon d={ICONS.search} size={16} color="#1E293B" strokeWidth={1.75} />
              Browse Listings
            </PrimaryButton>
          </Link>
        </div>
        
        <p style={styles.support}>
          Need help? <a href="mailto:support@msikaai.com" style={styles.link}>Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;