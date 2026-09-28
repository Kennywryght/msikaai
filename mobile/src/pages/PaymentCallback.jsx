// mobile/src/pages/PaymentCallback.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    check: 'M20 6L9 17l-5-5',
    alertCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  };
  const d = icons[name] || icons.check;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, authInitialized } = useAuth();

  const [status, setStatus] = useState('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [resultKind, setResultKind] = useState(null); // 'subscription' | 'boost' | null

  const pollTimerRef = useRef(null);
  const MAX_ATTEMPTS = 20;

  const txRef =
    searchParams.get('tx_ref') ||
    searchParams.get('txRef') ||
    searchParams.get('reference') ||
    searchParams.get('payment_id') ||
    searchParams.get('paymentId') ||
    location.state?.txRef ||
    null;

  useEffect(() => {
    if (!authInitialized) return;

    if (!isAuthenticated) {
      navigate('/login', {
        replace: true,
        state: { from: location.pathname + location.search },
      });
      return;
    }

    if (!txRef) {
      setStatus('failed');
      setErrorMsg('No payment reference found in the URL.');
      return;
    }

    let cancelled = false;

    const verifyOnce = async () => {
      try {
        const res = await paymentAPI.verifyPayment(txRef);
        const data = res?.data || {};

        if (data.success && data.status === 'success') {
          if (!cancelled) {
            setResultKind(data.kind || null);
            setStatus('success');
          }
          return true;
        }
        if (data.status === 'failed') {
          if (!cancelled) {
            setStatus('failed');
            setErrorMsg('The payment was not completed.');
          }
          return true;
        }
        return false;
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err?.response?.data?.error || err.message || 'Verification failed');
        }
        return false;
      }
    };

    (async () => {
      const done = await verifyOnce();
      if (done || cancelled) return;

      let count = 0;
      pollTimerRef.current = setInterval(async () => {
        count += 1;
        if (cancelled) return;
        setAttempts(count);

        const finished = await verifyOnce();
        if (finished || count >= MAX_ATTEMPTS) {
          clearInterval(pollTimerRef.current);
          if (!finished && !cancelled) {
            setStatus('pending');
            setErrorMsg(
              "We couldn't confirm your payment automatically. If you were charged, it will be applied within a few minutes."
            );
          }
        }
      }, 2500);
    })();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [authInitialized, isAuthenticated, txRef, location.pathname, location.search, navigate]);

  // ★ Choose destination based on kind
  const destination = resultKind === 'boost' ? '/landing' : '/settings#subscription';

  const successTitle =
    resultKind === 'boost'
      ? 'Boost confirmed'
      : resultKind === 'subscription'
      ? 'Subscription active'
      : 'Payment confirmed';

  const successDesc =
    resultKind === 'boost'
      ? 'Your listing is now in the Spotlight.'
      : resultKind === 'subscription'
      ? 'Your new plan is now active. All new listings are unlocked.'
      : 'Your payment has been processed.';

  return (
    <div className="callback-page">
      <div className="callback-card">
        {status === 'verifying' && (
          <>
            <div className="callback-spinner" />
            <h1 className="callback-title">Confirming your payment…</h1>
            <p className="callback-desc">
              Please wait. This usually takes a few seconds.
            </p>
            {attempts > 0 && (
              <p className="callback-attempts">Attempt {attempts} of {MAX_ATTEMPTS}</p>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="callback-icon success">
              <Icon name="check" size={32} color="#065F46" strokeWidth={2.6} />
            </div>
            <h1 className="callback-title">{successTitle}</h1>
            <p className="callback-desc">{successDesc}</p>
            <div className="callback-actions">
              <button className="callback-btn primary" onClick={() => navigate(destination)}>
                <Icon name="home" size={16} color="#FFFFFF" strokeWidth={2} />
                {resultKind === 'boost' ? 'Back to marketplace' : 'View my plan'}
              </button>
            </div>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="callback-icon amber">
              <Icon name="alertCircle" size={28} color="#92400E" strokeWidth={2} />
            </div>
            <h1 className="callback-title">Still processing</h1>
            <p className="callback-desc">{errorMsg}</p>
            <div className="callback-actions">
              <button
                className="callback-btn primary"
                onClick={() => {
                  setAttempts(0);
                  setStatus('verifying');
                }}
              >
                <Icon name="refresh" size={16} color="#FFFFFF" strokeWidth={2} />
                Check again
              </button>
              <button className="callback-btn secondary" onClick={() => navigate('/landing')}>
                Back to marketplace
              </button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="callback-icon red">
              <Icon name="alertCircle" size={28} color="#7F1D1D" strokeWidth={2} />
            </div>
            <h1 className="callback-title">Payment not completed</h1>
            <p className="callback-desc">{errorMsg || 'Something went wrong.'}</p>
            <div className="callback-actions">
              <button className="callback-btn primary" onClick={() => navigate(-1)}>
                Try again
              </button>
              <button className="callback-btn secondary" onClick={() => navigate('/landing')}>
                Back to marketplace
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .callback-page {
          min-height: 100vh;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .callback-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 32px 24px;
          text-align: center;
          box-shadow: 0 4px 24px rgba(15, 23, 42, 0.05);
        }
        .callback-spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #e2e8f0;
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .callback-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }
        .callback-icon.success { background: #d1fae5; }
        .callback-icon.amber { background: #fef3c7; }
        .callback-icon.red { background: #fee2e2; }
        .callback-title {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 8px;
          font-family: Georgia, serif;
        }
        .callback-desc {
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
          margin: 0 0 20px;
        }
        .callback-attempts {
          font-size: 12px;
          color: #94a3b8;
          margin: -12px 0 0;
        }
        .callback-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .callback-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 46px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .callback-btn.primary {
          background: #1e293b;
          color: #ffffff;
        }
        .callback-btn.primary:hover { background: #f59e0b; }
        .callback-btn.secondary {
          background: transparent;
          color: #94a3b8;
        }
        .callback-btn.secondary:hover { color: #1e293b; }
      `}</style>
    </div>
  );
};

export default PaymentCallback;