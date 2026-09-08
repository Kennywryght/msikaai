// mobile/src/pages/CreateListing.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI } from '../services/api';
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
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

const LOCATIONS = [
  'Mitundu Trading Centre',
  'Mitundu Bunda',
  'Mitundu Chimbiri',
  'Mitundu Motolosi',
  'Mitundu Nkhoma',
  'Mitundu Town',
  'Mitundu Rural',
  'Other (specify in description)'
];

const CreateListing = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast, success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
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
    status: 'active',
    locationArea: '',
    deliveryAvailable: false,
    deliveryFee: '',
    contactPhone: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const isMobile = windowWidth <= 768;

  const categories = [
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

  const subCategories = {
    'Farm Inputs': ['Seeds', 'Fertilizer', 'Pesticides', 'Livestock', 'Farm Tools'],
    'Construction Materials': ['Cement', 'Iron Sheets', 'Paint', 'Timber', 'Hardware'],
    'Products': ['Electronics', 'Clothing', 'Furniture', 'Kitchenware'],
    'Services': ['Repair', 'Installation', 'Consulting', 'Transport'],
    'Food & Groceries': ['Vegetables', 'Fruits', 'Grains', 'Meat', 'Beverages']
  };

  const titleInputRef = useRef(null);

  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => titleInputRef.current.focus(), 100);
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

  useEffect(() => {
    fetchBusinesses();
  }, [user]);

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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newPreviews]
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBusiness) {
      showToast('Please select a business to associate with this listing.', 'error');
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

  if (loading) {
    return <LoadingSpinner fullScreen message="Creating your listing..." />;
  }

  return (
    <div className="create-listing">
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
        {/* Page Header */}
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <Icon d={ICONS.arrowLeft} size={16} color="#64748B" strokeWidth={1.75} />
            Back
          </button>
          <div className="header-content">
            <div className="header-icon">
              <Icon d={ICONS.box} size={28} color="#F59E0B" strokeWidth={1.75} />
            </div>
            <h1 className="page-title">Create Listing</h1>
            <p className="page-subtitle">Add a product or service to your storefront</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {/* Business Selection */}
            {businesses.length > 0 && (
              <div className="form-group">
                <label className="form-label">
                  <Icon d={ICONS.store} size={14} color="#94A3B8" strokeWidth={1.75} />
                  Business <span className="required">*</span>
                </label>
                <select
                  value={selectedBusiness}
                  onChange={(e) => setSelectedBusiness(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select a business</option>
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
              <label className="form-label">
                <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
                Listing Title <span className="required">*</span>
              </label>
              <input
                ref={titleInputRef}
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Fresh Tomatoes, Plumbing Services"
                required
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                <Icon d={ICONS.box} size={14} color="#94A3B8" strokeWidth={1.75} />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Describe your product or service in detail..."
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">
                <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
                Category <span className="required">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sub Category */}
            {formData.category && subCategories[formData.category] && (
              <div className="form-group">
                <label className="form-label">Sub Category</label>
                <select
                  name="subCategory"
                  value={formData.subCategory}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select sub category</option>
                  {subCategories[formData.category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Price & Price Type */}
            <div className="form-row">
              <div className="form-group half">
                <label className="form-label">
                  <Icon d={ICONS.dollar} size={14} color="#94A3B8" strokeWidth={1.75} />
                  Price (MWK)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., 5000"
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
                  placeholder="e.g., 10"
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
                  placeholder="e.g., bags, kg, pieces"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">
                <Icon d={ICONS.mapPin} size={14} color="#94A3B8" strokeWidth={1.75} />
                Location <span className="required">*</span>
              </label>
              <select
                name="locationArea"
                value={formData.locationArea}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select location in Mitundu</option>
                {LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Delivery */}
            <div className="form-group">
              <label className="form-label">
                <Icon d={ICONS.delivery} size={14} color="#94A3B8" strokeWidth={1.75} />
                Delivery Options
              </label>
              <div className="delivery-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="deliveryAvailable"
                    checked={formData.deliveryAvailable}
                    onChange={handleChange}
                    className="checkbox-input"
                  />
                  Delivery available
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
              <label className="form-label">
                <Icon d={ICONS.phone} size={14} color="#94A3B8" strokeWidth={1.75} />
                Contact Phone <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 0999123456"
                required
                autoComplete="tel"
              />
            </div>

            {/* Images */}
            <div className="form-group">
              <label className="form-label">
                <Icon d={ICONS.image} size={14} color="#94A3B8" strokeWidth={1.75} />
                Images
              </label>
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  aria-label="Upload product images"
                />
                <Icon d={ICONS.upload} size={24} color="#94A3B8" strokeWidth={1.5} />
                <span className="upload-text">Click to upload images</span>
                <span className="upload-hint">PNG, JPG, GIF up to 10MB each</span>
              </div>
              {imagePreviews.length > 0 && (
                <div className="image-grid">
                  {imagePreviews.map((url, index) => (
                    <div key={index} className="image-wrapper">
                      <img src={url} alt={`Upload ${index}`} className="image-thumb" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-btn"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" className="submit-btn" disabled={loading || !selectedBusiness}>
              <Icon d={ICONS.check} size={18} color="#FFFFFF" strokeWidth={2} />
              {loading ? 'Creating...' : 'Create Listing'}
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
            const active = item.id === 'sell';
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
        .create-listing {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .create-listing {
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
          max-width: 600px;
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
          min-height: 80px;
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

        /* ===== DELIVERY ===== */
        .delivery-options {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #64748B;
          cursor: pointer;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
          accent-color: #F59E0B;
          cursor: pointer;
        }

        .delivery-fee {
          flex: 1;
          min-width: 120px;
        }

        /* ===== IMAGE UPLOAD ===== */
        .upload-area {
          border: 2px dashed #E2E8F0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          background: #F8FAFC;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .upload-area:hover {
          border-color: #F59E0B;
          background: #FEFCF5;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 500;
          color: #64748B;
        }

        .upload-hint {
          font-size: 12px;
          color: #94A3B8;
        }

        .image-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .image-wrapper {
          position: relative;
        }

        .image-thumb {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #F1F5F9;
        }

        .remove-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #EF4444;
          color: #FFFFFF;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          transform: scale(1.1);
        }

        /* ===== SUBMIT BUTTON ===== */
        .submit-btn {
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
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
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
          .delivery-options {
            flex-direction: column;
            align-items: flex-start;
          }
          .delivery-fee {
            width: 100%;
          }
          .form-card {
            padding: 14px 16px;
          }
          .upload-area {
            padding: 16px;
          }
        }

        @media (max-width: 380px) {
          .main-content {
            padding: 12px 12px 32px;
          }
          .form-card {
            padding: 12px 14px;
          }
          .image-thumb {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateListing;