// mobile/src/pages/SplashScreen.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

  // Progress animation
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
    }, 300);

    return () => clearTimeout(timer);
  }, [canRedirect, isAuthenticated, authInitialized, navigate]);

  return (
    <div className="splash-screen">
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Version */}
      <div className="version">v2.0.0</div>

      {/* Main Content */}
      <div className="content">
        <div className="logo-wrapper">
          <div className="logo-badge">
            <Icon d={ICONS.store} size={34} color="#1E293B" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="title">
          Kum<span className="title-accent">sika</span>
        </h1>

        <p className="subtitle">Malawi's Smart Local Marketplace</p>

        <div className="tagline">
          <Icon d={ICONS.sparkles} size={14} color="#F59E0B" strokeWidth={1.75} />
          <span>AI-Powered Local Commerce</span>
        </div>

        {/* Features */}
        <div className="features">
          <div className="feature-item">
            <div className="feature-icon">
              <Icon d={ICONS.mapPin} size={20} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <span className="feature-label">Find Nearby</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <Icon d={ICONS.mic} size={20} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <span className="feature-label">Voice Listing</span>
          </div>
          <div className="feature-item">
            <div className="feature-icon">
              <Icon d={ICONS.bot} size={20} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <span className="feature-label">AI Assistant</span>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-wrapper">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}>
              <div className="progress-shimmer" />
            </div>
          </div>
          <p className="progress-text">
            {loadingText}
            <span className="percentage"> {Math.min(progress, 100)}%</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <span>🇲🇼</span> Built for Malawi
      </div>

      <style jsx>{`
        .splash-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #334155 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ===== ORBS ===== */
        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%);
          top: -200px;
          right: -150px;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%);
          bottom: -150px;
          left: -120px;
        }

        .orb-3 {
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        /* ===== VERSION ===== */
        .version {
          position: absolute;
          top: 20px;
          right: 24px;
          color: rgba(255, 255, 255, 0.15);
          font-size: 11px;
          font-weight: 500;
          font-family: monospace;
          z-index: 1;
          letter-spacing: 0.3px;
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
          animation: fadeInDown 0.8s ease-out;
        }

        .logo-badge {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #F59E0B, #D97706);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 48px rgba(245, 158, 11, 0.3);
          animation: pulse 2.5s ease-in-out infinite;
          transition: all 0.3s;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 48px rgba(245, 158, 11, 0.3);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 8px 64px rgba(245, 158, 11, 0.5);
          }
        }

        /* ===== TITLE ===== */
        .title {
          font-size: 44px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 16px 0 4px;
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-family: 'Fraunces', Georgia, serif;
          animation: fadeInDown 0.8s ease-out 0.15s both;
        }

        .title-accent {
          color: #F59E0B;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 15px;
          margin: 0 0 8px;
          text-align: center;
          animation: fadeInDown 0.8s ease-out 0.3s both;
          letter-spacing: 0.3px;
        }

        /* ===== TAGLINE ===== */
        .tagline {
          color: #F59E0B;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          background: rgba(245, 158, 11, 0.1);
          padding: 6px 20px;
          border-radius: 20px;
          border: 1px solid rgba(245, 158, 11, 0.12);
          animation: fadeInDown 0.8s ease-out 0.45s both;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ===== FEATURES ===== */
        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 28px;
          width: 100%;
          animation: fadeInDown 0.8s ease-out 0.6s both;
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.4);
          font-size: 11px;
          font-weight: 500;
          text-align: center;
          padding: 14px 8px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(4px);
          transition: all 0.3s;
        }

        .feature-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(245, 158, 11, 0.1);
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          background: rgba(245, 158, 11, 0.08);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .feature-item:hover .feature-icon {
          background: rgba(245, 158, 11, 0.15);
        }

        .feature-label {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
          letter-spacing: 0.2px;
        }

        /* ===== PROGRESS ===== */
        .progress-wrapper {
          width: 100%;
          max-width: 320px;
          margin-top: 32px;
          animation: fadeInDown 0.8s ease-out 0.75s both;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #F59E0B, #D97706);
          border-radius: 4px;
          transition: width 0.15s ease;
          position: relative;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.2);
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: shimmer 1.8s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-text {
          color: rgba(255, 255, 255, 0.3);
          font-size: 12px;
          margin: 10px 0 0;
          text-align: center;
          font-family: monospace;
          letter-spacing: 0.3px;
        }

        .percentage {
          color: #F59E0B;
          font-weight: 700;
        }

        /* ===== FOOTER ===== */
        .footer {
          position: absolute;
          bottom: 28px;
          color: rgba(255, 255, 255, 0.15);
          font-size: 12px;
          z-index: 1;
          animation: fadeInDown 0.8s ease-out 0.9s both;
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.2px;
        }

        /* ===== ANIMATIONS ===== */
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .title {
            font-size: 34px;
          }
          .logo-badge {
            width: 64px;
            height: 64px;
            border-radius: 20px;
          }
          .logo-badge svg {
            width: 28px;
            height: 28px;
          }
          .features {
            gap: 8px;
          }
          .feature-item {
            padding: 10px 6px;
          }
          .feature-icon {
            width: 36px;
            height: 36px;
          }
          .feature-icon svg {
            width: 16px;
            height: 16px;
          }
          .feature-label {
            font-size: 9px;
          }
          .subtitle {
            font-size: 13px;
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
        }

        @media (max-width: 380px) {
          .title {
            font-size: 28px;
          }
          .logo-badge {
            width: 56px;
            height: 56px;
            border-radius: 16px;
          }
          .logo-badge svg {
            width: 24px;
            height: 24px;
          }
          .features {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          .feature-item {
            padding: 8px 4px;
          }
          .feature-icon {
            width: 32px;
            height: 32px;
          }
          .feature-icon svg {
            width: 14px;
            height: 14px;
          }
          .progress-wrapper {
            margin-top: 24px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .title {
            font-size: 40px;
          }
        }
      `}</style>
    </div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;