// mobile/src/pages/CreateListing.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI, aiAPI, locationAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    plus: "M12 4v16m8-8H4",
    box: "M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0zM2.32 6.16L12 11l9.68-4.84M12 22.76V11",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
    image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
    close: "M18 6L6 18M6 6l12 12",
    check: "M20 6L9 17l-5-5",
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
    dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    delivery: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 16h6",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
    upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a3 3 0 100-6 3 3 0 000 6z",
    trendingUp: "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
    award: "M12 15a7 7 0 100-14 7 7 0 000 14zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    // ★ PHASE 1: crosshair for "use my location"
    crosshair: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 2v4M12 18v4M2 12h4M18 12h4",
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
// CONSTANTS
// ============================================================
const CATEGORIES = [
  'Products',
  'Services',
  'Farm Inputs',
  'Food & Groceries',
  'Construction Materials',
  'Electronics',
  'Clothing & Fashion',
  'Vehicles & Parts',
  'Furniture',
  'Tools & Equipment',
  'Other'
];

const SUB_CATEGORIES = {
  'Farm Inputs': ['Seeds', 'Fertilizer', 'Pesticides', 'Livestock', 'Farm Tools'],
  'Construction Materials': ['Cement', 'Iron Sheets', 'Paint', 'Timber', 'Hardware'],
  'Products': ['Electronics', 'Clothing', 'Furniture', 'Kitchenware'],
  'Services': ['Repair', 'Installation', 'Consulting', 'Transport'],
  'Food & Groceries': ['Vegetables', 'Fruits', 'Grains', 'Meat', 'Beverages']
};

