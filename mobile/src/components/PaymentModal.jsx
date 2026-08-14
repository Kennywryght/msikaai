// mobile/src/components/PaymentModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentAPI } from '../services/api';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from './ToastContainer';

const PaymentModal = ({ plans, currentPlan, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast, success, error } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('airtel_money');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If no plans, don't render
  if (!plans) return null;

  const handlePayment = async () => {
    if (!selectedPlan || selectedPlan === currentPlan) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const planData = plans[selectedPlan];
      
      // Initiate payment
      const response = await paymentAPI.initiatePayment({
        userId: user.id,
        plan: selectedPlan,
        amount: planData.price,
        currency: planData.currency || 'MWK',
        method: paymentMethod
      });

      if (response.data.success) {
        // Simulate payment verification
        const verifyResponse = await paymentAPI.verifyPayment(response.data.paymentId);
        
        if (verifyResponse.data.success) {
          success(`🎉 Successfully upgraded to ${planData.name} plan!`);
          
          await onSuccess({
            plan: selectedPlan,
            paymentId: response.data.paymentId
          });
          onClose();
        } else {
          const errorMsgText = 'Payment verification failed. Please try again.';
          setErrorMsg(errorMsgText);
          showToast(errorMsgText, 'error');
        }
      } else {
        const errorMsgText = 'Payment initiation failed. Please try again.';
        setErrorMsg(errorMsgText);
        showToast(errorMsgText, 'error');
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMsgText = err.response?.data?.error || 'Payment failed. Please try again.';
      setErrorMsg(errorMsgText);
      showToast(errorMsgText, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <LoadingSpinner message="Processing your payment..." />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>💳 Upgrade Your Plan</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <p style={styles.subtitle}>
          Choose a plan that fits your business needs. Upgrade to unlock more listings and premium features.
        </p>

        {/* Error Message */}
        {errorMsg && (
          <div style={styles.error}>
            ❌ {errorMsg}
          </div>
        )}

        {/* Plan Cards */}
        <div style={styles.plansGrid}>
          {Object.entries(plans).map(([key, plan]) => {
            const isCurrent = key === currentPlan;
            const isSelected = selectedPlan === key;
            
            return (
              <div
                key={key}
                onClick={() => !isCurrent && setSelectedPlan(key)}
                style={{
                  ...styles.planCard,
                  ...(isSelected && styles.planCardSelected),
                  ...(isCurrent && styles.planCardCurrent),
                  ...(!isCurrent && styles.planCardClickable),
                }}
                className="animate-fade-in"
              >
                {isCurrent && (
                  <span style={styles.currentBadge}>✓ Current</span>
                )}
                
                <h3 style={styles.planName}>{plan.name}</h3>
                
                <div style={styles.planPrice}>
                  {plan.price === 0 ? 'Free' : `${plan.price} ${plan.currency}`}
                  {plan.price > 0 && <span style={styles.planPeriod}>/month</span>}
                </div>
                
                <p style={styles.planListings}>{plan.listings} listings</p>
                
                <ul style={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={styles.featureItem}>
                      <span style={styles.featureIcon}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent && (
                  <div style={styles.currentPlanBadge}>Active Plan</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment Method */}
        {selectedPlan && selectedPlan !== currentPlan && (
          <div style={styles.paymentSection}>
            <label style={styles.paymentLabel}>Payment Method</label>
            <div style={styles.paymentMethods}>
              {[
                { id: 'airtel_money', label: '📱 Airtel Money' },
                { id: 'mpamba', label: '📱 Mpamba' },
                { id: 'card', label: '💳 Debit/Credit Card' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    ...styles.paymentMethodBtn,
                    ...(paymentMethod === method.id && styles.paymentMethodBtnSelected),
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={styles.actions}>
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handlePayment}
            disabled={!selectedPlan || selectedPlan === currentPlan}
            loading={loading}
          >
            {selectedPlan && selectedPlan !== currentPlan
              ? `Pay ${plans[selectedPlan].price} ${plans[selectedPlan].currency}`
              : 'Select a Plan'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Styles
// ==========================================

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '32px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px 8px',
    lineHeight: 1,
  },
  subtitle: {
    color: '#64748b',
    marginBottom: '24px',
    fontSize: '14px',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    marginBottom: '16px',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  planCard: {
    padding: '20px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    transform: 'scale(1.02)',
  },
  planCardCurrent: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
    opacity: 0.8,
  },
  planCardClickable: {
    cursor: 'pointer',
  },
  currentBadge: {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    backgroundColor: '#22c55e',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 12px',
    borderRadius: '20px',
  },
  planName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '4px',
  },
  planPrice: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: '4px',
  },
  planPeriod: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#64748b',
    marginLeft: '4px',
  },
  planListings: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '12px',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    padding: '4px 0',
    color: '#475569',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  featureIcon: {
    color: '#22c55e',
    fontWeight: '700',
  },
  currentPlanBadge: {
    marginTop: '12px',
    padding: '4px 12px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentSection: {
    marginBottom: '24px',
  },
  paymentLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '8px',
  },
  paymentMethods: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  paymentMethodBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  paymentMethodBtnSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
};

export default PaymentModal;