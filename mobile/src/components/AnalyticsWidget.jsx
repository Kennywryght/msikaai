import React from 'react';

const AnalyticsWidget = ({ analytics, onClose }) => {
  if (!analytics) return null;

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #e2e8f0',
      position: 'relative'
    },
    closeBtn: {
      position: 'absolute',
      top: '12px',
      right: '16px',
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      color: '#94a3b8'
    },
    title: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px'
    },
    statCard: {
      textAlign: 'center',
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    number: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#2563eb'
    },
    label: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '4px'
    },
    trend: {
      fontSize: '14px',
      fontWeight: '600'
    },
    trendPositive: {
      color: '#16a34a'
    },
    trendNegative: {
      color: '#dc2626'
    },
    footer: {
      marginTop: '12px',
      padding: '12px',
      backgroundColor: '#f1f5f9',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    footerText: {
      fontSize: '13px',
      color: '#64748b',
      margin: 0
    },
    period: {
      fontSize: '12px',
      color: '#94a3b8'
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={onClose} style={styles.closeBtn}>✕</button>
      
      <h3 style={styles.title}>📊 Performance Analytics</h3>
      
      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div style={styles.number}>{analytics.totalViews || 0}</div>
          <div style={styles.label}>👁️ Total Views</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.number}>{analytics.totalContacts || 0}</div>
          <div style={styles.label}>📞 Total Contacts</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={{
            ...styles.number,
            ...(analytics.trend > 0 ? styles.trendPositive : styles.trendNegative),
            fontSize: '20px'
          }}>
            {analytics.trend > 0 ? '↑' : '↓'} {Math.abs(analytics.trend)}%
          </div>
          <div style={styles.label}>📈 Trend</div>
        </div>
        
        <div style={styles.statCard}>
          <div style={styles.number}>{analytics.listings?.length || 0}</div>
          <div style={styles.label}>📦 Total Listings</div>
        </div>
      </div>

      {analytics.topListing && (
        <div style={styles.footer}>
          <span style={styles.footerText}>
            🏆 Top Listing: <strong>{analytics.topListing.title}</strong>
            {' '}({analytics.topListing.view_count || 0} views, {analytics.topListing.contact_count || 0} contacts)
          </span>
          <span style={styles.period}>📅 {analytics.period}</span>
        </div>
      )}
    </div>
  );
};

export default AnalyticsWidget;