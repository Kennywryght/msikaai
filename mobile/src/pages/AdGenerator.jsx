// mobile/src/pages/AdGenerator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/TranslationContext';
import { adAPI } from '../services/api';
import SocialShare from '../components/SocialShare';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

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
  image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  copy: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z",
  close: "M18 6L6 18M6 6l12 12"
};

const AdGenerator = () => {
  const { user } = useAuth();
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
  const fileInputRef = useRef();

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

  // Auto-focus title input on mount
  useEffect(() => {
    const titleInput = document.querySelector('input[name="title"]');
    if (titleInput) {
      setTimeout(() => titleInput.focus(), 100);
    }
  }, []);

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
    // Focus title input after reset
    setTimeout(() => {
      const titleInput = document.querySelector('input[name="title"]');
      if (titleInput) titleInput.focus();
    }, 100);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success('📋 Copied to clipboard!');
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 'clamp(16px, 2vw, 24px) clamp(12px, 2vw, 16px)',
      maxWidth: '800px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: 'clamp(16px, 2vw, 24px)',
      marginBottom: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    },
    backButton: {
      padding: '8px 16px',
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      color: '#334155',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '16px',
      transition: 'all 0.2s'
    },
    title: {
      fontSize: 'clamp(20px, 2.5vw, 22px)',
      fontWeight: '800',
      color: '#0f172a',
      margin: '0 0 4px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subtitle: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#64748b',
      margin: '0 0 20px 0'
    },
    label: {
      display: 'block',
      fontSize: 'clamp(12px, 1vw, 13px)',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '6px'
    },
    input: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      WebkitAppearance: 'none'
    },
    textarea: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: 'clamp(60px, 8vw, 80px)',
      transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    select: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff',
      fontFamily: 'inherit',
      WebkitAppearance: 'none'
    },
    row: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    half: {
      flex: 1,
      minWidth: 'clamp(140px, 40vw, 200px)'
    },
    uploadArea: {
      border: '2px dashed #cbd5e1',
      borderRadius: '12px',
      padding: 'clamp(16px, 2vw, 24px)',
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: '#f8fafc',
      transition: 'all 0.2s ease-in-out'
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: 'clamp(160px, 25vw, 220px)',
      objectFit: 'contain',
      borderRadius: '8px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
    },
    error: {
      color: '#dc2626',
      padding: '12px',
      backgroundColor: '#fef2f2',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginTop: '12px',
      fontSize: 'clamp(13px, 1.1vw, 14px)'
    },
    adPreview: {
      backgroundColor: '#f8fafc',
      padding: 'clamp(14px, 1.5vw, 18px)',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      marginBottom: '16px'
    },
    adTitle: {
      fontSize: 'clamp(16px, 1.6vw, 18px)',
      fontWeight: '700',
      color: '#1e40af',
      margin: '0 0 6px 0'
    },
    adDesc: {
      color: '#334155',
      margin: '0 0 10px 0',
      lineHeight: '1.5',
      fontSize: 'clamp(13px, 1.1vw, 14px)'
    },
    adCTA: {
      color: '#2563eb',
      fontWeight: '600',
      margin: '0 0 8px 0',
      fontSize: 'clamp(13px, 1.1vw, 14px)'
    },
    hashtag: {
      display: 'inline-block',
      padding: '3px 10px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderRadius: '6px',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '500',
      marginRight: '6px',
      marginTop: '4px'
    },
    socialCard: {
      padding: 'clamp(12px, 1.2vw, 14px)',
      borderRadius: '10px',
      marginBottom: '10px',
      border: '1px solid transparent'
    },
    socialHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '6px',
      flexWrap: 'wrap',
      gap: '8px'
    },
    socialLabel: {
      fontWeight: '600',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    copyBtn: {
      padding: '4px 12px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      touchAction: 'manipulation'
    },
    socialText: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#334155',
      margin: 0,
      whiteSpace: 'pre-wrap',
      lineHeight: '1.4',
      wordBreak: 'break-word'
    },
    resetBtn: {
      width: '100%',
      padding: 'clamp(10px, 1.2vw, 12px)',
      backgroundColor: '#f1f5f9',
      color: '#334155',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '16px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      touchAction: 'manipulation'
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    },
    spinner: {
      width: '18px',
      height: '18px',
      border: '2px solid #ffffff',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    shareSection: {
      marginTop: '20px',
      paddingTop: '16px',
      borderTop: '1px solid #e2e8f0'
    },
    shareLabel: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '600',
      color: '#0f172a',
      marginBottom: '10px'
    }
  };

  if (loading) {
    return <LoadingSpinner message="Generating your ad..." />;
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .input-focus:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
      `}</style>

      <button 
        onClick={() => navigate('/dashboard')} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
      >
        <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
        Back to Dashboard
      </button>

      <div style={styles.card}>
        <h2 style={styles.title}>
          <SketchIcon d={ICONS.sparkles} size={24} color="#f59e0b" strokeWidth={2} />
          AI Ad Generator
        </h2>
        <p style={styles.subtitle}>Upload a product image and let AI create a professional ad</p>

        {/* Image Upload */}
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>
            <SketchIcon d={ICONS.image} size={14} color="#64748b" strokeWidth={2} />
            <span style={{ marginLeft: '4px' }}>Product Image</span>
            <span style={{ color: '#dc2626' }}> *</span>
          </label>
          <div
            style={styles.uploadArea}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
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
              <img src={imagePreview} alt="Preview" style={styles.previewImage} />
            ) : (
              <div>
                <SketchIcon d={ICONS.image} size={48} color="#94a3b8" strokeWidth={1.5} />
                <p style={{ color: '#64748b', marginTop: '8px', fontWeight: '500', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>
                  Click to upload product image
                </p>
                <p style={{ color: '#94a3b8', fontSize: 'clamp(11px, 0.9vw, 12px)' }}>
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>Product Title</label>
          <input
            type="text"
            name="title"
            value={productInfo.title}
            onChange={(e) => setProductInfo({ ...productInfo, title: e.target.value })}
            style={styles.input}
            placeholder="e.g., Fresh Tomatoes"
            className="input-focus"
            autoComplete="off"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>Description</label>
          <textarea
            value={productInfo.description}
            onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })}
            style={styles.textarea}
            placeholder="Brief description of your product..."
            className="input-focus"
          />
        </div>

        <div style={styles.row}>
          <div style={styles.half}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>
                <SketchIcon d={ICONS.tag} size={14} color="#64748b" strokeWidth={2} />
                <span style={{ marginLeft: '4px' }}>Category</span>
              </label>
              <select
                value={productInfo.category}
                onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                style={styles.select}
                className="input-focus"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.half}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>
                <SketchIcon d={ICONS.dollar} size={14} color="#64748b" strokeWidth={2} />
                <span style={{ marginLeft: '4px' }}>Price (MWK)</span>
              </label>
              <input
                type="number"
                value={productInfo.price}
                onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })}
                style={styles.input}
                placeholder="e.g., 5000"
                className="input-focus"
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={styles.label}>Unit</label>
          <input
            type="text"
            value={productInfo.unit}
            onChange={(e) => setProductInfo({ ...productInfo, unit: e.target.value })}
            style={styles.input}
            placeholder="e.g., bag, kg, piece"
            className="input-focus"
            autoComplete="off"
          />
        </div>

        <Button
          onClick={handleGenerateAd}
          variant="primary"
          size="lg"
          fullWidth
          disabled={loading || !image}
          loading={loading}
        >
          {loading ? 'Generating...' : (
            <>
              <SketchIcon d={ICONS.sparkles} size={18} color="#ffffff" strokeWidth={2} />
              Generate Ad
            </>
          )}
        </Button>

        {errorMsg && <div style={styles.error}>❌ {errorMsg}</div>}
      </div>

      {/* Results */}
      {result && (
        <div style={styles.card}>
          <h3 style={{ fontSize: 'clamp(16px, 1.6vw, 18px)', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SketchIcon d={ICONS.sparkles} size={20} color="#f59e0b" strokeWidth={2} />
            Your AI-Generated Ad
          </h3>

          <div style={styles.adPreview}>
            <h3 style={styles.adTitle}>{result.ad?.headline || result.ad?.title}</h3>
            <p style={styles.adDesc}>{result.ad?.fullCopy || result.ad?.description}</p>
            <p style={styles.adCTA}>{result.ad?.cta || result.ad?.callToAction}</p>
            <div style={{ marginTop: '8px' }}>
              {result.ad?.sellingPoints?.map((point, index) => (
                <span key={index} style={{ ...styles.hashtag, backgroundColor: '#ecfdf5', color: '#065f46' }}>
                  ✓ {point}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <h4 style={{ fontSize: 'clamp(13px, 1.1vw, 14px)', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>
              📱 Social Media Posts
            </h4>
            
            {result.socialPosts?.facebook && (
              <div style={{ ...styles.socialCard, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                <div style={styles.socialHeader}>
                  <span style={{ ...styles.socialLabel, color: '#1e40af' }}>📘 Facebook</span>
                  <button onClick={() => copyToClipboard(result.socialPosts.facebook)} style={styles.copyBtn}>
                    <SketchIcon d={ICONS.copy} size={12} color="#ffffff" strokeWidth={2} />
                    Copy
                  </button>
                </div>
                <p style={styles.socialText}>{result.socialPosts.facebook}</p>
              </div>
            )}

            {result.socialPosts?.whatsapp && (
              <div style={{ ...styles.socialCard, backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
                <div style={styles.socialHeader}>
                  <span style={{ ...styles.socialLabel, color: '#065f46' }}>💬 WhatsApp</span>
                  <button onClick={() => copyToClipboard(result.socialPosts.whatsapp)} style={styles.copyBtn}>
                    <SketchIcon d={ICONS.copy} size={12} color="#ffffff" strokeWidth={2} />
                    Copy
                  </button>
                </div>
                <p style={styles.socialText}>{result.socialPosts.whatsapp}</p>
              </div>
            )}
          </div>

          {/* Share Section */}
          <div style={styles.shareSection}>
            <p style={styles.shareLabel}>📤 Share This Ad</p>
            <SocialShare 
              title={result.ad?.headline || result.ad?.title || 'Check out this product!'}
              description={result.ad?.fullCopy || result.ad?.description || ''}
              url={window.location.href}
            />
          </div>

          <button onClick={handleReset} style={styles.resetBtn}>
            <SketchIcon d={ICONS.close} size={16} color="#334155" strokeWidth={2} />
            Start Over
          </button>
        </div>
      )}
    </div>
  );
};

export default AdGenerator;