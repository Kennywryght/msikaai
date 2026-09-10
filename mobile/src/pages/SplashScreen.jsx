// mobile/src/pages/SplashScreen.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SplashScreen = memo(({ onComplete }) => {
  const { isAuthenticated, loading, authInitialized } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Welcome to Kumsika');
  const [currentStep, setCurrentStep] = useState(0);
  const [canRedirect, setCanRedirect] = useState(false);
  const hasNavigated = useRef(false);
  const [showTagline, setShowTagline] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Loading messages with timing
  const loadingMessages = [
    { text: 'Welcome to Kumsika', delay: 0 },
    { text: 'Connecting to marketplace...', delay: 800 },
    { text: 'Loading local businesses...', delay: 1600 },
    { text: 'Preparing your feed...', delay: 2400 },
    { text: 'Almost ready...', delay: 3200 },
  ];

  // Staggered animations
  useEffect(() => {
    const timers = [];

    timers.push(setTimeout(() => setShowTagline(true), 400));
    timers.push(setTimeout(() => setShowFeatures(true), 900));
    timers.push(setTimeout(() => setShowProgress(true), 500));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  // Progress animation
  useEffect(() => {
    let progressValue = 0;
    let messageIndex = 0;
    let lastUpdate = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdate;
      lastUpdate = now;

      let increment = 0.5;
      if (progressValue > 30) increment = 0.8;
      if (progressValue > 60) increment = 1.2;
      if (progressValue > 80) increment = 1.8;

      progressValue += increment * (delta / 16);
      
      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(interval);
        setCanRedirect(true);
        if (onComplete) onComplete();
      }

      setProgress(Math.min(progressValue, 100));

      const newIndex = Math.min(
        Math.floor(progressValue / 20),
        loadingMessages.length - 1
      );
      if (newIndex !== messageIndex) {
        messageIndex = newIndex;
        setLoadingText(loadingMessages[messageIndex].text);
        setCurrentStep(messageIndex);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete, loadingMessages]);

  // Auto-redirect
  useEffect(() => {
    if (!canRedirect || !authInitialized || hasNavigated.current) return;

    hasNavigated.current = true;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/landing', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [canRedirect, isAuthenticated, authInitialized, navigate]);

  // Dot indicators for loading steps
  const renderDots = () => {
    const totalDots = loadingMessages.length;
    return (
      <div className="dots-container">
        {Array.from({ length: totalDots }).map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="splash-screen">
      {/* Background Effects */}
      <div className="bg-gradient" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />

      {/* Version */}
      <div className="version">v2.0.0</div>

      {/* Main Content */}
      <div className="content">
        {/* Logo */}
        <div className="logo-wrapper">
          <div className="logo-badge">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 2L4 12L18 22L32 12L18 2Z" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M4 24L18 34L32 24" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M4 18L18 28L32 18" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round"/>
              <circle cx="18" cy="18" r="4" fill="#1E293B"/>
            </svg>
          </div>
        </div>

        {/* ✅ Brand Name: "Ku" in white, "msika" in gold */}
        <h1 className="title">
          <span className="title-dark">Ku</span>
          <span className="title-accent">msika</span>
        </h1>

        <p className="subtitle">Malawi's Smart Local Marketplace</p>

        {/* Tagline */}
        <div className={`tagline-wrapper ${showTagline ? 'visible' : ''}`}>
          <div className="tagline">
            <span className="tagline-icon">✨</span>
            <span>AI-Powered Local Commerce</span>
          </div>
        </div>

        {/* Features */}
        <div className={`features ${showFeatures ? 'visible' : ''}`}>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="feature-label">Find Nearby</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M8 21h8"/>
              </svg>
            </div>
            <span className="feature-label">Voice Listing</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z"/>
                <circle cx="9" cy="12" r="0.5" fill="#F59E0B"/>
                <circle cx="15" cy="12" r="0.5" fill="#F59E0B"/>
                <path d="M10 16h4"/>
              </svg>
            </div>
            <span className="feature-label">AI Assistant</span>
          </div>
        </div>

        {/* Progress */}
        <div className={`progress-wrapper ${showProgress ? 'visible' : ''}`}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}>
              <div className="progress-shimmer" />
            </div>
          </div>
          <div className="progress-bottom">
            <span className="progress-text">{loadingText}</span>
            <span className="percentage">{Math.round(Math.min(progress, 100))}%</span>
          </div>
          {renderDots()}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span className="footer-flag">🇲🇼</span>
        <span className="footer-text">Built for Malawi</span>
      </div>

      <style jsx>{`
        .splash-screen {
          min-height: 100vh;
          background: #0F172A;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ===== BACKGROUND ===== */
        .bg-gradient {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
          pointer-events: none;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(80px);
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: rgba(245, 158, 11, 0.06);
          top: -200px;
          right: -150px;
          animation: float 8s ease-in-out infinite;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: rgba(16, 185, 129, 0.04);
          bottom: -150px;
          left: -120px;
          animation: float 10s ease-in-out infinite reverse;
        }

        .orb-3 {
          width: 200px;
          height: 200px;
          background: rgba(139, 92, 246, 0.04);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse-slow 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes pulse-slow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
        }

        /* ===== VERSION ===== */
        .version {
          position: absolute;
          top: 20px;
          right: 24px;
          color: rgba(255, 255, 255, 0.12);
          font-size: 11px;
          font-weight: 500;
          font-family: 'SF Mono', 'Menlo', monospace;
          z-index: 1;
          letter-spacing: 0.5px;
        }

        /* ===== CONTENT ===== */
        .content {
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1;
          max-width: 400px;
          width: 100%;
        }

        /* ===== LOGO ===== */
        .logo-wrapper {
          animation: fadeInUp 0.8s ease-out;
          margin-bottom: 12px;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-badge {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 48px rgba(245, 158, 11, 0.25);
          animation: logoPulse 2.5s ease-in-out infinite;
          transition: all 0.3s;
        }

        .logo-badge svg {
          width: 32px;
          height: 32px;
        }

        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 48px rgba(245, 158, 11, 0.25);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 8px 64px rgba(245, 158, 11, 0.4);
          }
        }

        /* ===== TITLE ===== */
        .title {
          font-size: 40px;
          font-weight: 800;
          margin: 0 0 4px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-family: 'Fraunces', Georgia, serif;
          animation: fadeInUp 0.8s ease-out 0.15s both;
        }

        /* ✅ "Ku" in white, "msika" in gold */
        .title-dark {
          color: #FFFFFF;
        }

        .title-accent {
          color: #F59E0B;
          position: relative;
        }

        .title-accent::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #F59E0B, transparent);
          border-radius: 1px;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.4);
          font-size: 14px;
          margin: 0 0 12px;
          text-align: center;
          animation: fadeInUp 0.8s ease-out 0.3s both;
          letter-spacing: 0.5px;
          font-weight: 400;
        }

        /* ===== TAGLINE ===== */
        .tagline-wrapper {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 8px;
        }

        .tagline-wrapper.visible {
          max-height: 60px;
          opacity: 1;
        }

        .tagline {
          color: #F59E0B;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          background: rgba(245, 158, 11, 0.08);
          padding: 6px 18px;
          border-radius: 20px;
          border: 1px solid rgba(245, 158, 11, 0.1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(4px);
        }

        .tagline-icon {
          font-size: 14px;
        }

        /* ===== FEATURES ===== */
        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 20px;
          width: 100%;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .features.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: rgba(255, 255, 255, 0.35);
          font-size: 10px;
          font-weight: 500;
          text-align: center;
          padding: 12px 6px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(4px);
          transition: all 0.3s;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(245, 158, 11, 0.08);
          transform: translateY(-2px);
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          background: rgba(245, 158, 11, 0.06);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .feature-item:hover .feature-icon {
          background: rgba(245, 158, 11, 0.12);
        }

        .feature-label {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* ===== PROGRESS ===== */
        .progress-wrapper {
          width: 100%;
          max-width: 300px;
          margin-top: 28px;
          opacity: 0;
          transform: translateY(12px);
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-wrapper.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .progress-bar {
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #F59E0B, #D97706);
          border-radius: 3px;
          transition: width 0.15s ease;
          position: relative;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.15);
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          animation: shimmer 1.8s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
        }

        .progress-text {
          color: rgba(255, 255, 255, 0.25);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.3px;
          font-family: 'SF Pro', -apple-system, sans-serif;
        }

        .percentage {
          color: #F59E0B;
          font-weight: 600;
          font-size: 11px;
          font-family: 'SF Mono', 'Menlo', monospace;
        }

        /* ===== DOTS ===== */
        .dots-container {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-top: 12px;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          transition: all 0.5s ease;
        }

        .dot.active {
          background: #F59E0B;
          width: 18px;
          border-radius: 3px;
        }

        .dot.completed {
          background: rgba(245, 158, 11, 0.4);
        }

        /* ===== FOOTER ===== */
        .footer {
          position: absolute;
          bottom: 28px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 1;
          animation: fadeInUp 0.8s ease-out 0.9s both;
          opacity: 0.3;
        }

        .footer-flag {
          font-size: 13px;
        }

        .footer-text {
          color: rgba(255, 255, 255, 0.25);
          font-size: 11px;
          font-weight: 400;
          letter-spacing: 0.3px;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .title {
            font-size: 32px;
          }
          .logo-badge {
            width: 60px;
            height: 60px;
            border-radius: 16px;
          }
          .logo-badge svg {
            width: 26px;
            height: 26px;
          }
          .features {
            gap: 6px;
            margin-top: 16px;
          }
          .feature-item {
            padding: 8px 4px;
          }
          .feature-icon {
            width: 34px;
            height: 34px;
          }
          .feature-icon svg {
            width: 16px;
            height: 16px;
          }
          .feature-label {
            font-size: 8px;
          }
          .subtitle {
            font-size: 12px;
          }
          .tagline {
            font-size: 11px;
            padding: 4px 14px;
          }
          .version {
            font-size: 10px;
            top: 14px;
            right: 16px;
          }
          .progress-wrapper {
            margin-top: 20px;
          }
          .orb-1 {
            width: 300px;
            height: 300px;
          }
          .orb-2 {
            width: 250px;
            height: 250px;
          }
        }

        @media (max-width: 380px) {
          .title {
            font-size: 28px;
          }
          .logo-badge {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }
          .logo-badge svg {
            width: 22px;
            height: 22px;
          }
          .features {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }
          .feature-item {
            padding: 6px 4px;
          }
          .feature-icon {
            width: 30px;
            height: 30px;
          }
          .feature-icon svg {
            width: 14px;
            height: 14px;
          }
          .progress-wrapper {
            max-width: 260px;
          }
          .progress-text {
            font-size: 10px;
          }
          .percentage {
            font-size: 10px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .title {
            font-size: 38px;
          }
        }

        /* Safari/iOS safe area support */
        @supports (padding: max(0px)) {
          .splash-screen {
            padding-left: max(24px, env(safe-area-inset-left));
            padding-right: max(24px, env(safe-area-inset-right));
            padding-bottom: max(40px, env(safe-area-inset-bottom));
          }
        }

        /* Reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .logo-badge {
            animation: none;
          }
          .orb-1, .orb-2, .orb-3 {
            animation: none;
          }
          .progress-shimmer {
            animation: none;
            display: none;
          }
          .feature-item {
            transition: none;
          }
          .feature-item:hover {
            transform: none;
          }
          .logo-wrapper,
          .title,
          .subtitle,
          .footer {
            animation: none;
          }
          .tagline-wrapper,
          .features,
          .progress-wrapper {
            transition: none;
          }
          .tagline-wrapper.visible,
          .features.visible,
          .progress-wrapper.visible {
            opacity: 1;
            transform: none;
            max-height: none;
          }
          .dot {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;