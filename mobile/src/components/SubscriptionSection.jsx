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

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

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
            color: var(--color-text-muted);
            margin: 0 0 10px 6px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .sub-loading {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 18px 16px;
            background: var(--color-surface);
            border-radius: var(--radius-2xl);
            border: 1px solid var(--color-border);
            font-size: 13px;
            color: var(--color-text-muted);
          }
          .sub-loading-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid var(--color-border);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </section>
    );
  }

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
              color={isPaid ? 'var(--color-accent)' : 'var(--color-text-inverse)'}
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
            <Icon name="alertCircle" size={14} color="var(--color-accent-hover)" strokeWidth={2} />
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
                        <Icon name="check" size={11} color="var(--color-text-inverse)" strokeWidth={3} />
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
              <Icon name="crown" size={24} color="var(--color-accent)" strokeWidth={2} />
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
                <Icon name="check" size={13} color="var(--color-success)" strokeWidth={2.5} />
                <span>{plans[selectedPlan]?.listings} listings per month</span>
              </div>
              <div className="sub-modal-item">
                <Icon name="check" size={13} color="var(--color-success)" strokeWidth={2.5} />
                <span>Renews every 30 days</span>
              </div>
              <div className="sub-modal-item">
                <Icon name="check" size={13} color="var(--color-success)" strokeWidth={2.5} />
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
          color: var(--color-text-muted);
          margin: 0 0 10px 6px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .sub-card {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          border: 1px solid var(--color-border);
          padding: 16px;
          box-shadow: var(--shadow-xs);
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
          border-radius: var(--radius-xl);
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-primary);
        }

        .sub-head-text {
          flex: 1;
          min-width: 0;
        }

        .sub-head-name {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sub-paid-badge {
          padding: 2px 8px;
          border-radius: 6px;
          background: var(--color-accent);
          color: var(--color-text-inverse);
          font-family: var(--font-sans);
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .sub-head-desc {
          font-size: 12px;
          color: var(--color-text-muted);
          margin-top: 2px;
        }

        .sub-toggle-btn {
          padding: 8px 14px;
          border-radius: var(--radius-lg);
          border: 1.5px solid var(--color-border);
          background: var(--color-surface-alt);
          color: var(--color-text);
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .sub-toggle-btn:hover {
          background: var(--color-accent-tint);
          border-color: var(--color-accent);
        }

        /* ---- USAGE BAR ---- */
        .sub-usage { margin-bottom: 12px; }

        .sub-usage-bar {
          height: 6px;
          background: var(--color-border);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .sub-usage-fill {
          height: 100%;
          background: var(--color-primary);
          border-radius: 3px;
          transition: width 0.35s ease;
        }

        .sub-usage-fill.full {
          background: var(--color-accent);
        }

        .sub-usage-text {
          font-size: 11.5px;
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        /* ---- EXPIRY WARN ---- */
        .sub-warn {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: var(--color-accent-soft);
          border: 1px solid var(--color-accent);
          border-radius: var(--radius-lg);
          font-size: 12px;
          color: var(--color-accent-hover);
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
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface-alt);
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all var(--transition-fast);
        }

        .sub-plan:hover:not(:disabled) {
          border-color: var(--color-accent);
          background: var(--color-surface);
          transform: translateY(-1px);
        }

        .sub-plan.selected {
          border-color: var(--color-primary);
          background: var(--color-surface);
          box-shadow: 0 0 0 3px var(--color-primary-tint);
        }

        .sub-plan.current {
          opacity: 0.65;
          cursor: not-allowed;
          background: var(--color-border);
        }

        .sub-plan-tag {
          position: absolute;
          top: -8px;
          right: 10px;
          padding: 2px 7px;
          border-radius: 5px;
          background: var(--color-primary);
          color: var(--color-text-inverse);
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
          font-family: var(--font-serif);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
        }

        .sub-plan-check {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sub-plan-price {
          font-family: var(--font-serif);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: -0.01em;
        }

        .sub-plan-period {
          font-size: 10px;
          font-weight: 500;
          color: var(--color-text-muted);
          margin-left: 2px;
        }

        .sub-plan-listings {
          font-size: 10.5px;
          color: var(--color-text-secondary);
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
          color: var(--color-text-muted);
          line-height: 1.35;
          padding-left: 10px;
          position: relative;
        }

        .sub-plan-features li::before {
          content: '·';
          position: absolute;
          left: 2px;
          color: var(--color-accent);
          font-weight: 900;
        }

        /* ---- CTA ROW ---- */
        .sub-cta-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid var(--color-border);
        }

        .sub-cta-cancel,
        .sub-cta-confirm {
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all var(--transition-fast);
        }

        .sub-cta-cancel {
          background: var(--color-surface-alt);
          color: var(--color-text-secondary);
          flex: 1;
        }

        .sub-cta-cancel:hover:not(:disabled) { background: var(--color-border); }

        .sub-cta-confirm {
          background: var(--color-accent);
          color: var(--color-text-inverse);
          flex: 1.5;
          box-shadow: var(--shadow-accent);
        }

        .sub-cta-confirm:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(255, 92, 35, 0.32);
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
          background: rgba(10, 36, 114, 0.55);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
        }

        .sub-modal {
          background: var(--color-surface);
          border-radius: var(--radius-3xl);
          max-width: 400px;
          width: 100%;
          padding: 24px;
          text-align: center;
          box-shadow: var(--shadow-2xl);
          border: 1px solid var(--color-border);
        }

        .sub-modal-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          box-shadow: var(--shadow-primary);
        }

        .sub-modal-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 8px;
          letter-spacing: -0.01em;
        }

        .sub-modal-desc {
          font-size: 13px;
          color: var(--color-text-secondary);
          line-height: 1.55;
          margin: 0 0 18px;
        }

        .sub-modal-desc strong { color: var(--color-text); }

        .sub-modal-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
          padding: 12px 14px;
          background: var(--color-surface-alt);
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
        }

        .sub-modal-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--color-text);
        }

        .sub-modal-actions {
          display: flex;
          gap: 10px;
        }

        .sub-modal-cancel,
        .sub-modal-confirm {
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          border: none;
        }

        .sub-modal-cancel {
          background: var(--color-surface-alt);
          color: var(--color-text-secondary);
          flex: 1;
        }

        .sub-modal-cancel:hover:not(:disabled) { background: var(--color-border); }

        .sub-modal-confirm {
          background: var(--color-accent);
          color: var(--color-text-inverse);
          flex: 1.4;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: var(--shadow-accent);
        }

        .sub-modal-confirm:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-1px);
        }

        .sub-modal-cancel:disabled,
        .sub-modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

        .sub-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: var(--color-text-inverse);
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