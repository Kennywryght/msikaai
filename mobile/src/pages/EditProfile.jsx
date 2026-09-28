// mobile/src/pages/EditProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { profileAPI, businessAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a3 3 0 100-6 3 3 0 000 6z",
    check: "M20 6L9 17l-5-5",
    close: "M18 6L6 18M6 6l12 12",
    save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
    upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  };

  const d = icons[name] || icons.store;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const EditProfile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
    location_text: '',
  });

  const [business, setBusiness] = useState({
    business_name: '',
    category: '',
    description: '',
    phone: '',
    address: '',
    logo_url: '',
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  const isMobile = windowWidth <= 768;

  const categories = [
    'Hardware & Construction',
    'Retail & Grocery Shop',
    'Farm Inputs & Agro Chemicals',
    'Plumber',
    'Electrician',
    'Carpenter',
    'Mechanic / Automotive',
    'Builder / Construction',
    'Tailor / Apparel',
    'Salon / Barber',
    'Restaurant / Food Services',
    'Other Services'
  ];

  useEffect(() => {
    if (user?.id) {
      fetchData();
    } else {
      navigate('/login');
    }
  }, [user]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loading) {
      const firstNameInput = document.querySelector('input[name="full_name"]');
      if (firstNameInput) {
        setTimeout(() => firstNameInput.focus(), 100);
      }
    }
  }, [loading]);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const profileRes = await profileAPI.getByUser(user.id);
      if (profileRes.data.success && profileRes.data.profile) {
        const p = profileRes.data.profile;
        setProfile({
          full_name: p.full_name || '',
          phone: p.phone || '',
          avatar_url: p.avatar_url || '',
          location_text: p.location_text || '',
        });
        if (p.avatar_url) setAvatarPreview(p.avatar_url);
      }

      const businessRes = await businessAPI.getByUser(user.id);
      if (businessRes.data.success && businessRes.data.business) {
        const b = businessRes.data.business;
        setBusiness({
          business_name: b.business_name || '',
          category: b.category || '',
          description: b.description || '',
          phone: b.phone || '',
          address: b.address || '',
          logo_url: b.logo_url || '',
        });
        if (b.logo_url) setLogoPreview(b.logo_url);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setErrorMsg('Failed to load profile data');
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusiness(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const profileData = {
        userId: user.id,
        fullName: profile.full_name,
        phone: profile.phone,
        location_text: profile.location_text,
      };

      const profileResponse = await profileAPI.update(profileData);
      if (!profileResponse.data.success) {
        throw new Error(profileResponse.data.error || 'Failed to update profile');
      }

      const businessData = {
        userId: user.id,
        businessName: business.business_name,
        category: business.category,
        description: business.description,
        phone: business.phone,
        address: business.address,
      };

      const businessResponse = await profileAPI.updateBusiness(businessData);
      if (!businessResponse.data.success) {
        throw new Error(businessResponse.data.error || 'Failed to update business');
      }

      setSuccessMsg('✅ Profile updated successfully!');
      success('Profile updated successfully! 🎉');

      setTimeout(() => {
        fetchData();
      }, 2000);

    } catch (err) {
      console.error('Error updating profile:', err);
      const errMsg = err.message || 'Failed to update profile';
      setErrorMsg(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setSaving(false);
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
    return (
      <div className="loading-skeleton">
        <div className="skeleton-header" />
        <div className="skeleton-avatar" />
        <div className="skeleton-form">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton-field" />)}
        </div>
        <div className="skeleton-button" />
        <style jsx>{`
          .loading-skeleton {
            min-height: 100vh;
            background: var(--color-bg);
            padding: 20px 16px 80px;
            max-width: 700px;
            margin: 0 auto;
          }
          .skeleton-header {
            height: 80px;
            background: var(--color-border);
            border-radius: var(--radius-xl);
            margin-bottom: 20px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--color-border);
            margin-bottom: 16px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .skeleton-field {
            height: 44px;
            background: var(--color-border);
            border-radius: var(--radius-md);
            animation: pulse 1.5s ease-in-out infinite;
          }
          .skeleton-button {
            height: 48px;
            background: var(--color-border);
            border-radius: var(--radius-lg);
            margin-top: 12px;
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="edit-profile">
      <div className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <Icon name="arrowLeft" size={16} color="var(--color-text-secondary)" strokeWidth={1.75} />
            Back
          </button>
          <div className="header-content">
            <div className="header-icon">
              <Icon name="user" size={28} color="var(--color-accent)" strokeWidth={1.75} />
            </div>
            <h1 className="page-title">Edit Profile</h1>
            <p className="page-subtitle">Update your business and personal information</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="form-card">
          {errorMsg && (
            <div className="error-banner">
              <Icon name="close" size={16} color="var(--color-error)" strokeWidth={1.75} />
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="success-banner">
              <Icon name="check" size={16} color="var(--color-success)" strokeWidth={2.5} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="section">
              <h3 className="section-title">
                <Icon name="user" size={18} color="var(--color-accent)" strokeWidth={1.75} />
                Personal Information
              </h3>
              <p className="section-subtitle">Update your personal details</p>

              <div className="avatar-section">
                <div className="avatar-wrapper">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile.full_name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                  >
                    <Icon name="camera" size={14} color="var(--color-text-secondary)" strokeWidth={1.75} />
                    Upload Photo
                  </button>
                  <p className="hint-text">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Icon name="phone" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="e.g., 0999123456"
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Icon name="mapPin" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
                  Location
                </label>
                <input
                  type="text"
                  name="location_text"
                  value={profile.location_text}
                  onChange={handleProfileChange}
                  className="form-input"
                  placeholder="e.g., Mitundu Trading Centre"
                  autoComplete="address-level2"
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="section">
              <h3 className="section-title">
                <Icon name="store" size={18} color="var(--color-accent)" strokeWidth={1.75} />
                Business Information
              </h3>
              <p className="section-subtitle">Update your business details</p>

              <div className="avatar-section">
                <div className="avatar-wrapper">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="logo-avatar" />
                  ) : (
                    <div className="logo-placeholder">🏪</div>
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="upload-btn"
                  >
                    <Icon name="camera" size={14} color="var(--color-text-secondary)" strokeWidth={1.75} />
                    Upload Logo
                  </button>
                  <p className="hint-text">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Business Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="business_name"
                  value={business.business_name}
                  onChange={handleBusinessChange}
                  className="form-input"
                  placeholder="Your business name"
                  autoComplete="organization"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Icon name="tag" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
                  Category <span className="required">*</span>
                </label>
                <select
                  name="category"
                  value={business.category}
                  onChange={handleBusinessChange}
                  className="form-select"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={business.description}
                  onChange={handleBusinessChange}
                  className="form-textarea"
                  placeholder="Describe what products or services you offer..."
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">
                    <Icon name="phone" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
                    Business Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={business.phone}
                    onChange={handleBusinessChange}
                    className="form-input"
                    placeholder="e.g., 0999123456"
                    autoComplete="tel"
                  />
                </div>
                <div className="form-group half">
                  <label className="form-label">
                    <Icon name="mapPin" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
                    Business Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={business.address}
                    onChange={handleBusinessChange}
                    className="form-input"
                    placeholder="e.g., Mitundu Trading Centre"
                    autoComplete="address-line1"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={saving}>
              <Icon name="save" size={18} color="var(--color-text-inverse)" strokeWidth={1.75} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
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
            const active = item.id === 'profile';
            return (
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .edit-profile {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .edit-profile { padding-bottom: 0; }
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== PAGE HEADER ===== */
        .page-header { margin-bottom: 24px; }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: var(--color-surface-alt);
          border-color: var(--color-border-strong);
        }

        .header-content { margin-top: 12px; }

        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: var(--color-accent-tint);
          border-radius: var(--radius-2xl);
          margin-bottom: 8px;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: clamp(24px, 2.8vw, 28px);
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
        }

        /* ===== FORM CARD ===== */
        .form-card {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: 20px;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xs);
        }

        /* ===== SECTION ===== */
        .section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .section:last-of-type {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-subtitle {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0 0 16px;
        }

        /* ===== FORM GROUP ===== */
        .form-group { margin-bottom: 14px; }

        .form-group:last-of-type { margin-bottom: 0; }

        .form-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 4px;
        }

        .required { color: var(--color-error); }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          font-size: 14px;
          color: var(--color-text);
          outline: none;
          background: var(--color-surface);
          font-family: inherit;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
        }

        .form-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .form-row .half {
          flex: 1;
          min-width: 140px;
        }

        /* ===== AVATAR ===== */
        .avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .avatar-wrapper { position: relative; }

        .avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          background: var(--color-surface-alt);
          border: 2px solid var(--color-border);
        }

        .avatar-placeholder {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          color: var(--color-accent);
          border: 2px solid var(--color-border);
        }

        .logo-avatar {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-xl);
          object-fit: cover;
          background: var(--color-surface-alt);
          border: 2px solid var(--color-border);
        }

        .logo-placeholder {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-xl);
          background: var(--color-accent-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          border: 2px solid var(--color-border);
        }

        .upload-btn {
          padding: 6px 16px;
          background: var(--color-surface-alt);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          transition: all 0.2s;
        }

        .upload-btn:hover {
          background: var(--color-border);
          border-color: var(--color-border-strong);
        }

        .hint-text {
          font-size: 11px;
          color: var(--color-text-muted);
          margin: 4px 0 0;
        }

        /* ===== BANNERS ===== */
        .error-banner {
          color: var(--color-error);
          font-size: 13px;
          padding: 10px 14px;
          background: var(--color-error-bg);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-error);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .success-banner {
          color: var(--color-success);
          font-size: 13px;
          padding: 10px 14px;
          background: var(--color-success-bg);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        /* ===== SUBMIT BUTTON ===== */
        .submit-btn {
          width: 100%;
          padding: 12px;
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-xl);
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text-inverse);
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          margin-top: 8px;
          min-height: 48px;
          box-shadow: var(--shadow-primary);
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-accent);
          transform: scale(0.98);
          box-shadow: var(--shadow-accent);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== BOTTOM NAV ===== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 8px;
          z-index: 100;
        }

        .nav-btn {
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

        .nav-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .nav-label.active {
          color: var(--color-text);
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .form-row { flex-direction: column; }
          .form-row .half { min-width: 100%; }
          .form-card { padding: 16px; }
          .avatar-section { gap: 12px; }
          .avatar, .avatar-placeholder, .logo-avatar, .logo-placeholder {
            width: 60px;
            height: 60px;
          }
          .page-title { font-size: 22px; }
          .header-icon {
            width: 40px;
            height: 40px;
          }
          .header-icon svg {
            width: 22px;
            height: 22px;
          }
        }

        @media (max-width: 380px) {
          .main-content { padding: 12px 12px 32px; }
          .form-card { padding: 14px; }
          .page-title { font-size: 20px; }
          .submit-btn {
            font-size: 14px;
            padding: 10px;
            min-height: 44px;
          }
          .avatar, .avatar-placeholder, .logo-avatar, .logo-placeholder {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>
    </div>
  );
};

export default EditProfile;