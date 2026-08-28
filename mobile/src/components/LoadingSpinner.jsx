// mobile/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  size = 'md',
  fullScreen = false,
  className = '',
}) => {
  const sizes = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4',
  };

  // Inline styles for the spinner (fallback if CSS classes don't load)
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ...(fullScreen ? {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #151130 0%, #2A2438 50%, #3F384F 100%)',
      } : {}),
    },
    badge: {
      width: '56px',
      height: '56px',
      background: 'linear-gradient(135deg, #C8BEFA 0%, #B8A8F0 50%, #A898E6 100%)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(200, 190, 250, 0.35)',
      animation: 'pulse 1.8s ease-in-out infinite',
    },
    spinnerWrap: {
      position: 'relative',
      width: '40px',
      height: '40px',
    },
    spinnerTrack: {
      position: 'absolute',
      inset: 0,
      border: '3px solid rgba(148, 163, 184, 0.2)',
      borderRadius: '50%',
    },
    spinnerArc: {
      position: 'absolute',
      inset: 0,
      border: '3px solid transparent',
      borderTopColor: '#C8BEFA',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    text: {
      color: fullScreen ? '#C5C0D6' : '#787090',
      fontSize: '14px',
      fontWeight: '500',
      letterSpacing: '0.01em',
    },
    brand: {
      fontSize: '13px',
      fontWeight: '700',
      color: fullScreen ? '#DDD9EB' : '#5C5470',
      letterSpacing: '0.04em',
    },
  };

  // CSS classes for the spinner
  const spinnerElement = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`${sizes[size] || sizes.md} rounded-full border-2 border-gray-200 border-t-lavender-tonic animate-spin`} />
      {message && (
        <p className="text-gray-500 font-medium text-sm animate-pulse">{message}</p>
      )}
    </div>
  );

  // Full screen version with inline styles (fallback)
  if (fullScreen) {
    return (
      <div style={styles.container}>
        <div style={styles.badge}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#151130" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9" />
          </svg>
        </div>
        <div style={styles.spinnerWrap}>
          <div style={styles.spinnerTrack}></div>
          <div style={styles.spinnerArc}></div>
        </div>
        <p style={styles.text}>{message}</p>
        <span style={styles.brand}>MSIKA<span style={{ color: '#C8BEFA' }}>AI</span></span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
        `}</style>
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;