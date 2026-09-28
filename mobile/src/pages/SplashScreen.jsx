// mobile/src/pages/SplashScreen.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

// How long the splash stays on screen before redirecting (in milliseconds)
const SPLASH_DURATION_MS = 10000;

// Defined outside the component so the progress effect isn't restarted on every render
const LOADING_MESSAGES = [
  'Welcome to Kumsika',
  'Connecting to marketplace...',
  'Loading local businesses...',
  'Preparing your feed...',
  'Almost ready...',
];

const FEATURES = [
  {
    title: 'Find nearby',
    desc: 'Shops and sellers around you',
    icon: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    title: 'Voice listing',
    desc: 'Post an item by speaking',
    icon: (
      <>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M8 21h8" />
      </>
    ),
  },
  {
    title: 'AI assistant',
    desc: 'Smart search and ready-made ads',
    icon: (
      <>
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
        <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
      </>
    ),
  },
];

const SplashScreen = memo(({ onComplete }) => {
  const { isAuthenticated, authInitialized } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [canRedirect, setCanRedirect] = useState(false);
  const hasNavigated = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Progress animation (runs once)
  useEffect(() => {
    const startTime = Date.now();

    const interval = setInterval(() => {
      // Time-based progress: reaches 100% after SPLASH_DURATION_MS
      let progressValue = ((Date.now() - startTime) / SPLASH_DURATION_MS) * 100;

      if (progressValue >= 100) {
        progressValue = 100;
        clearInterval(interval);
        setCanRedirect(true);
        if (onCompleteRef.current) onCompleteRef.current();
      }

      setProgress(progressValue);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Navigation (unchanged behaviour)
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

  const messageIndex = Math.min(Math.floor(progress / 20), LOADING_MESSAGES.length - 1);
  const activeFeature = Math.min(Math.floor(progress / 33.4), FEATURES.length - 1);
  const pct = Math.round(Math.min(progress, 100));

  return (
    <div className="splash-screen" role="status" aria-live="polite" aria-label="Loading Kumsika">
      <div className="glow" aria-hidden="true" />

      <main className="content">
        <div className="logo-card">
          <Logo variant="full" size={150} clickable={false} />
        </div>

        <h1 className="headline">AI-powered local commerce for Malawi</h1>
        <p className="subtitle">Malawi's Smart Local Marketplace</p>

        <ul className="feature-list">
          {FEATURES.map((f, i) => (
            <li
              key={f.title}
              className={`feature-row ${i === activeFeature ? 'active' : ''} ${i < activeFeature ? 'seen' : ''}`}
            >
              <span className="feature-icon" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {f.icon}
                </svg>
              </span>
              <span className="feature-text">
                <span className="feature-title">{f.title}</span>
                <span className="feature-desc">{f.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="progress-wrapper">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <div className="progress-bottom">
            <span className="progress-text">{LOADING_MESSAGES[messageIndex]}</span>
            <span className="percentage">{pct}%</span>
          </div>
        </div>
      </main>

      <footer className="footer">
        <span className="flag-stripe" aria-hidden="true">
          <i style={{ background: '#000' }} />
          <i style={{ background: '#CE1126' }} />
          <i style={{ background: '#339E35' }} />
        </span>
        <span className="footer-text">Built for Malawi</span>
      </footer>

      <style jsx>{`
        .splash-screen {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(170deg, #0a2472 0%, #061446 55%, #040d2e 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px 80px;
          font-family: var(--font-sans);
          position: relative;
          overflow: hidden;
        }

        /* One quiet warm glow behind the logo — the only ambient effect */
        .glow {
          position: absolute;
          top: 8%;
          left: 50%;
          width: 560px;
          height: 560px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(255, 92, 35, 0.16) 0%, transparent 65%);
          pointer-events: none;
        }

        .content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 400px;
        }

        .logo-card {
          background: #ffffff;
          padding: 16px 24px;
          border-radius: var(--radius-3xl);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08);
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .headline {
          margin: 0;
          color: #ffffff;
          font-size: 26px;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.02em;
          text-align: center;
          max-width: 18ch;
          text-wrap: balance;
        }

        .subtitle {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          text-align: center;
        }

        /* Feature rows light up in step with loading progress */
        .feature-list {
          list-style: none;
          margin: 32px 0 0;
          padding: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .feature-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px 14px;
          border-radius: var(--radius-xl);
          border: 1px solid transparent;
          color: rgba(255, 255, 255, 0.4);
          transition: background 0.4s ease, border-color 0.4s ease, color 0.4s ease;
        }

        .feature-row.seen {
          color: rgba(255, 255, 255, 0.6);
        }

        .feature-row.active {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 92, 35, 0.35);
          color: #ffffff;
        }

        .feature-icon {
          flex: none;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.06);
          transition: background 0.4s ease, color 0.4s ease;
        }

        .feature-row.active .feature-icon {
          background: var(--color-accent);
          color: #ffffff;
        }

        .feature-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .feature-title {
          font-size: 14px;
          font-weight: 600;
        }

        .feature-desc {
          font-size: 12px;
          opacity: 0.75;
        }

        .progress-wrapper {
          width: 100%;
          margin-top: 32px;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ff5c23, #ff7f49);
          border-radius: 4px;
          transition: width 0.15s ease;
        }

        .progress-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }

        .progress-text {
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
        }

        .percentage {
          color: var(--color-accent);
          font-weight: 600;
          font-size: 12px;
          font-variant-numeric: tabular-nums;
        }

        .footer {
          position: absolute;
          bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1;
        }

        .flag-stripe {
          display: flex;
          flex-direction: column;
          width: 22px;
          height: 14px;
          border-radius: 2px;
          overflow: hidden;
        }

        .flag-stripe i {
          flex: 1;
          display: block;
        }

        .footer-text {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }

        @media (max-width: 380px) {
          .headline { font-size: 22px; }
          .logo-card { padding: 12px 18px; margin-bottom: 22px; }
          .feature-list { margin-top: 24px; }
          .feature-row { padding: 8px 10px; }
          .feature-icon { width: 36px; height: 36px; }
        }

        @supports (padding: max(0px)) {
          .splash-screen {
            padding-left: max(24px, env(safe-area-inset-left));
            padding-right: max(24px, env(safe-area-inset-right));
            padding-bottom: max(80px, calc(env(safe-area-inset-bottom) + 64px));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .feature-row,
          .feature-icon,
          .progress-fill { transition: none; }
        }
      `}</style>
    </div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;