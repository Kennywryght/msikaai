// mobile/src/pages/SplashScreen.jsx
import React, { useState, useEffect, memo } from 'react';

// --- HAND-DRAWN ICONS ---
const SketchIcon = ({ d, size = 24, color = 'currentColor', strokeWidth = 2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  arrowRight: "M5 12h14M12 5l7 7-7 7"
};

const SplashScreen = memo(() => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('🌾 Loading Mitundu Marketplace...');

  useEffect(() => {
    const messages = [
      '🌾 Loading Mitundu Marketplace...',
      '🔍 Finding local businesses...',
      '🤖 Preparing AI assistant...',
      '📍 Mapping your location...',
      '✅ Almost ready...'
    ];

    let step = 0;
    let progressValue = 0;

    const interval = setInterval(() => {
      progressValue += 3;
      setProgress(progressValue);

      if (progressValue >= 20 && step < messages.length - 1) {
        step++;
        setLoadingText(messages[step]);
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ✅ Memoized styles to prevent re-renders
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    },
    bgOrbs: {
      position: 'absolute',
      borderRadius: '50%',
      opacity: 0.08,
      pointerEvents: 'none'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
      animation: 'fadeIn 0.8s ease-out'
    },
    logoBadge: {
      width: '72px',
      height: '72px',
      backgroundColor: '#2563eb',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(37,99,235,0.35)',
      animation: 'pulse 2s ease-in-out infinite'
    },
    title: {
      fontSize: '42px',
      fontWeight: '800',
      color: '#ffffff',
      margin: 0,
      lineHeight: '1.1'
    },
    titleAccent: {
      color: '#60a5fa'
    },
    subtitle: {
      color: '#94a3b8',
      fontSize: '16px',
      marginTop: '4px',
      textAlign: 'center',
      animation: 'fadeIn 0.8s ease-out 0.3s both'
    },
    tagline: {
      color: '#60a5fa',
      fontSize: '18px',
      fontWeight: '600',
      marginTop: '8px',
      textAlign: 'center',
      backgroundColor: 'rgba(37,99,235,0.15)',
      padding: '6px 20px',
      borderRadius: '20px',
      border: '1px solid rgba(37,99,235,0.2)',
      animation: 'fadeIn 0.8s ease-out 0.6s both'
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginTop: '32px',
      maxWidth: '420px',
      width: '100%',
      animation: 'fadeIn 0.8s ease-out 0.9s both'
    },
    featureItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      color: '#94a3b8',
      fontSize: '13px',
      fontWeight: '500',
      textAlign: 'center',
      padding: '12px',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)'
    },
    featureIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: 'rgba(37,99,235,0.15)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    featureLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      fontWeight: '500'
    },
    progressContainer: {
      width: '100%',
      maxWidth: '360px',
      marginTop: '40px',
      animation: 'fadeIn 0.8s ease-out 1.2s both'
    },
    progressBar: {
      width: '100%',
      height: '6px',
      backgroundColor: '#1e293b',
      borderRadius: '6px',
      overflow: 'hidden',
      position: 'relative'
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#2563eb',
      borderRadius: '6px',
      transition: 'width 0.1s ease',
      position: 'relative',
      overflow: 'hidden'
    },
    progressGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      animation: 'shimmer 1.5s infinite'
    },
    progressText: {
      color: '#64748b',
      fontSize: '13px',
      marginTop: '12px',
      textAlign: 'center',
      fontFamily: 'monospace',
      letterSpacing: '0.5px'
    },
    percentage: {
      color: '#60a5fa',
      fontWeight: '600'
    },
    footer: {
      position: 'absolute',
      bottom: '30px',
      color: '#334155',
      fontSize: '12px',
      animation: 'fadeIn 0.8s ease-out 1.5s both'
    },
    version: {
      position: 'absolute',
      top: '20px',
      right: '24px',
      color: '#1e293b',
      fontSize: '11px',
      fontWeight: '500',
      fontFamily: 'monospace'
    },
    keyframes: `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 8px 32px rgba(37,99,235,0.35); }
        50% { transform: scale(1.05); box-shadow: 0 8px 48px rgba(37,99,235,0.5); }
        100% { transform: scale(1); box-shadow: 0 8px 32px rgba(37,99,235,0.35); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `
  };

  return (
    <div style={styles.container}>
      <style>{styles.keyframes}</style>

      {/* Background Orbs */}
      <div style={{ ...styles.bgOrbs, width: '350px', height: '350px', backgroundColor: '#2563eb', top: '-150px', right: '-150px' }}></div>
      <div style={{ ...styles.bgOrbs, width: '250px', height: '250px', backgroundColor: '#8b5cf6', bottom: '-100px', left: '-100px' }}></div>
      <div style={{ ...styles.bgOrbs, width: '150px', height: '150px', backgroundColor: '#f59e0b', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.03 }}></div>

      {/* Version */}
      <div style={styles.version}>v1.0.0</div>

      {/* Logo */}
      <div style={styles.logoContainer}>
        <div style={styles.logoBadge}>
          <SketchIcon d={ICONS.store} size={34} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={styles.title}>
            <span style={styles.titleAccent}>Kum</span>sika
          </h1>
        </div>
      </div>

      <p style={styles.subtitle}>Mitundu's Smart Local Marketplace</p>
      <div style={styles.tagline}>
        <SketchIcon d={ICONS.sparkles} size={16} color="#60a5fa" strokeWidth={2} />
        <span style={{ marginLeft: '6px' }}>Trade, Buy & Hire Locally</span>
      </div>

      {/* Features Preview */}
      <div style={styles.features}>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <SketchIcon d={ICONS.mapPin} size={20} color="#60a5fa" strokeWidth={2} />
          </div>
          <span style={styles.featureLabel}>Find Nearby</span>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <SketchIcon d={ICONS.mic} size={20} color="#60a5fa" strokeWidth={2} />
          </div>
          <span style={styles.featureLabel}>Voice Listing</span>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <SketchIcon d={ICONS.bot} size={20} color="#60a5fa" strokeWidth={2} />
          </div>
          <span style={styles.featureLabel}>AI Assistant</span>
        </div>
      </div>

      {/* Progress */}
      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${Math.min(progress, 100)}%` }}>
            <div style={styles.progressGlow}></div>
          </div>
        </div>
        <p style={styles.progressText}>
          {loadingText}
          <span style={styles.percentage}> {Math.min(progress, 100)}%</span>
        </p>
      </div>

      <p style={styles.footer}>Built for Mitundu, Malawi 🇲🇼</p>
    </div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;