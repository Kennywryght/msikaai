// mobile/src/pages/ListingDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingsAPI, reviewsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
  phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  whatsapp: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5zM16 12v1.5M12 12v1.5M8 12v1.5",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z",
  check: "M20 6L9 17l-5-5",
  pencil: "M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z",
  close: "M18 6L6 18M6 6l12 12",
  delivery: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 16h6",
  copy: "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z",
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
};

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, success, error } = useToast();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');

  useEffect(() => {
    if (id) {
      fetchListingDetails();
    } else {
      setErrorMsg('No listing ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchListingDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      console.log('📤 Fetching listing details for ID:', id);
      const response = await listingsAPI.getById(id);
      console.log('✅ Listing fetched:', response.data);
      
      if (response.data && response.data.listing) {
        setListing(response.data.listing);
        
        // Track view
        if (user?.id) {
          try {
            await analyticsAPI.trackView({ listingId: id });
            await analyticsAPI.trackUserActivity(user.id, 'view_listing', {
              listingId: id,
              title: response.data.listing.title,
              category: response.data.listing.category
            });
            console.log('📊 Analytics: View tracked');
          } catch (analyticsErr) {
            console.error('Analytics error:', analyticsErr);
          }
        }
      } else {
        setErrorMsg('Listing not found');
      }
      
      try {
        const reviewsResponse = await reviewsAPI.getByListing(id);
        setReviews(reviewsResponse.data.reviews || []);
      } catch (err) {
        console.log('No reviews yet');
        setReviews([]);
      }
    } catch (err) {
      console.error('❌ Error fetching listing:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await reviewsAPI.create({
        listingId: id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      
      if (user?.id) {
        try {
          await analyticsAPI.trackUserActivity(user.id, 'write_review', {
            listingId: id,
            rating: reviewData.rating
          });
        } catch (analyticsErr) {
          console.error('Analytics error:', analyticsErr);
        }
      }
      
      success('✅ Review submitted successfully!');
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
      fetchListingDetails();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to submit review';
      showToast(errMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `MWK ${Number(price).toLocaleString()}`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.round(rating);
    const emptyStars = 5 - fullStars;
    return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  // Contact Functions
  const openWhatsApp = () => {
    const phone = listing.contact_phone || 
                  listing.businesses?.phone || 
                  listing.businesses?.whatsapp_number;
    
    if (!phone) {
      showToast('This seller has not provided a phone number yet.', 'warning');
      return;
    }

    if (user?.id) {
      try {
        analyticsAPI.trackContact({ listingId: id });
        analyticsAPI.trackUserActivity(user.id, 'contact_business', {
          listingId: id,
          businessId: listing.businesses?.id,
          method: 'whatsapp'
        });
      } catch (analyticsErr) {
        console.error('Analytics error:', analyticsErr);
      }
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone;
    
    const message = `Hi, I'm interested in your listing: ${listing.title} on MsikaAI.`;
    const whatsappUrl = `https://wa.me/265${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openPhoneDialer = () => {
    const phone = listing.contact_phone || 
                  listing.businesses?.phone || 
                  listing.businesses?.whatsapp_number;
    
    if (!phone) {
      showToast('This seller has not provided a phone number yet.', 'warning');
      return;
    }

    if (user?.id) {
      try {
        analyticsAPI.trackContact({ listingId: id });
        analyticsAPI.trackUserActivity(user.id, 'contact_business', {
          listingId: id,
          businessId: listing.businesses?.id,
          method: 'phone'
        });
      } catch (analyticsErr) {
        console.error('Analytics error:', analyticsErr);
      }
    }

    window.open(`tel:${phone}`, '_blank');
  };

  // Share Functions
  const shareOnWhatsApp = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    const message = `🛒 ${listing.title}\n🏪 ${listing.businesses?.business_name || 'Business'}\n💰 ${formatPrice(listing.price)}\n📍 ${listing.location_area || 'Mitundu'}\n\nView: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    const text = `${listing.title} - Check this out on MsikaAI`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    await navigator.clipboard.writeText(url);
    setShareSuccess('Link copied to clipboard!');
    success('Link copied to clipboard!');
    setTimeout(() => setShareSuccess(''), 3000);
  };

  if (loading) {
    return <LoadingSpinner message="Loading listing details..." />;
  }

  if (errorMsg || !listing) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>😕</div>
        <h3 style={styles.errorTitle}>{errorMsg || 'Listing not found'}</h3>
        <p style={styles.errorText}>
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate('/search')} variant="primary">
          <SketchIcon d={ICONS.arrowRight} size={16} color="#ffffff" strokeWidth={2.5} />
          Back to Search
        </Button>
      </div>
    );
  }

  const sellerPhone = listing.contact_phone || 
                      listing.businesses?.phone || 
                      listing.businesses?.whatsapp_number;

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 'clamp(16px, 2vw, 24px) clamp(12px, 2vw, 16px)'
    },
    backButton: {
      padding: '10px 20px',
      backgroundColor: '#e2e8f0',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      color: '#334155',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '16px',
      transition: 'background-color 0.2s'
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      padding: 'clamp(16px, 2vw, 24px)',
      marginBottom: '16px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    },
    imageGrid: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      marginBottom: '16px',
      paddingBottom: '4px',
      WebkitOverflowScrolling: 'touch'
    },
    image: {
      width: 'clamp(160px, 25vw, 200px)',
      height: 'clamp(120px, 18vw, 150px)',
      objectFit: 'cover',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      flexShrink: 0
    },
    title: {
      fontSize: 'clamp(20px, 2.5vw, 24px)',
      fontWeight: '800',
      color: '#0f172a',
      margin: '0 0 8px 0',
      lineHeight: '1.2'
    },
    badgeGroup: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '12px'
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '600'
    },
    description: {
      color: '#475569',
      lineHeight: '1.6',
      marginBottom: '12px',
      whiteSpace: 'pre-wrap',
      fontSize: 'clamp(14px, 1.2vw, 15px)'
    },
    metaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #f1f5f9'
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#64748b'
    },
    sectionTitle: {
      fontSize: 'clamp(16px, 1.6vw, 18px)',
      fontWeight: '700',
      color: '#0f172a',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    contactRow: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginTop: '12px'
    },
    shareContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px'
    },
    shareBtn: {
      padding: 'clamp(6px, 0.6vw, 8px) clamp(12px, 1.2vw, 14px)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(12px, 1vw, 13px)',
      fontWeight: '600',
      color: '#ffffff',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'transform 0.2s, opacity 0.2s'
    },
    shareSuccess: {
      color: '#16a34a',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      marginTop: '8px'
    },
    reviewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    },
    reviewForm: {
      marginTop: '16px'
    },
    reviewItem: {
      borderTop: '1px solid #e2e8f0',
      paddingTop: '12px',
      marginTop: '12px'
    },
    reviewRating: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px'
    },
    reviewComment: {
      color: '#475569',
      marginTop: '4px',
      fontSize: 'clamp(14px, 1.2vw, 15px)'
    },
    noReviews: {
      color: '#64748b',
      marginTop: '12px',
      fontSize: 'clamp(14px, 1.2vw, 15px)'
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
      transition: 'border-color 0.15s, box-shadow 0.15s'
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
      transition: 'border-color 0.15s, box-shadow 0.15s'
    },
    select: {
      width: '100%',
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #cbd5e1',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#0f172a',
      boxSizing: 'border-box',
      outline: 'none',
      backgroundColor: '#ffffff'
    },
    row: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    half: {
      flex: 1
    },
    errorContainer: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      backgroundColor: '#f8fafc',
      padding: '20px',
      textAlign: 'center'
    },
    errorIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    errorTitle: {
      color: '#0f172a',
      fontSize: 'clamp(18px, 2vw, 20px)',
      fontWeight: '700',
      margin: 0
    },
    errorText: {
      color: '#64748b',
      marginBottom: '16px',
      fontSize: 'clamp(14px, 1.2vw, 15px)'
    }
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        style={styles.backButton}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#cbd5e1'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
      >
        <SketchIcon d={ICONS.arrowRight} size={16} color="#64748b" strokeWidth={2.5} />
        <span>Back</span>
      </button>

      {/* Listing Details */}
      <div style={styles.card}>
        {listing.images && listing.images.length > 0 ? (
          <div style={styles.imageGrid}>
            {listing.images.map((img, index) => (
              <img 
                key={index} 
                src={img} 
                alt={listing.title} 
                style={styles.image} 
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            ...styles.imageGrid,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            minHeight: '120px'
          }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <SketchIcon d={ICONS.image} size={48} color="#94a3b8" strokeWidth={1.5} />
              <p style={{ marginTop: '8px', fontSize: '14px' }}>No image available</p>
            </div>
          </div>
        )}

        <h1 style={styles.title}>{listing.title}</h1>

        <div style={styles.badgeGroup}>
          <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
            {listing.category || 'General'}
          </span>
          {listing.sub_category && (
            <span style={{ ...styles.badge, backgroundColor: '#e2e8f0', color: '#475569' }}>
              {listing.sub_category}
            </span>
          )}
          {listing.price && (
            <span style={{ ...styles.badge, backgroundColor: '#d1fae5', color: '#065f46' }}>
              {formatPrice(listing.price)}
            </span>
          )}
          {listing.price_type === 'negotiable' && (
            <span style={{ ...styles.badge, backgroundColor: '#fef3c7', color: '#92400e' }}>
              Negotiable
            </span>
          )}
          {listing.delivery_available && (
            <span style={{ ...styles.badge, backgroundColor: '#dbeafe', color: '#1e40af' }}>
              <SketchIcon d={ICONS.delivery} size={12} color="#1e40af" strokeWidth={2} />
              <span style={{ marginLeft: '4px' }}>Delivery Available</span>
            </span>
          )}
        </div>

        <p style={styles.description}>{listing.description || 'No description provided'}</p>

        <div style={styles.metaRow}>
          {listing.location_area && (
            <span style={styles.metaItem}>
              <SketchIcon d={ICONS.mapPin} size={14} color="#64748b" strokeWidth={2} />
              {listing.location_area}
            </span>
          )}
          {listing.quantity && (
            <span style={styles.metaItem}>
              <SketchIcon d={ICONS.tag} size={14} color="#64748b" strokeWidth={2} />
              {listing.quantity} {listing.unit || 'units'}
            </span>
          )}
          {listing.delivery_fee && (
            <span style={styles.metaItem}>
              <SketchIcon d={ICONS.delivery} size={14} color="#64748b" strokeWidth={2} />
              Delivery: MWK {listing.delivery_fee}
            </span>
          )}
          <span style={styles.metaItem}>
            <SketchIcon d={ICONS.clock} size={14} color="#64748b" strokeWidth={2} />
            {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Business Info with Contact */}
      {listing.businesses && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.store} size={20} color="#2563eb" strokeWidth={2} />
            Contact {listing.businesses.business_name}
          </h3>
          
          <p style={{ fontSize: 'clamp(15px, 1.3vw, 16px)', fontWeight: '600', color: '#0f172a' }}>
            {listing.businesses.business_name}
          </p>
          
          {sellerPhone && (
            <p style={{ color: '#64748b', marginTop: '4px', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
              <SketchIcon d={ICONS.phone} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '6px' }}>{sellerPhone}</span>
            </p>
          )}
          
          {listing.businesses.address && (
            <p style={{ color: '#64748b', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
              <SketchIcon d={ICONS.mapPin} size={14} color="#64748b" strokeWidth={2} />
              <span style={{ marginLeft: '6px' }}>{listing.businesses.address}</span>
            </p>
          )}
          
          {listing.businesses.rating > 0 && (
            <p style={{ color: '#f59e0b', marginTop: '4px', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
              {renderStars(listing.businesses.rating)} ({listing.businesses.rating.toFixed(1)})
            </p>
          )}

          {/* Contact Buttons */}
          <div style={styles.contactRow}>
            {user ? (
              <>
                {sellerPhone && (
                  <>
                    <Button
                      variant="success"
                      size="md"
                      onClick={openPhoneDialer}
                      iconLeft={<SketchIcon d={ICONS.phone} size={16} color="#ffffff" strokeWidth={2} />}
                    >
                      Call Now
                    </Button>
                    <Button
                      variant="success"
                      size="md"
                      onClick={openWhatsApp}
                      style={{ backgroundColor: '#25D366' }}
                      iconLeft={<SketchIcon d={ICONS.whatsapp} size={16} color="#ffffff" strokeWidth={2} />}
                    >
                      WhatsApp
                    </Button>
                  </>
                )}
                {!sellerPhone && (
                  <p style={{ color: '#64748b', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>
                    This seller hasn't provided a phone number yet.
                  </p>
                )}
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="md">
                  <SketchIcon d={ICONS.user} size={16} color="#ffffff" strokeWidth={2} />
                  Sign in to Contact
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Share Section */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>
          <SketchIcon d={ICONS.share} size={20} color="#2563eb" strokeWidth={2} />
          Share This Listing
        </h3>
        <p style={{ color: '#64748b', fontSize: 'clamp(13px, 1.1vw, 14px)', marginBottom: '12px' }}>
          Share this product with friends and family
        </p>

        <div style={styles.shareContainer}>
          <button
            onClick={shareOnWhatsApp}
            style={{ ...styles.shareBtn, backgroundColor: '#25D366' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <SketchIcon d={ICONS.whatsapp} size={16} color="#ffffff" strokeWidth={2} />
            WhatsApp
          </button>
          <button
            onClick={shareOnFacebook}
            style={{ ...styles.shareBtn, backgroundColor: '#1877F2' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <SketchIcon d={ICONS.share} size={16} color="#ffffff" strokeWidth={2} />
            Facebook
          </button>
          <button
            onClick={shareOnTwitter}
            style={{ ...styles.shareBtn, backgroundColor: '#000000' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <SketchIcon d={ICONS.share} size={16} color="#ffffff" strokeWidth={2} />
            Twitter
          </button>
          <button
            onClick={copyLink}
            style={{ ...styles.shareBtn, backgroundColor: '#64748b' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <SketchIcon d={ICONS.copy} size={16} color="#ffffff" strokeWidth={2} />
            Copy Link
          </button>
        </div>
        {shareSuccess && <p style={styles.shareSuccess}>{shareSuccess}</p>}
      </div>

      {/* Reviews Section */}
      <div style={styles.card}>
        <div style={styles.reviewHeader}>
          <h3 style={styles.sectionTitle}>
            <SketchIcon d={ICONS.star} size={20} color="#f59e0b" strokeWidth={2} />
            Reviews ({reviews.length})
          </h3>
          {user && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              <SketchIcon d={ICONS.pencil} size={14} color="#ffffff" strokeWidth={2} />
              Write Review
            </Button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#334155', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Rating</label>
              <select
                value={reviewData.rating}
                onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                style={styles.select}
                className="input-focus"
              >
                {[5,4,3,2,1].map(num => (
                  <option key={num} value={num}>{num} Stars</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#334155', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Comment</label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                style={styles.textarea}
                placeholder="Share your experience..."
                className="input-focus"
                required
              />
            </div>
            <div style={styles.row}>
              <Button
                type="submit"
                variant="success"
                size="md"
                disabled={submitting}
                loading={submitting}
              >
                Submit Review
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} style={styles.reviewItem}>
              <div style={styles.reviewRating}>
                <span style={{ fontWeight: '600', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
                  {renderStars(review.rating)} {review.rating}/5
                </span>
                <span style={{ color: '#94a3b8', fontSize: 'clamp(11px, 0.9vw, 12px)' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={styles.reviewComment}>{review.comment}</p>
            </div>
          ))
        ) : (
          <p style={styles.noReviews}>No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
};

export default ListingDetails;