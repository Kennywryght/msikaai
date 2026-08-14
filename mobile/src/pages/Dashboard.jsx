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
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';
import PaymentModal from '../components/PaymentModal';

// ==========================================
// Hand-Drawn / Pencil-Style SVG Icon Set
// ==========================================

const iconStyle = {
  display: 'inline-block',
  verticalAlign: 'middle',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  flexShrink: 0,
};

const HandStore = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9" />
    <path d="M3 9a3 3 0 016 0a3 3 0 016 0a3 3 0 016 0" />
    <path d="M9 21v-6a2 2 0 012-2h2a2 2 0 012 2v6" />
  </svg>
);

const HandRobot = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M12 2v3" />
    <circle cx="12" cy="14" r="7" />
    <path d="M9 13v1" />
    <path d="M15 13v1" />
    <path d="M10 17s1 1 2 1 2-1 2-1" />
    <path d="M4 14h1" />
    <path d="M19 14h1" />
  </svg>
);

const HandMic = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 10a7 7 0 0014 0" />
    <path d="M12 17v4" />
    <path d="M8 21h8" />
  </svg>
);

const HandPalette = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M12 21a9 9 0 100-18c2 0 4 .8 5.2 2.1a9 9 0 012.8 6.4c0 2.5-2 4.5-4.5 4.5h-1.5a2 2 0 00-2 2v.5a2.5 2.5 0 01-2.5 2.5z" />
    <circle cx="7.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="12" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="16.5" cy="10.5" r=".5" fill="currentColor" />
  </svg>
);

const HandSearch = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const HandPlus = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" style={iconStyle}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const HandUser = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const HandLogout = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const HandWave = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M18 11V6a2 2 0 00-4 0v5" />
    <path d="M14 10V4a2 2 0 00-4 0v6" />
    <path d="M10 10.5V2.5a2 2 0 00-4 0V14" />
    <path d="M6 14v-1.5a1.5 1.5 0 00-3 0V16a7 7 0 007 7h3a7 7 0 007-7v-5a2 2 0 00-4 0" />
  </svg>
);

const HandPackage = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0z" />
    <path d="M2.32 6.16L12 11l9.68-4.84" />
    <path d="M12 22.76V11" />
  </svg>
);

const HandEye = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const HandPhone = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const HandTag = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" />
  </svg>
);

const HandPin = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const HandPencil = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const HandClipboard = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const HandZap = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const HandDot = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={iconStyle}>
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const HandClose = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" style={iconStyle}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const HandExport = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

