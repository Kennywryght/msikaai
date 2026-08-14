// mobile/src/components/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ 
  message = 'Loading...', 
  subMessage = 'Please wait while we load your content',
  fullScreen = true,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeMap = {
    sm: { 
      container: '40px', 
      spinner: '30px', 
      font: '13px',
      borderWidth: '2px'
    },
    md: { 
      container: '48px', 
      spinner: '36px', 
      font: '15px',
      borderWidth: '3px'
    },
    lg: { 
      container: '64px', 
      spinner: '48px', 
      font: '17px',
      borderWidth: '4px'
    },
  };

  const colorMap = {
    primary: '#2563eb',
    white: '#ffffff',
    gray: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  const styles = {
    container: {
      minHeight: fullScreen ? '100vh' : '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: fullScreen ? '#f8fafc' : 'transparent',
      padding: '24px',
      gap: '16px',
      animation: 'fadeIn 0.3s ease-out',
    },
    spinnerWrapper: {
      position: 'relative',
      width: sizeMap[size].container,
      height: sizeMap[size].container,
    },
    spinner: {
      width: sizeMap[size].spinner,
      height: sizeMap[size].spinner,
      border: `${sizeMap[size].borderWidth} solid ${colorMap[variant]}20`,
      borderTop: `${sizeMap[size].borderWidth} solid ${colorMap[variant]}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    pulse: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      background: `radial-gradient(circle, ${colorMap[variant]}10, transparent 70%)`,
      animation: 'pulse 2s ease-in-out infinite',
    },
    message: {
      color: variant === 'white' ? '#ffffff' : '#64748b',
      fontSize: sizeMap[size].font,
      fontWeight: '500',
      textAlign: 'center',
    },
    subMessage: {
      color: variant === 'white' ? '#94a3b8' : '#94a3b8',
      fontSize: '13px',
      textAlign: 'center',
      marginTop: '4px',
    },
    dots: {
      display: 'inline-block',
      animation: 'dots 1.4s infinite',
      marginLeft: '4px',
    }
  };

  return (
    <div style={styles.container} className={className}>
      <div style={styles.spinnerWrapper}>
        <div style={styles.pulse}></div>
        <div style={styles.spinner}></div>
      </div>
      <div>
        <p style={styles.message}>
          {message}
          <span style={styles.dots}>...</span>
        </p>
        {subMessage && (
          <p style={styles.subMessage}>{subMessage}</p>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        @keyframes dots {
          0% { content: '.'; }
          33% { content: '..'; }
          66% { content: '...'; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;