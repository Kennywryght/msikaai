// mobile/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { businessAPI, listingsAPI, analyticsAPI, notificationsAPI, exportAPI, paymentAPI } from '../services/api';
import LanguageToggle from '../components/LanguageToggle';
import NotificationBell from '../components/NotificationBell';
import AnalyticsWidget from '../components/AnalyticsWidget';
import NotificationsDropdown from '../components/NotificationsDropdown';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';
import PaymentModal from '../components/PaymentModal';

// ==========================================
// BRAND COLORS
// ==========================================
const COLORS = {
  championBlue: '#151130',
  championBlueLight: '#2A2438',
  championBlueDark: '#0A081F',
  lavenderTonic: '#C8BEFA',
  lavenderLight: '#D8CFFF',
  lavenderDark: '#B8A8F0',
  white: '#FFFFFF',
  gray50: '#F8F7FA',
  gray100: '#EEECF5',
  gray200: '#DDD9EB',
  gray300: '#C5C0D6',
  gray400: '#9E97B3',
  gray500: '#787090',
  gray600: '#5C5470',
  gray700: '#3F384F',
  gray800: '#2A2438',
  gray900: '#151130',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

// --- HAND-DRAWN STYLE INLINE SVG ICONS ---
const SketchIcon = ({ d, size = 20, color = 'currentColor', strokeWidth = 2 }) => (
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
  plus: "M12 4v16M4 12h16",
  box: "M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0zM2.32 6.16L12 11l9.68-4.84M12 22.76V11",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  delivery: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 16h6",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  wave: "M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V2.5a2 2 0 00-4 0V14M6 14v-1.5a1.5 1.5 0 00-3 0V16a7 7 0 007 7h3a7 7 0 007-7v-5a2 2 0 00-4 0",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z",
  dot: "M12 12a4 4 0 100-8 4 4 0 000 8z",
  pencil: "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  export: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 15V3",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  robot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  palette: "M12 21a9 9 0 100-18c2 0 4 .8 5.2 2.1a9 9 0 012.8 6.4c0 2.5-2 4.5-4.5 4.5h-1.5a2 2 0 00-2 2v.5a2.5 2.5 0 01-2.5 2.5zM7.5 10.5a.5.5 0 100-1 .5.5 0 000 1zM12 7.5a.5.5 0 100-1 .5.5 0 000 1zM16.5 10.5a.5.5 0 100-1 .5.5 0 000 1z",
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();

  // State
  const [business, setBusiness] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Analytics & Notifications
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalContacts: 0,
    activeListings: 0,
  });

  // ==========================================
  // PAYMENT & SUBSCRIPTION STATE
  // ==========================================
  const [subscription, setSubscription] = useState({
    plan: 'free',
    listings_allowed: 3,
    listings_used: 0,
    remaining_listings: 3,
    status: 'active'
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [plans, setPlans] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    phone: '',
    address: '',
  });

  // Refs for auto-focus
  const formRef = useRef(null);
  const nameInputRef = useRef(null);

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    if (user?.id) {
      fetchBusiness();
      fetchNotifications();
      fetchSubscription();
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (showCreateForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    }
  }, [showCreateForm]);

  // ==========================================
  // FETCH SUBSCRIPTION
  // ==========================================
  const fetchSubscription = async () => {
    if (!user?.id) return;
    
    setLoadingSubscription(true);
    try {
      const response = await paymentAPI.getSubscription(user.id);
      if (response.data.success) {
        setSubscription(response.data.subscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setSubscription({
        plan: 'free',
        listings_allowed: 3,
        listings_used: 0,
        remaining_listings: 3,
        status: 'active'
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await paymentAPI.getPlans();
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchBusiness = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await businessAPI.getByUser(user.id);
      const businessData = response.data.business || (Array.isArray(response.data.businesses) ? response.data.businesses[0] : null);
      setBusiness(businessData);

      if (businessData?.id) {
        fetchListings(businessData.id);
        fetchAnalytics(businessData.id);
      }
    } catch (err) {
      console.error('Error fetching business:', err);
      if (err.response?.status === 404) {
        setBusiness(null);
      } else {
        const errorMsgText = err.response?.data?.error || t('failed_load_business') || 'Failed to load business data';
        setErrorMsg(errorMsgText);
        showToast(errorMsgText, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async (businessId) => {
    try {
      const response = await listingsAPI.getByBusiness(businessId);
      const listingsData = response.data.listings || [];
      setListings(listingsData);

      const activeListings = listingsData.filter((l) => l.status === 'active');
      setStats({
        totalListings: listingsData.length,
        activeListings: activeListings.length,
        totalViews: listingsData.reduce((sum, l) => sum + (l.view_count || 0), 0),
        totalContacts: listingsData.reduce((sum, l) => sum + (l.contact_count || 0), 0),
      });
    } catch (err) {
      console.error('Error fetching listings:', err);
      setListings([]);
    }
  };

  const fetchAnalytics = async (businessId) => {
    try {
      const response = await analyticsAPI.getBusinessAnalytics(businessId, { days: 30 });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
        setShowAnalytics(true);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications(user.id);
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleMarkNotificationRead = (id) => {
    if (id === 'all') {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      success('All notifications marked as read');
    } else {
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
  };

  const handleExportCSV = async () => {
    if (!business?.id) {
      showToast('No business data to export', 'warning');
      return;
    }

    try {
      const response = await exportAPI.exportListingsCSV(business.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `listings-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      success('📊 CSV exported successfully!');
    } catch (err) {
      console.error('Export CSV error:', err);
      showToast('Failed to export CSV', 'error');
    }
  };

  const handleExportJSON = async () => {
    if (!business?.id) {
      showToast('No business data to export', 'warning');
      return;
    }

    try {
      const response = await exportAPI.exportBusinessJSON(business.id);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `business-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      success('📄 JSON exported successfully!');
    } catch (err) {
      console.error('Export JSON error:', err);
      showToast('Failed to export JSON', 'error');
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    setCreating(true);
    setErrorMsg('');

    try {
      const response = await businessAPI.create({
        userId: user.id,
        ...formData,
      });

      setBusiness(response.data.business);
      setShowCreateForm(false);
      success('🎉 Business created successfully!');

      setFormData({
        businessName: '',
        category: '',
        description: '',
        phone: '',
        address: '',
      });

      fetchBusiness();
    } catch (err) {
      console.error('Business creation error:', err);
      const errorMsgText = err.response?.data?.error || t('failed_create_business') || 'Failed to create business';
      setErrorMsg(errorMsgText);
      showToast('❌ ' + errorMsgText, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `MWK ${price.toLocaleString()}`;
  };

  // Handle logout with toast
  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Failed to logout', 'error');
    }
  };

  // ==========================================
  // PAYMENT HANDLERS
  // ==========================================
  const handlePaymentSuccess = async (paymentData) => {
    try {
      const response = await paymentAPI.upgradeSubscription({
        userId: user.id,
        plan: paymentData.plan,
        paymentId: paymentData.paymentId
      });
      
      if (response.data.success) {
        setSubscription(response.data.subscription);
        success('🎉 Subscription upgraded successfully!');
        if (business?.id) {
          fetchListings(business.id);
        }
      }
    } catch (err) {
      console.error('Payment upgrade error:', err);
      showToast('Failed to upgrade subscription', 'error');
    }
  };

  const handleAddListingClick = () => {
    if (subscription.remaining_listings <= 0) {
      setShowPaymentModal(true);
    } else {
      navigate('/create-listing');
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your business dashboard..." />;
  }

  return (
    <div style={styles.container}>
      {/* ============================================
      PROFESSIONAL NAVIGATION BAR
      ============================================ */}
      <nav style={styles.nav}>
        <div style={styles.brandGroup}>
          <div style={styles.brandIcon}>
            <SketchIcon d={ICONS.store} size={18} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={styles.brandTitle}>
              Msika<span style={{ color: COLORS.lavenderTonic }}>AI</span>
            </h1>
            <span style={styles.brandSubtitle}>
              Vendor Dashboard
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          style={styles.mobileMenuToggle}
          className="mobile-toggle"
          aria-label="Toggle menu"
        >
          <span style={{
            ...styles.hamburgerLine,
            transform: showMobileMenu ? 'rotate(45deg) translate(4px, 4px)' : 'none'
          }}></span>
          <span style={{
            ...styles.hamburgerLine,
            opacity: showMobileMenu ? 0 : 1
          }}></span>
          <span style={{
            ...styles.hamburgerLine,
            transform: showMobileMenu ? 'rotate(-45deg) translate(4px, -4px)' : 'none'
          }}></span>
        </button>

        <div style={styles.desktopNav}>
          <div style={styles.subscriptionBadge}>
            <span style={{
              ...styles.subscriptionDot,
              backgroundColor: subscription.plan === 'free' ? COLORS.gray400 : COLORS.success
            }}></span>
            <span style={{
              ...styles.subscriptionPlan,
              ...(subscription.plan !== 'free' && styles.subscriptionPlanActive)
            }}>
              {subscription.plan.toUpperCase()}
            </span>
            <span style={styles.subscriptionCount}>
              ({subscription.listings_used}/{subscription.listings_allowed})
            </span>
          </div>

          <PrimaryButton
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            style={{ padding: '6px 10px', fontSize: '12px', color: COLORS.gray600 }}
          >
            <SketchIcon d={ICONS.tag} size={14} color={COLORS.gray600} strokeWidth={2} />
            Browse
          </PrimaryButton>

          <PrimaryButton
            variant="primary"
            size="sm"
            onClick={handleAddListingClick}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '8px'
            }}
          >
            <SketchIcon d={ICONS.plus} size={14} color={COLORS.championBlue} strokeWidth={2.5} />
            Add
          </PrimaryButton>

          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>
              {business?.business_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={styles.userName}>
              {business?.business_name || user?.email?.split('@')[0] || 'User'}
            </span>
            
            <button
              onClick={handleLogout}
              style={styles.logoutBtn}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
              title="Logout"
            >
              <SketchIcon d={ICONS.logout} size={12} color={COLORS.error} strokeWidth={2} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 480px) {
          .btn-label { display: none; }
        }
        @media (min-width: 481px) {
          .btn-label { display: inline; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileMenuBadge}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: subscription.plan === 'free' ? COLORS.gray400 : COLORS.success
            }}></span>
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: subscription.plan === 'free' ? COLORS.gray600 : '#065f46'
            }}>
              Plan: {subscription.plan.toUpperCase()}
            </span>
            <span style={{ fontSize: '11px', color: COLORS.gray400 }}>
              ({subscription.listings_used}/{subscription.listings_allowed})
            </span>
          </div>

          <PrimaryButton
            variant="ghost"
            fullWidth
            onClick={() => { navigate('/search'); setShowMobileMenu(false); }}
            style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
          >
            <SketchIcon d={ICONS.tag} size={16} color={COLORS.gray600} strokeWidth={2} />
            Browse Listings
          </PrimaryButton>

          <PrimaryButton
            variant="primary"
            fullWidth
            onClick={() => { handleAddListingClick(); setShowMobileMenu(false); }}
            style={{ justifyContent: 'center' }}
          >
            {subscription.remaining_listings <= 0 ? 'Upgrade to Add' : 'Add Listing'}
          </PrimaryButton>

          <button
            onClick={() => { handleLogout(); setShowMobileMenu(false); }}
            style={styles.mobileLogoutBtn}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
          >
            <SketchIcon d={ICONS.logout} size={16} color={COLORS.error} strokeWidth={2} />
            Logout
          </button>
        </div>
      )}

      {/* Upgrade Banner */}
      {subscription.remaining_listings <= 0 && (
        <div style={styles.upgradeBanner}>
          <div style={styles.upgradeBannerText}>
            <span style={styles.upgradeBannerIcon}>⚠️</span>
            <span>You've reached your listing limit. Upgrade to add more.</span>
          </div>
          <PrimaryButton
            variant="warning"
            size="sm"
            onClick={() => setShowPaymentModal(true)}
            style={{
              padding: 'clamp(6px, 0.8vw, 8px) clamp(12px, 1.5vw, 16px)',
              fontSize: 'clamp(12px, 1vw, 13px)',
              whiteSpace: 'nowrap',
              minWidth: 'clamp(80px, 15vw, 120px)',
              justifyContent: 'center'
            }}
          >
            Upgrade Now
          </PrimaryButton>
        </div>
      )}

      {/* Main Content */}
      <div style={styles.content}>
        {/* Welcome Header */}
        <div style={styles.headerSection}>
          <div>
            <h2 style={styles.welcomeTitle}>
              <SketchIcon d={ICONS.wave} size={22} color={COLORS.warning} strokeWidth={2} />
              {t('welcome') || 'Welcome'}
              {business?.business_name
                ? `, ${business.business_name}`
                : user?.email
                ? `, ${user.email}`
                : ''}
              !
            </h2>
            <p style={{ color: COLORS.gray500, marginTop: '2px', fontSize: 'clamp(13px, 1.2vw, 14px)' }}>
              {business
                ? (t('dashboard_subtitle') || 'Track your market presence, manage listings, and attract customer inquiries.')
                : (t('register_prompt_subtitle') || 'Register your business to get discovered by customers.')}
            </p>
          </div>
          {business && (
            <PrimaryButton
              variant="primary"
              size="md"
              onClick={handleAddListingClick}
              style={subscription.remaining_listings <= 0 ? styles.addButtonDisabled : {}}
            >
              <SketchIcon d={ICONS.box} size={16} color={COLORS.championBlue} strokeWidth={2} />
              {subscription.remaining_listings <= 0 ? 'Upgrade to Add' : t('add_product') || 'Add Product'}
            </PrimaryButton>
          )}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={styles.errorBanner}>
            <span>❌ {errorMsg}</span>
            <PrimaryButton variant="danger" size="sm" onClick={fetchBusiness}>
              {t('retry') || 'Retry'}
            </PrimaryButton>
          </div>
        )}

        {/* Analytics Widget */}
        {business && showAnalytics && analytics && (
          <AnalyticsWidget 
            analytics={analytics}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {/* Business Section */}
        {business ? (
          <>
            {/* Business Profile Card */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={styles.businessAvatar}>
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        business.business_name?.charAt(0).toUpperCase() || '🏪'
                      )}
                    </div>
                    <div>
                      <h2 style={styles.businessName}>{business.business_name}</h2>
                      <p style={styles.businessCategory}>
                        <SketchIcon d={ICONS.tag} size={14} color={COLORS.gray500} strokeWidth={2} />
                        <span>{business.category}</span>
                      </p>
                    </div>
                  </div>

                  {business.description && (
                    <p style={styles.businessDescription}>{business.description}</p>
                  )}

                  <div style={styles.businessMeta}>
                    {business.phone && (
                      <span style={styles.businessMetaItem}>
                        <SketchIcon d={ICONS.phone} size={14} color={COLORS.gray500} strokeWidth={2} />
                        <a href={`tel:${business.phone}`} style={{ color: COLORS.lavenderTonic, textDecoration: 'none' }}>
                          {business.phone}
                        </a>
                      </span>
                    )}
                    {business.address && (
                      <span style={styles.businessMetaItem}>
                        <SketchIcon d={ICONS.mapPin} size={14} color={COLORS.gray500} strokeWidth={2} />
                        {business.address}
                      </span>
                    )}
                  </div>

                  <div style={styles.businessBadges}>
                    <span className="badge badge-success">
                      {business.verified ? `✅ ${t('verified') || 'Verified'}` : `⏳ ${t('pending') || 'Pending'}`}
                    </span>
                    <span className={`badge ${business.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {business.status === 'active' ? `🟢 ${t('active') || 'Active'}` : `🔴 ${t('inactive') || 'Inactive'}`}
                    </span>
                  </div>
                </div>

                <div style={styles.businessActions}>
                  <PrimaryButton
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/edit-profile')}
                  >
                    <SketchIcon d={ICONS.pencil} size={14} color={COLORS.white} strokeWidth={2} />
                    {t('edit_profile') || 'Edit Profile'}
                  </PrimaryButton>
                  
                  <div style={styles.exportButtons}>
                    <button
                      onClick={handleExportCSV}
                      style={styles.exportBtn}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.gray200}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.gray100}
                    >
                      <SketchIcon d={ICONS.export} size={14} color={COLORS.gray600} strokeWidth={2} />
                      CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      style={styles.exportBtn}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.gray200}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.gray100}
                    >
                      <SketchIcon d={ICONS.export} size={14} color={COLORS.gray600} strokeWidth={2} />
                      JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <SketchIcon d={ICONS.box} size={20} color={COLORS.lavenderTonic} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: COLORS.lavenderTonic }}>
                    {stats.totalListings}
                  </div>
                  <div style={styles.statLabel}>{t('total_products') || 'Total Products'}</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <SketchIcon d={ICONS.dot} size={18} color={COLORS.success} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: COLORS.success }}>
                    {stats.activeListings}
                  </div>
                  <div style={styles.statLabel}>{t('active_products') || 'Active Products'}</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <SketchIcon d={ICONS.eye} size={20} color={COLORS.lavenderTonic} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: COLORS.lavenderTonic }}>
                    {stats.totalViews}
                  </div>
                  <div style={styles.statLabel}>{t('views') || 'Views'}</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <SketchIcon d={ICONS.phone} size={20} color={COLORS.warning} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: COLORS.warning }}>
                    {stats.totalContacts}
                  </div>
                  <div style={styles.statLabel}>{t('contacts') || 'Contacts'}</div>
                </div>
              </div>
            </div>

            {/* Listings Section */}
            <div style={styles.card}>
              <div style={styles.cardTitleRow}>
                <h3 style={styles.cardTitle}>
                  <SketchIcon d={ICONS.box} size={20} color={COLORS.gray900} strokeWidth={2} />
                  {t('your_listings') || 'Your Listings'} ({listings.length})
                  <span style={styles.cardTitleSub}>
                    ({subscription.remaining_listings} remaining)
                  </span>
                </h3>
                <PrimaryButton
                  variant="primary"
                  size="sm"
                  onClick={handleAddListingClick}
                  style={subscription.remaining_listings <= 0 ? styles.addButtonDisabled : {}}
                >
                  <SketchIcon d={ICONS.plus} size={14} color={COLORS.championBlue} strokeWidth={2.5} />
                  {subscription.remaining_listings <= 0 ? 'Upgrade' : t('add') || 'Add'}
                </PrimaryButton>
              </div>

              {listings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      style={styles.listingRow}
                      className="card-hover"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.gray50}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <div style={styles.listingInfo}>
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            style={styles.listingThumbnail}
                            loading="lazy"
                          />
                        ) : (
                          <div style={styles.placeholderThumbnail}>
                            <SketchIcon d={ICONS.box} size={20} color={COLORS.gray400} strokeWidth={2} />
                          </div>
                        )}

                        <div>
                          <div style={styles.listingTitle}>{listing.title}</div>
                          <div style={styles.listingMetaInfo}>
                            <SketchIcon d={ICONS.tag} size={12} color={COLORS.gray400} strokeWidth={2} />
                            {listing.category || 'General'} &bull;{' '}
                            <span style={styles.listingPrice}>
                              {formatPrice(listing.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={styles.listingStats}>
                        <div style={styles.listingStatItem}>
                          <SketchIcon d={ICONS.eye} size={12} color={COLORS.gray400} strokeWidth={2} />
                          {listing.view_count || 0}
                        </div>
                        <div style={styles.listingStatItem}>
                          <SketchIcon d={ICONS.phone} size={12} color={COLORS.gray400} strokeWidth={2} />
                          {listing.contact_count || 0}
                        </div>

                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor: listing.status === 'active' ? '#d1fae5' : '#fee2e2',
                            color: listing.status === 'active' ? '#065f46' : '#991b1b',
                          }}
                        >
                          <SketchIcon d={ICONS.dot} size={8} color={listing.status === 'active' ? COLORS.success : COLORS.error} strokeWidth={2} />
                          {listing.status === 'active' ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyStateContainer}>
                  <SketchIcon d={ICONS.box} size={40} color={COLORS.gray400} strokeWidth={1.5} />
                  <p style={styles.emptyStateTitle}>
                    {t('no_products_yet') || 'No products or services listed yet'}
                  </p>
                  <p style={styles.emptyStateText}>
                    {t('start_adding_items') || 'Start adding items to reach customers across Malawi.'}
                  </p>
                  <PrimaryButton
                    variant="primary"
                    size="md"
                    onClick={handleAddListingClick}
                    style={{ marginTop: '12px' }}
                    disabled={subscription.remaining_listings <= 0}
                  >
                    {subscription.remaining_listings <= 0 ? 'Upgrade to Create First Listing' : t('create_first_listing') || 'Create First Listing'}
                  </PrimaryButton>
                </div>
              )}
            </div>

            {/* AI Toolkit */}
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, marginBottom: '4px' }}>
                <SketchIcon d={ICONS.robot} size={20} color={COLORS.warning} strokeWidth={2} />
                {t('ai_toolkit') || 'AI Toolkit'}
              </h3>
              <p style={styles.aiToolkitSub}>
                {t('ai_toolkit_sub') || 'AI-powered tools to grow your business.'}
              </p>

              <div style={styles.quickActionsGrid}>
                <div
                  style={styles.actionTile}
                  className="card-hover"
                  onClick={() => navigate('/voice-listing')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.gray200}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#fce7f3' }}>
                    <SketchIcon d={ICONS.mic} size={22} color="#ec4899" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>{t('voice_listing') || 'Voice Listing'}</div>
                    <div style={styles.actionTileSub}>{t('voice_listing_sub') || 'Speak to create products'}</div>
                  </div>
                </div>

                <div
                  style={styles.actionTile}
                  className="card-hover"
                  onClick={() => navigate('/ad-generator')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d97706'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.gray200}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#fef3c7' }}>
                    <SketchIcon d={ICONS.palette} size={22} color="#d97706" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>{t('ad_generator') || 'Ad Generator'}</div>
                    <div style={styles.actionTileSub}>{t('ad_generator_sub') || 'Create promotional content'}</div>
                  </div>
                </div>

                <div
                  style={styles.actionTile}
                  className="card-hover"
                  onClick={() => navigate('/ai-search')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.gray200}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#f3e8ff' }}>
                    <SketchIcon d={ICONS.robot} size={22} color="#7c3aed" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>{t('ai_assistant') || 'AI Assistant'}</div>
                    <div style={styles.actionTileSub}>{t('ai_assistant_sub') || 'Market insights & demand'}</div>
                  </div>
                </div>

                <div
                  style={styles.actionTile}
                  className="card-hover"
                  onClick={() => navigate('/create-listing')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = COLORS.lavenderTonic}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.gray200}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#dbeafe' }}>
                    <SketchIcon d={ICONS.box} size={22} color={COLORS.championBlue} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>{t('manual_entry') || 'Manual Entry'}</div>
                    <div style={styles.actionTileSub}>{t('manual_entry_sub') || 'Add photos & pricing'}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Registration Prompt */
          <div style={styles.card}>
            <div style={styles.emptyStateContainer}>
              <SketchIcon d={ICONS.store} size={48} color={COLORS.lavenderTonic} strokeWidth={1.5} />
              <p style={styles.registerPromptTitle}>
                {t('register_business') || 'Register Your Business'}
              </p>
              <p style={styles.registerPromptText}>
                {t('register_business_desc') || 'Connect with buyers across Malawi. Set up your profile and start listing products in minutes.'}
              </p>
              <PrimaryButton
                variant="primary"
                size="lg"
                onClick={() => setShowCreateForm(true)}
              >
                {t('register_now') || 'Register Now'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      {/* Business Registration Modal */}
      {showCreateForm && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <SketchIcon d={ICONS.store} size={20} color={COLORS.lavenderTonic} strokeWidth={2} />
                {t('register_business') || 'Register Business'}
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                style={styles.modalClose}
                aria-label="Close modal"
              >
                <SketchIcon d={ICONS.close} size={18} color={COLORS.gray400} strokeWidth={2} />
              </button>
            </div>
            <p style={styles.modalSubtitle}>
              {t('fill_shop_details') || 'Fill in your shop details to begin listing products on MsikaAI.'}
            </p>

            {errorMsg && (
              <div style={styles.errorBanner}>
                <SketchIcon d={ICONS.close} size={16} color={COLORS.error} strokeWidth={2} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} ref={formRef}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('business_name') || 'Business Name'} *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Mitundu Hardware"
                  autoComplete="off"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('category') || 'Category'} *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">{t('select_category') || 'Select category'}</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Retail Shop">Retail Shop</option>
                  <option value="Farm Inputs">Farm Inputs</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Mechanic">Mechanic</option>
                  <option value="Builder">Builder</option>
                  <option value="Tailor">Tailor</option>
                  <option value="Hairdresser">Salon</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('description') || 'Description'}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  style={{ ...styles.input, resize: 'vertical' }}
                  placeholder="Describe your business..."
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('phone_whatsapp') || 'Phone / WhatsApp'}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 0999123456"
                  autoComplete="tel"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t('location_address') || 'Location / Address'}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Mitundu Trading Centre"
                  autoComplete="address-line1"
                />
              </div>

              <div style={styles.modalActions}>
                <PrimaryButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={creating}
                  loading={creating}
                >
                  {creating ? (t('saving') || 'Saving...') : (t('complete_setup') || 'Complete Setup')}
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => { setShowCreateForm(false); setErrorMsg(''); }}
                >
                  {t('cancel') || 'Cancel'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && plans && (
        <PaymentModal
          plans={plans}
          currentPlan={subscription.plan}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.gray50,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  nav: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: 'clamp(10px, 1.5vw, 14px) clamp(12px, 2vw, 20px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid ' + COLORS.gray100,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    minHeight: 'clamp(60px, 8vh, 72px)',
    flexWrap: 'wrap',
    gap: '8px'
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  brandIcon: {
    width: 'clamp(32px, 4vw, 38px)',
    height: 'clamp(32px, 4vw, 38px)',
    background: 'linear-gradient(135deg, #C8BEFA 0%, #B8A8F0 50%, #A898E6 100%)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(200, 190, 250, 0.3)',
    flexShrink: 0
  },
  brandTitle: {
    fontSize: 'clamp(16px, 2.2vw, 20px)',
    fontWeight: '800',
    color: COLORS.gray900,
    margin: 0,
    letterSpacing: '-0.5px',
    lineHeight: '1.1'
  },
  brandSubtitle: {
    fontSize: 'clamp(6px, 0.6vw, 8px)',
    color: COLORS.gray400,
    fontWeight: '600',
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(4px, 0.8vw, 8px)',
    flexWrap: 'wrap',
  },
  mobileMenuToggle: {
    display: 'none',
    flexDirection: 'column',
    gap: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
  },
  hamburgerLine: {
    display: 'block',
    width: '22px',
    height: '2px',
    backgroundColor: COLORS.gray900,
    borderRadius: '2px',
    transition: 'all 0.3s',
  },
  subscriptionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: COLORS.gray100,
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1px solid ' + COLORS.gray200,
    flexShrink: 0,
  },
  subscriptionDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  subscriptionPlan: {
    fontSize: '11px',
    fontWeight: '600',
    color: COLORS.gray500,
  },
  subscriptionPlanActive: {
    color: '#065f46',
  },
  subscriptionCount: {
    fontSize: '9px',
    color: COLORS.gray400,
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 6px 4px 10px',
    borderRadius: '20px',
    backgroundColor: COLORS.gray50,
    border: '1px solid ' + COLORS.gray200,
    flexShrink: 0,
  },
  userAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#dbeafe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    color: COLORS.championBlue,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.gray700,
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#fee2e2',
    color: COLORS.error,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '600',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  mobileMenu: {
    position: 'fixed',
    top: 'clamp(60px, 8vh, 72px)',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderBottom: '1px solid ' + COLORS.gray200,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    padding: '16px 20px',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    animation: 'slideDown 0.3s ease-out',
  },
  mobileMenuBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: COLORS.gray100,
    borderRadius: '10px',
    border: '1px solid ' + COLORS.gray200,
  },
  mobileLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#fee2e2',
    color: COLORS.error,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
    transition: 'all 0.2s',
  },
  upgradeBanner: {
    backgroundColor: '#fef3c7',
    borderBottom: '1px solid ' + COLORS.warning,
    padding: 'clamp(10px, 1.2vw, 12px) clamp(16px, 2vw, 24px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  upgradeBannerText: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '500',
    color: '#92400e',
    fontSize: 'clamp(13px, 1.1vw, 14px)',
  },
  upgradeBannerIcon: {
    fontSize: 'clamp(18px, 1.8vw, 20px)',
  },
  addButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  content: {
    maxWidth: '1140px',
    margin: '0 auto',
    padding: 'clamp(16px, 3vw, 24px) clamp(12px, 3vw, 16px)',
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 'clamp(16px, 2vw, 20px)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  welcomeTitle: {
    fontSize: 'clamp(20px, 2.5vw, 24px)',
    fontWeight: '800',
    color: COLORS.gray900,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 20vw, 180px), 1fr))',
    gap: 'clamp(8px, 1.2vw, 12px)',
    marginBottom: 'clamp(16px, 2vw, 20px)',
  },
  statCard: {
    backgroundColor: COLORS.white,
    padding: 'clamp(10px, 1.2vw, 14px) clamp(12px, 1.5vw, 16px)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 1vw, 12px)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    border: '1px solid ' + COLORS.gray200,
  },
  statIconWrapper: {
    width: 'clamp(34px, 3.5vw, 40px)',
    height: 'clamp(34px, 3.5vw, 40px)',
    borderRadius: '10px',
    backgroundColor: COLORS.gray100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statNumber: {
    fontSize: 'clamp(18px, 2.2vw, 20px)',
    fontWeight: '800',
    lineHeight: '1.2',
  },
  statLabel: {
    fontSize: 'clamp(10px, 1vw, 12px)',
    color: COLORS.gray500,
    fontWeight: '500',
    marginTop: '2px',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: '12px',
    padding: 'clamp(14px, 1.8vw, 20px)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    marginBottom: 'clamp(12px, 1.5vw, 16px)',
    border: '1px solid ' + COLORS.gray200,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
  },
  cardTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'clamp(10px, 1.2vw, 12px)',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    fontSize: 'clamp(14px, 1.6vw, 16px)',
    fontWeight: '700',
    color: COLORS.gray900,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardTitleSub: {
    fontSize: '12px',
    fontWeight: '400',
    color: COLORS.gray500,
    marginLeft: '8px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: 'clamp(3px, 0.4vw, 4px) clamp(8px, 0.8vw, 10px)',
    borderRadius: '9999px',
    fontSize: 'clamp(9px, 0.9vw, 11px)',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  businessAvatar: {
    width: 'clamp(48px, 5vw, 60px)',
    height: 'clamp(48px, 5vw, 60px)',
    borderRadius: '50%',
    backgroundColor: COLORS.gray100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(20px, 2.5vw, 24px)',
    overflow: 'hidden',
    border: '2px solid ' + COLORS.gray200,
    flexShrink: 0,
  },
  businessName: {
    fontSize: 'clamp(16px, 1.8vw, 18px)',
    fontWeight: '700',
    color: COLORS.gray900,
    margin: 0,
  },
  businessCategory: {
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    color: COLORS.gray500,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  businessDescription: {
    marginTop: '10px',
    color: COLORS.gray600,
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    lineHeight: '1.5',
  },
  businessMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'clamp(8px, 1vw, 12px)',
    marginTop: '6px',
  },
  businessMetaItem: {
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    color: COLORS.gray500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  businessBadges: {
    marginTop: '6px',
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  businessActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end',
  },
  exportButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  exportBtn: {
    padding: 'clamp(4px, 0.6vw, 6px) clamp(10px, 1.2vw, 14px)',
    backgroundColor: COLORS.gray100,
    color: COLORS.gray700,
    border: '1px solid ' + COLORS.gray300,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(11px, 1vw, 12px)',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'background-color 0.2s',
    touchAction: 'manipulation',
  },
  listingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(8px, 0.8vw, 10px) clamp(8px, 1vw, 12px)',
    border: '1px solid ' + COLORS.gray200,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease-in-out',
    gap: '8px',
    flexWrap: 'wrap',
  },
  listingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    minWidth: '150px',
  },
  listingThumbnail: {
    width: 'clamp(38px, 4vw, 44px)',
    height: 'clamp(38px, 4vw, 44px)',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid ' + COLORS.gray300,
    flexShrink: 0,
  },
  placeholderThumbnail: {
    width: 'clamp(38px, 4vw, 44px)',
    height: 'clamp(38px, 4vw, 44px)',
    backgroundColor: COLORS.gray100,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid ' + COLORS.gray200,
    flexShrink: 0,
  },
  listingTitle: {
    fontWeight: '600',
    color: COLORS.gray800,
    fontSize: 'clamp(13px, 1.2vw, 14px)',
  },
  listingMetaInfo: {
    fontSize: 'clamp(11px, 1vw, 12px)',
    color: COLORS.gray500,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  },
  listingPrice: {
    fontWeight: '700',
    color: COLORS.success,
  },
  listingStats: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 1vw, 12px)',
    flexWrap: 'wrap',
  },
  listingStatItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'clamp(10px, 0.9vw, 11px)',
    color: COLORS.gray500,
    fontWeight: '500',
  },
  emptyStateContainer: {
    textAlign: 'center',
    padding: 'clamp(20px, 3vw, 30px) clamp(12px, 2vw, 16px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontWeight: '600',
    color: COLORS.gray700,
    fontSize: 'clamp(14px, 1.4vw, 15px)',
    marginTop: '8px',
  },
  emptyStateText: {
    color: COLORS.gray500,
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    marginTop: '2px',
  },
  registerPromptTitle: {
    fontSize: 'clamp(16px, 1.8vw, 18px)',
    fontWeight: '700',
    color: COLORS.gray800,
    marginTop: '10px',
  },
  registerPromptText: {
    color: COLORS.gray500,
    maxWidth: '400px',
    margin: '6px auto 16px',
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    lineHeight: '1.5',
  },
  quickActionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 20vw, 180px), 1fr))',
    gap: 'clamp(8px, 1vw, 12px)',
  },
  actionTile: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 1vw, 12px)',
    padding: 'clamp(10px, 1.2vw, 14px)',
    border: '1px solid ' + COLORS.gray200,
    borderRadius: '10px',
    backgroundColor: COLORS.gray50,
    cursor: 'pointer',
    transition: 'transform 0.15s, border-color 0.15s',
    touchAction: 'manipulation',
  },
  tileIconWrapper: {
    width: 'clamp(38px, 4vw, 44px)',
    height: 'clamp(38px, 4vw, 44px)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionTileTitle: {
    fontWeight: '700',
    color: COLORS.gray900,
    fontSize: 'clamp(12px, 1.2vw, 13px)',
  },
  actionTileSub: {
    fontSize: 'clamp(10px, 0.9vw, 11px)',
    color: COLORS.gray500,
    marginTop: '2px',
    lineHeight: '1.3',
  },
  aiToolkitSub: {
    color: COLORS.gray500,
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    marginBottom: '12px',
  },
  errorBanner: {
    color: COLORS.error,
    fontSize: 'clamp(13px, 1.2vw, 14px)',
    marginBottom: 'clamp(12px, 1.5vw, 16px)',
    padding: 'clamp(8px, 1vw, 10px) clamp(12px, 1.5vw, 14px)',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: '16px',
    maxWidth: 'clamp(340px, 50vw, 520px)',
    width: '100%',
    padding: 'clamp(16px, 2vw, 24px)',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 'clamp(16px, 1.8vw, 18px)',
    fontWeight: '700',
    color: COLORS.gray900,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.gray400,
    padding: '4px',
  },
  modalSubtitle: {
    color: COLORS.gray500,
    marginBottom: '16px',
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    marginTop: '4px',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
    flexWrap: 'wrap',
  },
  fieldGroup: {
    marginBottom: 'clamp(10px, 1.2vw, 14px)',
  },
  label: {
    display: 'block',
    fontSize: 'clamp(12px, 1.1vw, 13px)',
    fontWeight: '600',
    color: COLORS.gray700,
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: 'clamp(6px, 0.8vw, 8px) clamp(10px, 1vw, 12px)',
    border: '1px solid ' + COLORS.gray300,
    borderRadius: '8px',
    fontSize: 'clamp(13px, 1.2vw, 14px)',
    color: COLORS.gray900,
    marginTop: '2px',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    WebkitAppearance: 'none',
    backgroundColor: COLORS.white,
  },
};

export default Dashboard;