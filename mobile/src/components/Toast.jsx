// mobile/src/components/Toast.jsx
import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  const colors = {
    success: { bg: '#d1fae5', border: '#a7f3d0', text: '#065f46', icon: '✅' },
    error: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: '❌' },
    warning: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e', icon: '⚠️' },
    info: { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af', icon: 'ℹ️' }
  };

  const style = colors[type] || colors.info;

  const styles = {
    container: {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 20px',
      backgroundColor: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      maxWidth: '90%',
      animation: 'slideUp 0.3s ease-out'
    },
    text: {
      color: style.text,
      fontSize: '14px',
      fontWeight: '500',
      margin: 0
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: style.text,
      fontSize: '16px',
      padding: '0 4px'
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      <div style={styles.container}>
        <span>{style.icon}</span>
        <p style={styles.text}>{message}</p>
        <button 
          onClick={() => { setVisible(false); onClose?.(); }} 
          style={styles.closeBtn}
        >
          ✕
        </button>
      </div>
    </>
  );
};

export default Toast;