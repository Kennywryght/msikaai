// mobile/src/pages/ProfileSetup.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a3 3 0 100-6 3 3 0 000 6z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
    check: "M20 6L9 17l-5-5",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
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
// CATEGORIES
// ============================================================
const CATEGORIES = [
  { id: 'food', label: 'Food & Groceries', emoji: '🍲' },
  { id: 'clothing', label: 'Clothing & Fashion', emoji: '👕' },
  { id: 'farm', label: 'Farm Inputs', emoji: '🌾' },
  { id: 'construction', label: 'Construction', emoji: '🏗️' },
  { id: 'plumber', label: 'Plumbing', emoji: '🔧' },
  { id: 'electrician', label: 'Electrical', emoji: '⚡' },
  { id: 'carpenter', label: 'Carpentry', emoji: '🔨' },
  { id: 'tailor', label: 'Tailoring', emoji: '🧵' },
  { id: 'salon', label: 'Salon & Barber', emoji: '💇' },
  { id: 'mechanic', label: 'Mechanic', emoji: '🚗' },
  { id: 'electronics', label: 'Electronics', emoji: '📱' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

const LOCATIONS = [
  'Mitundu Trading Centre',
  'Mitundu Bunda',
  'Mitundu Chimbiri',
  'Mitundu Motolosi',
  'Mitundu Nkhoma',
  'Mitundu Town',
  'Mitundu Rural',
  'Other',
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const ProfileSetup = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    businessName: '',
    category: '',
    location: '',
    description: '',
    phone: '',
  });

  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.businessName.trim()) {
        showToast('Please enter a business name', 'warning');
        return;
      }
      if (!formData.category) {
        showToast('Please select a category', 'warning');
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };

  // Skipping should actually skip. Previously this just navigated
  // to /landing without ever marking onboarding_completed, which
  // meant the ProtectedRoute gate in App.jsx would immediately
  // bounce the user right back to /role-selection — so "skip"
  // didn't skip anything. Now it marks onboarding as done first.
  const handleSkip = async () => {
    try {
      if (updateProfile) {
        await updateProfile({ onboarding_completed: true });
      }
    } catch (err) {
      console.error('Error skipping profile setup:', err);
    }
    navigate('/landing', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        userId: user?.id,
        businessName: formData.businessName,
        category: formData.category,
        location: formData.location,
        description: formData.description,
        phone: formData.phone,
      };

      // Call API to create business
      if (businessAPI?.create) {
        await businessAPI.create(payload);
      } else if (updateProfile) {
        await updateProfile(payload);
      }

      // Mark onboarding as finished regardless of which branch
      // above ran, as a separate call — `payload`'s field names
      // (businessName, category, etc.) match a businesses-table
      // shape, not necessarily the profiles-table columns
      // updateProfile writes to, so onboarding_completed is set
      // explicitly here rather than folded into that payload.
      if (updateProfile) {
        await updateProfile({ onboarding_completed: true });
      }

      success('Profile created! Welcome to Kumsika 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Error creating profile:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup">
      <div className="setup-card">
        {/* Header */}
        <div className="card-header">
          <button className="back-btn" onClick={handleBack}>
            <Icon name="arrowLeft" size={18} color="#64748B" strokeWidth={1.75} />
          </button>
          <div className="header-content">
            <div className="header-badge">
              <Icon name="sparkles" size={14} color="#F59E0B" strokeWidth={1.75} />
              <span>Step {step} of 2</span>
            </div>
            <h1 className="card-title">
              {step === 1 ? 'Set up your profile' : 'Almost there!'}
            </h1>
            <p className="card-subtitle">
              {step === 1
                ? 'Tell buyers and customers about your business'
                : 'Add a few more details to complete your profile'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="step-content">
            {/* Photo Upload */}
            <div className="photo-section">
              <div
                className="photo-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">
                    <Icon name="camera" size={24} color="#94A3B8" strokeWidth={1.5} />
                    <span>Add photo</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <p className="photo-hint">Optional — helps build trust with buyers</p>
            </div>

            {/* Business Name */}
            <div className="form-group">
              <label className="form-label">
                <Icon name="store" size={14} color="#94A3B8" strokeWidth={1.75} />
                Business Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Grace's Groceries"
                autoComplete="organization"
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                <Icon name="tag" size={14} color="#94A3B8" strokeWidth={1.75} />
                Category <span className="required">*</span>
              </label>
              <div className="category-grid">
                {CATEGORIES.slice(0, 8).map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip ${formData.category === cat.label ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.label }))}
                  >
                    <span className="category-emoji">{cat.emoji}</span>
                    <span className="category-label">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">
                <Icon name="mapPin" size={14} color="#94A3B8" strokeWidth={1.75} />
                Location
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select location</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="step-content">
            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Tell customers what products or services you offer..."
                rows={4}
                autoFocus
              />
              <p className="field-hint">Optional — a short description helps customers find you</p>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 0999123456"
                autoComplete="tel"
              />
            </div>

            {/* Summary Card */}
            <div className="summary-card">
              <div className="summary-header">
                <Icon name="check" size={16} color="#10B981" strokeWidth={2.5} />
                <span>Ready to save</span>
              </div>
              <div className="summary-list">
                <div className="summary-item">
                  <span className="summary-key">Business</span>
                  <span className="summary-value">{formData.businessName}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-key">Category</span>
                  <span className="summary-value">{formData.category}</span>
                </div>
                {formData.location && (
                  <div className="summary-item">
                    <span className="summary-key">Location</span>
                    <span className="summary-value">{formData.location}</span>
                  </div>
                )}
                {formData.phone && (
                  <div className="summary-item">
                    <span className="summary-key">Phone</span>
                    <span className="summary-value">{formData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Note */}
            <div className="trust-note">
              <Icon name="shield" size={16} color="#3B82F6" strokeWidth={1.75} />
              <span>Your information is only shared with interested buyers</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          {step === 1 ? (
            <>
              <button
                className={`continue-btn ${formData.businessName && formData.category ? 'active' : ''}`}
                onClick={handleNext}
                disabled={!formData.businessName || !formData.category}
              >
                Continue
                <Icon name="arrowRight" size={16} color="#FFFFFF" strokeWidth={2} />
              </button>
              <button className="skip-btn" onClick={handleSkip}>
                Skip for now
              </button>
            </>
          ) : (
            <>
              <button
                className={`continue-btn ${loading ? '' : 'active'}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Icon name="check" size={16} color="#FFFFFF" strokeWidth={2.5} />
                  </>
                )}
              </button>
              <button className="skip-btn" onClick={handleSkip}>
                Do this later
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .profile-setup {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
        }

        /* ===== CARD ===== */
        .setup-card {
          max-width: 520px;
          width: 100%;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px 24px 28px;
          border: 1px solid #F1F5F9;
          box-shadow: 0 4px 24px rgba(30, 41, 59, 0.04);
          animation: fadeInUp 0.5s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ===== HEADER ===== */
        .card-header {
          margin-bottom: 20px;
        }

        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          margin-bottom: 12px;
        }

        .back-btn:hover {
          background: #F1F5F9;
        }

        .header-content {
          text-align: center;
        }

        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.08);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #F59E0B;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .card-title {
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 6px;
          font-family: 'Georgia', serif;
          letter-spacing: -0.02em;
        }

        .card-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
          line-height: 1.5;
          max-width: 360px;
          margin: 0 auto;
        }

        /* ===== PROGRESS ===== */
        .progress-bar {
          margin-bottom: 22px;
        }

        .progress-track {
          width: 100%;
          height: 4px;
          background: #F1F5F9;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #F59E0B, #D97706);
          border-radius: 2px;
          transition: width 0.4s ease;
        }

        /* ===== STEP CONTENT ===== */
        .step-content {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ===== PHOTO UPLOAD ===== */
        .photo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }

        .photo-upload {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          border: 2px dashed #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s;
          background: #F8FAFC;
        }

        .photo-upload:hover {
          border-color: #F59E0B;
          background: #FEFCF5;
        }

        .photo-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #94A3B8;
          font-size: 11px;
        }

        .photo-hint {
          font-size: 12px;
          color: #94A3B8;
          margin: 8px 0 0;
          text-align: center;
        }

        /* ===== FORM ===== */
        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .required {
          color: #EF4444;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 11px 14px;
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
          min-height: 90px;
          line-height: 1.5;
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px;
        }

        .field-hint {
          font-size: 12px;
          color: #94A3B8;
          margin: 6px 0 0;
        }

        /* ===== CATEGORY GRID ===== */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .category-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          text-align: left;
        }

        .category-chip:hover {
          border-color: #CBD5E1;
          background: #F8FAFC;
        }

        .category-chip.active {
          border-color: #F59E0B;
          background: rgba(245, 158, 11, 0.04);
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.06);
        }

        .category-emoji {
          font-size: 16px;
          flex-shrink: 0;
        }

        .category-label {
          font-size: 12px;
          font-weight: 500;
          color: #475569;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-chip.active .category-label {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== SUMMARY ===== */
        .summary-card {
          background: #F8FAFC;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #F1F5F9;
          margin-bottom: 12px;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #10B981;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid #E2E8F0;
        }

        .summary-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 13px;
        }

        .summary-key {
          color: #94A3B8;
          flex-shrink: 0;
        }

        .summary-value {
          color: #1E293B;
          font-weight: 500;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ===== TRUST NOTE ===== */
        .trust-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(59, 130, 246, 0.06);
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.12);
          font-size: 12px;
          color: #1E40AF;
          line-height: 1.4;
        }

        /* ===== ACTIONS ===== */
        .actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 20px;
        }

        .continue-btn {
          width: 100%;
          padding: 14px;
          background: #E2E8F0;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #94A3B8;
          cursor: not-allowed;
          transition: all 0.25s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 50px;
        }

        .continue-btn.active {
          background: #1E293B;
          color: #FFFFFF;
          cursor: pointer;
        }

        .continue-btn.active:hover:not(:disabled) {
          background: #F59E0B;
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
        }

        .continue-btn:disabled {
          cursor: not-allowed;
        }

        .skip-btn {
          width: 100%;
          padding: 10px;
          background: none;
          border: none;
          color: #94A3B8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s;
          text-align: center;
        }

        .skip-btn:hover {
          color: #1E293B;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .setup-card {
            padding: 20px 16px 24px;
            border-radius: 16px;
          }
          .card-title {
            font-size: 20px;
          }
          .category-grid {
            gap: 6px;
          }
          .category-chip {
            padding: 8px 10px;
            gap: 6px;
          }
          .category-label {
            font-size: 11px;
          }
        }

        @media (max-width: 380px) {
          .card-title {
            font-size: 18px;
          }
          .card-subtitle {
            font-size: 13px;
          }
          .photo-upload {
            width: 76px;
            height: 76px;
          }
          .continue-btn {
            padding: 12px;
            font-size: 14px;
            min-height: 44px;
          }
          .category-chip {
            padding: 6px 8px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .setup-card,
          .step-content {
            animation: none;
          }
          .photo-upload,
          .category-chip,
          .continue-btn,
          .progress-fill {
            transition: none;
          }
          .continue-btn.active:hover:not(:disabled) {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileSetup;