// mobile/src/pages/Onboarding.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';

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
  shopping: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  check: "M20 6L9 17l-5-5",
  close: "M18 6L6 18M6 6l12 12",
};

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingBusiness, setCheckingBusiness] = useState(true);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [isScrolled, setIsScrolled] = useState(false);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user has a business
  useEffect(() => {
    const checkUserBusiness = async () => {
      if (!user?.id) {
        setCheckingBusiness(false);
        return;
      }

      try {
        const response = await businessAPI.getByUser(user.id);
        if (response.data?.business || (response.data?.businesses && response.data.businesses.length > 0)) {
          const biz = response.data.business || response.data.businesses[0];
          setHasBusiness(true);
          setBusinessId(biz.id);
        } else {
          setHasBusiness(false);
        }
      } catch (err) {
        console.error('Error checking business:', err);
        setHasBusiness(false);
      } finally {
        setCheckingBusiness(false);
      }
    };

    checkUserBusiness();
  }, [user]);

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const handleContinue = () => {
    if (!selectedOption) {
      showToast('Please select an option to continue', 'warning');
      return;
    }

    if (selectedOption === 'buy') {
      // Redirect to landing page
      navigate('/landing');
    } else if (selectedOption === 'sell') {
      // Check if user has a business
      if (hasBusiness && businessId) {
        // Has business → go to create listing
        navigate('/create-listing');
      } else {
        // No business → go to register business (EditProfile)
        navigate('/profile');
      }
    }
  };

  if (checkingBusiness) {
    return <LoadingSpinner fullScreen message="Loading your profile..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1E293B',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
    },
    card: {
      maxWidth: '480px',
      width: '100%',
      background: '#FFFFFF',
      borderRadius: '20px',
      padding: 'clamp(24px, 4vw, 36px)',
      border: '1px solid #F1F5F9',
      boxShadow: '0 4px 24px rgba(30, 41, 59, 0.04)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '28px',
    },
    headerIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      background: 'rgba(245, 158, 11, 0.1)',
      borderRadius: '16px',
      marginBottom: '12px',
    },
    title: {
      fontSize: 'clamp(22px, 3vw, 26px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: '0 0 6px',
      fontFamily: '"Fraunces", Georgia, serif',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: 'clamp(14px, 1.2vw, 15px)',
      color: '#94A3B8',
      margin: '0',
      lineHeight: '1.5',
    },
    options: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '24px',
    },
    optionCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: 'clamp(16px, 2vw, 20px)',
      borderRadius: '14px',
      border: '2px solid #F1F5F9',
      cursor: 'pointer',
      transition: 'all 0.25s ease',
      background: '#FFFFFF',
    },
    optionCardSelected: {
      borderColor: '#F59E0B',
      background: 'rgba(245, 158, 11, 0.04)',
      boxShadow: '0 0 0 4px rgba(245, 158, 11, 0.08)',
    },
    optionIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      flexShrink: 0,
      background: '#F8FAFC',
    },
    optionIconActive: {
      background: 'rgba(245, 158, 11, 0.12)',
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 'clamp(15px, 1.3vw, 16px)',
      fontWeight: '600',
      color: '#1E293B',
      margin: '0 0 2px',
    },
    optionDescription: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#94A3B8',
      margin: '0',
      lineHeight: '1.4',
    },
    optionCheck: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      border: '2px solid #E2E8F0',
      flexShrink: 0,
      transition: 'all 0.25s ease',
    },
    optionCheckSelected: {
      background: '#F59E0B',
      borderColor: '#F59E0B',
    },
    continueBtn: {
      width: '100%',
      padding: 'clamp(12px, 1.5vw, 14px)',
      background: selectedOption ? 'linear-gradient(135deg, #1E293B, #F59E0B)' : '#E2E8F0',
      border: 'none',
      borderRadius: '12px',
      fontSize: 'clamp(15px, 1.3vw, 16px)',
      fontWeight: '600',
      color: selectedOption ? '#FFFFFF' : '#94A3B8',
      cursor: selectedOption ? 'pointer' : 'not-allowed',
      transition: 'all 0.25s ease',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    continueBtnHover: {
      transform: 'scale(0.98)',
      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
    },
    skipLink: {
      display: 'block',
      textAlign: 'center',
      marginTop: '16px',
      color: '#94A3B8',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      textDecoration: 'none',
      transition: 'color 0.2s ease',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    businessStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      padding: '6px 12px',
      borderRadius: '8px',
      marginTop: '8px',
      background: '#F8FAFC',
      border: '1px solid #F1F5F9',
    },
    businessStatusText: {
      color: '#64748B',
    },
    businessStatusBadge: {
      fontWeight: '600',
    },
    businessStatusBadgeRegistered: {
      color: '#10B981',
    },
    businessStatusBadgeUnregistered: {
      color: '#F59E0B',
    },
    footer: {
      textAlign: 'center',
      marginTop: '16px',
      fontSize: '12px',
      color: '#94A3B8',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <Icon d={ICONS.store} size={28} color="#F59E0B" strokeWidth={1.75} />
          </div>
          <h1 style={styles.title}>Welcome to Kumsika</h1>
          <p style={styles.subtitle}>
            How would you like to get started today?
          </p>
        </div>

        <div style={styles.options}>
          {/* Buy Option */}
          <div
            style={{
              ...styles.optionCard,
              ...(selectedOption === 'buy' ? styles.optionCardSelected : {}),
            }}
            onClick={() => handleOptionSelect('buy')}
            onMouseEnter={(e) => {
              if (selectedOption !== 'buy') {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.background = '#F8FAFC';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOption !== 'buy') {
                e.currentTarget.style.borderColor = '#F1F5F9';
                e.currentTarget.style.background = '#FFFFFF';
              }
            }}
          >
            <div
              style={{
                ...styles.optionIcon,
                ...(selectedOption === 'buy' ? styles.optionIconActive : {}),
              }}
            >
              <Icon d={ICONS.shopping} size={22} color={selectedOption === 'buy' ? '#F59E0B' : '#94A3B8'} strokeWidth={1.75} />
            </div>
            <div style={styles.optionContent}>
              <h3 style={styles.optionTitle}>I want to buy</h3>
              <p style={styles.optionDescription}>Browse products and services from local sellers</p>
            </div>
            <div
              style={{
                ...styles.optionCheck,
                ...(selectedOption === 'buy' ? styles.optionCheckSelected : {}),
              }}
            >
              {selectedOption === 'buy' && (
                <Icon d={ICONS.check} size={14} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </div>
          </div>

          {/* Sell Option */}
          <div
            style={{
              ...styles.optionCard,
              ...(selectedOption === 'sell' ? styles.optionCardSelected : {}),
            }}
            onClick={() => handleOptionSelect('sell')}
            onMouseEnter={(e) => {
              if (selectedOption !== 'sell') {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.background = '#F8FAFC';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedOption !== 'sell') {
                e.currentTarget.style.borderColor = '#F1F5F9';
                e.currentTarget.style.background = '#FFFFFF';
              }
            }}
          >
            <div
              style={{
                ...styles.optionIcon,
                ...(selectedOption === 'sell' ? styles.optionIconActive : {}),
              }}
            >
              <Icon d={ICONS.store} size={22} color={selectedOption === 'sell' ? '#F59E0B' : '#94A3B8'} strokeWidth={1.75} />
            </div>
            <div style={styles.optionContent}>
              <h3 style={styles.optionTitle}>I want to sell</h3>
              <p style={styles.optionDescription}>List products or services and reach customers</p>
            </div>
            <div
              style={{
                ...styles.optionCheck,
                ...(selectedOption === 'sell' ? styles.optionCheckSelected : {}),
              }}
            >
              {selectedOption === 'sell' && (
                <Icon d={ICONS.check} size={14} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </div>
          </div>
        </div>

        {/* Business Status Indicator */}
        {selectedOption === 'sell' && (
          <div style={styles.businessStatus}>
            <span style={styles.businessStatusText}>
              {hasBusiness ? '✅ You have a registered business' : '⚠️ You need to register a business to sell'}
            </span>
            <span
              style={{
                ...styles.businessStatusBadge,
                ...(hasBusiness ? styles.businessStatusBadgeRegistered : styles.businessStatusBadgeUnregistered),
              }}
            >
              {hasBusiness ? 'Registered' : 'Not Registered'}
            </span>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          style={styles.continueBtn}
          disabled={!selectedOption}
          onMouseEnter={(e) => {
            if (selectedOption) {
              Object.assign(e.currentTarget.style, styles.continueBtnHover);
            }
          }}
          onMouseLeave={(e) => {
            if (selectedOption) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {selectedOption === 'buy' && 'Start Shopping →'}
          {selectedOption === 'sell' && (hasBusiness ? 'Create Listing →' : 'Register Business →')}
          {!selectedOption && 'Select an option to continue'}
        </button>

        {/* Skip Link */}
        <button
          onClick={() => navigate('/landing')}
          style={styles.skipLink}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#1E293B'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
        >
          Skip for now
        </button>

        <div style={styles.footer}>
          You can always change this later in settings
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 480px) {
          .option-card {
            padding: 14px 16px !important;
          }
          .option-icon {
            width: 40px !important;
            height: 40px !important;
          }
          .option-icon svg {
            width: 18px !important;
            height: 18px !important;
          }
        }

        @media (max-width: 380px) {
          .card {
            padding: 16px !important;
          }
          .header-icon {
            width: 48px !important;
            height: 48px !important;
          }
          .header-icon svg {
            width: 22px !important;
            height: 22px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;