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
      backgroundColor: '#f8fafc',
      gap: '16px'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 0.9s linear infinite'
    },
    text: {
      color: '#64748b',
      fontSize: '15px',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;