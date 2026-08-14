// mobile/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

// --- HAND-DRAWN STYLE INLINE SVG ICONS ---
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
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35"
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
      backgroundColor: '#f8fafc',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      textAlign: 'center'
    },
    content: {
      maxWidth: '480px',
      animation: 'fadeIn 0.5s ease-out',
    },
    number: {
      fontSize: '120px',
      fontWeight: '900',
      color: '#e2e8f0',
      lineHeight: 1,
      marginBottom: '8px',
      letterSpacing: '-0.05em',
    },
    icon: {
      fontSize: '64px',
      marginBottom: '16px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '8px',
    },
    description: {
      color: '#64748b',
      fontSize: '16px',
      marginBottom: '32px',
      lineHeight: '1.6',
    },
    actions: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      alignItems: 'center',
    },
    support: {
      marginTop: '24px',
      color: '#94a3b8',
      fontSize: '14px',
    },
    link: {
      color: '#2563eb',
      textDecoration: 'none',
      fontWeight: '500',
    },
    keyframes: `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
  };

  return (
    <div style={styles.container}>
      <style>{styles.keyframes}</style>
      
      <div style={styles.content}>
        {/* 404 Number */}
        <div style={styles.number}>404</div>
        
        {/* Icon */}
        <div style={styles.icon}>🔍</div>
        
        {/* Title */}
        <h1 style={styles.title}>Page Not Found</h1>
        
        {/* Description */}
        <p style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Actions */}
        <div style={styles.actions}>
          <Link to={user ? '/dashboard' : '/'} style={{ width: '100%' }}>
            <Button variant="primary" size="lg" fullWidth>
              {user ? 'Go to Dashboard' : 'Go Home'}
            </Button>
          </Link>
          
          <Link to="/search" style={{ width: '100%' }}>
            <Button variant="secondary" size="lg" fullWidth>
              Browse Listings
            </Button>
          </Link>
        </div>
        
        {/* Support Link */}
        <p style={styles.support}>
          Need help? <a href="mailto:support@kumsika.com" style={styles.link}>Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;