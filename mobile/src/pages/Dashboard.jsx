import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { businessAPI, listingsAPI, analyticsAPI, notificationsAPI, exportAPI } from '../services/api';
import LanguageToggle from '../components/LanguageToggle';
import NotificationBell from '../components/NotificationBell';
import AnalyticsWidget from '../components/AnalyticsWidget';
import NotificationsDropdown from '../components/NotificationsDropdown';

// ==========================================
// Hand-Drawn / Pencil-Style SVG Icon Set
// ==========================================

const iconStyle = {
  display: 'inline-block',
  verticalAlign: 'middle',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
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

const HandCheck = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={iconStyle}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const HandClock = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" style={iconStyle}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const HandClose = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" style={iconStyle}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const HandDot = ({ size = 12, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={iconStyle}>
    <circle cx="12" cy="12" r="8" />
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

  // State
  const [business, setBusiness] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    description: '',
    phone: '',
    address: '',
  });

  // ==========================================
  // FETCH DATA
  // ==========================================

  useEffect(() => {
    if (user?.id) {
      fetchBusiness();
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBusiness = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📤 Fetching business for user:', user.id);
      const response = await businessAPI.getByUser(user.id);
      console.log('✅ Business fetched:', response.data);
      
      const businessData = response.data.business;
      setBusiness(businessData);

      if (businessData?.id) {
        fetchListings(businessData.id);
        fetchAnalytics(businessData.id);
      }
    } catch (err) {
      console.error('❌ Error fetching business:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      if (err.response?.status === 404) {
        console.log('ℹ️ No business found for user');
        setBusiness(null);
      } else {
        const errorMsg = err.response?.data?.error || 'Failed to load business data';
        setError(errorMsg);
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
      console.error('❌ Error fetching listings:', err);
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
    } else {
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
  };

  const handleExportCSV = async () => {
    if (!business?.id) {
      alert('No business data to export');
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
      alert('📊 CSV exported successfully!');
    } catch (err) {
      console.error('Export CSV error:', err);
      alert('Failed to export CSV');
    }
  };

  const handleExportJSON = async () => {
    if (!business?.id) {
      alert('No business data to export');
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
      alert('📄 JSON exported successfully!');
    } catch (err) {
      console.error('Export JSON error:', err);
      alert('Failed to export JSON');
    }
  };

  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      console.log('📤 Creating business with data:', {
        userId: user.id,
        ...formData,
      });

      const response = await businessAPI.create({
        userId: user.id,
        ...formData,
      });

      console.log('✅ Business created:', response.data);
      setBusiness(response.data.business);
      setShowCreateForm(false);
      alert('🎉 Business created successfully!');

      setFormData({
        businessName: '',
        category: '',
        description: '',
        phone: '',
        address: '',
      });

      fetchBusiness();
    } catch (err) {
      console.error('❌ Business creation error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to create business';
      setError(errorMsg);
      alert('❌ ' + errorMsg);
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
    spinner: {
      width: '44px',
      height: '44px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 0.9s linear infinite',
      margin: '0 auto',
    },
    nav: {
      backgroundColor: '#0f172a',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      flexWrap: 'wrap',
      gap: '12px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '3px solid #2563eb',
    },
    brandGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    brandTitle: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#ffffff',
      margin: 0,
      lineHeight: '1.1',
    },
    brandSubtitle: {
      fontSize: '11px',
      color: '#94a3b8',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    brandIcon: {
      width: '40px',
      height: '40px',
      backgroundColor: '#2563eb',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexWrap: 'wrap',
    },
    aiBtn: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '12px',
      color: 'white',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'opacity 0.2s, transform 0.2s',
    },
    secondaryNavBtn: {
      padding: '6px 12px',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: '#e2e8f0',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s',
    },
    primaryNavBtn: {
      padding: '6px 12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s',
    },
    userBadge: {
      fontSize: '12px',
      color: '#e2e8f0',
      fontWeight: '500',
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      padding: '4px 12px',
      borderRadius: '8px',
      maxWidth: '150px',
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
      fontSize: '12px',
      fontWeight: '500',
      padding: '4px 8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '6px',
      transition: 'background-color 0.2s',
    },
    content: {
      maxWidth: '1140px',
      margin: '0 auto',
      padding: '24px 16px',
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px',
    },
    welcomeTitle: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    headerActionBtn: {
      padding: '8px 16px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
      marginBottom: '20px',
    },
    statCard: {
      backgroundColor: '#ffffff',
      padding: '14px 16px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
    },
    statIconWrapper: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      backgroundColor: '#eff6ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statNumber: {
      fontSize: '20px',
      fontWeight: '800',
      lineHeight: '1.2',
    },
    statLabel: {
      fontSize: '12px',
      color: '#64748b',
      fontWeight: '500',
      marginTop: '2px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      marginBottom: '16px',
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
      marginBottom: '12px',
    },
    cardTitle: {
      fontSize: '16px',
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
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '11px',
      fontWeight: '600',
    },
    buttonPrimary: {
      padding: '8px 16px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s',
    },
    buttonSecondary: {
      padding: '8px 16px',
      backgroundColor: '#ffffff',
      color: '#1e293b',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s',
    },
    buttonDisabled: {
      padding: '8px 16px',
      backgroundColor: '#93c5fd',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'not-allowed',
    },
    listingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 12px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.15s ease-in-out',
    },
    listingThumbnail: {
      width: '44px',
      height: '44px',
      objectFit: 'cover',
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
    },
    placeholderThumbnail: {
      width: '44px',
      height: '44px',
      backgroundColor: '#f1f5f9',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #e2e8f0',
    },
    listingMeta: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '2px',
      fontSize: '11px',
      color: '#64748b',
      fontWeight: '500',
    },
    emptyStateContainer: {
      textAlign: 'center',
      padding: '30px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    quickActionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
    },
    actionTile: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
      transition: 'transform 0.15s, border-color 0.15s',
    },
    tileIconWrapper: {
      width: '44px',
      height: '44px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    actionTileTitle: {
      fontWeight: '700',
      color: '#0f172a',
      fontSize: '13px',
    },
    actionTileSub: {
      fontSize: '11px',
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
      maxWidth: '520px',
      width: '100%',
      padding: '24px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
    fieldGroup: {
      marginBottom: '14px',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      marginTop: '2px',
      boxSizing: 'border-box',
      outline: 'none',
    },
    errorBanner: {
      color: '#dc2626',
      fontSize: '14px',
      marginBottom: '16px',
      padding: '10px 14px',
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
      padding: '6px 14px',
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s',
    },
    notificationWrapper: {
      position: 'relative',
      display: 'inline-block',
    },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: '16px', color: '#64748b', fontWeight: '500' }}>
            Loading your business dashboard...
          </p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Navigation Bar */}
      <nav style={styles.nav}>
        <div style={styles.brandGroup}>
          <div style={styles.brandIcon}>
            <HandStore size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={styles.brandTitle}>
              Msika<span style={{ color: '#60a5fa' }}>AI</span>
            </h1>
            <span style={styles.brandSubtitle}>Vendor Dashboard</span>
          </div>
        </div>

        <div style={styles.navActions}>
          <LanguageToggle />

          <button
            onClick={() => navigate('/ai-search')}
            style={{ ...styles.aiBtn, backgroundColor: '#7c3aed' }}
            title="AI Search & Assistant"
          >
            <HandRobot size={14} /> AI
          </button>
          <button
            onClick={() => navigate('/voice-listing')}
            style={{ ...styles.aiBtn, backgroundColor: '#db2777' }}
            title="Create listing using voice"
          >
            <HandMic size={14} /> Voice
          </button>
          <button
            onClick={() => navigate('/ad-generator')}
            style={{ ...styles.aiBtn, backgroundColor: '#d97706' }}
            title="Generate advertisements"
          >
            <HandPalette size={14} /> Ads
          </button>

          <button
            onClick={() => navigate('/search')}
            style={styles.secondaryNavBtn}
          >
            <HandSearch size={14} /> Browse
          </button>
          <button
            onClick={() => navigate('/create-listing')}
            style={styles.primaryNavBtn}
          >
            <HandPlus size={14} /> Add
          </button>

          {/* Notification Bell */}
          <div style={styles.notificationWrapper}>
            <NotificationBell 
              unreadCount={unreadCount} 
              onClick={() => setShowNotifications(!showNotifications)} 
            />
            {showNotifications && (
              <NotificationsDropdown 
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkRead={handleMarkNotificationRead}
              />
            )}
          </div>

          <span style={styles.userBadge}>
            <HandUser size={14} />
            <span style={{ fontWeight: '500' }}>
              {business?.business_name || user?.email?.split('@')[0] || 'Vendor'}
            </span>
          </span>

          <button onClick={logout} style={styles.logoutBtn}>
            <HandLogout size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={styles.content}>
        {/* Welcome Header */}
        <div style={styles.headerSection}>
          <div>
            <h2 style={styles.welcomeTitle}>
              <HandWave size={24} color="#d97706" /> Welcome
              {business?.business_name
                ? `, ${business.business_name}`
                : user?.email
                ? `, ${user.email}`
                : ''}
              !
            </h2>
            <p style={{ color: '#64748b', marginTop: '2px', fontSize: '14px' }}>
              {business
                ? 'Track your market presence, manage listings, and attract customer inquiries.'
                : 'Register your business to get discovered by customers.'}
            </p>
          </div>
          {business && (
            <button
              onClick={() => navigate('/create-listing')}
              style={styles.headerActionBtn}
            >
              <HandPackage size={16} /> Add Product
            </button>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div style={styles.errorBanner}>
            <span>❌ {error}</span>
            <button
              onClick={fetchBusiness}
              style={{
                padding: '4px 12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Retry
            </button>
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
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      overflow: 'hidden',
                      border: '2px solid #e2e8f0',
                      flexShrink: 0
                    }}>
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.business_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        business.business_name?.charAt(0).toUpperCase() || '🏪'
                      )}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        {business.business_name}
                      </h2>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <HandTag size={14} color="#64748b" />
                        <span>{business.category}</span>
                      </p>
                    </div>
                  </div>

                  {business.description && (
                    <p style={{ marginTop: '10px', color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>
                      {business.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                    {business.phone && (
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HandPhone size={14} color="#64748b" />
                        {business.phone}
                      </span>
                    )}
                    {business.address && (
                      <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <HandPin size={14} color="#64748b" />
                        {business.address}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: business.verified ? '#d1fae5' : '#fef3c7',
                      color: business.verified ? '#065f46' : '#92400e'
                    }}>
                      {business.verified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '500',
                      backgroundColor: business.status === 'active' ? '#d1fae5' : '#fee2e2',
                      color: business.status === 'active' ? '#065f46' : '#991b1b'
                    }}>
                      {business.status === 'active' ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => navigate('/edit-profile')}
                    style={styles.buttonSecondary}
                  >
                    <HandPencil size={14} /> Edit Profile
                  </button>
                  
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
              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <HandPackage size={20} color="#2563eb" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#2563eb' }}>
                    {stats.totalListings}
                  </div>
                  <div style={styles.statLabel}>Total Products</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <HandDot size={18} color="#16a34a" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#16a34a' }}>
                    {stats.activeListings}
                  </div>
                  <div style={styles.statLabel}>Active Products</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <HandEye size={20} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#8b5cf6' }}>
                    {stats.totalViews}
                  </div>
                  <div style={styles.statLabel}>Views</div>
                </div>
              </div>

              <div style={styles.statCard}>
                <div style={styles.statIconWrapper}>
                  <HandPhone size={20} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ ...styles.statNumber, color: '#f59e0b' }}>
                    {stats.totalContacts}
                  </div>
                  <div style={styles.statLabel}>Contacts</div>
                </div>
              </div>
            </div>

            {/* Listings Section */}
            <div style={styles.card}>
              <div style={styles.cardTitleRow}>
                <h3 style={styles.cardTitle}>
                  <HandClipboard size={20} color="#1e293b" /> Your Listings ({listings.length})
                </h3>
                <button
                  onClick={() => navigate('/create-listing')}
                  style={styles.buttonPrimary}
                >
                  <HandPlus size={14} /> Add
                </button>
              </div>

              {listings.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {listings.map((listing) => (
                    <div
                      key={listing.id}
                      style={styles.listingRow}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = '#f8fafc')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                      onClick={() => navigate(`/listing/${listing.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            style={styles.listingThumbnail}
                          />
                        ) : (
                          <div style={styles.placeholderThumbnail}>
                            <HandPackage size={20} color="#64748b" />
                          </div>
                        )}

                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                            {listing.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <HandTag size={12} /> {listing.category || 'General'} &bull;{' '}
                            <span style={{ fontWeight: '700', color: '#059669' }}>
                              {formatPrice(listing.price)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            fontSize: '10px',
                          }}
                        >
                          <HandDot size={8} color={listing.status === 'active' ? '#16a34a' : '#dc2626'} />{' '}
                          {listing.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyStateContainer}>
                  <HandPackage size={40} color="#94a3b8" />
                  <p style={{ fontWeight: '600', color: '#334155', fontSize: '15px', marginTop: '8px' }}>
                    No products or services listed yet
                  </p>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                    Start adding items to reach customers across Mitundu.
                  </p>
                  <button
                    onClick={() => navigate('/create-listing')}
                    style={{ ...styles.buttonPrimary, marginTop: '12px' }}
                  >
                    <HandPlus size={14} /> Create First Listing
                  </button>
                </div>
              )}
            </div>

            {/* AI Toolkit */}
            <div style={styles.card}>
              <h3 style={{ ...styles.cardTitle, marginBottom: '4px' }}>
                <HandZap size={20} color="#f59e0b" /> AI Toolkit
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
                AI-powered tools to grow your business.
              </p>

              <div style={styles.quickActionsGrid}>
                <div
                  style={styles.actionTile}
                  onClick={() => navigate('/voice-listing')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#fce7f3' }}>
                    <HandMic size={22} color="#ec4899" />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>Voice Listing</div>
                    <div style={styles.actionTileSub}>Speak to create products</div>
                  </div>
                </div>

                <div
                  style={styles.actionTile}
                  onClick={() => navigate('/ad-generator')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#d97706'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#fef3c7' }}>
                    <HandPalette size={22} color="#d97706" />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>Ad Generator</div>
                    <div style={styles.actionTileSub}>Create promotional content</div>
                  </div>
                </div>

                <div
                  style={styles.actionTile}
                  onClick={() => navigate('/ai-search')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#f3e8ff' }}>
                    <HandRobot size={22} color="#7c3aed" />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>AI Assistant</div>
                    <div style={styles.actionTileSub}>Market insights & demand</div>
                  </div>
                </div>

                <div
                  style={styles.actionTile}
                  onClick={() => navigate('/create-listing')}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ ...styles.tileIconWrapper, backgroundColor: '#dbeafe' }}>
                    <HandPackage size={22} color="#2563eb" />
                  </div>
                  <div>
                    <div style={styles.actionTileTitle}>Manual Entry</div>
                    <div style={styles.actionTileSub}>Add photos & pricing</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Registration Prompt */
          <div style={styles.card}>
            <div style={styles.emptyStateContainer}>
              <HandStore size={48} color="#2563eb" />
              <p style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginTop: '10px' }}>
                Register Your Business
              </p>
              <p style={{ color: '#64748b', maxWidth: '400px', margin: '6px auto 16px', fontSize: '13px', lineHeight: '1.5' }}>
                Connect with buyers in Mitundu. Set up your profile and start listing products in minutes.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{ ...styles.buttonPrimary, padding: '10px 20px', fontSize: '14px' }}
              >
                Register Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Business Registration Modal */}
      {showCreateForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HandStore size={20} color="#2563eb" /> Register Business
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <HandClose size={18} />
              </button>
            </div>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px', marginTop: '4px' }}>
              Fill in your shop details to begin listing products on MsikaAI.
            </p>

            {error && (
              <div style={styles.errorBanner}>
                <HandClose size={16} color="#dc2626" /> {error}
              </div>
            )}

            <form onSubmit={handleCreateBusiness}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Business Name *</label>
                <input
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
                  style={styles.input}
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
                  style={{ ...styles.input, resize: 'vertical' }}
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

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={creating}
                  style={creating ? styles.buttonDisabled : styles.buttonPrimary}
                >
                  {creating ? 'Saving...' : 'Complete Setup'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                  }}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;