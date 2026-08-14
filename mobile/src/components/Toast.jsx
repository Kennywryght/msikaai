// mobile/src/components/Toast.jsx
import React, { useEffect, useState } from 'react';

const Toast = ({ 
  message, 
  title,
  type = 'info', 
  duration = 3000, 
  onClose,
  position = 'bottom-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: { 
      icon: '✅', 
      borderColor: '#22c55e',
      bgColor: '#f0fdf4',
      titleColor: '#065f46'
    },
    error: { 
      icon: '❌', 
      borderColor: '#ef4444',
      bgColor: '#fef2f2',
      titleColor: '#991b1b'
    },
    warning: { 
      icon: '⚠️', 
      borderColor: '#f59e0b',
      bgColor: '#fffbeb',
      titleColor: '#92400e'
    },
    info: { 
      icon: 'ℹ️', 
      borderColor: '#3b82f6',
      bgColor: '#eff6ff',
      titleColor: '#1e40af'
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  const styles = {
    container: {
      position: 'fixed',
      zIndex: 9999,
      padding: '16px',
      ...(position === 'top-right' && { top: '16px', right: '16px' }),
      ...(position === 'top-left' && { top: '16px', left: '16px' }),
      ...(position === 'top-center' && { top: '16px', left: '50%', transform: 'translateX(-50%)' }),
      ...(position === 'bottom-right' && { bottom: '16px', right: '16px' }),
      ...(position === 'bottom-left' && { bottom: '16px', left: '16px' }),
      ...(position === 'bottom-center' && { bottom: '16px', left: '50%', transform: 'translateX(-50%)' }),
      animation: isLeaving 
        ? 'toastOut 0.3s ease-out forwards'
        : 'toastIn 0.3s ease-out',
    },
    toast: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '14px 20px',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      border: '1px solid rgba(0,0,0,0.05)',
      minWidth: '280px',
      maxWidth: '460px',
      position: 'relative',
    },
    border: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '4px',
      borderTopLeftRadius: '12px',
      borderBottomLeftRadius: '12px',
      backgroundColor: config.borderColor,
    },
    icon: {
      fontSize: '20px',
      flexShrink: 0,
      marginTop: '2px',
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    titleText: {
      fontWeight: '600',
      color: config.titleColor,
      fontSize: '14px',
      marginBottom: '2px',
    },
    messageText: {
      color: '#64748b',
      fontSize: '13px',
      lineHeight: '1.5',
    },
    close: {
      background: 'none',
      border: 'none',
      color: '#94a3b8',
      cursor: 'pointer',
      fontSize: '18px',
      padding: '4px',
      lineHeight: 1,
      transition: 'color 0.2s',
      flexShrink: 0,
      marginTop: '-2px',
    },
  };

  if (!isVisible) return null;

  const defaultTitle = type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div style={styles.container}>
      <div style={styles.toast}>
        <div style={styles.border}></div>
        <span style={styles.icon}>{config.icon}</span>
        <div style={styles.content}>
          <div style={styles.titleText}>{title || defaultTitle}</div>
          <div style={styles.messageText}>{message}</div>
        </div>
        <button
          style={styles.close}
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => {
              setIsVisible(false);
              if (onClose) onClose();
            }, 300);
          }}
        >
          ×
        </button>
      </div>
      <style>{`
        @keyframes toastIn {
          from { 
            opacity: 0; 
            transform: ${position.includes('bottom') ? 'translateY(20px)' : 'translateY(-20px)'};
          }
          to { 
            opacity: 1; 
            transform: ${position.includes('bottom') ? 'translateY(0)' : 'translateY(0)'};
          }
        }
        @keyframes toastOut {
          from { 
            opacity: 1; 
            transform: ${position.includes('bottom') ? 'translateY(0)' : 'translateY(0)'};
          }
          to { 
            opacity: 0; 
            transform: ${position.includes('bottom') ? 'translateY(20px)' : 'translateY(-20px)'};
          }
        }
      `}</style>
    </div>
  );
};

export default Toast;