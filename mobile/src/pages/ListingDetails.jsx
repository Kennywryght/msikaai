// mobile/src/pages/ListingDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { listingsAPI, reviewsAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus: "M12 4v16m8-8H4",
  message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
};

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast, success, error } = useToast();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const isMobile = windowWidth <= 768;

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
    if (id) {
      fetchListingDetails();
    } else {
      setErrorMsg('No listing ID provided');
      setLoading(false);
    }
  }, [id]);

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
    
    const message = `Hi, I'm interested in your listing: ${listing.title} on Kumsika.`;
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
    const text = `${listing.title} - Check this out on Kumsika`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    await navigator.clipboard.writeText(url);
    setShareSuccess('Link copied to clipboard!');
    success('Link copied to clipboard!');
    setTimeout(() => setShareSuccess(''), 3000);
  };

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading listing details..." />;
  }

  if (errorMsg || !listing) {
    return (
      <div className="error-container">
        <div className="error-icon">😕</div>
        <h3 className="error-title">{errorMsg || 'Listing not found'}</h3>
        <p className="error-text">
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <button className="btn-primary" onClick={() => navigate('/search')}>
          <Icon d={ICONS.arrowLeft} size={16} color="#FFFFFF" strokeWidth={1.75} />
          Back to Search
        </button>
        <style jsx>{`
          .error-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            background: #F8FAFC;
            padding: 20px;
            text-align: center;
          }
          .error-icon { font-size: 48px; }
          .error-title {
            color: #1E293B;
            font-size: clamp(18px, 2vw, 20px);
            font-weight: 700;
            margin: 0;
          }
          .error-text {
            color: #94A3B8;
            margin: 0 0 8px;
            font-size: clamp(14px, 1.2vw, 15px);
          }
          .btn-primary {
            padding: 10px 24px;
            background: #1E293B;
            border: none;
            border-radius: 10px;
            color: #FFF;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            font-family: inherit;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .btn-primary:hover {
            background: #F59E0B;
            transform: scale(0.98);
          }
        `}</style>
      </div>
    );
  }

  const sellerPhone = listing.contact_phone || 
                      listing.businesses?.phone || 
                      listing.businesses?.whatsapp_number;

  return (
    <div className="listing-details">
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
        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <Icon d={ICONS.arrowLeft} size={16} color="#64748B" strokeWidth={1.75} />
          Back
        </button>

        {/* Listing Card */}
        <div className="listing-card">
          {/* Images */}
          {listing.images && listing.images.length > 0 ? (
            <div className="image-grid">
              {listing.images.map((img, index) => (
                <img 
                  key={index} 
                  src={img} 
                  alt={listing.title} 
                  className="listing-image" 
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          ) : (
            <div className="no-image">
              <Icon d={ICONS.image} size={48} color="#CBD5E1" strokeWidth={1.5} />
              <p>No image available</p>
            </div>
          )}

          <h1 className="listing-title">{listing.title}</h1>

          {/* Badges */}
          <div className="badge-group">
            <span className="badge badge-category">{listing.category || 'General'}</span>
            {listing.sub_category && (
              <span className="badge badge-sub">{listing.sub_category}</span>
            )}
            {listing.price && (
              <span className="badge badge-price">{formatPrice(listing.price)}</span>
            )}
            {listing.price_type === 'negotiable' && (
              <span className="badge badge-negotiable">Negotiable</span>
            )}
            {listing.delivery_available && (
              <span className="badge badge-delivery">
                <Icon d={ICONS.delivery} size={12} color="#1E40AF" strokeWidth={1.75} />
                Delivery Available
              </span>
            )}
          </div>

          <p className="listing-description">{listing.description || 'No description provided'}</p>

          {/* Meta Info */}
          <div className="meta-row">
            {listing.location_area && (
              <span className="meta-item">
                <Icon d={ICONS.mapPin} size={14} color="#94A3B8" strokeWidth={1.75} />
                {listing.location_area}
              </span>
            )}
            {listing.quantity && (
              <span className="meta-item">
                <Icon d={ICONS.tag} size={14} color="#94A3B8" strokeWidth={1.75} />
                {listing.quantity} {listing.unit || 'units'}
              </span>
            )}
            {listing.delivery_fee && (
              <span className="meta-item">
                <Icon d={ICONS.delivery} size={14} color="#94A3B8" strokeWidth={1.75} />
                Delivery: MWK {listing.delivery_fee}
              </span>
            )}
            <span className="meta-item">
              <Icon d={ICONS.clock} size={14} color="#94A3B8" strokeWidth={1.75} />
              {new Date(listing.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Contact Card */}
        {listing.businesses && (
          <div className="contact-card">
            <h3 className="section-title">
              <Icon d={ICONS.store} size={20} color="#F59E0B" strokeWidth={1.75} />
              Contact {listing.businesses.business_name}
            </h3>
            
            <p className="business-name">{listing.businesses.business_name}</p>
            
            {sellerPhone && (
              <p className="contact-phone">
                <Icon d={ICONS.phone} size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>{sellerPhone}</span>
              </p>
            )}
            
            {listing.businesses.address && (
              <p className="contact-address">
                <Icon d={ICONS.mapPin} size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>{listing.businesses.address}</span>
              </p>
            )}
            
            {listing.businesses.rating > 0 && (
              <p className="business-rating">
                {renderStars(listing.businesses.rating)} ({listing.businesses.rating.toFixed(1)})
              </p>
            )}

            <div className="contact-buttons">
              {user ? (
                <>
                  {sellerPhone && (
                    <>
                      <button className="btn-call" onClick={openPhoneDialer}>
                        <Icon d={ICONS.phone} size={16} color="#FFFFFF" strokeWidth={1.75} />
                        Call Now
                      </button>
                      <button className="btn-whatsapp" onClick={openWhatsApp}>
                        <Icon d={ICONS.whatsapp} size={16} color="#FFFFFF" strokeWidth={1.75} />
                        WhatsApp
                      </button>
                    </>
                  )}
                  {!sellerPhone && (
                    <p className="no-phone">This seller hasn't provided a phone number yet.</p>
                  )}
                </>
              ) : (
                <Link to="/login" className="btn-login">
                  <Icon d={ICONS.user} size={16} color="#FFFFFF" strokeWidth={1.75} />
                  Sign in to Contact
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Share Card */}
        <div className="share-card">
          <h3 className="section-title">
            <Icon d={ICONS.share} size={20} color="#F59E0B" strokeWidth={1.75} />
            Share This Listing
          </h3>
          <p className="share-subtitle">Share this product with friends and family</p>

          <div className="share-buttons">
            <button className="share-btn whatsapp" onClick={shareOnWhatsApp}>
              <Icon d={ICONS.whatsapp} size={16} color="#FFFFFF" strokeWidth={1.75} />
              WhatsApp
            </button>
            <button className="share-btn facebook" onClick={shareOnFacebook}>
              <Icon d={ICONS.share} size={16} color="#FFFFFF" strokeWidth={1.75} />
              Facebook
            </button>
            <button className="share-btn twitter" onClick={shareOnTwitter}>
              <Icon d={ICONS.share} size={16} color="#FFFFFF" strokeWidth={1.75} />
              Twitter
            </button>
            <button className="share-btn copy" onClick={copyLink}>
              <Icon d={ICONS.copy} size={16} color="#FFFFFF" strokeWidth={1.75} />
              Copy Link
            </button>
          </div>
          {shareSuccess && <p className="share-success">{shareSuccess}</p>}
        </div>

        {/* Reviews Card */}
        <div className="reviews-card">
          <div className="reviews-header">
            <h3 className="section-title">
              <Icon d={ICONS.star} size={20} color="#F59E0B" strokeWidth={1.75} />
              Reviews ({reviews.length})
            </h3>
            {user && (
              <button className="btn-write-review" onClick={() => setShowReviewForm(!showReviewForm)}>
                <Icon d={ICONS.pencil} size={14} color="#FFFFFF" strokeWidth={1.75} />
                Write Review
              </button>
            )}
          </div>

          {showReviewForm && (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <select
                  value={reviewData.rating}
                  onChange={(e) => setReviewData({ ...reviewData, rating: parseInt(e.target.value) })}
                  className="form-select"
                >
                  {[5,4,3,2,1].map(num => (
                    <option key={num} value={num}>{num} Stars</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Comment</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  className="form-textarea"
                  placeholder="Share your experience..."
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit-review" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" className="btn-cancel-review" onClick={() => setShowReviewForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header-row">
                  <span className="review-stars">{renderStars(review.rating)} {review.rating}/5</span>
                  <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}
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
            const active = item.id === 'search';
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
        .listing-details {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 80px;
        }

        @media (min-width: 769px) {
          .listing-details {
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
          padding: 16px 16px 40px;
        }

        /* ===== BACK BUTTON ===== */
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
          margin-bottom: 16px;
        }

        .back-btn:hover {
          background: #F1F5F9;
          border-color: #E2E8F0;
        }

        /* ===== LISTING CARD ===== */
        .listing-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .image-grid {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          margin-bottom: 14px;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .image-grid::-webkit-scrollbar {
          display: none;
        }

        .listing-image {
          width: clamp(140px, 22vw, 180px);
          height: clamp(110px, 16vw, 130px);
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid #F1F5F9;
          flex-shrink: 0;
        }

        .no-image {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 14px;
          min-height: 120px;
          color: #94A3B8;
        }

        .no-image p {
          margin: 8px 0 0;
          font-size: 14px;
        }

        .listing-title {
          font-size: clamp(20px, 2.5vw, 24px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 8px;
          line-height: 1.2;
        }

        .badge-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .badge {
          padding: 3px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .badge-category {
          background: #EDE9F5;
          color: #1E293B;
        }

        .badge-sub {
          background: #F1F5F9;
          color: #64748B;
        }

        .badge-price {
          background: #D1FAE5;
          color: #065F46;
        }

        .badge-negotiable {
          background: #FEF3C7;
          color: #92400E;
        }

        .badge-delivery {
          background: #DBEAFE;
          color: #1E40AF;
        }

        .listing-description {
          font-size: 14px;
          color: #64748B;
          line-height: 1.6;
          margin: 0 0 12px;
          white-space: pre-wrap;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: #94A3B8;
        }

        /* ===== CONTACT CARD ===== */
        .contact-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .business-name {
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 4px;
        }

        .contact-phone,
        .contact-address {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #94A3B8;
          margin: 2px 0;
        }

        .business-rating {
          color: #F59E0B;
          font-size: 14px;
          margin: 4px 0 0;
        }

        .contact-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .btn-call {
          padding: 8px 20px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-call:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .btn-whatsapp {
          padding: 8px 20px;
          background: #25D366;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-whatsapp:hover {
          transform: scale(0.98);
          opacity: 0.9;
        }

        .btn-login {
          padding: 8px 20px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-login:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .no-phone {
          color: #94A3B8;
          font-size: 14px;
          margin: 0;
        }

        /* ===== SHARE CARD ===== */
        .share-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .share-subtitle {
          font-size: 13px;
          color: #94A3B8;
          margin: 0 0 12px;
        }

        .share-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .share-btn {
          padding: 6px 16px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .share-btn:hover {
          transform: scale(0.97);
        }

        .share-btn.whatsapp { background: #25D366; }
        .share-btn.facebook { background: #1877F2; }
        .share-btn.twitter { background: #1DA1F2; }
        .share-btn.copy { background: #64748B; }

        .share-success {
          color: #10B981;
          font-size: 13px;
          margin: 8px 0 0;
        }

        /* ===== REVIEWS CARD ===== */
        .reviews-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px 18px;
          border: 1px solid #F1F5F9;
        }

        .reviews-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .btn-write-review {
          padding: 6px 16px;
          background: #1E293B;
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-write-review:hover {
          background: #F59E0B;
          transform: scale(0.98);
        }

        .review-form {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
        }

        .form-group {
          margin-bottom: 10px;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .form-select {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          color: #1E293B;
          outline: none;
          font-family: inherit;
          background: #FFFFFF;
        }

        .form-select:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .form-textarea {
          width: 100%;
          padding: 6px 12px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 14px;
          color: #1E293B;
          outline: none;
          font-family: inherit;
          background: #FFFFFF;
          resize: vertical;
          min-height: 60px;
          transition: all 0.2s;
        }

        .form-textarea:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .form-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-submit-review {
          padding: 6px 20px;
          background: #10B981;
          border: none;
          border-radius: 8px;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-submit-review:hover:not(:disabled) {
          transform: scale(0.98);
        }

        .btn-submit-review:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-cancel-review {
          padding: 6px 20px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #64748B;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .btn-cancel-review:hover {
          background: #E2E8F0;
        }

        .review-item {
          padding-top: 12px;
          margin-top: 12px;
          border-top: 1px solid #F1F5F9;
        }

        .review-item:first-of-type {
          border-top: none;
          margin-top: 12px;
        }

        .review-header-row {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .review-stars {
          font-weight: 600;
          font-size: 14px;
          color: #1E293B;
        }

        .review-date {
          font-size: 12px;
          color: #94A3B8;
        }

        .review-comment {
          font-size: 14px;
          color: #64748B;
          margin: 4px 0 0;
        }

        .no-reviews {
          color: #94A3B8;
          font-size: 14px;
          margin: 12px 0 0;
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
          .main-content {
            padding: 12px 12px 32px;
          }
          .listing-card,
          .contact-card,
          .share-card,
          .reviews-card {
            padding: 14px 16px;
          }
          .listing-image {
            width: 120px;
            height: 100px;
          }
          .contact-buttons {
            flex-direction: column;
          }
          .btn-call,
          .btn-whatsapp,
          .btn-login {
            width: 100%;
            justify-content: center;
          }
          .share-buttons {
            flex-direction: column;
          }
          .share-btn {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 380px) {
          .listing-image {
            width: 100px;
            height: 85px;
          }
          .badge-group .badge {
            font-size: 10px;
            padding: 2px 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default ListingDetails;