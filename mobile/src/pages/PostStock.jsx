// mobile/src/pages/PostStock.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    check: "M20 6L9 17l-5-5",
    x: "M18 6L6 18M6 6l12 12",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a3 3 0 100-6 3 3 0 000 6z",
    image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
    dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    trendingUp: "M23 6l-9.5 9.5-5-5L1 18",
    checkCircle: "M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  };

  const d = icons[name] || icons.store;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
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

// NOTE: category colors are per-category identity markers used inline.
// Intentionally NOT tokenized (same treatment as RoleSelection/CategoryBrowse).
const QUICK_CATEGORIES = [
  { id: 'produce', label: 'Produce', emoji: '🥬', color: '#10B981' },
  { id: 'grains', label: 'Grains', emoji: '🌾', color: '#F59E0B' },
  { id: 'dairy', label: 'Dairy & Eggs', emoji: '🥚', color: '#F97316' },
  { id: 'meat', label: 'Meat & Fish', emoji: '🐟', color: '#EF4444' },
  { id: 'clothing', label: 'Clothing', emoji: '👕', color: '#EC4899' },
  { id: 'household', label: 'Household', emoji: '🏠', color: '#8B5CF6' },
  { id: 'hardware', label: 'Hardware', emoji: '🔧', color: '#3B82F6' },
  { id: 'other', label: 'Other', emoji: '✨', color: '#64748B' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const PostStock = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const [formData, setFormData] = useState({
    category: '',
    itemName: '',
    price: '',
    quantity: '',
    unit: '',
    note: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const fetchBusinesses = async () => {
    if (!user?.id) return;
    try {
      const response = await businessAPI.getByUser(user.id);
      if (response.data?.business) {
        setBusinesses([response.data.business]);
        setSelectedBusiness(response.data.business.id);
      } else if (Array.isArray(response.data?.businesses)) {
        setBusinesses(response.data.businesses);
        if (response.data.businesses.length > 0) {
          setSelectedBusiness(response.data.businesses[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      showToast('Please select a category', 'warning');
      return;
    }
    if (!formData.itemName.trim()) {
      showToast('Please enter an item name', 'warning');
      return;
    }
    if (!formData.price) {
      showToast('Please enter a price', 'warning');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      setSubmitted(true);
      success('Posted to Today\'s Board! 🎉');
    } catch (err) {
      console.error('Error posting stock:', err);
      showToast('Failed to post stock. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      category: '',
      itemName: '',
      price: '',
      quantity: '',
      unit: '',
      note: '',
    });
    setPhoto(null);
    setPhotoPreview(null);
    setSubmitted(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  // Success state
  if (submitted) {
    return (
      <div className="post-stock">
        <div className="success-screen">
          <div className="success-icon-wrap">
            <Icon name="check" size={40} color="var(--color-text-inverse)" strokeWidth={3} />
          </div>
          <h1 className="success-title">Posted!</h1>
          <p className="success-desc">
            Your stock is now visible on Today's Board. Buyers in Mitundu can see it.
          </p>

          <div className="success-preview">
            <div className="preview-item">
              <span className="preview-key">Item</span>
              <span className="preview-value">{formData.itemName}</span>
            </div>
            <div className="preview-item">
              <span className="preview-key">Price</span>
              <span className="preview-value">MK {Number(formData.price).toLocaleString()}</span>
            </div>
            {formData.quantity && (
              <div className="preview-item">
                <span className="preview-key">Quantity</span>
                <span className="preview-value">
                  {formData.quantity} {formData.unit || 'units'}
                </span>
              </div>
            )}
          </div>

          <div className="success-actions">
            <button className="success-btn primary" onClick={() => navigate('/price-board')}>
              <Icon name="trendingUp" size={16} color="var(--color-text-inverse)" strokeWidth={2} />
              View Board
            </button>
            <button className="success-btn secondary" onClick={handleReset}>
              <Icon name="plus" size={16} color="var(--color-text-secondary)" strokeWidth={2} />
              Post More
            </button>
          </div>

          <p className="success-note">
            <Icon name="info" size={12} color="var(--color-text-muted)" strokeWidth={1.75} />
            Auto-expires at end of day
          </p>
        </div>

        <style jsx>{`
          .post-stock {
            min-height: 100vh;
            background: var(--color-bg);
            background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
            background-size: 22px 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            font-family: var(--font-sans);
          }

          .success-screen {
            max-width: 400px;
            width: 100%;
            background: var(--color-surface);
            border-radius: var(--radius-3xl);
            padding: 40px 28px;
            text-align: center;
            border: 1px solid var(--color-border);
            box-shadow: var(--shadow-md);
            animation: scaleIn 0.4s ease-out;
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          .success-icon-wrap {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: var(--color-success);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
            animation: pulseSuccess 1s ease-out;
          }

          @keyframes pulseSuccess {
            0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3); }
          }

          .success-title {
            font-family: var(--font-serif);
            font-size: 26px;
            font-weight: 600;
            color: var(--color-text);
            margin: 0 0 8px;
          }

          .success-desc {
            font-size: 14px;
            color: var(--color-text-muted);
            margin: 0 0 20px;
            line-height: 1.6;
          }

          .success-preview {
            background: var(--color-surface-alt);
            border-radius: var(--radius-xl);
            padding: 16px;
            margin-bottom: 20px;
            text-align: left;
            border: 1px solid var(--color-border);
          }

          .preview-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 13px;
          }

          .preview-item + .preview-item {
            border-top: 1px solid var(--color-border);
          }

          .preview-key {
            color: var(--color-text-muted);
            font-weight: 500;
          }

          .preview-value {
            color: var(--color-text);
            font-weight: 700;
          }

          .success-actions {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }

          .success-btn {
            flex: 1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
            border-radius: var(--radius-xl);
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
            min-height: 44px;
          }

          .success-btn.primary {
            background: var(--color-primary);
            border: none;
            color: var(--color-text-inverse);
            box-shadow: var(--shadow-primary);
          }

          .success-btn.primary:hover {
            background: var(--color-accent);
            transform: scale(0.98);
          }

          .success-btn.secondary {
            background: var(--color-surface-alt);
            border: 1px solid var(--color-border);
            color: var(--color-text-secondary);
          }

          .success-btn.secondary:hover {
            background: var(--color-border);
          }

          .success-note {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 11px;
            color: var(--color-text-muted);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="post-stock">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="var(--color-text)" strokeWidth={1.75} />
          </button>
          <button className="skip-btn" onClick={() => navigate('/price-board')}>
            Skip
          </button>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="sparkles" size={14} color="var(--color-accent)" strokeWidth={1.75} />
            <span>Quick Post</span>
          </div>
          <h1 className="page-title">Post Today's Stock</h1>
          <p className="page-subtitle">
            Share what you have available today. Auto-expires at end of day.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="main-content">
        {/* Photo Upload */}
        <div className="form-group">
          <label className="form-label">
            <Icon name="camera" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
            Photo <span className="optional">(optional)</span>
          </label>
          <div
            className="upload-area"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            {photoPreview ? (
              <div className="photo-preview-wrap">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
                <button
                  type="button"
                  className="remove-photo-btn"
                  onClick={handleRemovePhoto}
                >
                  <Icon name="x" size={14} color="var(--color-text-inverse)" strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Icon name="camera" size={28} color="var(--color-text-muted)" strokeWidth={1.5} />
                <span className="upload-text">Add a photo</span>
                <span className="upload-hint">One clear photo helps buyers</span>
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">
            <Icon name="tag" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
            Category <span className="required">*</span>
          </label>
          <div className="category-grid">
            {QUICK_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`category-chip ${formData.category === cat.id ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                style={formData.category === cat.id ? {
                  background: `${cat.color}15`,
                  borderColor: cat.color
                } : {}}
              >
                <span className="category-emoji">{cat.emoji}</span>
                <span className="category-label" style={
                  formData.category === cat.id ? { color: cat.color, fontWeight: 700 } : {}
                }>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Item Name */}
        <div className="form-group">
          <label className="form-label">
            <Icon name="store" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
            Item Name <span className="required">*</span>
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Fresh Tomatoes"
            autoComplete="off"
          />
        </div>

        {/* Price */}
        <div className="form-group">
          <label className="form-label">
            <Icon name="dollar" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
            Price (MK) <span className="required">*</span>
          </label>
          <div className="price-input-wrap">
            <span className="price-prefix">MK</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="form-input price-input"
              placeholder="0"
              autoComplete="off"
            />
          </div>
          {formData.price && (
            <p className="field-hint">
              Buyers will see: <strong>MK {Number(formData.price).toLocaleString()}</strong>
            </p>
          )}
        </div>

        {/* Quantity & Unit */}
        <div className="form-row">
          <div className="form-group half">
            <label className="form-label">
              <Icon name="layers" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 10"
              autoComplete="off"
            />
          </div>
          <div className="form-group half">
            <label className="form-label">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">Select unit</option>
              <option value="kg">kg</option>
              <option value="bag">bag</option>
              <option value="basket">basket</option>
              <option value="piece">piece</option>
              <option value="bunch">bunch</option>
              <option value="crate">crate</option>
              <option value="other">other</option>
            </select>
          </div>
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">
            <Icon name="message" size={14} color="var(--color-text-muted)" strokeWidth={1.75} />
            Note <span className="optional">(optional)</span>
          </label>
          <textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            className="form-textarea"
            placeholder="e.g., Fresh from the garden this morning"
            rows={2}
            maxLength={150}
          />
          <p className="field-hint">{formData.note.length}/150</p>
        </div>

        {/* Info Note */}
        <div className="info-note">
          <Icon name="info" size={14} color="var(--color-warning)" strokeWidth={1.75} />
          <span>This post will appear on <strong>Today's Board</strong> and expire at midnight</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="submit-btn"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Posting...
            </>
          ) : (
            <>
              <Icon name="checkCircle" size={18} color="var(--color-text-inverse)" strokeWidth={2} />
              Post to Board
            </>
          )}
        </button>
      </form>

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
            const active = item.id === 'sell';
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
        .post-stock {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .post-stock { padding-bottom: 40px; }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: var(--color-surface);
          padding: 14px 16px 20px;
          border-bottom: 1px solid var(--color-border);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }

        .header-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-lg);
          border: none;
          background: var(--color-surface-alt);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-btn:hover { background: var(--color-border); }

        .skip-btn {
          padding: 6px 14px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .skip-btn:hover {
          color: var(--color-text);
          background: var(--color-surface-alt);
        }

        .header-content {
          max-width: 560px;
          margin: 0 auto;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--color-accent-tint);
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          color: var(--color-accent);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 600;
          color: var(--color-text);
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--color-text-muted);
          margin: 0;
          line-height: 1.5;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 560px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== FORM ===== */
        .form-group { margin-bottom: 18px; }

        .form-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }

        .required { color: var(--color-error); }

        .optional {
          color: var(--color-text-muted);
          font-weight: 500;
          font-size: 11px;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
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

        .form-input::placeholder,
        .form-textarea::placeholder { color: var(--color-text-muted); }

        .form-textarea {
          resize: vertical;
          min-height: 70px;
          line-height: 1.5;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }

        .form-row {
          display: flex;
          gap: 12px;
        }

        .form-row .half {
          flex: 1;
          min-width: 0;
        }

        .field-hint {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 6px 0 0;
        }

        .field-hint strong {
          color: var(--color-primary);
          font-weight: 700;
        }

        /* Price Input */
        .price-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .price-prefix {
          position: absolute;
          left: 14px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .price-input { padding-left: 48px; }

        /* ===== PHOTO UPLOAD ===== */
        .upload-area {
          border: 2px dashed var(--color-border-strong);
          border-radius: var(--radius-2xl);
          padding: 24px;
          text-align: center;
          cursor: pointer;
          background: var(--color-surface);
          transition: all 0.2s;
          min-height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-area:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-soft);
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-top: 4px;
        }

        .upload-hint {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .photo-preview-wrap {
          position: relative;
          width: 100%;
          max-width: 200px;
        }

        .photo-preview {
          width: 100%;
          max-height: 180px;
          object-fit: cover;
          border-radius: var(--radius-lg);
        }

        .remove-photo-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid var(--color-surface);
          background: var(--color-error);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-error);
          transition: all 0.2s;
        }

        .remove-photo-btn:hover { transform: scale(1.1); }

        /* ===== CATEGORIES ===== */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .category-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          text-align: left;
          min-height: 52px;
        }

        .category-chip:hover {
          border-color: var(--color-border-strong);
          background: var(--color-surface-alt);
        }

        .category-chip.active {
          font-weight: 600;
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .category-emoji {
          font-size: 18px;
          flex-shrink: 0;
        }

        .category-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ===== INFO NOTE ===== */
        .info-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          background: var(--color-warning-bg);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          font-size: 12px;
          color: var(--color-warning);
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .info-note strong { font-weight: 700; }

        /* ===== SUBMIT ===== */
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: var(--color-primary);
          border: none;
          border-radius: var(--radius-xl);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-inverse);
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
          box-shadow: var(--shadow-primary);
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-accent);
          transform: scale(0.98);
          box-shadow: var(--shadow-accent);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--color-text-inverse);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

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
          .page-header { padding: 12px 12px 16px; }
          .main-content { padding: 16px 12px 40px; }
          .page-title { font-size: 20px; }
          .category-chip { padding: 10px; min-height: 48px; }
          .category-emoji { font-size: 16px; }
          .category-label { font-size: 12px; }
        }

        @media (max-width: 380px) {
          .form-row { flex-direction: column; gap: 18px; }
          .form-row .half { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .category-chip, .upload-area, .submit-btn, .remove-photo-btn, .header-btn { transition: none; }
          .submit-btn:hover:not(:disabled), .remove-photo-btn:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default PostStock;