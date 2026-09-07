// mobile/src/pages/SplashScreen.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ============================================================
// PREMIUM FEATHER ICONS
// ============================================================
const Icon = ({ d, size = 24, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  mic: "M19 10v2a7 7 0 01-14 0v-2M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM8 21h8",
  bot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
};

const SplashScreen = memo(({ onComplete }) => {
  const { isAuthenticated, loading, authInitialized } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading Kumsika...');
  const [canRedirect, setCanRedirect] = useState(false);
  const hasNavigated = useRef(false);

  // ============================================================
  // PROGRESS ANIMATION
  // ============================================================
  useEffect(() => {
    const messages = [
      'Loading Kumsika...',
      'Checking your session...',
      'Preparing your marketplace...',
      'Almost ready...'
    ];

    let step = 0;
    let progressValue = 0;

    const interval = setInterval(() => {
      progressValue += 3;
      setProgress(progressValue);

      if (progressValue >= 25 && step < messages.length - 1) {
        step++;
        setLoadingText(messages[step]);
      }

      if (progressValue >= 100) {
        clearInterval(interval);
        setCanRedirect(true);
        if (onComplete) onComplete();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  // ============================================================
  // AUTO-REDIRECT
  // ============================================================
  useEffect(() => {
    if (!canRedirect || !authInitialized || hasNavigated.current) return;

    hasNavigated.current = true;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/landing', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [canRedirect, isAuthenticated, authInitialized, navigate]);

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E293B 0%, #334155 50%, #475569 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    },
    bgOrb1: {
      position: 'absolute',
      width: '400px',
      height: '400px',
      background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
      borderRadius: '50%',
      top: '-150px',
      right: '-150px',
      pointerEvents: 'none',
    },
    bgOrb2: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
      borderRadius: '50%',
      bottom: '-100px',
      left: '-100px',
      pointerEvents: 'none',
    },
    logoContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
      zIndex: 1,
      animation: 'fadeIn 0.8s ease-out',
    },
    logoBadge: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 40px rgba(245,158,11,0.3)',
      animation: 'pulse 2s ease-in-out infinite',
    },
    title: {
      fontSize: '44px',
      fontWeight: '800',
      color: '#FFFFFF',
      margin: 0,
      lineHeight: '1.1',
      letterSpacing: '-0.02em',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    titleAccent: {
      color: '#F59E0B',
    },
    subtitle: {
      color: '#94A3B8',
      fontSize: '16px',
      marginTop: '2px',
      textAlign: 'center',
      animation: 'fadeIn 0.8s ease-out 0.3s both',
    },
    tagline: {
      color: '#F59E0B',
      fontSize: '14px',
      fontWeight: '600',
      marginTop: '4px',
      textAlign: 'center',
      backgroundColor: 'rgba(245,158,11,0.12)',
      padding: '6px 20px',
      borderRadius: '20px',
      border: '1px solid rgba(245,158,11,0.15)',
      animation: 'fadeIn 0.8s ease-out 0.6s both',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px',
      marginTop: '32px',
      maxWidth: '380px',
      width: '100%',
      zIndex: 1,
      animation: 'fadeIn 0.8s ease-out 0.9s both',
    },
    featureItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      color: '#94A3B8',
      fontSize: '12px',
      fontWeight: '500',
      textAlign: 'center',
      padding: '14px 12px',
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(4px)',
    },
    featureIcon: {
      width: '44px',
      height: '44px',
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: {
      fontSize: '11px',
      color: '#94A3B8',
      fontWeight: '500',
    },
    progressContainer: {
      width: '100%',
      maxWidth: '360px',
      marginTop: '36px',
      zIndex: 1,
      animation: 'fadeIn 0.8s ease-out 1.2s both',
    },
    progressBar: {
      width: '100%',
      height: '6px',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: '6px',
      overflow: 'hidden',
      position: 'relative',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #F59E0B, #D97706)',
      borderRadius: '6px',
      transition: 'width 0.1s ease',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 20px rgba(245,158,11,0.3)',
      width: `${Math.min(progress, 100)}%`,
    },
    progressGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      animation: 'shimmer 1.5s infinite',
    },
    progressText: {
      color: '#64748B',
      fontSize: '13px',
      marginTop: '12px',
      textAlign: 'center',
      fontFamily: 'monospace',
      letterSpacing: '0.3px',
    },
    percentage: {
      color: '#F59E0B',
      fontWeight: '700',
    },
    footer: {
      position: 'absolute',
      bottom: '30px',
      color: '#475569',
      fontSize: '13px',
      zIndex: 1,
      animation: 'fadeIn 0.8s ease-out 1.5s both',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    version: {
      position: 'absolute',
      top: '20px',
      right: '24px',
      color: '#475569',
      fontSize: '11px',
      fontWeight: '500',
      fontFamily: 'monospace',
      zIndex: 1,
    },
    keyframes: `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 8px 40px rgba(245,158,11,0.3); }
        50% { transform: scale(1.05); box-shadow: 0 8px 60px rgba(245,158,11,0.5); }
        100% { transform: scale(1); box-shadow: 0 8px 40px rgba(245,158,11,0.3); }
      }
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `,
  };

  return (
    <div style={styles.container}>
      <style>{styles.keyframes}</style>

      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <div style={styles.version}>v2.0.0</div>

      <div style={styles.logoContainer}>
        <div style={styles.logoBadge}>
          <Icon d={ICONS.store} size={34} color="#1E293B" strokeWidth={2.5} />
        </div>
        <h1 style={styles.title}>
          Kum<span style={styles.titleAccent}>sika</span>
        </h1>
      </div>

      <p style={styles.subtitle}>Malawi's Smart Local Marketplace</p>
      <div style={styles.tagline}>
        <Icon d={ICONS.sparkles} size={14} color="#F59E0B" strokeWidth={1.75} />
        <span>AI-Powered Local Commerce</span>
      </div>

      <div style={styles.features}>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <Icon d={ICONS.mapPin} size={20} color="#F59E0B" strokeWidth={1.75} />
          </div>
          <span style={styles.featureLabel}>Find Nearby</span>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <Icon d={ICONS.mic} size={20} color="#F59E0B" strokeWidth={1.75} />
          </div>
          <span style={styles.featureLabel}>Voice Listing</span>
        </div>
        <div style={styles.featureItem}>
          <div style={styles.featureIcon}>
            <Icon d={ICONS.bot} size={20} color="#F59E0B" strokeWidth={1.75} />
          </div>
          <span style={styles.featureLabel}>AI Assistant</span>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div style={styles.progressFill}>
            <div style={styles.progressGlow} />
          </div>
        </div>
        <p style={styles.progressText}>
          {loadingText}
          <span style={styles.percentage}> {Math.min(progress, 100)}%</span>
        </p>
      </div>

      <p style={styles.footer}>
        <span>🇲🇼</span> Built for Malawi
      </p>
    </div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;