// mobile/src/pages/CreateListing.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI } from '../services/api';
import PrimaryButton from '../components/PrimaryButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/ToastContainer';

// ============================================
// PREMIUM FEATHER ICONS
// ============================================
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
    status: 'active',
    locationArea: '',
    deliveryAvailable: false,
    deliveryFee: '',
    contactPhone: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

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

  if (loading) {
    return <LoadingSpinner fullScreen message="Creating your listing..." />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 'clamp(16px, 2vw, 24px) clamp(12px, 2vw, 16px)',
    },
    card: {
      maxWidth: '600px',
      margin: '0 auto',
      background: '#FFFFFF',
      borderRadius: '16px',
      padding: 'clamp(20px, 2.5vw, 32px)',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
      border: '1px solid #E2E8F0',
    },
    header: {
      marginBottom: '24px',
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#94A3B8',
      textDecoration: 'none',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      marginBottom: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      fontFamily: 'inherit',
      transition: 'color 0.2s ease',
    },
    title: {
      fontSize: 'clamp(20px, 2.5vw, 24px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    subtitle: {
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#94A3B8',
      marginTop: '4px',
      marginBottom: 0,
    },
    formGroup: {
      marginBottom: 'clamp(14px, 1.5vw, 18px)',
    },
    label: {
      display: 'flex',
      alignItems: 'center',
      fontSize: 'clamp(12px, 1vw, 13px)',
      fontWeight: '600',
      color: '#475569',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#1E293B',
      boxSizing: 'border-box',
      outline: 'none',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    textarea: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#1E293B',
      boxSizing: 'border-box',
      outline: 'none',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: 'clamp(80px, 10vw, 100px)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    select: {
      width: '100%',
      padding: 'clamp(8px, 0.8vw, 10px) clamp(12px, 1vw, 14px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#1E293B',
      boxSizing: 'border-box',
      outline: 'none',
      background: '#FFFFFF',
      fontFamily: 'inherit',
      appearance: 'none',
    },
    row: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    },
    half: {
      flex: 1,
      minWidth: 'clamp(130px, 35vw, 200px)',
    },
    imageGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '10px',
    },
    imageWrapper: {
      position: 'relative',
    },
    imageThumb: {
      width: 'clamp(60px, 8vw, 80px)',
      height: 'clamp(60px, 8vw, 80px)',
      objectFit: 'cover',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
    },
    removeBtn: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      background: '#EF4444',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
    },
    fileInput: {
      padding: '8px',
      border: '1px dashed #E2E8F0',
      borderRadius: '8px',
      width: '100%',
      boxSizing: 'border-box',
      cursor: 'pointer',
      fontSize: 'clamp(12px, 1vw, 13px)',
      background: '#F8FAFC',
    },
    checkbox: {
      width: 'clamp(16px, 1.5vw, 18px)',
      height: 'clamp(16px, 1.5vw, 18px)',
      cursor: 'pointer',
      accentColor: '#F59E0B',
    },
    required: {
      color: '#EF4444',
      marginLeft: '2px',
    },
    submitBtn: {
      marginTop: '8px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={styles.backLink}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1E293B'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; }}
          >
            <Icon d={ICONS.arrowLeft} size={16} color="#94A3B8" strokeWidth={1.75} />
            Back to Dashboard
          </button>
          
          <h1 style={styles.title}>
            <Icon d={ICONS.box} size={24} color="#F59E0B" strokeWidth={1.75} />
            Create New Listing
          </h1>
          <p style={styles.subtitle}>Add a product or service to your storefront</p>
        </div>

        <form onSubmit={handleSubmit}>
          {businesses.length > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <Icon d={ICONS.store} size={14} color="#94A3B8" strokeWidth={1.75} />
                <span style={{ marginLeft: '4px' }}>Business</span>
                <span style={styles.required}>*</span>
              </label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                style={styles.select}
                className="input-focus"
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

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Listing Title</span>
              <span style={styles.required}>*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., Fresh Tomatoes, Plumbing Services"
              className="input-focus"
              required
              autoComplete="off"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.box} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Description</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe your product or service in detail..."
              className="input-focus"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Category</span>
              <span style={styles.required}>*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.select}
              className="input-focus"
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {formData.category && subCategories[formData.category] && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Sub Category</label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                style={styles.select}
                className="input-focus"
              >
                <option value="">Select sub category</option>
                {subCategories[formData.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          <div style={styles.row}>
            <div style={styles.half}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <Icon d={ICONS.dollar} size={14} color="#94A3B8" strokeWidth={1.75} />
                  <span style={{ marginLeft: '4px' }}>Price (MWK)</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 5000"
                  className="input-focus"
                  autoComplete="off"
                />
              </div>
            </div>
            <div style={styles.half}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price Type</label>
                <select
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleChange}
                  style={styles.select}
                  className="input-focus"
                >
                  <option value="fixed">Fixed</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="free_quote">Free Quote</option>
                </select>
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.half}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 10"
                  className="input-focus"
                  autoComplete="off"
                />
              </div>
            </div>
            <div style={styles.half}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., bags, kg, pieces"
                  className="input-focus"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.mapPin} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Specific Location</span>
              <span style={styles.required}>*</span>
            </label>
            <select
              name="locationArea"
              value={formData.locationArea}
              onChange={handleChange}
              style={styles.select}
              className="input-focus"
              required
            >
              <option value="">Select location in Mitundu</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.delivery} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Delivery Options</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
              <label style={{ fontSize: 'clamp(13px, 1.1vw, 14px)', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="deliveryAvailable"
                  checked={formData.deliveryAvailable}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                Delivery available
              </label>
              {formData.deliveryAvailable && (
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={formData.deliveryFee}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Delivery fee (MWK)"
                    className="input-focus"
                  />
                </div>
              )}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.phone} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Contact Phone</span>
              <span style={styles.required}>*</span>
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 0999123456"
              className="input-focus"
              required
              autoComplete="tel"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Icon d={ICONS.image} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Images</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={styles.fileInput}
              aria-label="Upload product images"
            />
            {imagePreviews.length > 0 && (
              <div style={styles.imageGrid}>
                {imagePreviews.map((url, index) => (
                  <div key={index} style={styles.imageWrapper}>
                    <img src={url} alt={`Upload ${index}`} style={styles.imageThumb} />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={styles.removeBtn}
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <PrimaryButton
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading || !selectedBusiness}
            style={styles.submitBtn}
          >
            {loading ? 'Creating...' : (
              <>
                <Icon d={ICONS.check} size={18} color="#FFFFFF" strokeWidth={2} />
                Create Listing
              </>
            )}
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;