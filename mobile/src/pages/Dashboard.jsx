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
  close: "M6 18L18 6M6 6l12 12",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();

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
  
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalContacts: 0,
    activeListings: 0,
  });

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

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your dashboard..." />;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="dashboard">
      <div className="dashboard-main">
        {/* Welcome Header */}
        <div className="welcome-section">
          <h1 className="welcome-title">
            Welcome back, <span className="welcome-highlight">{user?.email?.split('@')[0] || 'User'}</span>
          </h1>
          <p className="welcome-subtitle">Here's what's happening with your business today</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
              <Icon d={ICONS.box} size={18} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalListings}</div>
              <div className="stat-label">Total Listings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Icon d={ICONS.check} size={18} color="#10B981" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.activeListings}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <Icon d={ICONS.eye} size={18} color="#3B82F6" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalViews}</div>
              <div className="stat-label">Views</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Icon d={ICONS.phone} size={18} color="#8B5CF6" strokeWidth={1.75} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalContacts}</div>
              <div className="stat-label">Contacts</div>
            </div>
          </div>
        </div>

        {/* Business Info */}
        {business ? (
          <div className="business-card">
            <div className="business-info">
              <div className="business-avatar">
                {business.business_name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div className="business-details">
                <div className="business-name">{business.business_name}</div>
                <div className="business-meta">
                  {business.category} • {business.address || 'Location not set'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-business">
            <div className="empty-content">
              <div className="empty-icon">🏪</div>
              <h3 className="empty-title">No Business Registered</h3>
              <p className="empty-text">
                Register your business to start listing products and reaching customers.
              </p>
              <button className="btn-primary" onClick={() => navigate('/edit-profile')}>
                Register Business
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="section-card">
          <div className="section-header">
            <h3 className="section-title">
              <Icon d={ICONS.plus} size={18} color="#F59E0B" strokeWidth={1.75} />
              Quick Actions
            </h3>
          </div>
          <div className="actions-grid">
            <div className="action-item" onClick={() => navigate('/create-listing')}>
              <div className="action-icon">➕</div>
              <div className="action-name">Add Listing</div>
              <div className="action-desc">Create new product</div>
            </div>
            <div className="action-item" onClick={() => navigate('/search')}>
              <div className="action-icon">🔍</div>
              <div className="action-name">Browse</div>
              <div className="action-desc">Discover products</div>
            </div>
            <div className="action-item" onClick={() => navigate('/ai-search')}>
              <div className="action-icon">🤖</div>
              <div className="action-name">AI Search</div>
              <div className="action-desc">Smart search & insights</div>
            </div>
            <div className="action-item" onClick={() => navigate('/voice-listing')}>
              <div className="action-icon">🎤</div>
              <div className="action-name">Voice Listing</div>
              <div className="action-desc">List with your voice</div>
            </div>
          </div>
        </div>

        {/* Recent Listings */}
        {listings.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h3 className="section-title">
                <Icon d={ICONS.store} size={18} color="#F59E0B" strokeWidth={1.75} />
                Recent Listings
              </h3>
              <button className="link-btn" onClick={() => navigate('/search')}>View All →</button>
            </div>
            <div className="listings-list">
              {listings.slice(0, 5).map((listing, index) => (
                <div
                  key={listing.id}
                  className={`listing-item ${index === Math.min(4, listings.length - 1) ? 'listing-item-last' : ''}`}
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  <div className="listing-info">
                    {listing.images && listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="listing-image" />
                    ) : (
                      <div className="listing-image-placeholder">📦</div>
                    )}
                    <div className="listing-details">
                      <div className="listing-title">{listing.title}</div>
                      <div className="listing-meta">
                        {listing.category} • {listing.location_area || 'Location not set'}
                      </div>
                    </div>
                  </div>
                  <div className="listing-right">
                    <div className="listing-price">{formatPrice(listing.price)}</div>
                    <div className="listing-views">{listing.view_count || 0} views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {isMobile && (
        <div className="bottom-nav">
          {[
            { id: 'home', label: 'Home', icon: 'home' },
            { id: 'search', label: 'Search', icon: 'search' },
            { id: 'sell', label: 'Sell', icon: 'plus' },
            { id: 'messages', label: 'Chat', icon: 'message' },
            { id: 'profile', label: 'Profile', icon: 'user' },
          ].map((item) => {
            const active = item.id === 'home';
            return (
              <button key={item.id} className="nav-item" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon ${active ? 'nav-icon-active' : ''}`}>
                  <Icon d={ICONS[item.icon]} size={20} color={active ? '#FFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'nav-label-active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Business Registration Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Icon d={ICONS.store} size={20} color="#F59E0B" strokeWidth={1.75} />
                Register Business
              </h3>
              <button onClick={() => setShowCreateForm(false)} className="modal-close">
                <Icon d={ICONS.close} size={18} color="#94A3B8" strokeWidth={1.75} />
              </button>
            </div>

            {errorMsg && (
              <div className="error-banner">
                <Icon d={ICONS.close} size={16} color="#EF4444" strokeWidth={1.75} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} ref={formRef}>
              <div className="field-group">
                <label className="field-label">Business Name *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="businessName"
                  required
                  value={formData.businessName}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="e.g., Mitundu Hardware"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="field-select"
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

              <div className="field-group">
                <label className="field-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="field-textarea"
                  placeholder="Describe your business..."
                />
              </div>

              <div className="field-group">
                <label className="field-label">Phone / WhatsApp</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="e.g., 0999123456"
                />
              </div>

              <div className="field-group">
                <label className="field-label">Location / Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="field-input"
                  placeholder="e.g., Mitundu Trading Centre"
                />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Saving...' : 'Complete Setup'}
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => { setShowCreateForm(false); setErrorMsg(''); }}
                >
                  Cancel
                </button>
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

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .dashboard {
            padding-bottom: 0;
          }
        }

        /* ===== MAIN ===== */
        .dashboard-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== WELCOME ===== */
        .welcome-section {
          margin-bottom: 24px;
        }

        .welcome-title {
          font-size: clamp(22px, 2.8vw, 30px);
          font-weight: 700;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .welcome-highlight {
          background: linear-gradient(135deg, #F59E0B, #D97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== STATS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        @media (min-width: 480px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .stat-card:hover {
          border-color: #E2E8F0;
          transform: translateY(-1px);
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-info {
          flex: 1;
          min-width: 0;
        }

        .stat-value {
          font-size: clamp(18px, 1.8vw, 22px);
          font-weight: 700;
          color: #1E293B;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 11px;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        /* ===== BUSINESS CARD ===== */
        .business-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .business-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .business-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #EDE9F5, #F59E0B);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          flex-shrink: 0;
        }

        .business-details {
          flex: 1;
          min-width: 0;
        }

        .business-name {
          font-size: 17px;
          font-weight: 700;
          color: #1E293B;
        }

        .business-meta {
          font-size: 13px;
          color: #94A3B8;
        }

        /* ===== EMPTY BUSINESS ===== */
        .empty-business {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 32px 20px;
          border: 1px solid #F1F5F9;
          text-align: center;
          margin-bottom: 16px;
        }

        .empty-content {
          max-width: 320px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 40px;
          margin-bottom: 8px;
        }

        .empty-title {
          font-size: 17px;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .empty-text {
          font-size: 14px;
          color: #94A3B8;
          margin: 0 0 16px;
        }

        /* ===== SECTION CARD ===== */
        .section-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .link-btn {
          background: none;
          border: none;
          color: #F59E0B;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
        }

        .link-btn:hover {
          color: #D97706;
        }

        /* ===== ACTIONS GRID ===== */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        @media (min-width: 480px) {
          .actions-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .action-item {
          padding: 14px 12px;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          background: #F8FAFC;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-item:hover {
          border-color: #E2E8F0;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }

        .action-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .action-name {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
        }

        .action-desc {
          font-size: 10px;
          color: #94A3B8;
        }

        /* ===== LISTINGS ===== */
        .listings-list {
          display: flex;
          flex-direction: column;
        }

        .listing-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #F1F5F9;
          cursor: pointer;
          gap: 10px;
          transition: all 0.2s;
        }

        .listing-item:hover {
          background: #F8FAFC;
          margin: 0 -4px;
          padding: 10px 4px;
          border-radius: 6px;
        }

        .listing-item-last {
          border-bottom: none;
        }

        .listing-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .listing-image {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          object-fit: cover;
          background: #F1F5F9;
          flex-shrink: 0;
        }

        .listing-image-placeholder {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .listing-details {
          flex: 1;
          min-width: 0;
        }

        .listing-title {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .listing-meta {
          font-size: 12px;
          color: #94A3B8;
        }

        .listing-right {
          text-align: right;
          flex-shrink: 0;
        }

        .listing-price {
          font-size: 14px;
          font-weight: 700;
          color: #10B981;
        }

        .listing-views {
          font-size: 11px;
          color: #94A3B8;
        }

        /* ===== BUTTONS ===== */
        .btn-primary {
          padding: 10px 24px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-outline {
          padding: 10px 24px;
          background: transparent;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          color: #64748B;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: #F1F5F9;
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          padding: 20px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(30, 41, 59, 0.15);
          animation: slideUp 0.25s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close {
          background: none;
          border: none;
          cursor: pointer;
          color: #94A3B8;
          padding: 4px;
        }

        .modal-close:hover {
          color: #475569;
        }

        .field-group {
          margin-bottom: 12px;
        }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .field-input,
        .field-select,
        .field-textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 14px;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
          font-family: inherit;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .field-input:focus,
        .field-select:focus,
        .field-textarea:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .field-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .error-banner {
          color: #EF4444;
          font-size: 13px;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: #FEF2F2;
          border-radius: 10px;
          border: 1px solid #FECACA;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.4);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          font-family: inherit;
          min-width: 44px;
        }

        .nav-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label-active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 380px) {
          .stats-grid {
            gap: 8px;
          }
          .stat-card {
            padding: 10px 12px;
          }
          .stat-icon {
            width: 32px;
            height: 32px;
          }
          .stat-value {
            font-size: 16px;
          }
          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .action-item {
            padding: 10px 8px;
          }
          .action-icon {
            font-size: 20px;
          }
          .action-name {
            font-size: 12px;
          }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .actions-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;