// ==========================================
// Dashboard Component
// ==========================================

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
      // Default to free plan
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
      // Update subscription
      const response = await paymentAPI.upgradeSubscription({
        userId: user.id,
        plan: paymentData.plan,
        paymentId: paymentData.paymentId
      });
      
      if (response.data.success) {
        setSubscription(response.data.subscription);
        success('🎉 Subscription upgraded successfully!');
        // Refresh listings to show updated limits
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
  // STYLES
  // ==========================================
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
    },
    // ==========================================
    // PROFESSIONAL NAVIGATION STYLES
    // ==========================================
    nav: {
      backgroundColor: '#ffffff',
      padding: 'clamp(8px, 1.2vw, 12px) clamp(16px, 3vw, 24px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      minHeight: 'clamp(56px, 7vh, 64px)',
      flexWrap: 'wrap',
      gap: '8px'
    },
    brandGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    brandIcon: {
      width: 'clamp(34px, 3.5vw, 38px)',
      height: 'clamp(34px, 3.5vw, 38px)',
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
      flexShrink: 0
    },
    brandTitle: {
      fontSize: 'clamp(16px, 2vw, 20px)',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0,
      letterSpacing: '-0.5px',
      lineHeight: '1.1'
    },
    brandSubtitle: {
      fontSize: '7px',
      color: '#94a3b8',
      margin: 0,
      fontWeight: '600',
      letterSpacing: '0.6px',
      textTransform: 'uppercase'
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(4px, 0.8vw, 8px)',
      flexWrap: 'wrap'
    },
    // ✅ FIXED: No blinking - static dot with no animation
    subscriptionBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      backgroundColor: '#f1f5f9',
      padding: '4px 12px',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    subscriptionDot: {
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      flexShrink: 0,
      // ✅ NO ANIMATION - static dot
    },
    subscriptionPlan: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#64748b'
    },
    subscriptionPlanActive: {
      color: '#065f46'
    },
    subscriptionCount: {
      fontSize: '9px',
      color: '#94a3b8'
    },
    userProfile: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px 4px 12px',
      borderRadius: '20px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      cursor: 'pointer'
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
      color: '#2563eb'
    },
    userName: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#334155',
      maxWidth: '100px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    logoutIcon: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      color: '#94a3b8',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center'
    },
    // ✅ FIXED: Responsive upgrade banner
    upgradeBanner: {
      backgroundColor: '#fef3c7',
      borderBottom: '1px solid #f59e0b',
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
    // ==========================================
    // CONTENT STYLES
    // ==========================================
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
      color: '#0f172a',
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
      backgroundColor: '#ffffff',
      padding: 'clamp(10px, 1.2vw, 14px) clamp(12px, 1.5vw, 16px)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(8px, 1vw, 12px)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
    },
    statIconWrapper: {
      width: 'clamp(34px, 3.5vw, 40px)',
      height: 'clamp(34px, 3.5vw, 40px)',
      borderRadius: '10px',
      backgroundColor: '#eff6ff',
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
      color: '#64748b',
      fontWeight: '500',
      marginTop: '2px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: 'clamp(14px, 1.8vw, 20px)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      marginBottom: 'clamp(12px, 1.5vw, 16px)',
      border: '1px solid #e2e8f0',
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
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
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
    listingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(8px, 1vw, 12px)',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.15s ease-in-out',
      gap: '8px',
      flexWrap: 'wrap',
    },
    listingThumbnail: {
      width: 'clamp(38px, 4vw, 44px)',
      height: 'clamp(38px, 4vw, 44px)',
      objectFit: 'cover',
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
      flexShrink: 0,
    },
    placeholderThumbnail: {
      width: 'clamp(38px, 4vw, 44px)',
      height: 'clamp(38px, 4vw, 44px)',
      backgroundColor: '#f1f5f9',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
      flexShrink: 0,
    },
    listingMeta: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '2px',
      fontSize: 'clamp(10px, 0.9vw, 11px)',
      color: '#64748b',
      fontWeight: '500',
    },
    emptyStateContainer: {
      textAlign: 'center',
      padding: 'clamp(20px, 3vw, 30px) clamp(12px, 2vw, 16px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
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
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      backgroundColor: '#f8fafc',
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
      color: '#0f172a',
      fontSize: 'clamp(12px, 1.2vw, 13px)',
    },
    actionTileSub: {
      fontSize: 'clamp(10px, 0.9vw, 11px)',
      color: '#64748b',
      marginTop: '2px',
      lineHeight: '1.3',
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
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      maxWidth: 'clamp(340px, 50vw, 520px)',
      width: '100%',
      padding: 'clamp(16px, 2vw, 24px)',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    fieldGroup: {
      marginBottom: 'clamp(10px, 1.2vw, 14px)',
    },
    label: {
      display: 'block',
      fontSize: 'clamp(12px, 1.1vw, 13px)',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: 'clamp(6px, 0.8vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.2vw, 14px)',
      color: '#0f172a',
      marginTop: '2px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      WebkitAppearance: 'none',
      backgroundColor: '#ffffff',
    },
    errorBanner: {
      color: '#dc2626',
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
    exportButtons: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
      flexWrap: 'wrap',
    },
    exportBtn: {
      padding: 'clamp(4px, 0.6vw, 6px) clamp(10px, 1.2vw, 14px)',
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
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
    notificationWrapper: {
      position: 'relative',
      display: 'inline-block',
    },
    // AI Button styles
    aiBtn: {
      padding: 'clamp(4px, 0.6vw, 6px) clamp(8px, 1.2vw, 12px)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 1vw, 12px)',
      color: 'white',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'opacity 0.2s, transform 0.2s',
      touchAction: 'manipulation',
      whiteSpace: 'nowrap',
    },
    secondaryNavBtn: {
      padding: 'clamp(4px, 0.6vw, 6px) clamp(8px, 1.2vw, 12px)',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: '#e2e8f0',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 1vw, 12px)',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s',
      touchAction: 'manipulation',
      whiteSpace: 'nowrap',
    },
    userBadge: {
      fontSize: 'clamp(10px, 0.9vw, 12px)',
      color: '#e2e8f0',
      fontWeight: '500',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      padding: 'clamp(3px, 0.5vw, 4px) clamp(8px, 1vw, 12px)',
      borderRadius: '8px',
      maxWidth: 'clamp(100px, 15vw, 150px)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      border: '1px solid rgba(255, 255, 255, 0.06)',
    },
    logoutBtn: {
      color: '#f87171',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 'clamp(10px, 0.9vw, 12px)',
      fontWeight: '500',
      padding: 'clamp(3px, 0.5vw, 4px) clamp(6px, 0.8vw, 8px)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '6px',
      transition: 'background-color 0.2s',
      touchAction: 'manipulation',
    },
  };

  if (loading) {
    return <LoadingSpinner message="Loading your business dashboard..." />;
  }

  return (
    <div style={styles.container}>
      {/* ============================================
      PROFESSIONAL NAVIGATION BAR - CLEAN & MODERN
      ============================================ */}
      <nav style={styles.nav}>
        {/* Brand / Logo */}
        <div style={styles.brandGroup}>
          <div style={styles.brandIcon}>
            <HandStore size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>
              Ku<span style={{ color: '#2563eb' }}>Msika</span>
            </h1>
            <p style={styles.brandSubtitle}>
              Vendor Dashboard
            </p>
          </div>
        </div>

        {/* Right Side - Clean & Minimal */}
        <div style={styles.navActions}>
          {/* ✅ FIXED: Static dot - NO BLINKING */}
          <div style={styles.subscriptionBadge}>
            <span style={{
              ...styles.subscriptionDot,
              backgroundColor: subscription.plan === 'free' ? '#94a3b8' : '#22c55e'
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

          {/* Quick Actions */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              color: '#475569'
            }}
            iconLeft={<HandSearch size={14} />}
          >
            <span className="btn-label">Browse</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddListingClick}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              borderRadius: '8px'
            }}
            iconLeft={<HandPlus size={14} />}
          >
            <span className="btn-label">Add</span>
          </Button>

          {/* User Profile */}
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>
              {business?.business_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={styles.userName}>
              {business?.business_name || user?.email?.split('@')[0] || 'User'}
            </span>
            <button
              onClick={handleLogout}
              style={styles.logoutIcon}
              title="Logout"
            >
              <HandLogout size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 480px) {
          .btn-label {
            display: none;
          }
        }
        @media (min-width: 481px) {
          .btn-label {
            display: inline;
          }
        }
      `}</style>

      {/* ✅ FIXED: Responsive Upgrade Banner with proper button */}
      {subscription.remaining_listings <= 0 && (
        <div style={styles.upgradeBanner}>
          <div style={styles.upgradeBannerText}>
            <span style={styles.upgradeBannerIcon}>⚠️</span>
            <span>You've reached your listing limit. Upgrade to add more.</span>
          </div>
          <Button
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
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div style={styles.content}>
        {/* Welcome Header */}
        <div style={styles.headerSection}>
          <div>
            <h2 style={styles.welcomeTitle}>
              <HandWave size={22} color="#d97706" /> {t('welcome') || 'Welcome'}
              {business?.business_name
                ? `, ${business.business_name}`
                : user?.email
                ? `, ${user.email}`
                : ''}
              !
            </h2>
            <p style={{ color: '#64748b', marginTop: '2px', fontSize: 'clamp(13px, 1.2vw, 14px)' }}>
              {business
                ? (t('dashboard_subtitle') || 'Track your market presence, manage listings, and attract customer inquiries.')
                : (t('register_prompt_subtitle') || 'Register your business to get discovered by customers.')}
            </p>
          </div>
          {business && (
            <Button
              variant="primary"
              size="md"
              onClick={handleAddListingClick}
              iconLeft={<HandPackage size={16} />}
              style={subscription.remaining_listings <= 0 ? styles.addButtonDisabled : {}}
            >
              {subscription.remaining_listings <= 0 ? 'Upgrade to Add' : t('add_product') || 'Add Product'}
            </Button>
          )}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div style={styles.errorBanner}>
            <span>❌ {errorMsg}</span>
            <Button
              variant="danger"
              size="sm"
              onClick={fetchBusiness}
            >
              {t('retry') || 'Retry'}
            </Button>
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
            <div style={styles.card} className="card">
              <div style={styles.cardHeader}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: 'clamp(48px, 5vw, 60px)',
                      height: 'clamp(48px, 5vw, 60px)',
                      borderRadius: '50%',
                      backgroundColor: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(20px, 2.5vw, 24px)',
                      overflow: 'hidden',
                      border: '2px solid #e2e8f0',
                      flexShrink: 0,
                    }}>
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        business.business_name?.charAt(0).toUpperCase() || '🏪'
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {business.business_name}
                      </h2>
                      <p style={{ fontSize: 'clamp(12px, 1.1vw, 13px)', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <HandTag size={14} color="#64748b" />
                        <span>{business.category}</span>
                      </p>
                    </div>
                  </div>

                  {business.description && (
                    <p style={{ marginTop: '10px', color: '#475569', fontSize: 'clamp(12px, 1.1vw, 13px)', lineHeight: '1.5' }}>
                      {business.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(8px, 1vw, 12px)', marginTop: '6px' }}>
                    {business.phone && (
                      <span style={{ fontSize: 'clamp(12px, 1.1vw, 13px)', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HandPhone size={14} color="#64748b" />
                        <a href={`tel:${business.phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                          {business.phone}
                        </a>
                      </span>
                    )}
                    {business.address && (
                      <span style={{ fontSize: 'clamp(12px, 1.1vw, 13px)', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HandPin size={14} color="#64748b" />
                        {business.address}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-success">
                      {business.verified ? `✅ ${t('verified') || 'Verified'}` : `⏳ ${t('pending') || 'Pending'}`}
                    </span>
                    <span className={`badge ${business.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {business.status === 'active' ? `🟢 ${t('active') || 'Active'}` : `🔴 ${t('inactive') || 'Inactive'}`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/edit-profile')}
                    iconLeft={<HandPencil size={14} />}
                  >
                    {t('edit_profile') || 'Edit Profile'}
                  </Button>
                  
                  {/* Export Buttons */}
                  <div style={styles.exportButtons}>
                    <button
                      onClick={handleExportCSV}
                      style={styles.exportBtn}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      <HandExport size={14} /> CSV
                    </button>
                    <button
                      onClick={handleExportJSON}
                      style={styles.exportBtn}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      <HandExport size={14} /> JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div style={styles.statsGrid}>
              <div style={styles.statCard} className="card">
                <div style={styles.statIconWrapper}>
                  <HandPackage size={20} color="#2563eb" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#2563eb' }}>
                    {stats.totalListings}
                  </div>
                  <div style={styles.statLabel}>{t('total_products') || 'Total Products'}</div>
                </div>
              </div>

              <div style={styles.statCard} className="card">
                <div style={styles.statIconWrapper}>
                  <HandDot size={18} color="#16a34a" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#16a34a' }}>
                    {stats.activeListings}
                  </div>
                  <div style={styles.statLabel}>{t('active_products') || 'Active Products'}</div>
                </div>
              </div>

              <div style={styles.statCard} className="card">
                <div style={styles.statIconWrapper}>
                  <HandEye size={20} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#8b5cf6' }}>
                    {stats.totalViews}
                  </div>
                  <div style={styles.statLabel}>{t('views') || 'Views'}</div>
                </div>
              </div>

              <div style={styles.statCard} className="card">
                <div style={styles.statIconWrapper}>
                  <HandPhone size={20} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#f59e0b' }}>
                    {stats.totalContacts}
                  </div>
                  <div style={styles.statLabel}>{t('contacts') || 'Contacts'}</div>
                </div>
              </div>
            </div>

            {/* Listings Section */}
            <div style={styles.card} className="card">
              <div style={styles.cardTitleRow}>
                <h3 style={styles.cardTitle}>
                  <HandClipboard size={20} color="#1e293b" /> {t('your_listings') || 'Your Listings'} ({listings.length})
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '400',
                    color: '#64748b',
                    marginLeft: '8px'
                  }}>
                    ({subscription.remaining_listings} remaining)
                  </span>
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddListingClick}
                  iconLeft={<HandPlus size={14} />}
                  style={subscription.remaining_listings <= 0 ? styles.addButtonDisabled : {}}
                >
                  {subscription.remaining_listings <= 0 ? 'Upgrade' : t('add') || 'Add'}
                </Button>
              </div>

              {listings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      style={styles.listingRow}
                      className="card-hover"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = '#f8fafc')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '150px' }}>
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            style={styles.listingThumbnail}
                            loading="lazy"
                          />
                        ) : (
                          <div style={styles.placeholderThumbnail}>
                            <HandPackage size={20} color="#64748b" />
                          </div>
                        )}

                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: 'clamp(13px, 1.2vw, 14px)' }}>
                            {listing.title}
                          </div>
                          <div style={{ fontSize: 'clamp(11px, 1vw, 12px)', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <HandTag size={12} /> {listing.category || 'General'} &bull;{' '}
                            <span style={{ fontWeight: '700', color: '#059669' }}>
                              {formatPrice(listing.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1vw, 12px)', flexWrap: 'wrap' }}>
                        <div style={styles.listingMeta}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HandEye size={12} /> {listing.view_count || 0}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HandPhone size={12} /> {listing.contact_count || 0}
                          </span>
                        </div>

                        <span
                          style={{
                            ...styles.badge,
                            backgroundColor:
                              listing.status === 'active' ? '#d1fae5' : '#fee2e2',
                            color: listing.status === 'active' ? '#065f46' : '#991b1b',
                            fontSize: 'clamp(9px, 0.8vw, 10px)',
                          }}
                        >
                          <HandDot size={8} color={listing.status === 'active' ? '#16a34a' : '#dc2626'} />{' '}
                          {listing.status === 'active' ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyStateContainer}>
                  <HandPackage size={40} color="#94a3b8" />
                  <p style={{ fontWeight: '600', color: '#334155', fontSize: 'clamp(14px, 1.4vw, 15px)', marginTop: '8px' }}>
                    {t('no_products_yet') || 'No products or services listed yet'}
                  </p>
                  <p style={{ color: '#64748b', fontSize: 'clamp(12px, 1.1vw, 13px)', marginTop: '2px' }}>
                    {t('start_adding_items') || 'Start adding items to reach customers across Mitundu.'}
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleAddListingClick}
                    style={{ marginTop: '12px' }}
                    iconLeft={<HandPlus size={14} />}
                    disabled={subscription.remaining_listings <= 0}
                  >
                    {subscription.remaining_listings <= 0 ? 'Upgrade to Create First Listing' : t('create_first_listing') || 'Create First Listing'}
                  </Button>
                </div>
              )}
            </div>

            {/* AI Toolkit */}
            <div style={styles.card} className="card">
              <h3 style={{ ...styles.cardTitle, marginBottom: '4px' }}>
                <HandZap size={20} color="#f59e0b" /> {t('ai_toolkit') || 'AI Toolkit'}
              </h3>
              <p style={{ color: '#64748b', fontSize: 'clamp(12px, 1.1vw, 13px)', marginBottom: '12px' }}>
                {t('ai_toolkit_sub') || 'AI-powered tools to grow your business.'}
              </p>

              <div style={styles.quickActionsGrid}>
                <div
                  style={styles.actionTile}
                  className="card-hover"
                  onClick={() => navigate('/voice-listing')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#fce7f3' }}>
                    <HandMic size={22} color="#ec4899" />
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
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#fef3c7' }}>
                    <HandPalette size={22} color="#d97706" />
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
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#f3e8ff' }}>
                    <HandRobot size={22} color="#7c3aed" />
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
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#dbeafe' }}>
                    <HandPackage size={22} color="#2563eb" />
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
          <div style={styles.card} className="card">
            <div style={styles.emptyStateContainer}>
              <HandStore size={48} color="#2563eb" />
              <p style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', fontWeight: '700', color: '#1e293b', marginTop: '10px' }}>
                {t('register_business') || 'Register Your Business'}
              </p>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '6px auto 16px', fontSize: 'clamp(12px, 1.1vw, 13px)', lineHeight: '1.5' }}>
                {t('register_business_desc') || 'Connect with buyers in Mitundu. Set up your profile and start listing products in minutes.'}
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowCreateForm(true)}
              >
                {t('register_now') || 'Register Now'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Business Registration Modal */}
      {showCreateForm && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateForm(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'clamp(16px, 1.8vw, 18px)', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HandStore size={20} color="#2563eb" /> {t('register_business') || 'Register Business'}
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                aria-label="Close modal"
              >
                <HandClose size={18} />
              </button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: 'clamp(12px, 1.1vw, 13px)', marginTop: '4px' }}>
              {t('fill_shop_details') || 'Fill in your shop details to begin listing products on MsikaAI.'}
            </p>

            {errorMsg && (
              <div style={styles.errorBanner}>
                <HandClose size={16} color="#dc2626" /> {errorMsg}
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={creating}
                  loading={creating}
                >
                  {creating ? (t('saving') || 'Saving...') : (t('complete_setup') || 'Complete Setup')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setShowCreateForm(false);
                    setErrorMsg('');
                  }}
                >
                  {t('cancel') || 'Cancel'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal - NEW */}
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