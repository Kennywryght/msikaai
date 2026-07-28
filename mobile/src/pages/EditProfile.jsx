import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { profileAPI, businessAPI } from '../services/api';

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
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a3 3 0 100-6 3 3 0 000 6z",
  check: "M20 6L9 17l-5-5",
  close: "M18 6L6 18M6 6l12 12",
  save: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8",
  building: "M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"
};

const EditProfile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch profile
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

      // Fetch business
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
      setError('Failed to load profile data');
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
    setError('');
    setSuccess('');

    try {
      // Update profile
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

      // Update business
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

      setSuccess('✅ Profile updated successfully!');
      
      // Refresh data after 2 seconds
      setTimeout(() => {
        fetchData();
      }, 2000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px'
    },
    card: {
      maxWidth: '700px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid #e2e8f0'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#f1f5f9',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#334155',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '20px',
      transition: 'background-color 0.2s'
    },
    backButtonHover: {
      backgroundColor: '#e2e8f0'
    },
    title: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#0f172a',
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      margin: '0 0 24px 0'
    },
    section: {
      marginBottom: '24px',
      paddingBottom: '24px',
      borderBottom: '1px solid #e2e8f0'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    sectionSubtitle: {
      fontSize: '13px',
      color: '#64748b',
      margin: '0 0 16px 0'
    },
    formGroup: {
      marginBottom: '16px'
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '4px'
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      transition: 'border-color 0.15s'
    },
    inputFocus: {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 3px rgba(37,99,235,0.1)'
    },
    textarea: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: '80px',
      transition: 'border-color 0.15s'
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit'
    },
    row: {
      display: 'flex',
      gap: '12px'
    },
    half: {
      flex: 1
    },
    avatarSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    avatarWrapper: {
      position: 'relative'
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      objectFit: 'cover',
      backgroundColor: '#e2e8f0',
      border: '2px solid #e2e8f0'
    },
    avatarPlaceholder: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      backgroundColor: '#dbeafe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
      color: '#2563eb',
      border: '2px solid #e2e8f0'
    },
    uploadBtn: {
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
      transition: 'background-color 0.2s'
    },
    uploadBtnHover: {
      backgroundColor: '#e2e8f0'
    },
    error: {
      color: '#dc2626',
      padding: '12px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    success: {
      color: '#16a34a',
      padding: '12px',
      backgroundColor: '#ecfdf5',
      borderRadius: '8px',
      border: '1px solid #a7f3d0',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    submitBtn: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'background-color 0.2s'
    },
    submitBtnHover: {
      backgroundColor: '#1d4ed8'
    },
    submitDisabled: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#93c5fd',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'not-allowed',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    loadingContainer: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      backgroundColor: '#f1f5f9'
    },
    spinner: {
      width: '44px',
      height: '44px',
      border: '4px solid #cbd5e1',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    hint: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '4px'
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ color: '#64748b', fontWeight: '500' }}>Loading your profile...</p>
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
      <div style={styles.card}>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard')} 
          style={styles.backButton}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        >
          <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
          Back to Dashboard
        </button>

        <h1 style={styles.title}>
          <SketchIcon d={ICONS.user} size={24} color="#2563eb" strokeWidth={2} />
          Edit Profile
        </h1>
        <p style={styles.subtitle}>Update your business and personal information</p>

        {error && (
          <div style={styles.error}>
            <SketchIcon d={ICONS.close} size={16} color="#dc2626" strokeWidth={2} />
            {error}
          </div>
        )}
        {success && (
          <div style={styles.success}>
            <SketchIcon d={ICONS.check} size={16} color="#16a34a" strokeWidth={2.5} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ========================================== */}
          {/* PERSONAL INFORMATION */}
          {/* ========================================== */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <SketchIcon d={ICONS.user} size={18} color="#2563eb" strokeWidth={2} />
              Personal Information
            </h3>
            <p style={styles.sectionSubtitle}>Update your personal details</p>

            {/* Avatar Upload */}
            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={styles.avatar} />
                ) : (
                  <div style={styles.avatarPlaceholder}>
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
                  style={styles.uploadBtn}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  <SketchIcon d={ICONS.camera} size={14} color="#64748b" strokeWidth={2} />
                  Upload Photo
                </button>
                <p style={styles.hint}>JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleProfileChange}
                style={styles.input}
                placeholder="Your full name"
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                style={styles.input}
                placeholder="e.g., 0999123456"
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <input
                type="text"
                name="location_text"
                value={profile.location_text}
                onChange={handleProfileChange}
                style={styles.input}
                placeholder="e.g., Mitundu Trading Centre"
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>
          </div>

          {/* ========================================== */}
          {/* BUSINESS INFORMATION */}
          {/* ========================================== */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <SketchIcon d={ICONS.store} size={18} color="#2563eb" strokeWidth={2} />
              Business Information
            </h3>
            <p style={styles.sectionSubtitle}>Update your business details</p>

            {/* Logo Upload */}
            <div style={styles.avatarSection}>
              <div style={styles.avatarWrapper}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ ...styles.avatar, borderRadius: '12px' }} />
                ) : (
                  <div style={{ ...styles.avatarPlaceholder, borderRadius: '12px', fontSize: '28px' }}>
                    🏪
                  </div>
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
                  style={styles.uploadBtn}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                >
                  <SketchIcon d={ICONS.camera} size={14} color="#64748b" strokeWidth={2} />
                  Upload Logo
                </button>
                <p style={styles.hint}>JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Business Name</label>
              <input
                type="text"
                name="business_name"
                value={business.business_name}
                onChange={handleBusinessChange}
                style={styles.input}
                placeholder="Your business name"
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                name="category"
                value={business.category}
                onChange={handleBusinessChange}
                style={styles.select}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                name="description"
                value={business.description}
                onChange={handleBusinessChange}
                style={styles.textarea}
                placeholder="Describe what products or services you offer..."
                onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={styles.row}>
              <div style={styles.half}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Business Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={business.phone}
                    onChange={handleBusinessChange}
                    style={styles.input}
                    placeholder="e.g., 0999123456"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>
              <div style={styles.half}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Business Address</label>
                  <input
                    type="text"
                    name="address"
                    value={business.address}
                    onChange={handleBusinessChange}
                    style={styles.input}
                    placeholder="e.g., Mitundu Trading Centre"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#2563eb'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            style={saving ? styles.submitDisabled : styles.submitBtn}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <SketchIcon d={ICONS.save} size={18} color="#ffffff" strokeWidth={2} />
                Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;