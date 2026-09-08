// mobile/src/pages/AdGenerator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { adAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

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
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  copy: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

const AdGenerator = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [productInfo, setProductInfo] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    unit: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const fileInputRef = useRef();

  const isMobile = windowWidth <= 768;

  const categories = [
    'Farm Inputs',
    'Construction Materials',
    'Plumber',
    'Electrician',
    'Carpenter',
    'Mechanic',
    'Retail',
    'Restaurant',
    'Tailor',
    'Hairdresser',
    'Other'
  ];

  useEffect(() => {
    const titleInput = document.querySelector('input[name="title"]');
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 100);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAd = async () => {
    if (!image) {
      setErrorMsg('Please select an image first');
      showToast('Please select an image first', 'error');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('productInfo', JSON.stringify(productInfo));

      const response = await adAPI.generate(formData);
      
      if (response.data.success) {
        setResult(response.data);
        success('🎨 Ad generated successfully!');
      } else {
        const errMsg = response.data.error || 'Failed to generate ad';
        setErrorMsg(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to generate ad';
      setErrorMsg(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setResult(null);
    setProductInfo({
      title: '',
      description: '',
      category: '',
      price: '',
      unit: ''
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setTimeout(() => {
      const titleInput = document.querySelector('input[name="title"]');
      if (titleInput) titleInput.focus();
    }, 100);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success('📋 Copied to clipboard!');
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Generating your ad..." />;
  }

  return (
    <div className="ad-generator">
      {/* Navbar */}
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link to="/landing" className="logo">
            <span className="logo-icon">K</span>
            <span className="logo-text">Kumsika</span>
          </Link>
          <div className="nav-actions">
            <span className="greeting">👋 {user?.email?.split('@')[0] || 'User'}</span>
            <button onClick={handleLogout} className="logout-btn">
              <Icon d={ICONS.logout} size={16} color="#EF4444" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <Icon d={ICONS.arrowLeft} size={16} color="#64748B" strokeWidth={1.75} />
            Back
          </button>
          <div className="header-content">
            <div className="header-icon">
              <Icon d={ICONS.sparkles} size={28} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <h1 className="page-title">AI Ad Generator</h1>
            <p className="page-subtitle">Upload a product image and let AI create a professional ad</p>
          </div>
        </div>

        {/* Main Form */}
        <div className="form-card">
          {/* Image Upload */}
          <div className="form-group">
            <label className="form-label">
              <Icon d={ICONS.image} size={14} color="#94A3B8" strokeWidth={1.75} />
              Product Image <span className="required">*</span>
            </label>
            <div 
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                aria-label="Upload product image"
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="preview-image" />
              ) : (
                <div className="upload-placeholder">
                  <Icon d={ICONS.upload} size={48} color="#94A3B8" strokeWidth={1.5} />
                  <p className="upload-text">Click to upload product image</p>
                  <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="form-group">
            <label className="form-label">Product Title</label>
            <input
              type="text"
              name="title"
              value={productInfo.title}
              onChange={(e) => setProductInfo({ ...productInfo, title: e.target.value })}
              className="form-input"
              placeholder="e.g., Fresh Tomatoes"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={productInfo.description}
              onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })}
              className="form-textarea"
              placeholder="Brief description of your product..."
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">
                <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
                Category
              </label>
              <select
                value={productInfo.category}
                onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                className="form-select"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group half">
              <label className="form-label">
                <Icon d={ICONS.dollar} size={14} color="#94A3B8" strokeWidth={1.75} />
                Price (MWK)
              </label>
              <input
                type="number"
                value={productInfo.price}
                onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })}
                className="form-input"
                placeholder="e.g., 5000"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Unit</label>
            <input
              type="text"
              value={productInfo.unit}
              onChange={(e) => setProductInfo({ ...productInfo, unit: e.target.value })}
              className="form-input"
              placeholder="e.g., bag, kg, piece"
              autoComplete="off"
            />
          </div>

          {errorMsg && (
            <div className="error-banner">
              <Icon d={ICONS.close} size={16} color="#EF4444" strokeWidth={1.75} />
              {errorMsg}
            </div>
          )}

          <button 
            className="generate-btn" 
            onClick={handleGenerateAd}
            disabled={loading || !image}
          >
            <Icon d={ICONS.sparkles} size={18} color="#FFFFFF" strokeWidth={1.75} />
            {loading ? 'Generating...' : 'Generate Ad'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="result-card">
            <div className="result-header">
              <Icon d={ICONS.sparkles} size={20} color="#F59E0B" strokeWidth={1.75} />
              <h3 className="result-title">Your AI-Generated Ad</h3>
            </div>

            <div className="ad-preview">
              <h3 className="ad-headline">{result.ad?.headline || result.ad?.title}</h3>
              <p className="ad-description">{result.ad?.fullCopy || result.ad?.description}</p>
              <p className="ad-cta">{result.ad?.cta || result.ad?.callToAction}</p>
              <div className="ad-points">
                {result.ad?.sellingPoints?.map((point, index) => (
                  <span key={index} className="ad-point">
                    ✓ {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="social-section">
              <h4 className="social-title">📱 Social Media Posts</h4>
              
              {result.socialPosts?.facebook && (
                <div className="social-card facebook">
                  <div className="social-header">
                    <span className="social-label">📘 Facebook</span>
                    <button onClick={() => copyToClipboard(result.socialPosts.facebook)} className="copy-btn">
                      <Icon d={ICONS.copy} size={12} color="#FFFFFF" strokeWidth={1.75} />
                      Copy
                    </button>
                  </div>
                  <p className="social-text">{result.socialPosts.facebook}</p>
                </div>
              )}

              {result.socialPosts?.whatsapp && (
                <div className="social-card whatsapp">
                  <div className="social-header">
                    <span className="social-label">💬 WhatsApp</span>
                    <button onClick={() => copyToClipboard(result.socialPosts.whatsapp)} className="copy-btn">
                      <Icon d={ICONS.copy} size={12} color="#FFFFFF" strokeWidth={1.75} />
                      Copy
                    </button>
                  </div>
                  <p className="social-text">{result.socialPosts.whatsapp}</p>
                </div>
              )}
            </div>

            <div className="share-section">
              <p className="share-label">📤 Share This Ad</p>
              <SocialShare 
                title={result.ad?.headline || result.ad?.title || 'Check out this product!'}
                description={result.ad?.fullCopy || result.ad?.description || ''}
                url={window.location.href}
              />
            </div>

            <button onClick={handleReset} className="reset-btn">
              <Icon d={ICONS.close} size={16} color="#64748B" strokeWidth={1.75} />
              Start Over
            </button>
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

      <style jsx>{`
        .ad-generator {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .ad-generator {
            padding-bottom: 0;
          }
        }

        /* ===== NAVBAR ===== */
        .navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.4);
          transition: all 0.2s;
        }

        .navbar-scrolled {
          box-shadow: 0 2px 16px rgba(0,0,0,0.04);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: #1E293B;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #F59E0B;
          font-weight: 700;
          font-size: 16px;
        }

        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          letter-spacing: -0.5px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .greeting {
          font-size: 13px;
          color: #64748B;
          display: none;
        }

        @media (min-width: 640px) {
          .greeting { display: inline; }
        }

        .logout-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #FEF2F2;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #FEE2E2;
        }

        /* ===== MAIN CONTENT ===== */
        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== PAGE HEADER ===== */
        .page-header {
          margin-bottom: 24px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
        }

        .header-content {
          margin-top: 12px;
        }

        .header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 14px;
          margin-bottom: 8px;
        }

        .page-title {
          font-size: clamp(24px, 2.8vw, 28px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          letter-spacing: -0.5px;
        }

        .page-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
        }

        /* ===== FORM CARD ===== */
        .form-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-group:last-of-type {
          margin-bottom: 0;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .required {
          color: #EF4444;
        }

        .form-input,
        .form-textarea,
        .form-select {
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

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .form-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
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

        /* ===== UPLOAD AREA ===== */
        .upload-area {
          border: 2px dashed #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          background: #F8FAFC;
          transition: all 0.2s;
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-area:hover {
          border-color: #F59E0B;
          background: #FEFCF5;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 500;
          color: #64748B;
          margin: 4px 0 0;
        }

        .upload-hint {
          font-size: 12px;
          color: #94A3B8;
          margin: 0;
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 8px;
        }

        /* ===== GENERATE BUTTON ===== */
        .generate-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #1E293B, #F59E0B);
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          margin-top: 16px;
        }

        .generate-btn:hover:not(:disabled) {
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
        }

        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ===== ERROR ===== */
        .error-banner {
          color: #EF4444;
          font-size: 13px;
          padding: 10px 14px;
          background: #FEF2F2;
          border-radius: 10px;
          border: 1px solid #FECACA;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        /* ===== RESULT CARD ===== */
        .result-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid #F1F5F9;
          margin-top: 16px;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .result-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        /* ===== AD PREVIEW ===== */
        .ad-preview {
          background: #F8FAFC;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .ad-headline {
          font-size: 17px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
        }

        .ad-description {
          font-size: 14px;
          color: #64748B;
          margin: 0 0 8px;
          line-height: 1.5;
        }

        .ad-cta {
          font-size: 14px;
          font-weight: 600;
          color: #F59E0B;
          margin: 0 0 8px;
        }

        .ad-points {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ad-point {
          padding: 2px 10px;
          background: #ECFDF5;
          color: #065F46;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        /* ===== SOCIAL SECTION ===== */
        .social-section {
          margin: 16px 0;
        }

        .social-title {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 10px;
        }

        .social-card {
          padding: 12px 14px;
          border-radius: 10px;
          margin-bottom: 10px;
          border: 1px solid #F1F5F9;
          background: #F8FAFC;
        }

        .social-card.facebook {
          border-left: 3px solid #1877F2;
        }

        .social-card.whatsapp {
          border-left: 3px solid #25D366;
        }

        .social-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .social-label {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
        }

        .copy-btn {
          padding: 2px 12px;
          background: #1E293B;
          border: none;
          border-radius: 6px;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          background: #F59E0B;
        }

        .social-text {
          font-size: 13px;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* ===== SHARE SECTION ===== */
        .share-section {
          margin: 16px 0;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
        }

        .share-label {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 10px;
        }

        /* ===== RESET BUTTON ===== */
        .reset-btn {
          width: 100%;
          padding: 10px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .reset-btn:hover {
          background: #E2E8F0;
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
        @media (max-width: 480px) {
          .form-row {
            flex-direction: column;
          }
          .form-row .half {
            min-width: 100%;
          }
          .upload-area {
            min-height: 100px;
            padding: 16px;
          }
          .ad-headline {
            font-size: 15px;
          }
          .social-card {
            padding: 10px 12px;
          }
        }

        @media (max-width: 380px) {
          .main-content {
            padding: 12px 12px 32px;
          }
          .form-card {
            padding: 14px 16px;
          }
          .result-card {
            padding: 14px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default AdGenerator;