// ============================================================
// QUALITY GRADE HELPERS
// ============================================================
const GRADE_META = {
  excellent: { label: 'Excellent', color: 'var(--color-success)', bg: 'var(--color-success-bg)', emoji: '🏆' },
  good:      { label: 'Good',      color: 'var(--color-secondary-hover)', bg: 'var(--color-info-bg)', emoji: '✅' },
  fair:      { label: 'Fair',      color: 'var(--color-accent-hover)', bg: 'var(--color-accent-soft)', emoji: '⚠️' },
  poor:      { label: 'Needs work', color: 'var(--color-error)', bg: 'var(--color-error-bg)', emoji: '📝' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    price: '',
    priceType: 'fixed',
    quantity: '',
    unit: '',
    images: [],
    locationArea: '',
    deliveryAvailable: false,
    deliveryFee: '',
    contactPhone: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);

  // ★ PHASE 1: coords + locating
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  // ★ PHASE 7B: price suggestion state
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  // ★ PHASE 7C: quality score state
  const [quality, setQuality] = useState(null);
  const [loadingQuality, setLoadingQuality] = useState(false);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => titleInputRef.current.focus(), 100);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  // ★ PHASE 7B: debounced price suggestion fetch (800ms)
  useEffect(() => {
    const title = String(formData.title || '').trim();
    const category = String(formData.category || '').trim();

    if (suggestionDismissed) return;

    if (title.length < 3) {
      setPriceSuggestion(null);
      setLoadingSuggestion(false);
      return;
    }

    setLoadingSuggestion(true);

    const handle = setTimeout(async () => {
      try {
        const res = await aiAPI.priceSuggest({ title, category });
        const suggestion = res?.data?.suggestion || null;
        setPriceSuggestion(suggestion);
      } catch (err) {
        console.warn('priceSuggest error:', err?.message);
        setPriceSuggestion(null);
      } finally {
        setLoadingSuggestion(false);
      }
    }, 800);

    return () => clearTimeout(handle);
  }, [formData.title, formData.category, suggestionDismissed]);

  // ★ PHASE 7C: debounced quality score fetch (1000ms — heavier call)
  useEffect(() => {
    const title = String(formData.title || '').trim();
    if (title.length < 3) {
      setQuality(null);
      setLoadingQuality(false);
      return;
    }

    setLoadingQuality(true);

    const handle = setTimeout(async () => {
      try {
        const res = await aiAPI.qualityScore({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          subCategory: formData.subCategory,
          price: formData.price,
          quantity: formData.quantity,
          unit: formData.unit,
          images: formData.images,
          locationArea: formData.locationArea,
          deliveryAvailable: formData.deliveryAvailable,
          contactPhone: formData.contactPhone,
        });
        const q = res?.data?.quality || null;
        setQuality(q);
      } catch (err) {
        console.warn('qualityScore error:', err?.message);
        setQuality(null);
      } finally {
        setLoadingQuality(false);
      }
    }, 1000);

    return () => clearTimeout(handle);
  }, [
    formData.title,
    formData.description,
    formData.category,
    formData.subCategory,
    formData.price,
    formData.quantity,
    formData.unit,
    formData.images.length,
    formData.locationArea,
    formData.deliveryAvailable,
    formData.contactPhone,
  ]);

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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ★ PHASE 1: capture coords + reverse-geocode
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this device', 'error');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await locationAPI.reverse(latitude, longitude);
          const name = res?.data?.name;
          if (name) {
            setFormData((prev) => ({ ...prev, locationArea: name }));
            success(`Location set: ${name}`);
          } else {
            const fallback = `Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
            setFormData((prev) => ({ ...prev, locationArea: fallback }));
            showToast('Could not resolve a place name — you can edit it', 'warning');
          }
        } catch (err) {
          console.warn('reverse geocode error:', err);
          const fallback = `Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setFormData((prev) => ({ ...prev, locationArea: fallback }));
          showToast('Could not resolve a place name — you can edit it', 'warning');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        showToast('Could not access your location', 'error');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploading(true);
      setTimeout(() => {
        setImageFiles(prev => [...prev, ...files]);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newPreviews]
        }));
        setUploading(false);
      }, 500);
    }
  };

  const removeImage = (index) => {
    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    setFormData(prev => ({
      ...prev,
      images: newPreviews
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const applySuggestedPrice = () => {
    if (!priceSuggestion?.hasSuggestion) return;
    setFormData((prev) => ({
      ...prev,
      price: String(priceSuggestion.median),
    }));
    setSuggestionDismissed(true);
  };

  const dismissSuggestion = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSuggestionDismissed(true);
    setPriceSuggestion(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusiness) {
      showToast('Please select a business', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token') || '';

      const formDataToSend = new FormData();
      formDataToSend.append('businessId', selectedBusiness);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('subCategory', formData.subCategory);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('priceType', formData.priceType);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('status', 'active');
      formDataToSend.append('locationArea', formData.locationArea);
      // ★ PHASE 1: only send coords if user actually captured them
      if (coords) {
        formDataToSend.append('locationLat', String(coords.lat));
        formDataToSend.append('locationLng', String(coords.lng));
      }
      formDataToSend.append('deliveryAvailable', formData.deliveryAvailable);
      formDataToSend.append('deliveryFee', formData.deliveryFee);
      formDataToSend.append('contactPhone', formData.contactPhone);

      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          formDataToSend.append('images', imageFiles[i]);
        }
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/listings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        success('🎉 Listing created successfully!');
        navigate('/dashboard');
      } else {
        const errMsg = data.error || 'Failed to create listing';
        showToast(errMsg, 'error');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      let errMsg = err.message || 'Failed to create listing';
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        errMsg = 'Your session has expired. Please log in again.';
        setTimeout(() => navigate('/login'), 2000);
      }
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  const showSuggestionChip =
    !suggestionDismissed &&
    formData.title.trim().length >= 3 &&
    (loadingSuggestion || priceSuggestion?.hasSuggestion);

  const gradeMeta = quality?.grade ? GRADE_META[quality.grade] : null;

  return (
    <div className="create-listing">
      {/* Header */}
      <div className="page-header">
        <div className="header-inner">
          <button className="back-btn" onClick={() => navigate('/dashboard')} aria-label="Back">
            <Icon name="arrowLeft" size={18} color="var(--color-text)" strokeWidth={2.2} />
          </button>
          <div className="header-text">
            <h1 className="page-title">New Listing</h1>
            <p className="page-subtitle">Share what you're selling</p>
          </div>
          <div className="header-spacer" />
        </div>
      </div>

      {/* Main Form */}
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Image Upload */}
          <div className="upload-section">
            <label className="form-label">
              <Icon name="camera" size={14} color="var(--color-secondary-hover)" strokeWidth={2} />
              Photos
              <span className="form-label-hint">Up to 4 images</span>
            </label>
            <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              {imagePreviews.length > 0 ? (
                <div className="image-preview-grid">
                  {imagePreviews.map((url, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={url} alt={`Upload ${index}`} className="image-preview" />
                      <button
                        type="button"
                        className="image-remove"
                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        aria-label="Remove image"
                      >
                        <Icon name="close" size={11} color="var(--color-text-inverse)" strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 4 && (
                    <div className="image-upload-btn">
                      <Icon name="plus" size={20} color="var(--color-accent)" strokeWidth={2.2} />
                      <span>Add</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon-wrap">
                    <Icon name="camera" size={28} color="var(--color-accent)" strokeWidth={1.6} />
                  </div>
                  <span className="upload-text">Add photos</span>
                  <span className="upload-hint">Tap to upload</span>
                </div>
              )}
            </div>
            {uploading && (
              <div className="upload-progress">
                <span className="upload-loader" />
                <span>Uploading…</span>
              </div>
            )}
          </div>

          {/* Business Selection */}
          {businesses.length > 0 && (
            <div className="form-group">
              <label className="form-label">Business</label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="form-select"
                required
              >
                {businesses.map(biz => (
                  <option key={biz.id} value={biz.id}>
                    {biz.business_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title <span className="required">*</span></label>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="What are you listing?"
              required
              autoComplete="off"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe your product or service…"
              rows={3}
            />
          </div>

          {/* Category */}
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Category <span className="required">*</span></label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {formData.category && SUB_CATEGORIES[formData.category] && (
              <div className="form-group half">
                <label className="form-label">Sub Category</label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select</option>
                  {SUB_CATEGORIES[formData.category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Price (MWK)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                placeholder="0"
                autoComplete="off"
              />
            </div>
            <div className="form-group half">
              <label className="form-label">Price Type</label>
              <select
                name="priceType"
                value={formData.priceType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="fixed">Fixed</option>
                <option value="negotiable">Negotiable</option>
                <option value="free_quote">Free Quote</option>
              </select>
            </div>
          </div>

          {/* ★ PHASE 7B: AI Price Suggestion Chip */}
          {showSuggestionChip && loadingSuggestion && (
            <div className="price-suggestion-chip price-suggestion-loading">
              <span className="chip-loader" />
              <span className="chip-text">Checking similar listings…</span>
            </div>
          )}

          {showSuggestionChip &&
            !loadingSuggestion &&
            priceSuggestion?.hasSuggestion && (
              <div
                role="button"
                tabIndex={0}
                className="price-suggestion-chip price-suggestion-ready"
                onClick={applySuggestedPrice}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    applySuggestedPrice();
                  }
                }}
                title="Tap to use the median price"
              >
                <div className="chip-icon">
                  <Icon
                    name="sparkles"
                    size={16}
                    color="var(--color-accent)"
                    strokeWidth={2}
                  />
                </div>
                <div className="chip-body">
                  <div className="chip-title">
                    Suggested: MK {Number(priceSuggestion.median).toLocaleString()}
                  </div>
                  <div className="chip-insight">{priceSuggestion.insight}</div>
                  <div className="chip-meta">
                    {priceSuggestion.sampleSize} similar ·{' '}
                    MK {Number(priceSuggestion.min).toLocaleString()} –{' '}
                    MK {Number(priceSuggestion.max).toLocaleString()} ·{' '}
                    {priceSuggestion.confidence} confidence
                  </div>
                </div>
                <button
                  type="button"
                  className="chip-dismiss"
                  onClick={dismissSuggestion}
                  aria-label="Dismiss suggestion"
                >
                  <Icon
                    name="close"
                    size={12}
                    color="var(--color-text-muted)"
                    strokeWidth={2.4}
                  />
                </button>
              </div>
            )}

          {/* Quantity & Unit */}
          <div className="form-row">
            <div className="form-group half">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="form-input"
                placeholder="1"
                autoComplete="off"
              />
            </div>
            <div className="form-group half">
              <label className="form-label">Unit</label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., kg, bag, piece"
                autoComplete="off"
              />
            </div>
          </div>

          {/* ★ PHASE 1: Location with crosshair (replaces dropdown) */}
          <div className="form-group">
            <label className="form-label">
              Location <span className="required">*</span>
            </label>
            <div className="input-with-btn">
              <input
                type="text"
                name="locationArea"
                value={formData.locationArea}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, locationArea: e.target.value }));
                  setCoords(null); // manual edit clears captured coords
                }}
                className="form-input"
                placeholder="e.g. Mitundu Trading Centre"
                required
                autoComplete="off"
              />
              <button
                type="button"
                className="icon-inline-btn"
                onClick={handleUseLocation}
                disabled={loading || locating}
                aria-label="Use my location"
              >
                <Icon
                  name="crosshair"
                  size={18}
                  color={locating ? 'var(--color-text-muted)' : 'var(--color-primary)'}
                  strokeWidth={2}
                />
              </button>
            </div>
            <span className="field-hint">
              Where can this be picked up or delivered?
            </span>
          </div>

          {/* Delivery */}
          <div className="form-group">
            <label className="form-label">Delivery</label>
            <div className="delivery-toggle">
              <label className={`checkbox-card ${formData.deliveryAvailable ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  name="deliveryAvailable"
                  checked={formData.deliveryAvailable}
                  onChange={handleChange}
                />
                <span className="checkbox-box">
                  {formData.deliveryAvailable && (
                    <Icon name="check" size={12} color="var(--color-text-inverse)" strokeWidth={3} />
                  )}
                </span>
                <span className="checkbox-text">Delivery available</span>
              </label>
              {formData.deliveryAvailable && (
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleChange}
                  className="form-input delivery-fee"
                  placeholder="Delivery fee (MWK)"
                />
              )}
            </div>
          </div>

          {/* Contact Phone */}
          <div className="form-group">
            <label className="form-label">Contact Phone <span className="required">*</span></label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="form-input"
              placeholder="0999123456"
              required
              autoComplete="tel"
            />
          </div>

          {/* ★ PHASE 7C: Live Listing Quality Card */}
          {formData.title.trim().length >= 3 && (loadingQuality || quality) && (
            <div className={`quality-card ${gradeMeta ? `quality-${quality?.grade}` : 'quality-loading'}`}>
              <div className="quality-header">
                <div className="quality-header-left">
                  <div
                    className="quality-score-ring"
                    style={{
                      borderColor: gradeMeta?.color || 'var(--color-border-strong)',
                    }}
                  >
                    <span
                      className="quality-score-number"
                      style={{ color: gradeMeta?.color || 'var(--color-text-muted)' }}
                    >
                      {loadingQuality ? '—' : quality?.score ?? '—'}
                    </span>
                  </div>
                  <div className="quality-header-text">
                    <div className="quality-title">
                      <Icon
                        name="award"
                        size={14}
                        color={gradeMeta?.color || 'var(--color-text-muted)'}
                        strokeWidth={2.2}
                      />
                      Listing quality
                    </div>
                    <div className="quality-subtitle">
                      {loadingQuality
                        ? 'Analyzing your listing…'
                        : gradeMeta
                        ? `${gradeMeta.emoji} ${gradeMeta.label}`
                        : 'Keep filling in details'}
                    </div>
                  </div>
                </div>
                {loadingQuality && <span className="quality-loader" />}
              </div>

              {!loadingQuality && quality?.tips?.length > 0 && (
                <ul className="quality-tips">
                  {quality.tips.map((tip, i) => (
                    <li key={i} className="quality-tip">
                      <span className="quality-tip-bullet">
                        <Icon name="trendingUp" size={11} color="var(--color-accent)" strokeWidth={2.4} />
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}

              {!loadingQuality && quality?.score === 100 && (
                <div className="quality-perfect">
                  🎉 Your listing is fully optimized — great job!
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="btn-loader" />
            ) : (
              <>
                <Icon name="check" size={18} color="var(--color-text-inverse)" strokeWidth={2.4} />
                Post Listing
              </>
            )}
          </button>
        </form>
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
            const active = item.id === 'sell';
            return (
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)'} strokeWidth={1.85} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .create-listing {
          min-height: 100vh;
          background: var(--color-bg);
          background-image: radial-gradient(var(--color-accent-tint) 1px, transparent 1px);
          background-size: 22px 22px;
          font-family: var(--font-sans);
          color: var(--color-text);
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .create-listing { padding-bottom: 40px; }
        }

        .page-header {
          background: var(--color-surface);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 14px 16px;
        }

        .header-inner {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .back-btn:hover {
          background: var(--color-surface-alt);
          border-color: var(--color-accent);
        }

        .header-text {
          flex: 1;
          min-width: 0;
          text-align: center;
        }

        .page-title {
          font-family: var(--font-serif);
          font-size: 18px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
          letter-spacing: -0.01em;
        }

        .page-subtitle {
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin: 1px 0 0;
        }

        .header-spacer {
          width: 40px;
          flex-shrink: 0;
        }

        .form-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin-bottom: 7px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .form-label-hint {
          font-weight: 500;
          font-size: 10.5px;
          color: var(--color-text-muted);
          text-transform: none;
          letter-spacing: 0;
          margin-left: auto;
        }

        .required {
          color: var(--color-error);
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 12px 15px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          font-size: 14px;
          color: var(--color-text);
          outline: none;
          background: var(--color-surface);
          font-family: inherit;
          transition: all var(--transition-fast);
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
          min-height: 84px;
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

        /* ★ PHASE 1: input-with-btn for crosshair */
        .input-with-btn {
          display: flex;
          align-items: stretch;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .input-with-btn:focus-within {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-tint);
        }

        .input-with-btn .form-input {
          border: none;
          box-shadow: none;
          background: transparent;
          border-radius: 0;
        }

        .input-with-btn .form-input:focus {
          box-shadow: none;
        }

        .icon-inline-btn {
          width: 46px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
          flex-shrink: 0;
        }

        .icon-inline-btn:hover:not(:disabled) {
          background: var(--color-surface-alt);
        }

        .icon-inline-btn:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .field-hint {
          font-size: 11.5px;
          color: var(--color-text-muted);
          margin-top: 6px;
          display: block;
        }

        .upload-section {
          margin-bottom: 18px;
        }

        .upload-area {
          border: 2px dashed var(--color-border-strong);
          border-radius: var(--radius-2xl);
          padding: 20px;
          cursor: pointer;
          background: var(--color-surface);
          transition: all 0.22s ease;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-area:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-soft);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .upload-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-accent-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 6px;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .upload-hint {
          font-size: 11.5px;
          color: var(--color-text-muted);
        }

        .image-preview-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          width: 100%;
        }

        .image-preview-item {
          position: relative;
          width: 82px;
          height: 82px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-xs);
        }

        .image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--color-error);
          color: var(--color-text-inverse);
          border: 2px solid var(--color-surface);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .image-remove:hover {
          transform: scale(1.08);
          box-shadow: var(--shadow-error);
        }

        .image-upload-btn {
          width: 82px;
          height: 82px;
          border-radius: var(--radius-xl);
          border: 1.5px dashed var(--color-border-strong);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: var(--color-accent);
          font-size: 10.5px;
          font-weight: 700;
          transition: all var(--transition-fast);
          background: var(--color-surface);
        }

        .image-upload-btn:hover {
          border-color: var(--color-accent);
          background: var(--color-accent-soft);
        }

        .upload-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          font-size: 13px;
          color: var(--color-text-muted);
        }

        .upload-loader {
          width: 16px;
          height: 16px;
          border: 2px solid var(--color-accent-tint);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .price-suggestion-chip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          padding: 12px 14px;
          border-radius: var(--radius-xl);
          border: 1.5px solid var(--color-accent-tint);
          background: var(--color-accent-soft);
          margin: -4px 0 16px;
          text-align: left;
          font-family: inherit;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-sizing: border-box;
          position: relative;
          outline: none;
        }

        .price-suggestion-chip:hover,
        .price-suggestion-chip:focus-visible {
          border-color: var(--color-accent);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .price-suggestion-loading {
          cursor: default;
          color: var(--color-text-muted);
          font-size: 12.5px;
          align-items: center;
        }

        .price-suggestion-loading:hover {
          transform: none;
          box-shadow: none;
          border-color: var(--color-accent-tint);
        }

        .price-suggestion-ready { padding-right: 36px; }

        .chip-icon {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-md);
          background: var(--color-surface);
          border: 1px solid var(--color-accent-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .chip-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .chip-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: 0.01em;
        }

        .chip-insight {
          font-size: 12px;
          line-height: 1.4;
          color: var(--color-text-secondary);
        }

        .chip-meta {
          font-size: 10.5px;
          color: var(--color-text-muted);
          letter-spacing: 0.02em;
          margin-top: 2px;
        }

        .chip-text { font-size: 12.5px; }

        .chip-loader {
          width: 14px;
          height: 14px;
          border: 2px solid var(--color-accent-tint);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        .chip-dismiss {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .chip-dismiss:hover { background: rgba(0, 0, 0, 0.06); }

        .quality-card {
          border-radius: var(--radius-xl);
          padding: 14px;
          margin: 8px 0 16px;
          border: 1.5px solid var(--color-border);
          background: var(--color-surface);
          transition: all var(--transition-base);
        }
        .quality-excellent { border-color: var(--color-success); background: var(--color-success-bg); }
        .quality-good { border-color: var(--color-secondary-hover); background: var(--color-info-bg); }
        .quality-fair { border-color: var(--color-accent); background: var(--color-accent-soft); }
        .quality-poor { border-color: var(--color-error); background: var(--color-error-bg); }
        .quality-loading { border-color: var(--color-border); background: var(--color-surface-alt); }

        .quality-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .quality-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .quality-score-ring {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 3px solid var(--color-border-strong);
          background: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: border-color var(--transition-base);
        }
        .quality-score-number {
          font-family: var(--font-serif);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .quality-header-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .quality-title {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: 0.01em;
        }
        .quality-subtitle { font-size: 12px; color: var(--color-text-secondary); line-height: 1.3; }
        .quality-loader {
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-border-strong);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        .quality-tips {
          list-style: none;
          margin: 12px 0 0;
          padding: 10px 0 0;
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .quality-tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12.5px;
          line-height: 1.45;
          color: var(--color-text-secondary);
        }
        .quality-tip-bullet {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--color-surface);
          border: 1px solid var(--color-accent-tint);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .quality-perfect {
          margin-top: 10px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          background: var(--color-surface);
          border: 1px dashed var(--color-success);
          font-size: 12.5px;
          font-weight: 600;
          color: var(--color-success);
          text-align: center;
        }

        .delivery-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .checkbox-card {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 11px 16px;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          background: var(--color-surface);
          cursor: pointer;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          user-select: none;
        }

        .checkbox-card input[type="checkbox"] { display: none; }

        .checkbox-card.checked {
          border-color: var(--color-primary);
          background: var(--color-primary-tint);
          color: var(--color-primary);
        }

        .checkbox-box {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm);
          border: 1.5px solid var(--color-border-strong);
          background: var(--color-surface);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }

        .checkbox-card.checked .checkbox-box {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .checkbox-text { font-size: 13.5px; }

        .delivery-fee { flex: 1; min-width: 140px; }

        .submit-btn {
          width: 100%;
          padding: 16px;
          background: var(--color-accent);
          border: none;
          border-radius: var(--radius-xl);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text-inverse);
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          transition: all var(--transition-fast);
          margin-top: 8px;
          min-height: 54px;
          box-shadow: var(--shadow-accent);
          letter-spacing: 0.01em;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(255, 92, 35, 0.32);
        }

        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-loader {
          width: 22px;
          height: 22px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--color-text-inverse);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid var(--color-border);
          display: flex;
          justify-content: space-around;
          padding: 4px 0 10px;
          z-index: 100;
        }

        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
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
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }

        .nav-icon-wrap.active {
          background: var(--color-primary);
          box-shadow: var(--shadow-primary);
        }

        .nav-btn:hover .nav-icon-wrap:not(.active) { background: var(--color-surface-alt); }
        .nav-label { font-size: 9px; font-weight: 500; color: var(--color-text-muted); }
        .nav-label.active { color: var(--color-text); font-weight: 600; }

        @media (max-width: 480px) {
          .form-container { padding: 16px 12px; }
          .form-row { flex-direction: column; gap: 0; }
          .form-row .half { min-width: 100%; }
          .page-title { font-size: 17px; }
          .image-preview-item,
          .image-upload-btn { width: 72px; height: 72px; }
          .delivery-toggle { flex-direction: column; align-items: stretch; }
          .delivery-fee { width: 100%; }
        }

        @media (max-width: 380px) {
          .form-container { padding: 12px 10px; }
          .form-input,
          .form-textarea,
          .form-select { font-size: 13px; padding: 10px 12px; }
          .image-preview-item,
          .image-upload-btn { width: 64px; height: 64px; }
          .submit-btn { font-size: 14px; padding: 14px; min-height: 48px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .upload-area, .back-btn, .submit-btn, .image-remove, .checkbox-card, .nav-icon-wrap, .price-suggestion-chip {
            transition: none;
          }
          .upload-area:hover,
          .submit-btn:hover,
          .image-remove:hover,
          .price-suggestion-chip:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default CreateListing;