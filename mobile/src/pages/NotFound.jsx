import React from 'react';
import { Link } from 'react-router-dom';

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
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9"
};

const NotFound = () => {
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
    emoji: {
      fontSize: '80px',
      marginBottom: '16px',
      animation: 'bounce 2s ease-in-out infinite'
    },
    title: {
      fontSize: '36px',
      fontWeight: '800',
      color: '#0f172a',
      margin: '0 0 8px 0'
    },
    subtitle: {
      fontSize: '16px',
      color: '#64748b',
      margin: '0 0 24px 0',
      maxWidth: '400px'
    },
    link: {
      padding: '12px 32px',
      backgroundColor: '#2563eb',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s, transform 0.2s'
    },
    linkHover: {
      backgroundColor: '#1d4ed8',
      transform: 'translateY(-2px)'
    },
    keyframes: `
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
    `
  };

  return (
    <div style={styles.container}>
      <style>{styles.keyframes}</style>
      
      <div style={styles.emoji}>🔍</div>
      
      <h1 style={styles.title}>Page Not Found</h1>
      
      <p style={styles.subtitle}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <Link 
        to="/" 
        style={styles.link}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#1d4ed8';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <SketchIcon d={ICONS.arrowRight} size={18} color="#ffffff" strokeWidth={2.5} />
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;