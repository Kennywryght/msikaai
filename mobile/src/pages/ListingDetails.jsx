// mobile/src/pages/ListingDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingsAPI, reviewsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
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
  share: "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
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
      const response = await listingsAPI.getById(id);
      
      if (response.data && response.data.listing) {
        setListing(response.data.listing);
        
        if (user?.id) {
          try {
            await analyticsAPI.trackView({ listingId: id });
            await analyticsAPI.trackUserActivity(user.id, 'view_listing', {
              listingId: id,
              title: response.data.listing.title,
              category: response.data.listing.category
            });
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
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
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

  const shareOnWhatsApp = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    const message = `🛒 ${listing.title}\n🏪 ${listing.businesses?.business_name || 'Business'}\n💰 ${formatPrice(listing.price)}\n📍 ${listing.location_area || 'Malawi'}\n\nView: ${url}`;
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
    return <LoadingSpinner fullScreen message="Loading listing details..." />;
  }

  if (errorMsg || !listing) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>😕</div>
        <h3 style={styles.errorTitle}>{errorMsg || 'Listing not found'}</h3>
        <p style={styles.errorText}>
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <PrimaryButton onClick={() => navigate('/search')} variant="primary">
          <Icon d={ICONS.arrowLeft} size={16} color="#FFFFFF" strokeWidth={1.75} />
          Back to Search
        </PrimaryButton>
      </div>
    );
  }

  const sellerPhone = listing.contact_phone || 
                      listing.businesses?.phone || 
                      listing.businesses?.whatsapp_number;

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: 'clamp(16px, 2vw, 24px) clamp(12px, 2vw, 16px)',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 16px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      fontWeight: '500',
      color: '#64748B',
      marginBottom: '16px',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    },
    card: {
      background: '#FFFFFF',
      borderRadius: '16px',
      padding: 'clamp(16px, 2vw, 24px)',
      marginBottom: '16px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 2px 12px rgba(30,41,59,0.04)',
    },
    imageGrid: {
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      marginBottom: '16px',
      paddingBottom: '4px',
      scrollbarWidth: 'none',
    },
    image: {
      width: 'clamp(160px, 25vw, 200px)',
      height: 'clamp(120px, 18vw, 150px)',
      objectFit: 'cover',
      borderRadius: '12px',
      border: '1px solid #E2E8F0',
      flexShrink: 0,
    },
    title: {
      fontSize: 'clamp(20px, 2.5vw, 24px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: '0 0 8px 0',
      lineHeight: '1.2',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    badgeGroup: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '12px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: 'clamp(11px, 0.9vw, 12px)',
      fontWeight: '600',
    },
    description: {
      color: '#64748B',
      lineHeight: '1.6',
      marginBottom: '12px',
      whiteSpace: 'pre-wrap',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
    },
    metaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      marginTop: '12px',
      paddingTop: '12px',
      borderTop: '1px solid #F1F5F9',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#94A3B8',
    },
    sectionTitle: {
      fontSize: 'clamp(16px, 1.6vw, 18px)',
      fontWeight: '700',
      color: '#1E293B',
      margin: '0 0 8px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontFamily: '"Fraunces", Georgia, serif',
    },
    contactRow: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginTop: '12px',
    },
    shareContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px',
    },
    shareBtn: {
      padding: 'clamp(6px, 0.6vw, 8px) clamp(12px, 1.2vw, 14px)',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: 'clamp(12px, 1vw, 13px)',
      fontWeight: '600',
      color: '#FFFFFF',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      fontFamily: 'inherit',
    },
    shareSuccess: {
      color: '#10B981',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      marginTop: '8px',
    },
    reviewHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px',
    },
    reviewForm: {
      marginTop: '16px',
    },
    reviewItem: {
      borderTop: '1px solid #F1F5F9',
      paddingTop: '12px',
      marginTop: '12px',
    },
    reviewRating: {
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '8px',
    },
    reviewComment: {
      color: '#64748B',
      marginTop: '4px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
    },
    noReviews: {
      color: '#94A3B8',
      marginTop: '12px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
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
      minHeight: 'clamp(60px, 8vw, 80px)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    select: {
      width: '100%',
      padding: 'clamp(6px, 0.6vw, 8px) clamp(10px, 1vw, 12px)',
      border: '1px solid #E2E8F0',
      borderRadius: '8px',
      fontSize: 'clamp(13px, 1.1vw, 14px)',
      color: '#1E293B',
      boxSizing: 'border-box',
      outline: 'none',
      background: '#FFFFFF',
      fontFamily: 'inherit',
    },
    row: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
    },
    half: {
      flex: 1,
    },
    errorContainer: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: '#F8FAFC',
      padding: '20px',
      textAlign: 'center',
    },
    errorIcon: {
      fontSize: '48px',
      marginBottom: '16px',
    },
    errorTitle: {
      color: '#1E293B',
      fontSize: 'clamp(18px, 2vw, 20px)',
      fontWeight: '700',
      margin: 0,
      fontFamily: '"Fraunces", Georgia, serif',
    },
    errorText: {
      color: '#94A3B8',
      marginBottom: '16px',
      fontSize: 'clamp(14px, 1.2vw, 15px)',
    },
  };

  return (
    <div style={styles.container}>
      <button 
        onClick={() => navigate(-1)} 
        style={styles.backButton}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
      >
        <Icon d={ICONS.arrowLeft} size={16} color="#64748B" strokeWidth={1.75} />
        Back
      </button>

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
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            ...styles.imageGrid,
            justifyContent: 'center',
            alignItems: 'center',
            background: '#F8FAFC',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            minHeight: '120px'
          }}>
            <div style={{ textAlign: 'center', color: '#94A3B8' }}>
              <Icon d={ICONS.image} size={48} color="#94A3B8" strokeWidth={1.5} />
              <p style={{ marginTop: '8px', fontSize: '14px' }}>No image available</p>
            </div>
          </div>
        )}

        <h1 style={styles.title}>{listing.title}</h1>

        <div style={styles.badgeGroup}>
          <span style={{ ...styles.badge, background: '#EDE9F5', color: '#1E293B' }}>
            {listing.category || 'General'}
          </span>
          {listing.sub_category && (
            <span style={{ ...styles.badge, background: '#F1F5F9', color: '#64748B' }}>
              {listing.sub_category}
            </span>
          )}
          {listing.price && (
            <span style={{ ...styles.badge, background: '#D1FAE5', color: '#065F46' }}>
              {formatPrice(listing.price)}
            </span>
          )}
          {listing.price_type === 'negotiable' && (
            <span style={{ ...styles.badge, background: '#FEF3C7', color: '#92400E' }}>
              Negotiable
            </span>
          )}
          {listing.delivery_available && (
            <span style={{ ...styles.badge, background: '#DBEAFE', color: '#1E40AF' }}>
              <Icon d={ICONS.delivery} size={12} color="#1E40AF" strokeWidth={1.75} />
              <span style={{ marginLeft: '4px' }}>Delivery Available</span>
            </span>
          )}
        </div>

        <p style={styles.description}>{listing.description || 'No description provided'}</p>

        <div style={styles.metaRow}>
          {listing.location_area && (
            <span style={styles.metaItem}>
              <Icon d={ICONS.mapPin} size={14} color="#94A3B8" strokeWidth={1.75} />
              {listing.location_area}
            </span>
          )}
          {listing.quantity && (
            <span style={styles.metaItem}>
              <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
              {listing.quantity} {listing.unit || 'units'}
            </span>
          )}
          {listing.delivery_fee && (
            <span style={styles.metaItem}>
              <Icon d={ICONS.delivery} size={14} color="#94A3B8" strokeWidth={1.75} />
              Delivery: MWK {listing.delivery_fee}
            </span>
          )}
          <span style={styles.metaItem}>
            <Icon d={ICONS.clock} size={14} color="#94A3B8" strokeWidth={1.75} />
            {new Date(listing.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {listing.businesses && (
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <Icon d={ICONS.store} size={20} color="#F59E0B" strokeWidth={1.75} />
            Contact {listing.businesses.business_name}
          </h3>
          
          <p style={{ fontSize: 'clamp(15px, 1.3vw, 16px)', fontWeight: '600', color: '#1E293B' }}>
            {listing.businesses.business_name}
          </p>
          
          {sellerPhone && (
            <p style={{ color: '#94A3B8', marginTop: '4px', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
              <Icon d={ICONS.phone} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '6px' }}>{sellerPhone}</span>
            </p>
          )}
          
          {listing.businesses.address && (
            <p style={{ color: '#94A3B8', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
              <Icon d={ICONS.mapPin} size={14} color="#94A3B8" strokeWidth={1.75} />
              <span style={{ marginLeft: '6px' }}>{listing.businesses.address}</span>
            </p>
          )}
          
          {listing.businesses.rating > 0 && (
            <p style={{ color: '#F59E0B', marginTop: '4px', fontSize: 'clamp(14px, 1.2vw, 15px)' }}>
              {renderStars(listing.businesses.rating)} ({listing.businesses.rating.toFixed(1)})
            </p>
          )}

          <div style={styles.contactRow}>
            {user ? (
              <>
                {sellerPhone && (
                  <>
                    <PrimaryButton
                      variant="success"
                      size="md"
                      onClick={openPhoneDialer}
                    >
                      <Icon d={ICONS.phone} size={16} color="#FFFFFF" strokeWidth={1.75} />
                      Call Now
                    </PrimaryButton>
                    <PrimaryButton
                      variant="success"
                      size="md"
                      onClick={openWhatsApp}
                      style={{ background: '#25D366' }}
                    >
                      <Icon d={ICONS.whatsapp} size={16} color="#FFFFFF" strokeWidth={1.75} />
                      WhatsApp
                    </PrimaryButton>
                  </>
                )}
                {!sellerPhone && (
                  <p style={{ color: '#94A3B8', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>
                    This seller hasn't provided a phone number yet.
                  </p>
                )}
              </>
            ) : (
              <Link to="/login">
                <PrimaryButton variant="primary" size="md">
                  <Icon d={ICONS.user} size={16} color="#FFFFFF" strokeWidth={1.75} />
                  Sign in to Contact
                </PrimaryButton>
              </Link>
            )}
          </div>
        </div>
      )}

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>
          <Icon d={ICONS.share} size={20} color="#F59E0B" strokeWidth={1.75} />
          Share This Listing
        </h3>
        <p style={{ color: '#94A3B8', fontSize: 'clamp(13px, 1.1vw, 14px)', marginBottom: '12px' }}>
          Share this product with friends and family
        </p>

        <div style={styles.shareContainer}>
          <button
            onClick={shareOnWhatsApp}
            style={{ ...styles.shareBtn, background: '#25D366' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon d={ICONS.whatsapp} size={16} color="#FFFFFF" strokeWidth={1.75} />
            WhatsApp
          </button>
          <button
            onClick={shareOnFacebook}
            style={{ ...styles.shareBtn, background: '#1877F2' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon d={ICONS.share} size={16} color="#FFFFFF" strokeWidth={1.75} />
            Facebook
          </button>
          <button
            onClick={shareOnTwitter}
            style={{ ...styles.shareBtn, background: '#1DA1F2' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon d={ICONS.share} size={16} color="#FFFFFF" strokeWidth={1.75} />
            Twitter
          </button>
          <button
            onClick={copyLink}
            style={{ ...styles.shareBtn, background: '#64748B' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Icon d={ICONS.copy} size={16} color="#FFFFFF" strokeWidth={1.75} />
            Copy Link
          </button>
        </div>
        {shareSuccess && <p style={styles.shareSuccess}>{shareSuccess}</p>}
      </div>

      <div style={styles.card}>
        <div style={styles.reviewHeader}>
          <h3 style={styles.sectionTitle}>
            <Icon d={ICONS.star} size={20} color="#F59E0B" strokeWidth={1.75} />
            Reviews ({reviews.length})
          </h3>
          {user && (
            <PrimaryButton
              variant="primary"
              size="sm"
              onClick={() => setShowReviewForm(!showReviewForm)}
            >
              <Icon d={ICONS.pencil} size={14} color="#FFFFFF" strokeWidth={1.75} />
              Write Review
            </PrimaryButton>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} style={styles.reviewForm}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#475569', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Rating</label>
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
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', color: '#475569', fontSize: 'clamp(13px, 1.1vw, 14px)' }}>Comment</label>
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
              <PrimaryButton type="submit" variant="success" size="md" disabled={submitting} loading={submitting}>
                Submit Review
              </PrimaryButton>
              <PrimaryButton type="button" variant="outline" size="md" onClick={() => setShowReviewForm(false)}>
                Cancel
              </PrimaryButton>
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
                <span style={{ color: '#94A3B8', fontSize: 'clamp(11px, 0.9vw, 12px)' }}>
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