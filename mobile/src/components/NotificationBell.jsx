import React from 'react';

const NotificationBell = ({ unreadCount, onClick }) => {
  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '6px',
      transition: 'background-color 0.2s',
      backgroundColor: 'transparent'
    },
    bell: {
      fontSize: '20px',
      lineHeight: 1
    },
    badge: {
      position: 'absolute',
      top: '-2px',
      right: '-2px',
      backgroundColor: '#dc2626',
      color: 'white',
      borderRadius: '50%',
      padding: '2px 6px',
      fontSize: '10px',
      fontWeight: '700',
      minWidth: '18px',
      textAlign: 'center',
      border: '2px solid white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  };

  return (
    <div 
      style={styles.container} 
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={styles.bell}>🔔</span>
      {unreadCount > 0 && (
        <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}
    </div>
  );
};

export default NotificationBell;