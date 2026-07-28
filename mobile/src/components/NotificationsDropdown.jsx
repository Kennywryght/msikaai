import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';

const NotificationsDropdown = ({ notifications, onClose, onMarkRead }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleMarkRead = async (id) => {
    setLoading(true);
    try {
      await notificationsAPI.markAsRead(id, user.id);
      onMarkRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await notificationsAPI.markAllAsRead(user.id);
      onMarkRead('all');
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 999,
      backgroundColor: 'rgba(0,0,0,0.3)'
    },
    dropdown: {
      position: 'absolute',
      top: '56px',
      right: '0',
      width: '380px',
      maxHeight: '420px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      flexShrink: 0
    },
    title: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a'
    },
    actionBtn: {
      background: 'none',
      border: 'none',
      color: '#2563eb',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      padding: '4px 8px'
    },
    actionBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    list: {
      overflowY: 'auto',
      flex: 1,
      padding: '4px 0'
    },
    item: {
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    },
    itemUnread: {
      backgroundColor: '#eff6ff'
    },
    itemHover: {
      backgroundColor: '#f8fafc'
    },
    itemTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#0f172a'
    },
    itemMessage: {
      fontSize: '13px',
      color: '#64748b',
      marginTop: '2px'
    },
    itemTime: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    unreadDot: {
      display: 'inline-block',
      width: '6px',
      height: '6px',
      backgroundColor: '#2563eb',
      borderRadius: '50%'
    },
    empty: {
      padding: '30px 20px',
      textAlign: 'center',
      color: '#94a3b8'
    },
    emptyIcon: {
      fontSize: '32px',
      marginBottom: '8px'
    },
    emptyTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#64748b',
      marginBottom: '4px'
    }
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.dropdown}>
        <div style={styles.header}>
          <span style={styles.title}>🔔 Notifications</span>
          <button 
            onClick={handleMarkAllRead} 
            style={{
              ...styles.actionBtn,
              ...(loading ? styles.actionBtnDisabled : {})
            }}
            disabled={loading || notifications?.length === 0}
          >
            Mark all read
          </button>
        </div>
        
        <div style={styles.list}>
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                style={{
                  ...styles.item,
                  ...(!notif.read ? styles.itemUnread : {})
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notif.read ? '#eff6ff' : 'white'}
                onClick={() => handleNotificationClick(notif)}
              >
                <div style={styles.itemTitle}>{notif.title}</div>
                <div style={styles.itemMessage}>{notif.message}</div>
                <div style={styles.itemTime}>
                  {new Date(notif.created_at).toLocaleDateString()} • {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {!notif.read && <span style={styles.unreadDot} />}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>✨</div>
              <div style={styles.emptyTitle}>No notifications</div>
              <div style={{ fontSize: '13px' }}>You're all caught up!</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsDropdown;