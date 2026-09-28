// mobile/src/components/SubscriptionSection.jsx
//
// Self-contained subscription management UI.
// Drops into Settings.jsx and renders:
//   - Current plan card (plan name, listings used, expiry)
//   - "Upgrade" or "Change plan" button
//   - Expanded plan comparison grid
//   - Confirmation modal → redirects to PayChangu checkout
//
// After PayChangu, PaymentCallback.jsx handles verification
// and lands the user back on /settings#subscription.

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import { useToast } from './ToastContainer';

// ============================================================
// ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => {
  const icons = {
    crown: 'M3 8l4 4 5-7 5 7 4-4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8z',
    sparkles:
      'M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z',
    check: 'M20 6L9 17l-5-5',
    close: 'M18 6L6 18M6 6l12 12',
    alertCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01',
    refresh:
      'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    trending: 'M23 6l-9.5 9.5-5-5L1 18',
    box: 'M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0zM2.32 6.16L12 11l9.68-4.84M12 22.76V11',
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

// ============================================================
// FALLBACK PLANS — mirrors backend PLANS config
// Real list is fetched from GET /api/payment/plans on mount.
// ============================================================
const FALLBACK_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'MWK',
    listings: 3,
    features: ['Basic listing', 'Standard support'],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 2000,
    currency: 'MWK',
    listings: 10,
    features: ['Premium listing', 'Priority support', 'Featured placement'],
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 5000,
    currency: 'MWK',
    listings: 25,
    features: [
      'Premium listing',
      'Priority support',
      'Featured placement',
      'AI recommendations',
      'Analytics dashboard',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 10000,
    currency: 'MWK',
    listings: 50,
    features: [
      'All features',
      'Multi-user access',
      'API access',
      'White-label option',
    ],
  },
};

const PLAN_ORDER = ['free', 'basic', 'pro', 'business'];

// ============================================================
// MAIN COMPONENT
// ============================================================
const SubscriptionSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [startingPayment, setStartingPayment] = useState(false);

  // ============================================================
  // Fetch subscription + plans on mount
  // ============================================================
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      // Fetch both in parallel
      const [subRes, plansRes] = await Promise.all([
        paymentAPI.getSubscription(user.id).catch((err) => {
          console.warn('Subscription fetch failed:', err?.message);
          return null;
        }),
        paymentAPI.getPlans().catch((err) => {
          console.warn('Plans fetch failed:', err?.message);
          return null;
        }),
      ]);

      if (cancelled) return;

      if (subRes?.data?.success && subRes.data.subscription) {
        setSubscription(subRes.data.subscription);
      } else {
        // Fallback: assume free tier
        setSubscription({
          plan: 'free',
          listings_allowed: 3,
          listings_used: 0,
          remaining_listings: 3,
          status: 'active',
          expires_at: null,
        });
      }

      if (plansRes?.data?.success && plansRes.data.plans) {
        setPlans(plansRes.data.plans);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ============================================================
  // Start upgrade
  // ============================================================
  const handleUpgrade = useCallback(async () => {
    if (!selectedPlan || !user?.id) return;

    setStartingPayment(true);

    try {
      const res = await paymentAPI.initiatePayment({
        kind: 'subscription',
        plan: selectedPlan,
      });

      const data = res?.data || {};

      if (data.checkoutUrl) {
        // Redirect the SAME tab so PayChangu can callback to
        // /payment/callback and we can verify the payment.
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.free) {
        success('Your plan is already free.');
        setConfirming(false);
        setStartingPayment(false);
        return;
      }

      throw new Error(data.error || 'No checkout URL returned');
    } catch (err) {
      console.error('[SubscriptionSection] initiate error:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;

      if (status === 502) {
        showToast(
          'Payment gateway is not available right now. Please try again shortly.',
          'error'
        );
      } else if (status === 401) {
        showToast('Please sign in again to continue.', 'error');
      } else {
        showToast(serverMsg || 'Could not start the upgrade. Please try again.', 'error');
      }
      setStartingPayment(false);
    }
  }, [selectedPlan, user?.id, success, showToast]);

  // ============================================================
  // RENDER — loading
  // ============================================================
  if (loading) {
    return (
      <section className="sub-section">
        <h2 className="section-title">Subscription</h2>
        <div className="sub-loading">
          <div className="sub-loading-spinner" />
          <span>Loading your plan…</span>
        </div>
        <style jsx>{`
          .sub-section { margin-bottom: 24px; }
          .section-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #9C9482;
            margin: 0 0 10px 6px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .sub-loading {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 18px 16px;
            background: #FFFDF8;
            border-radius: 16px;
            border: 1px solid rgba(239, 230, 206, 0.9);
            font-size: 13px;
            color: #9C9482;
          }
          .sub-loading-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid #EFE6CE;
            border-top-color: #24453B;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </section>
    );
  }

  // ============================================================
  // Derive display data
  // ============================================================
  const currentPlanId = subscription?.plan || 'free';
  const currentPlan = plans[currentPlanId] || FALLBACK_PLANS.free;

  const listingsAllowed = subscription?.listings_allowed ?? currentPlan.listings;
  const listingsUsed = subscription?.listings_used ?? 0;
  const remaining = Math.max(0, listingsAllowed - listingsUsed);
  const isPaid = currentPlanId !== 'free';

  const expiresAt = subscription?.expires_at
    ? new Date(subscription.expires_at)
    : null;
  const expiresSoon =
    expiresAt && expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <section className="sub-section">
      <h2 className="section-title">Subscription</h2>

      <div className="sub-card">
        {/* Current plan header */}
        <div className="sub-head">
          <div className="sub-head-icon">
            <Icon
              name={isPaid ? 'crown' : 'box'}
              size={22}
              color={isPaid ? '#F0D9A8' : '#9C9482'}
              strokeWidth={2}
            />
          </div>
          <div className="sub-head-text">
            <div className="sub-head-name">
              {currentPlan.name} plan
              {isPaid && <span className="sub-paid-badge">Active</span>}
            </div>
            <div className="sub-head-desc">
              {listingsUsed} of {listingsAllowed} listings used
              {expiresAt && ` · renews ${expiresAt.toLocaleDateString()}`}
            </div>
          </div>
          <button
            className="sub-toggle-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide' : isPaid ? 'Change' : 'Upgrade'}
          </button>
        </div>

        {/* Usage bar */}
        {listingsAllowed > 0 && (
          <div className="sub-usage">
            <div className="sub-usage-bar">
              <div
                className={`sub-usage-fill ${remaining === 0 ? 'full' : ''}`}
                style={{
                  width: `${Math.min(100, (listingsUsed / listingsAllowed) * 100)}%`,
                }}
              />
            </div>
            <div className="sub-usage-text">
              {remaining === 0
                ? 'No listings remaining — upgrade to add more'
                : `${remaining} listing${remaining === 1 ? '' : 's'} remaining`}
            </div>
          </div>
        )}

        {/* Expiry warning */}
        {expiresSoon && isPaid && (
          <div className="sub-warn">
            <Icon name="alertCircle" size={14} color="#92400E" strokeWidth={2} />
            <span>
              Your {currentPlan.name} plan expires{' '}
              {expiresAt.toLocaleDateString()}. Renew to keep your benefits.
            </span>
          </div>
        )}

        {/* Expanded plan grid */}
        {expanded && (
          <div className="sub-grid">
            {PLAN_ORDER.map((planId) => {
              const plan = plans[planId];
              if (!plan) return null;

              const isCurrent = planId === currentPlanId;
              const isSelected = planId === selectedPlan;

              return (
                <button
                  key={planId}
                  className={`sub-plan ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                  onClick={() => {
                    if (isCurrent) return;
                    setSelectedPlan(isSelected ? null : planId);
                  }}
                  disabled={isCurrent}
                >
                  {isCurrent && <span className="sub-plan-tag">Current</span>}

                  <div className="sub-plan-head">
                    <div className="sub-plan-name">{plan.name}</div>
                    {isSelected && (
                      <span className="sub-plan-check">
                        <Icon name="check" size={11} color="#FFFFFF" strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="sub-plan-price">
                    {plan.price === 0 ? (
                      'Free'
                    ) : (
                      <>
                        MK {Number(plan.price).toLocaleString()}
                        <span className="sub-plan-period">/mo</span>
                      </>
                    )}
                  </div>

                  <div className="sub-plan-listings">
                    {plan.listings} listing{plan.listings === 1 ? '' : 's'}
                  </div>

                  <ul className="sub-plan-features">
                    {(plan.features || []).slice(0, 3).map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        )}

        {/* Confirm CTA */}
        {expanded && selectedPlan && (
          <div className="sub-cta-row">
            <button
              className="sub-cta-cancel"
              onClick={() => setSelectedPlan(null)}
              disabled={startingPayment}
            >
              Cancel
            </button>
            <button
              className="sub-cta-confirm"
              onClick={() => setConfirming(true)}
              disabled={startingPayment}
            >
              Continue · MK{' '}
              {Number(plans[selectedPlan]?.price || 0).toLocaleString()}
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirming && selectedPlan && (
        <div className="sub-modal-overlay" onClick={() => !startingPayment && setConfirming(false)}>
          <div className="sub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sub-modal-icon">
              <Icon name="crown" size={24} color="#F0D9A8" strokeWidth={2} />
            </div>
            <h3 className="sub-modal-title">
              Confirm upgrade to {plans[selectedPlan]?.name}
            </h3>
            <p className="sub-modal-desc">
              You'll be redirected to PayChangu to complete the payment of{' '}
              <strong>
                MK {Number(plans[selectedPlan]?.price || 0).toLocaleString()}
              </strong>{' '}
              for one month.
            </p>

            <div className="sub-modal-list">
              <div className="sub-modal-item">
                <Icon name="check" size={13} color="#10B981" strokeWidth={2.5} />
                <span>{plans[selectedPlan]?.listings} listings per month</span>
              </div>
              <div className="sub-modal-item">
                <Icon name="check" size={13} color="#10B981" strokeWidth={2.5} />
                <span>Renews every 30 days</span>
              </div>
              <div className="sub-modal-item">
                <Icon name="check" size={13} color="#10B981" strokeWidth={2.5} />
                <span>Cancel anytime from this page</span>
              </div>
            </div>

            <div className="sub-modal-actions">
              <button
                className="sub-modal-cancel"
                onClick={() => setConfirming(false)}
                disabled={startingPayment}
              >
                Not now
              </button>
              <button
                className="sub-modal-confirm"
                onClick={handleUpgrade}
                disabled={startingPayment}
              >
                {startingPayment ? (
                  <>
                    <span className="sub-spinner" />
                    Starting…
                  </>
                ) : (
                  'Pay & upgrade'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .sub-section { margin-bottom: 24px; }

        .section-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #9C9482;
          margin: 0 0 10px 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .sub-card {
          background: #FFFDF8;
          border-radius: 16px;
          border: 1px solid rgba(239, 230, 206, 0.9);
          padding: 16px;
          box-shadow: 0 1px 3px rgba(22, 38, 31, 0.04);
        }

        /* ---- HEADER ---- */
        .sub-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .sub-head-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(36, 69, 59, 0.22);
        }

        .sub-head-text {
          flex: 1;
          min-width: 0;
        }

        .sub-head-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          color: #201F1B;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sub-paid-badge {
          padding: 2px 8px;
          border-radius: 6px;
          background: linear-gradient(135deg, #D99A3B 0%, #B8802A 100%);
          color: #FFFDF8;
          font-family: 'Work Sans', sans-serif;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sub-head-desc {
          font-size: 12px;
          color: #9C9482;
          margin-top: 2px;
        }

        .sub-toggle-btn {
          padding: 8px 14px;
          border-radius: 10px;
          border: 1.5px solid rgba(239, 230, 206, 0.9);
          background: #F7F1E3;
          color: #201F1B;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .sub-toggle-btn:hover {
          background: #EFE6CE;
          border-color: rgba(217, 154, 59, 0.5);
        }

        /* ---- USAGE BAR ---- */
        .sub-usage { margin-bottom: 12px; }

        .sub-usage-bar {
          height: 6px;
          background: #EFE6CE;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .sub-usage-fill {
          height: 100%;
          background: linear-gradient(90deg, #24453B 0%, #3E6C76 100%);
          border-radius: 3px;
          transition: width 0.35s ease;
        }

        .sub-usage-fill.full {
          background: linear-gradient(90deg, #BC5B34 0%, #8B3A1E 100%);
        }

        .sub-usage-text {
          font-size: 11.5px;
          color: #6B6259;
          font-weight: 500;
        }

        /* ---- EXPIRY WARN ---- */
        .sub-warn {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          border-radius: 10px;
          font-size: 12px;
          color: #92400E;
          line-height: 1.45;
          margin-bottom: 12px;
        }

        /* ---- PLAN GRID ---- */
        .sub-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 8px;
        }

        @media (min-width: 640px) {
          .sub-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .sub-plan {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px 12px 14px;
          border: 1.5px solid rgba(239, 230, 206, 0.9);
          border-radius: 12px;
          background: #F7F1E3;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all 0.18s;
        }

        .sub-plan:hover:not(:disabled) {
          border-color: rgba(217, 154, 59, 0.55);
          background: #FFFDF8;
          transform: translateY(-1px);
        }

        .sub-plan.selected {
          border-color: #24453B;
          background: #FFFDF8;
          box-shadow: 0 0 0 3px rgba(36, 69, 59, 0.08);
        }

        .sub-plan.current {
          opacity: 0.65;
          cursor: not-allowed;
          background: #EFE6CE;
        }

        .sub-plan-tag {
          position: absolute;
          top: -8px;
          right: 10px;
          padding: 2px 7px;
          border-radius: 5px;
          background: #24453B;
          color: #F7F1E3;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .sub-plan-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sub-plan-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 13px;
          font-weight: 600;
          color: #201F1B;
        }

        .sub-plan-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #24453B;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sub-plan-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15px;
          font-weight: 700;
          color: #24453B;
          letter-spacing: -0.01em;
        }

        .sub-plan-period {
          font-size: 10px;
          font-weight: 500;
          color: #9C9482;
          margin-left: 2px;
        }

        .sub-plan-listings {
          font-size: 10.5px;
          color: #6B6259;
          font-weight: 600;
        }

        .sub-plan-features {
          list-style: none;
          padding: 0;
          margin: 4px 0 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sub-plan-features li {
          font-size: 10px;
          color: #9C9482;
          line-height: 1.35;
          padding-left: 10px;
          position: relative;
        }

        .sub-plan-features li::before {
          content: '·';
          position: absolute;
          left: 2px;
          color: #D99A3B;
          font-weight: 900;
        }

        /* ---- CTA ROW ---- */
        .sub-cta-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(239, 230, 206, 0.7);
        }

        .sub-cta-cancel,
        .sub-cta-confirm {
          padding: 12px 16px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .sub-cta-cancel {
          background: #F7F1E3;
          color: #6B6259;
          flex: 1;
        }

        .sub-cta-cancel:hover:not(:disabled) { background: #EFE6CE; }

        .sub-cta-confirm {
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          color: #F7F1E3;
          flex: 1.5;
          box-shadow: 0 6px 14px rgba(36, 69, 59, 0.22);
        }

        .sub-cta-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(36, 69, 59, 0.32);
        }

        .sub-cta-cancel:disabled,
        .sub-cta-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ---- MODAL ---- */
        .sub-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }

        .sub-modal {
          background: #FFFDF8;
          border-radius: 20px;
          max-width: 400px;
          width: 100%;
          padding: 24px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(22, 38, 31, 0.3);
          border: 1px solid rgba(239, 230, 206, 0.9);
        }

        .sub-modal-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow: 0 8px 22px rgba(36, 69, 59, 0.28);
        }

        .sub-modal-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 18px;
          font-weight: 600;
          color: #201F1B;
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .sub-modal-desc {
          font-size: 13px;
          color: #6B6259;
          line-height: 1.55;
          margin: 0 0 18px;
        }

        .sub-modal-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          padding: 12px 14px;
          background: #F7F1E3;
          border-radius: 11px;
          margin-bottom: 20px;
        }

        .sub-modal-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #3A362E;
        }

        .sub-modal-actions {
          display: flex;
          gap: 10px;
        }

        .sub-modal-cancel,
        .sub-modal-confirm {
          padding: 12px 16px;
          border-radius: 11px;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          border: none;
        }

        .sub-modal-cancel {
          background: #F7F1E3;
          color: #6B6259;
          flex: 1;
        }

        .sub-modal-cancel:hover:not(:disabled) { background: #EFE6CE; }

        .sub-modal-confirm {
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          color: #F7F1E3;
          flex: 1.4;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .sub-modal-confirm:hover:not(:disabled) { transform: translateY(-1px); }

        .sub-modal-cancel:disabled,
        .sub-modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

        .sub-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(247, 241, 227, 0.35);
          border-top-color: #F7F1E3;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (prefers-reduced-motion: reduce) {
          .sub-plan, .sub-cta-confirm, .sub-cta-cancel,
          .sub-toggle-btn, .sub-modal-confirm, .sub-modal-cancel { transition: none; }
          .sub-plan:hover:not(:disabled),
          .sub-cta-confirm:hover:not(:disabled),
          .sub-modal-confirm:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </section>
  );
};

export default SubscriptionSection;