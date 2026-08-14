// mobile/src/components/PerformanceMonitor.jsx
import React, { useState, useEffect } from 'react';
import { useCache } from '../hooks/useCache';

const PerformanceMonitor = ({ showInDev = true }) => {
  const { stats: cacheStats, getCacheStats } = useCache();
  const [pageLoadTime, setPageLoadTime] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [memoryInfo, setMemoryInfo] = useState(null);

  // Only show in development
  if (!showInDev && process.env.NODE_ENV === 'production') {
    return null;
  }

  useEffect(() => {
    // Measure page load time
    if (window.performance) {
      const loadTime = window.performance.timing.domContentLoadedEventEnd - 
                      window.performance.timing.navigationStart;
      setPageLoadTime(loadTime);
    }

    // Get memory info if available
    if (performance.memory) {
      setMemoryInfo({
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      });
    }

    console.log('📊 Performance Monitor:');
    console.log(`  - Page Load Time: ${loadTime || 'Unknown'}ms`);
    console.log(`  - Cache Size: ${cacheStats.size || 0}`);
  }, []);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const styles = {
    container: {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    toggle: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      border: 'none',
      cursor: 'pointer',
      fontSize: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.2s',
    },
    panel: {
      position: 'absolute',
      bottom: '50px',
      right: '0',
      backgroundColor: '#0f172a',
      color: '#e2e8f0',
      padding: '16px',
      borderRadius: '12px',
      minWidth: '220px',
      maxWidth: '280px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      fontSize: '12px',
      lineHeight: '1.6',
    },
    title: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#60a5fa',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '2px 0',
    },
    label: {
      color: '#94a3b8',
    },
    value: {
      color: '#e2e8f0',
      fontWeight: '500',
    },
    success: {
      color: '#22c55e',
    },
    warning: {
      color: '#f59e0b',
    },
    error: {
      color: '#ef4444',
    },
    badge: {
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: '600',
      marginLeft: '6px',
    },
  };

  const getLoadTimeColor = (time) => {
    if (!time) return styles.value;
    if (time < 1000) return styles.success;
    if (time < 3000) return styles.warning;
    return styles.error;
  };

  return (
    <div style={styles.container}>
      <button style={styles.toggle} onClick={toggleVisibility} title="Performance Monitor">
        ⚡
      </button>
      
      {isVisible && (
        <div style={styles.panel}>
          <div style={styles.title}>
            ⚡ Performance
            <span style={{
              ...styles.badge,
              backgroundColor: pageLoadTime < 1000 ? '#22c55e20' : '#f59e0b20',
              color: pageLoadTime < 1000 ? '#22c55e' : '#f59e0b'
            }}>
              {pageLoadTime < 1000 ? 'Good' : 'Slow'}
            </span>
          </div>
          
          <div style={styles.row}>
            <span style={styles.label}>Page Load</span>
            <span style={getLoadTimeColor(pageLoadTime)}>
              {pageLoadTime || '--'}ms
            </span>
          </div>
          
          <div style={styles.row}>
            <span style={styles.label}>Cache Size</span>
            <span style={styles.value}>{cacheStats.size || 0} items</span>
          </div>
          
          <div style={styles.row}>
            <span style={styles.label}>Cache TTL</span>
            <span style={styles.value}>{cacheStats.ttl / 1000}s</span>
          </div>
          
          {memoryInfo && (
            <div style={{ marginTop: '8px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
              <div style={styles.row}>
                <span style={styles.label}>Memory (used)</span>
                <span style={{
                  ...styles.value,
                  color: memoryInfo.used / memoryInfo.limit > 0.8 ? '#ef4444' : '#e2e8f0'
                }}>
                  {memoryInfo.used}MB / {memoryInfo.limit}MB
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#1e293b',
                borderRadius: '2px',
                marginTop: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(memoryInfo.used / memoryInfo.limit) * 100}%`,
                  height: '100%',
                  backgroundColor: memoryInfo.used / memoryInfo.limit > 0.8 ? '#ef4444' : '#22c55e',
                  borderRadius: '2px',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '8px', borderTop: '1px solid #1e293b', paddingTop: '8px' }}>
            <button
              onClick={() => {
                const info = getCacheStats();
                console.log('📊 Cache Info:', info);
              }}
              style={{
                background: 'none',
                border: '1px solid #1e293b',
                color: '#94a3b8',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
                width: '100%',
              }}
            >
              📊 Log Cache Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;