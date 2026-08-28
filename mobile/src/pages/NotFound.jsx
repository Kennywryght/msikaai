// mobile/src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

// ==========================================
// BRAND COLORS
// ==========================================
const COLORS = {
  championBlue: '#151130',
  lavenderTonic: '#C8BEFA',
  gray50: '#F8F7FA',
  gray200: '#DDD9EB',
  gray400: '#9E97B3',
  gray500: '#787090',
  gray600: '#5C5470',
  gray700: '#3F384F',
  gray900: '#151130',
  white: '#FFFFFF',
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
      backgroundColor: COLORS.gray50,
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
      color: COLORS.gray200,
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
      color: COLORS.gray900,
      marginBottom: '8px',
    },
    description: {
      color: COLORS.gray500,
      fontSize: '16px',
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
      color: COLORS.gray400,
      fontSize: '14px',
    },
    link: {
      color: COLORS.lavenderTonic,
      textDecoration: 'none',
      fontWeight: '500',
    }
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
              {user ? 'Go to Dashboard' : 'Go Home'}
            </PrimaryButton>
          </Link>
          
          <Link to="/search" style={{ width: '100%' }}>
            <PrimaryButton variant="outline" size="lg" fullWidth>
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