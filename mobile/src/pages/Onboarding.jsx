// mobile/src/pages/Onboarding.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

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
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  check: "M20 6L9 17l-5-5",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  build: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4zM9 12l3-3",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
};

const Onboarding = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    
    try {
      const result = await updateProfile({ 
        role: role,
        onboarding_completed: true 
      });
      
      if (result.success) {
        success(`Welcome to Kumsika as a ${role}! 🎉`);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        showToast(result.error || 'Failed to complete onboarding', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    card: {
      maxWidth: '520px',
      width: '100%',
      padding: '40px 32px',
      background: '#FFFFFF',
      borderRadius: '24px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 20px 60px rgba(30,41,59,0.06)',
      position: 'relative',
    },
    header: {
      textAlign: 'center',
      marginBottom: '32px',
    },
    emoji: {
      fontSize: '48px',
      display: 'block',
      marginBottom: '12px',
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
    },
    subtitle: {
      fontSize: '16px',
      color: '#94A3B8',
      margin: '4px 0 0',
    },
    options: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px',
    },
    option: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '20px',
      borderRadius: '16px',
      border: '2px solid #E2E8F0',
      background: '#FFFFFF',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
      textAlign: 'left',
      width: '100%',
      opacity: loading ? 0.6 : 1,
    },
    optionSelected: {
      borderColor: '#F59E0B',
      background: 'rgba(245,158,11,0.04)',
      boxShadow: '0 0 0 4px rgba(245,158,11,0.1)',
    },
    optionIcon: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
    },
    optionDesc: {
      fontSize: '13px',
      color: '#94A3B8',
      margin: '2px 0 0',
    },
    optionCheck: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: '#E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.2s ease',
    },
    optionCheckActive: {
      background: '#F59E0B',
    },
    footer: {
      textAlign: 'center',
      fontSize: '13px',
      color: '#94A3B8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      margin: 0,
      paddingTop: '16px',
      borderTop: '1px solid #E2E8F0',
    },
    loadingOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(4px)',
      borderRadius: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    loadingText: {
      fontSize: '14px',
      color: '#64748B',
      marginTop: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {loading && (
          <div style={styles.loadingOverlay}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <div style={styles.loadingText}>Setting up your account...</div>
            </div>
          </div>
        )}

        <div style={styles.header}>
          <span style={styles.emoji}>👋</span>
          <h1 style={styles.title}>Welcome, {user?.email?.split('@')[0] || 'there'}!</h1>
          <p style={styles.subtitle}>How do you want to use Kumsika?</p>
        </div>

        <div style={styles.options}>
          <button
            style={{
              ...styles.option,
              ...(selectedRole === 'buyer' ? styles.optionSelected : {}),
            }}
            onClick={() => handleRoleSelect('buyer')}
            disabled={loading}
          >
            <div style={styles.optionIcon}>
              <Icon d={ICONS.user} size={28} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div style={styles.optionContent}>
              <h3 style={styles.optionTitle}>I want to buy</h3>
              <p style={styles.optionDesc}>Browse listings, find products, and connect with sellers</p>
            </div>
            <div style={{ ...styles.optionCheck, ...(selectedRole === 'buyer' ? styles.optionCheckActive : {}) }}>
              {selectedRole === 'buyer' && <Icon d={ICONS.check} size={14} color="#FFFFFF" strokeWidth={2.5} />}
            </div>
          </button>

          <button
            style={{
              ...styles.option,
              ...(selectedRole === 'seller' ? styles.optionSelected : {}),
            }}
            onClick={() => handleRoleSelect('seller')}
            disabled={loading}
          >
            <div style={styles.optionIcon}>
              <Icon d={ICONS.store} size={28} color="#10B981" strokeWidth={1.75} />
            </div>
            <div style={styles.optionContent}>
              <h3 style={styles.optionTitle}>I want to sell</h3>
              <p style={styles.optionDesc}>List products, manage inventory, and grow your business</p>
            </div>
            <div style={{ ...styles.optionCheck, ...(selectedRole === 'seller' ? styles.optionCheckActive : {}) }}>
              {selectedRole === 'seller' && <Icon d={ICONS.check} size={14} color="#FFFFFF" strokeWidth={2.5} />}
            </div>
          </button>

          <button
            style={{
              ...styles.option,
              ...(selectedRole === 'business' ? styles.optionSelected : {}),
            }}
            onClick={() => handleRoleSelect('business')}
            disabled={loading}
          >
            <div style={styles.optionIcon}>
              <Icon d={ICONS.build} size={28} color="#8B5CF6" strokeWidth={1.75} />
            </div>
            <div style={styles.optionContent}>
              <h3 style={styles.optionTitle}>I run a business</h3>
              <p style={styles.optionDesc}>Full business profile, analytics, and team management</p>
            </div>
            <div style={{ ...styles.optionCheck, ...(selectedRole === 'business' ? styles.optionCheckActive : {}) }}>
              {selectedRole === 'business' && <Icon d={ICONS.check} size={14} color="#FFFFFF" strokeWidth={2.5} />}
            </div>
          </button>
        </div>

        <p style={styles.footer}>
          <Icon d={ICONS.sparkles} size={14} color="#F59E0B" strokeWidth={1.75} />
          Free forever · AI-powered · Local community
        </p>
      </div>
    </div>
  );
};

export default Onboarding;