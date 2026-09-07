// mobile/src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { businessAPI, listingsAPI, analyticsAPI, notificationsAPI, exportAPI, paymentAPI } from '../services/api';
import AnalyticsWidget from '../components/AnalyticsWidget';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';
import PaymentModal from '../components/PaymentModal';

// ============================================
// PREMIUM FEATHER ICONS
// ============================================
const Icon = ({ d, size = 20, color = 'currentColor', strokeWidth = 1.75 }) => (
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
  plus: "M12 4v16m8-8H4",
  box: "M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0zM2.32 6.16L12 11l9.68-4.84M12 22.76V11",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12a3 3 0 100-6 3 3 0 000 6z",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  check: "M20 6L9 17l-5-5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  wave: "M18 11V6a2 2 0 00-4 0v5M14 10V4a2 2 0 00-4 0v6M10 10.5V2.5a2 2 0 00-4 0V14M6 14v-1.5a1.5 1.5 0 00-3 0V16a7 7 0 007 7h3a7 7 0 007-7v-5a2 2 0 00-4 0",
  dot: "M12 12a4 4 0 100-8 4 4 0 000 8z",
  pencil: "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  export: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5-5 5 5M12 15V3",
  robot: "M12 2a2 2 0 012 2v2h4a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4V4a2 2 0 012-2zM9 12h.01M15 12h.01M10 16h4",
  mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8",
  palette: "M12 21a9 9 0 100-18c2 0 4 .8 5.2 2.1a9 9 0 012.8 6.4c0 2.5-2 4.5-4.5 4.5h-1.5a2 2 0 00-2 2v.5a2.5 2.5 0 01-2.5 2.5zM7.5 10.5a.5.5 0 100-1 .5.5 0 000 1zM12 7.5a.5.5 0 100-1 .5.5 0 000 1zM16.5 10.5a.5.5 0 100-1 .5.5 0 000 1z",
  trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
  clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
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
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalContacts: 0,
    activeListings: 0,
  });

  // Subscription
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

  const formRef = useRef(null);
  const nameInputRef = useRef(null);

  // ============================================
  // FETCH DATA
  // ============================================
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

  useEffect(() => {
    if (showCreateForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current.focus(), 100);
    }
  }, [showCreateForm]);

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

  // ============================================
  // HANDLERS
  // ============================================
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

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your dashboard..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingTop: 'clamp(72px, 10vh, 80px)',
      paddingBottom: 'clamp(24px, 4vw, 40px)',
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 16px',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: 'clamp(24px, 3vw, 28px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    subtitle: {
      fontSize: 'clamp(14px, 1.2vw, 16px)',
      color: '#94A3B8',
      margin: '4px 0 0',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
      marginBottom: '24px',
    },
    statCard: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '16px 18px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    statIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      background: 'rgba(245,158,11,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    statValue: {
      fontSize: 'clamp(20px, 2vw, 24px)',
      fontWeight: '700',
      color: '#1E293B',
      fontFamily: '"Fraunces", Georgia, serif',
      lineHeight: '1.2',
    },
    statLabel: {
      fontSize: '12px',
      color: '#94A3B8',
    },
    card: {
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
      marginBottom: '16px',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '14px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    cardTitle: {
      fontSize: 'clamp(16px, 1.4vw, 18px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    businessInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flexWrap: 'wrap',
    },
    businessAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #EDE9F5, #F59E0B)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: '700',
      color: '#1E293B',
      flexShrink: 0,
    },
    businessName: {
      fontSize: 'clamp(18px, 1.6vw, 20px)',
      fontWeight: '700',
      color: '#1E293B',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    businessCategory: {
      fontSize: '13px',
      color: '#94A3B8',
    },
    listingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid #F1F5F9',
      gap: '10px',
      flexWrap: 'wrap',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    listingRowLast: {
      borderBottom: 'none',
    },
    listingInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    listingImage: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      objectFit: 'cover',
      background: '#F1F5F9',
      flexShrink: 0,
    },
    listingTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1E293B',
    },
    listingMeta: {
      fontSize: '12px',
      color: '#94A3B8',
    },
    listingPrice: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#10B981',
    },
    emptyState: {
      textAlign: 'center',
      padding: 'clamp(32px, 4vw, 48px) 20px',
    },
    emptyStateIcon: {
      fontSize: '48px',
      marginBottom: '12px',
    },
    emptyStateTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1E293B',
      margin: '0 0 6px',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    emptyStateText: {
      fontSize: '14px',
      color: '#94A3B8',
      margin: '0 0 20px',
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '10px',
    },
    actionCard: {
      padding: '14px',
      borderRadius: '10px',
      border: '1px solid #E2E8F0',
      background: '#F8FAFC',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    actionCardIcon: {
      fontSize: '28px',
      marginBottom: '6px',
    },
    actionCardTitle: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1E293B',
    },
    actionCardDesc: {
      fontSize: '11px',
      color: '#94A3B8',
    },
    modalOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 1000,
    },
    modalContent: {
      background: '#FFFFFF',
      borderRadius: '16px',
      maxWidth: 'clamp(340px, 50vw, 520px)',
      width: '100%',
      padding: 'clamp(16px, 2vw, 24px)',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 40px rgba(30,41,59,0.15)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    modalTitle: {
      fontSize: 'clamp(16px, 1.8vw, 18px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    modalClose: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#94A3B8',
      padding: '4px',
    },
    fieldGroup: {
      marginBottom: 'clamp(10px, 1.2vw, 14px)',
    },
    label: {
      display: 'block',
      fontSize: 'clamp(12px, 1.1vw, 13px)',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: 'clamp(6px, 0.8vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.2vw, 14px)',
      color: '#1E293B',
      marginTop: '2px',
      boxSizing: 'border-box',
      outline: 'none',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    select: {
      width: '100%',
      padding: 'clamp(6px, 0.8vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.2vw, 14px)',
      color: '#1E293B',
      outline: 'none',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      appearance: 'none',
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      marginTop: '16px',
      flexWrap: 'wrap',
    },
    errorBanner: {
      color: '#EF4444',
      fontSize: '13px',
      marginBottom: '16px',
      padding: '10px 14px',
      background: '#FEF2F2',
      borderRadius: '8px',
      border: '1px solid #FECACA',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            👋 Welcome back, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p style={styles.subtitle}>
            Here's what's happening with your business today
          </p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Icon d={ICONS.box} size={18} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total Listings</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Icon d={ICONS.check} size={18} color="#10B981" strokeWidth={1.75} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.active}</div>
              <div style={styles.statLabel}>Active</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Icon d={ICONS.eye} size={18} color="#3B82F6" strokeWidth={1.75} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.views}</div>
              <div style={styles.statLabel}>Views</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>
              <Icon d={ICONS.phone} size={18} color="#8B5CF6" strokeWidth={1.75} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.contacts}</div>
              <div style={styles.statLabel}>Contacts</div>
            </div>
          </div>
        </div>

        {/* Business Info */}
        {business ? (
          <div style={styles.card}>
            <div style={styles.businessInfo}>
              <div style={styles.businessAvatar}>
                {business.business_name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div>
                <div style={styles.businessName}>{business.business_name}</div>
                <div style={styles.businessCategory}>
                  {business.category} • {business.address || 'Location not set'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>🏪</div>
              <h3 style={styles.emptyStateTitle}>No Business Registered</h3>
              <p style={styles.emptyStateText}>
                Register your business to start listing products and reaching customers.
              </p>
              <PrimaryButton variant="primary" size="md" onClick={() => navigate('/edit-profile')}>
                Register Business
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <Icon d={ICONS.plus} size={18} color="#F59E0B" strokeWidth={1.75} />
              Quick Actions
            </h3>
          </div>
          <div style={styles.quickActions}>
            <div style={styles.actionCard} onClick={() => navigate('/create-listing')}>
              <div style={styles.actionCardIcon}>➕</div>
              <div style={styles.actionCardTitle}>Add Listing</div>
              <div style={styles.actionCardDesc}>Create new product</div>
            </div>
            <div style={styles.actionCard} onClick={() => navigate('/search')}>
              <div style={styles.actionCardIcon}>🔍</div>
              <div style={styles.actionCardTitle}>Browse</div>
              <div style={styles.actionCardDesc}>Discover products</div>
            </div>
            <div style={styles.actionCard} onClick={() => navigate('/ai-search')}>
              <div style={styles.actionCardIcon}>🤖</div>
              <div style={styles.actionCardTitle}>AI Search</div>
              <div style={styles.actionCardDesc}>Smart search & insights</div>
            </div>
            <div style={styles.actionCard} onClick={() => navigate('/voice-listing')}>
              <div style={styles.actionCardIcon}>🎤</div>
              <div style={styles.actionCardTitle}>Voice Listing</div>
              <div style={styles.actionCardDesc}>List with your voice</div>
            </div>
          </div>
        </div>

        {/* Recent Listings */}
        {listings.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <Icon d={ICONS.store} size={18} color="#F59E0B" strokeWidth={1.75} />
                Recent Listings
              </h3>
              <PrimaryButton variant="outline" size="sm" onClick={() => navigate('/search')}>
                View All
              </PrimaryButton>
            </div>
            {listings.slice(0, 5).map((listing, index) => (
              <div
                key={listing.id}
                style={{
                  ...styles.listingRow,
                  ...(index === Math.min(4, listings.length - 1) ? styles.listingRowLast : {}),
                }}
                onClick={() => navigate(`/listing/${listing.id}`)}
              >
                <div style={styles.listingInfo}>
                  {listing.images && listing.images[0] ? (
                    <img src={listing.images[0]} alt={listing.title} style={styles.listingImage} />
                  ) : (
                    <div style={{ ...styles.listingImage, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      📦
                    </div>
                  )}
                  <div>
                    <div style={styles.listingTitle}>{listing.title}</div>
                    <div style={styles.listingMeta}>
                      {listing.category} • {listing.location_area || 'Location not set'}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={styles.listingPrice}>{formatPrice(listing.price)}</div>
                  <div style={{ ...styles.listingMeta, textAlign: 'right' }}>
                    {listing.view_count || 0} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Business Registration Modal */}
      {showCreateForm && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <Icon d={ICONS.store} size={20} color="#F59E0B" strokeWidth={1.75} />
                Register Business
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                style={styles.modalClose}
                aria-label="Close modal"
              >
                <Icon d={ICONS.close} size={18} color="#94A3B8" strokeWidth={1.75} />
              </button>
            </div>

            {errorMsg && (
              <div style={styles.errorBanner}>
                <Icon d={ICONS.close} size={16} color="#EF4444" strokeWidth={1.75} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} ref={formRef}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Business Name *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Mitundu Hardware"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="">Select category</option>
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
                <label style={styles.label}>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  style={{ ...styles.input, resize: 'vertical', minHeight: '60px' }}
                  placeholder="Describe your business..."
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Phone / WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 0999123456"
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Location / Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., Mitundu Trading Centre"
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
                  {creating ? 'Saving...' : 'Complete Setup'}
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => { setShowCreateForm(false); setErrorMsg(''); }}
                >
                  Cancel
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

export default Dashboard;