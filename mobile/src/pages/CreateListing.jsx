import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI, listingsAPI } from '../services/api';

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
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  plus: "M12 4v16M4 12h16",
  box: "M12.89 1.45l8 4A2 2 0 0122 7.24v9.53a2 2 0 01-1.11 1.79l-8 4a2 2 0 01-1.79 0l-8-4a2 2 0 01-1.1-1.8V7.24a2 2 0 011.11-1.79l8-4a2 2 0 011.78 0zM2.32 6.16L12 11l9.68-4.84M12 22.76V11",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  close: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
  dollar: "M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  delivery: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 16h6",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
};

// Mitundu Locations
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

  // Categories
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

  // Fetch user's businesses
  useEffect(() => {
    fetchBusinesses();
  }, [user]);

  const fetchBusinesses = async () => {
    if (!user?.id) return;
    
    try {
      const response = await businessAPI.getByUser(user.id);
      if (response.data.business) {
        setBusinesses([response.data.business]);
        setSelectedBusiness(response.data.business.id);
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
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const listingData = {
        businessId: selectedBusiness,
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        deliveryFee: formData.deliveryFee ? parseFloat(formData.deliveryFee) : null
      };

      const response = await listingsAPI.create(listingData);
      
      if (response.data.success) {
        alert('🎉 Listing created successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      alert(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px'
    },
    card: {
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      border: '1px solid #e2e8f0'
    },
    header: {
      marginBottom: '24px'
    },
    backLink: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      color: '#64748b',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    title: {
      fontSize: '24px',
      fontWeight: '800',
      color: '#0f172a',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    subtitle: {
      fontSize: '14px',
      color: '#64748b',
      marginTop: '4px',
      marginBottom: 0
    },
    formGroup: {
      marginBottom: '18px'
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
      minHeight: '100px',
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
      fontFamily: 'inherit',
      appearance: 'auto',
      transition: 'border-color 0.15s'
    },
    row: {
      display: 'flex',
      gap: '12px'
    },
    half: {
      flex: 1
    },
    imageGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '8px'
    },
    imageWrapper: {
      position: 'relative'
    },
    imageThumb: {
      width: '80px',
      height: '80px',
      objectFit: 'cover',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    removeBtn: {
      position: 'absolute',
      top: '-6px',
      right: '-6px',
      backgroundColor: '#dc2626',
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
      padding: 0
    },
    fileInput: {
      padding: '8px',
      border: '1px dashed #cbd5e1',
      borderRadius: '8px',
      width: '100%',
      boxSizing: 'border-box'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#2563eb'
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
      marginTop: '8px'
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
      gap: '8px',
      marginTop: '8px'
    },
    required: {
      color: '#dc2626'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} style={styles.backLink}>
            <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
            <span>Back to Dashboard</span>
          </button>
          
          <h1 style={styles.title}>
            <SketchIcon d={ICONS.box} size={24} color="#2563eb" strokeWidth={2} />
            Create New Listing
          </h1>
          <p style={styles.subtitle}>Add a product or service to your storefront</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Business Selection */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.store} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Business</span>
              <span style={styles.required}>*</span>
            </label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              style={styles.select}
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

          {/* Title */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.tag} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Listing Title</span>
              <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., Fresh Tomatoes, Plumbing Services"
              required
            />
          </div>

          {/* Description */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.box} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Description</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe your product or service in detail..."
            />
          </div>

          {/* Category */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.tag} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Category</span>
              <span style={styles.required}>*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={styles.select}
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Sub Category</label>
              <select
                name="subCategory"
                value={formData.subCategory}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">Select sub category</option>
                {subCategories[formData.category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price & Price Type */}
          <div style={styles.row}>
            <div style={styles.half}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <SketchIcon d={ICONS.dollar} size={14} color="#64748b" strokeWidth={2} />
                  <span style={{ marginLeft: '4px' }}>Price (MWK)</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 5000"
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
                >
                  <option value="fixed">Fixed</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="free_quote">Free Quote</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quantity & Unit */}
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
                />
              </div>
            </div>
          </div>

          {/* LOCATION - New Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.mapPin} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Specific Location</span>
              <span style={styles.required}>*</span>
            </label>
            <select
              name="locationArea"
              value={formData.locationArea}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="">Select location in Mitundu</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* DELIVERY OPTIONS - New Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.delivery} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Delivery Options</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <label style={{ fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
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
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={formData.deliveryFee}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Delivery fee (MWK)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* CONTACT PHONE - New Field */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.phone} size={14} color="#64748b" strokeWidth={2} />
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
              required
            />
          </div>

          {/* Images */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <SketchIcon d={ICONS.image} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Images</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={styles.fileInput}
            />
            {formData.images.length > 0 && (
              <div style={styles.imageGrid}>
                {formData.images.map((url, index) => (
                  <div key={index} style={styles.imageWrapper}>
                    <img src={url} alt={`Upload ${index}`} style={styles.imageThumb} />
                    <button
                      onClick={() => removeImage(index)}
                      style={styles.removeBtn}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !selectedBusiness}
            style={loading || !selectedBusiness ? styles.submitDisabled : styles.submitBtn}
          >
            {loading ? (
              'Creating...'
            ) : (
              <>
                <SketchIcon d={ICONS.check} size={18} color="#ffffff" strokeWidth={2.5} />
                <span>Create Listing</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;