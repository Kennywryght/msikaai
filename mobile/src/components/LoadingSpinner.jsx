// mobile/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      gap: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    badge: {
      width: '56px',
      height: '56px',
      backgroundColor: '#2563eb',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
      animation: 'pulse 1.8s ease-in-out infinite'
    },
    spinnerWrap: {
      position: 'relative',
      width: '40px',
      height: '40px'
    },
    spinnerTrack: {
      position: 'absolute',
      inset: 0,
      border: '3px solid rgba(148,163,184,0.2)',
      borderRadius: '50%'
    },
    spinnerArc: {
      position: 'absolute',
      inset: 0,
      border: '3px solid transparent',
      borderTopColor: '#60a5fa',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    text: {
      color: '#94a3b8',
      fontSize: '14px',
      fontWeight: '500',
      letterSpacing: '0.01em'
    },
    brand: {
      fontSize: '13px',
      fontWeight: '700',
      color: '#334155',
      letterSpacing: '0.04em'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.badge}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9" />
        </svg>
      </div>
      <div style={styles.spinnerWrap}>
        <div style={styles.spinnerTrack}></div>
        <div style={styles.spinnerArc}></div>
      </div>
      <p style={styles.text}>{message}</p>
      <span style={styles.brand}>KUMSIKA</span>
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
};

export default LoadingSpinner;