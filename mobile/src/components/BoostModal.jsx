// mobile/src/components/BoostModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ToastContainer';

const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    crown: 'M3 8l4 4 5-7 5 7 4-4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8z',
    sparkles:
      'M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z',
    zap: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
    check: 'M20 6L9 17l-5-5',
    close: 'M18 6L6 18M6 6l12 12',
    alertCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
  };
  const d = icons[name] || icons.crown;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

const FALLBACK_PLANS = [
  { days: 7,  label: '7 days',  price: 'MK 2,000', amount: 2000, popular: true },
  { days: 14, label: '14 days', price: 'MK 3,500', amount: 3500 },
  { days: 30, label: '30 days', price: 'MK 6,000', amount: 6000, best: true },
];

const BoostModal = ({ listing, onClose, onActivated }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast, success } = useToast();

  const [stage, setStage] = useState('pick');
  const [days, setDays] = useState(7);
  const [message, setMessage] = useState('');
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await paymentAPI.getBoostPricing();
        const raw = res?.data?.plans || [];
        if (cancelled) return;
        if (Array.isArray(raw) && raw.length > 0) {
          const normalized = raw.map((p) => ({
            days: p.days,
            label: p.label || `${p.days} days`,
            price: `MK ${Number(p.amount).toLocaleString()}`,
            amount: p.amount,
            popular: p.days === 7,
            best: p.days === 30,
          }));
          setPlans(normalized);
        }
      } catch {
        // keep fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedPlan = plans.find((p) => p.days === days) || plans[0];

  const startPayment = async () => {
    if (!isAuthenticated || !user?.id) {
      showToast('Please sign in to boost your listing', 'warning');
      return;
    }

    setStage('processing');
    setMessage('');

    try {
      const res = await paymentAPI.initiatePayment({
        kind: 'boost',
        listingId: listing?.id,
        durationDays: days,
      });

      const data = res?.data || {};

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.free) {
        success('Your listing is now in the Spotlight ✨');
        setStage('success');
        onActivated?.(null);
        return;
      }

      throw new Error(data.error || 'No checkout URL returned');
    } catch (err) {
      console.error('[BoostModal] initiate error:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;

      if (status === 403) {
        setMessage(serverMsg || 'You do not own this listing.');
      } else if (status === 401) {
        setMessage('Please sign in again to continue.');
      } else if (status === 502) {
        setMessage('Payment gateway is not available right now. Please try again shortly.');
      } else {
        setMessage(serverMsg || err.message || 'Could not start the payment. Please try again.');
      }
      setStage('failed');
    }
  };

  return (
    <div className="boost-overlay" onClick={onClose}>
      <div className="boost-modal" onClick={(e) => e.stopPropagation()}>
        <div className="boost-head">
          <div className="boost-head-icon">
            <Icon name="crown" size={22} color="#F0D9A8" strokeWidth={2} />
          </div>
          <div className="boost-head-text">
            <h3 className="boost-title">Boost to Spotlight</h3>
            <p className="boost-sub">
              {stage === 'success'
                ? 'Your listing is featured'
                : 'Get more eyes on your listing'}
            </p>
          </div>
          <button className="boost-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} color="#201F1B" strokeWidth={2.2} />
          </button>
        </div>

        <div className="boost-body">
          {stage === 'pick' && (
            <>
              <p className="boost-preview-title">{listing?.title}</p>

              <div className="boost-benefits">
                <div className="boost-benefit">
                  <span className="boost-benefit-icon">
                    <Icon name="sparkles" size={14} color="#BC5B34" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="boost-benefit-title">Top of the homepage</div>
                    <div className="boost-benefit-desc">Appear in the Spotlight strip</div>
                  </div>
                </div>
                <div className="boost-benefit">
                  <span className="boost-benefit-icon">
                    <Icon name="crown" size={14} color="#BC5B34" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="boost-benefit-title">Premium crown badge</div>
                    <div className="boost-benefit-desc">Stand out with a gold highlight</div>
                  </div>
                </div>
                <div className="boost-benefit">
                  <span className="boost-benefit-icon">
                    <Icon name="zap" size={14} color="#BC5B34" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="boost-benefit-title">More views & messages</div>
                    <div className="boost-benefit-desc">Premium listings get more attention</div>
                  </div>
                </div>
              </div>

              <div className="boost-section-label">Choose duration</div>
              <div className="boost-options">
                {plans.map((opt) => {
                  const active = days === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      className={`boost-option ${active ? 'active' : ''}`}
                      onClick={() => setDays(opt.days)}
                    >
                      {opt.popular && <span className="boost-option-tag popular">Popular</span>}
                      {opt.best && <span className="boost-option-tag best">Best value</span>}
                      <span className="boost-option-days">{opt.label}</span>
                      <span className="boost-option-price">{opt.price}</span>
                      <span className="boost-option-check">
                        {active && <Icon name="check" size={12} color="#F7F1E3" strokeWidth={2.6} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {stage === 'processing' && (
            <div className="boost-status">
              <span className="boost-status-spinner" />
              <p className="boost-status-text">Starting your secure payment…</p>
              <p className="boost-status-sub">
                You'll be redirected to PayChangu to complete the payment.
              </p>
            </div>
          )}

          {stage === 'success' && (
            <div className="boost-status">
              <div className="boost-status-badge green">
                <Icon name="check" size={22} color="#065F46" strokeWidth={2.6} />
              </div>
              <p className="boost-status-text">You're in the Spotlight ✨</p>
              <p className="boost-status-sub">
                Your listing is now featured on the homepage.
              </p>
            </div>
          )}

          {stage === 'failed' && (
            <div className="boost-status">
              <div className="boost-status-badge red">
                <Icon name="alertCircle" size={20} color="#7F1D1D" strokeWidth={2} />
              </div>
              <p className="boost-status-text">Something went wrong</p>
              <p className="boost-status-sub">{message}</p>
            </div>
          )}
        </div>

        <div className="boost-foot">
          {stage === 'pick' && (
            <>
              <button className="boost-cancel" onClick={onClose}>Cancel</button>
              <button className="boost-confirm" onClick={startPayment}>
                <Icon name="crown" size={14} color="#F7F1E3" strokeWidth={2.2} />
                Boost now · {selectedPlan.price}
              </button>
            </>
          )}

          {stage === 'processing' && (
            <button className="boost-cancel wide" disabled>Please wait…</button>
          )}

          {stage === 'success' && (
            <button
              className="boost-confirm wide"
              onClick={() => { onClose(); navigate('/landing'); }}
            >
              <Icon name="externalLink" size={14} color="#F7F1E3" strokeWidth={2.2} />
              See it on the homepage
            </button>
          )}

          {stage === 'failed' && (
            <>
              <button className="boost-cancel" onClick={onClose}>Close</button>
              <button className="boost-confirm" onClick={() => setStage('pick')}>
                <Icon name="refresh" size={14} color="#F7F1E3" strokeWidth={2.2} />
                Try again
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .boost-overlay {
          position: fixed; inset: 0;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 500;
        }
        .boost-modal {
          width: 100%; max-width: 440px; max-height: 92vh;
          overflow-y: auto; background: #FFFDF8;
          border-radius: 18px;
          display: flex; flex-direction: column;
        }
        .boost-head {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 16px 12px;
          border-bottom: 1px solid #EFE6CE;
        }
        .boost-head-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: #24453B;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .boost-head-text { flex: 1; min-width: 0; }
        .boost-title {
          font-family: Georgia, serif;
          font-size: 17px; font-weight: 600;
          color: #201F1B; margin: 0;
        }
        .boost-sub { font-size: 12px; color: #9C9482; margin: 2px 0 0; }
        .boost-close {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid #EFE6CE; background: #FFFDF8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }
        .boost-body { padding: 14px 16px 8px; }
        .boost-preview-title {
          font-size: 13px; color: #6B6259; font-style: italic;
          margin: 0 0 12px; padding: 8px 10px;
          background: #F7F1E3; border-radius: 8px;
          border-left: 3px solid #D99A3B;
        }
        .boost-benefits {
          display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px;
        }
        .boost-benefit { display: flex; align-items: flex-start; gap: 10px; }
        .boost-benefit-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: #F7F1E3;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .boost-benefit-title { font-size: 13px; font-weight: 600; color: #201F1B; }
        .boost-benefit-desc { font-size: 11.5px; color: #9C9482; margin-top: 1px; }
        .boost-section-label {
          font-size: 11px; font-weight: 700; color: #6B6259;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .boost-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .boost-option {
          position: relative; display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; background: #FFFDF8;
          border: 1.5px solid #EFE6CE; border-radius: 12px;
          cursor: pointer; font-family: inherit; text-align: left;
        }
        .boost-option.active {
          border-color: #24453B; background: #FDF9EF;
          box-shadow: 0 0 0 3px rgba(36, 69, 59, 0.08);
        }
        .boost-option-days {
          font-size: 14px; font-weight: 700; color: #201F1B; flex: 1;
        }
        .boost-option-price {
          font-family: Georgia, serif; font-size: 15px; font-weight: 600;
          color: #24453B;
        }
        .boost-option-tag {
          position: absolute; top: -8px; left: 12px;
          padding: 2px 7px; border-radius: 5px;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .boost-option-tag.popular { background: #BC5B34; color: #FFFDF8; }
        .boost-option-tag.best { background: #D99A3B; color: #201F1B; }
        .boost-option-check {
          width: 20px; height: 20px; border-radius: 50%;
          background: #24453B;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
        }
        .boost-option.active .boost-option-check { opacity: 1; }

        .boost-status {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          text-align: center; padding: 20px 8px 12px;
        }
        .boost-status-badge {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .boost-status-badge.green { background: #D1FAE5; }
        .boost-status-badge.red { background: #FEE2E2; }
        .boost-status-spinner {
          width: 32px; height: 32px;
          border: 3px solid #EFE6CE;
          border-top-color: #24453B;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .boost-status-text {
          font-family: Georgia, serif;
          font-size: 15px; font-weight: 600;
          color: #201F1B; margin: 0;
        }
        .boost-status-sub {
          font-size: 12.5px; color: #6B6259;
          margin: 0; max-width: 320px; line-height: 1.5;
        }
        .boost-foot {
          display: flex; gap: 10px;
          padding: 12px 16px 16px;
          border-top: 1px solid #EFE6CE;
        }
        .boost-cancel {
          flex: 1; padding: 12px; background: #F7F1E3;
          border: 1px solid #EFE6CE; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 600;
          color: #6B6259; cursor: pointer;
        }
        .boost-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
        .boost-cancel.wide { flex: 1; }
        .boost-confirm {
          flex: 1.6;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px; padding: 12px;
          background: #24453B; color: #F7F1E3;
          border: none; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 700;
          cursor: pointer;
        }
        .boost-confirm:disabled { opacity: 0.7; cursor: not-allowed; }
        .boost-confirm.wide { flex: 1; }
      `}</style>
    </div>
  );
};

export default BoostModal;