// mobile/src/pages/ListingDetails.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  listingsAPI,
  reviewsAPI,
  analyticsAPI,
  messagesAPI,
  paymentAPI,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import CommentSection from '../components/CommentSection';

// ============================================================
// ICONS (unchanged)
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    store: 'M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z',
    phone: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z',
    whatsapp: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5zM16 12v1.5M12 12v1.5M8 12v1.5',
    facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8z',
    check: 'M20 6L9 17l-5-5',
    pencil: 'M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z',
    close: 'M18 6L6 18M6 6l12 12',
    delivery: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M9 16h6',
    copy: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z',
    share: 'M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13',
    image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    plus: 'M12 4v16m8-8H4',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    sparkles: 'M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z',
    crown: 'M3 8l4 4 5-7 5 7 4-4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8z',
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    zap: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
    alertCircle: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 8v4M12 16h.01',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
    heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    comment: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  };
  const d = icons[name] || icons.store;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
};

// ============================================================
// HELPERS
// ============================================================
const isPremium = (item) => {
  if (!item) return false;
  if (item.is_premium === true) return true;
  if (item.is_featured === true) return true;
  if (item.businesses?.is_premium === true) return true;
  if (item.businesses?.is_featured === true) return true;
  if (item.premium_until) {
    const t = new Date(item.premium_until).getTime();
    if (!Number.isNaN(t) && t > Date.now()) return true;
  }
  return false;
};

const getPremiumUntil = (item) => {
  if (!item?.premium_until) return null;
  const d = new Date(item.premium_until);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysUntil = (date) => {
  if (!date) return 0;
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const resolveSellerUserId = (item) => {
  if (!item) return null;
  return (
    item.businesses?.user_id ||
    item.businesses?.userId ||
    item.businesses?.owner_id ||
    item.businesses?.owner?.id ||
    item.businesses?.profile_id ||
    item.seller_id ||
    item.user_id ||
    item.owner_id ||
    null
  );
};

const resolveSellerPhone = (item) => {
  if (!item) return null;
  return (
    item.contact_phone ||
    item.businesses?.phone ||
    item.businesses?.whatsapp_number ||
    item.businesses?.whatsapp ||
    null
  );
};

const resolveSellerFacebook = (item) => {
  if (!item) return null;
  const raw =
    item.businesses?.facebook_page ||
    item.businesses?.facebook_url ||
    item.businesses?.facebook ||
    item.facebook_page ||
    item.facebook_url ||
    null;
  if (!raw) return null;

  // Normalize into an m.me/<username> URL
  const cleaned = String(raw).trim();
  // If it's already a full URL
  if (/^https?:\/\//i.test(cleaned)) {
    // Convert facebook.com/<user> → m.me/<user>
    const m = cleaned.match(/facebook\.com\/(?:pages\/[^/]+\/)?([^/?#]+)/i);
    if (m && m[1]) return `https://m.me/${m[1]}`;
    return cleaned;
  }
  // Otherwise treat as username
  return `https://m.me/${cleaned.replace(/^@/, '')}`;
};

// ============================================================
// BOOST MODAL (unchanged — payment aware)
// ============================================================
const BOOST_PLANS = [
  { days: 7, label: '7 days', price: 'MK 2,000', amount: 2000, popular: true },
  { days: 14, label: '14 days', price: 'MK 3,500', amount: 3500 },
  { days: 30, label: '30 days', price: 'MK 6,000', amount: 6000, best: true },
];

const BoostModal = ({ listing, onClose, onActivated }) => {
  const navigate = useNavigate();
  const { showToast, success } = useToast();
  const [stage, setStage] = useState('pick');
  const [days, setDays] = useState(7);
  const [message, setMessage] = useState('');
  const [paymentRef, setPaymentRef] = useState(null);
  const pollTimerRef = useRef(null);

  useEffect(() => () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  const selectedPlan = BOOST_PLANS.find((p) => p.days === days) || BOOST_PLANS[0];

  const startPayment = async () => {
    setStage('processing');
    setMessage('');
    try {
      const res = await paymentAPI.initiatePayment({
        purpose: 'listing_boost',
        listingId: listing?.id,
        durationDays: days,
        amount: selectedPlan.amount,
        currency: 'MWK',
      });
      const data = res?.data || {};

      if (data.checkoutUrl) {
        setPaymentRef(data.reference || data.txRef);
        window.open(data.checkoutUrl, '_blank', 'noopener');
        setStage('pending');
        startPolling(data.reference || data.txRef);
        return;
      }
      if (data.instructions) {
        setPaymentRef(data.reference || data.txRef);
        setMessage(data.instructions);
        setStage('pending');
        startPolling(data.reference || data.txRef);
        return;
      }
      if (data.pending) {
        setMessage(
          data.message ||
            'Your request has been received. Our team will activate your boost shortly.'
        );
        setStage('manual');
        return;
      }
      if (data.listing) {
        success('Your listing is now in the Spotlight ✨');
        setStage('success');
        onActivated?.(data.listing);
        return;
      }
      setMessage(
        'Boost requests are being finalised. Our team will activate your listing within 24 hours.'
      );
      setStage('manual');
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error;
      if (status === 404 || status === 501 || /not configured|not implemented/i.test(serverMsg || '')) {
        setMessage(
          'Boost payments are being set up. Our team will activate your listing within 24 hours and contact you about payment.'
        );
        setStage('manual');
        return;
      }
      setMessage(serverMsg || 'Could not start the payment. Please try again.');
      setStage('failed');
    }
  };

  const startPolling = (reference) => {
    if (!reference) return;
    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    pollTimerRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const res = await paymentAPI.verifyPayment(reference);
        const data = res?.data || {};
        if (data.status === 'paid' || data.status === 'success') {
          clearInterval(pollTimerRef.current);
          success('Payment confirmed — your listing is now in the Spotlight ✨');
          setStage('success');
          onActivated?.(data.listing);
          return;
        }
        if (data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(pollTimerRef.current);
          setMessage(data.message || 'Payment was not completed.');
          setStage('failed');
          return;
        }
      } catch {}
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(pollTimerRef.current);
        setMessage(
          "We couldn't confirm your payment in time. If you paid, your boost will still be activated. Contact support if it doesn't appear within an hour."
        );
        setStage('manual');
      }
    }, 3000);
  };

  return (
    <div className="boost-overlay" onClick={onClose}>
      <div className="boost-modal" onClick={(e) => e.stopPropagation()}>
        <div className="boost-head">
          <div className="boost-head-icon">
            <Icon name="crown" size={22} color="#F0D9A8" strokeWidth={2} />
          </div>
          <div className="boost-head-text">
            <h3 className="boost-title">Boost to Spotlight</h3>
            <p className="boost-sub">
              {stage === 'success' ? 'Your listing is featured' : 'Get more eyes on your listing'}
            </p>
          </div>
          <button className="boost-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} color="#201F1B" strokeWidth={2.2} />
          </button>
        </div>

        <div className="boost-body">
          {stage === 'pick' && (
            <>
              <p className="boost-preview-title">{listing?.title}</p>
              <div className="boost-benefits">
                <div className="boost-benefit">
                  <span className="boost-benefit-icon">
                    <Icon name="sparkles" size={14} color="#BC5B34" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="boost-benefit-title">Top of the homepage</div>
                    <div className="boost-benefit-desc">Appear in the Spotlight strip</div>
                  </div>
                </div>
                <div className="boost-benefit">
                  <span className="boost-benefit-icon">
                    <Icon name="crown" size={14} color="#BC5B34" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="boost-benefit-title">Premium crown badge</div>
                    <div className="boost-benefit-desc">Stand out with a gold highlight</div>
                  </div>
                </div>
                <div className="boost-benefit">
                  <span className="boost-benefit-icon">
                    <Icon name="zap" size={14} color="#BC5B34" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="boost-benefit-title">More views & messages</div>
                    <div className="boost-benefit-desc">Premium listings get more attention</div>
                  </div>
                </div>
              </div>

              <div className="boost-section-label">Choose duration</div>
              <div className="boost-options">
                {BOOST_PLANS.map((opt) => {
                  const active = days === opt.days;
                  return (
                    <button
                      key={opt.days}
                      type="button"
                      className={`boost-option ${active ? 'active' : ''}`}
                      onClick={() => setDays(opt.days)}
                    >
                      {opt.popular && <span className="boost-option-tag popular">Popular</span>}
                      {opt.best && <span className="boost-option-tag best">Best value</span>}
                      <span className="boost-option-days">{opt.label}</span>
                      <span className="boost-option-price">{opt.price}</span>
                      <span className="boost-option-check">
                        {active && <Icon name="check" size={12} color="#F7F1E3" strokeWidth={2.6} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {stage === 'processing' && (
            <div className="boost-status">
              <span className="boost-status-spinner" />
              <p className="boost-status-text">Starting your secure payment…</p>
              <p className="boost-status-sub">This only takes a moment.</p>
            </div>
          )}
          {stage === 'pending' && (
            <div className="boost-status">
              <span className="boost-status-spinner" />
              <p className="boost-status-text">Waiting for payment confirmation…</p>
              {message && <p className="boost-status-sub">{message}</p>}
              <p className="boost-status-sub">
                Complete the payment in the window that just opened. We'll update this page automatically.
              </p>
            </div>
          )}
          {stage === 'manual' && (
            <div className="boost-status">
              <div className="boost-status-badge amber">
                <Icon name="clock" size={20} color="#92400E" strokeWidth={2} />
              </div>
              <p className="boost-status-text">Request received</p>
              <p className="boost-status-sub">{message}</p>
            </div>
          )}
          {stage === 'success' && (
            <div className="boost-status">
              <div className="boost-status-badge green">
                <Icon name="check" size={22} color="#065F46" strokeWidth={2.6} />
              </div>
              <p className="boost-status-text">You're in the Spotlight ✨</p>
              <p className="boost-status-sub">
                Your listing is now featured at the top of the homepage.
              </p>
            </div>
          )}
          {stage === 'failed' && (
            <div className="boost-status">
              <div className="boost-status-badge red">
                <Icon name="alertCircle" size={20} color="#7F1D1D" strokeWidth={2} />
              </div>
              <p className="boost-status-text">Something went wrong</p>
              <p className="boost-status-sub">{message}</p>
            </div>
          )}
        </div>

        <div className="boost-foot">
          {stage === 'pick' && (
            <>
              <button className="boost-cancel" onClick={onClose}>Cancel</button>
              <button className="boost-confirm" onClick={startPayment}>
                <Icon name="crown" size={14} color="#F7F1E3" strokeWidth={2.2} />
                Boost now · {selectedPlan.price}
              </button>
            </>
          )}
          {stage === 'processing' && (
            <button className="boost-cancel wide" disabled>Please wait…</button>
          )}
          {stage === 'pending' && (
            <>
              <button className="boost-cancel" onClick={onClose}>Keep in background</button>
              <button
                className="boost-confirm"
                onClick={() => {
                  if (paymentRef) startPolling(paymentRef);
                  showToast('Checking payment status…', 'info');
                }}
              >
                <Icon name="refresh" size={14} color="#F7F1E3" strokeWidth={2.2} />
                Check now
              </button>
            </>
          )}
          {stage === 'manual' && (
            <button className="boost-confirm wide" onClick={onClose}>Got it</button>
          )}
          {stage === 'success' && (
            <button
              className="boost-confirm wide"
              onClick={() => { onClose(); navigate('/landing'); }}
            >
              <Icon name="externalLink" size={14} color="#F7F1E3" strokeWidth={2.2} />
              See it on the homepage
            </button>
          )}
          {stage === 'failed' && (
            <>
              <button className="boost-cancel" onClick={onClose}>Close</button>
              <button className="boost-confirm" onClick={() => setStage('pick')}>
                <Icon name="refresh" size={14} color="#F7F1E3" strokeWidth={2.2} />
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { showToast, success } = useToast();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [openingChat, setOpeningChat] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 375
  );
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [imageIdx, setImageIdx] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  const isMobile = windowWidth <= 768;
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (id) fetchListingDetails();
    else {
      setErrorMsg('No listing ID provided');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (showComments) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showComments]);

  useEffect(() => {
    if (!showComments) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowComments(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showComments]);

  const fetchListingDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await listingsAPI.getById(id);
      if (response?.data?.listing) {
        setListing(response.data.listing);
        if (user?.id) {
          analyticsAPI.trackView({ listingId: id }).catch(() => {});
          analyticsAPI
            .trackUserActivity(user.id, 'view_listing', {
              listingId: id,
              title: response.data.listing.title,
              category: response.data.listing.category,
            })
            .catch(() => {});
        }
      } else {
        setErrorMsg('Listing not found');
      }
      try {
        const reviewsResponse = await reviewsAPI.getByListing(id);
        setReviews(reviewsResponse?.data?.reviews ?? []);
      } catch (err) {
        if (err?.response?.status !== 404) {
          console.warn('Reviews fetch failed:', err?.message);
        }
        setReviews([]);
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const requireAuth = useCallback(
    (reason = 'continue') => {
      if (user) return true;
      showToast(`Please sign in to ${reason}`, 'warning');
      navigate('/login', { state: { from: location.pathname } });
      return false;
    },
    [user, navigate, location.pathname]
  );

  // ---- LIKE ----
  const handleLike = async () => {
    if (!requireAuth('like this listing')) return;
    if (liking) return;

    const wasLiked = !!listing.liked_by_me;
    const prevLikes = listing.likes ?? 0;

    setLiking(true);
    setListing((prev) =>
      prev ? { ...prev, liked_by_me: !wasLiked, likes: prevLikes + (wasLiked ? -1 : 1) } : prev
    );

    try {
      if (wasLiked) await listingsAPI.unlike(listing.id);
      else await listingsAPI.like(listing.id);
    } catch (err) {
      console.error('like error:', err);
      setListing((prev) =>
        prev ? { ...prev, liked_by_me: wasLiked, likes: prevLikes } : prev
      );
      showToast('Failed to update like', 'error');
    } finally {
      setLiking(false);
    }
  };

  const handleOpenComments = () => setShowComments(true);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!requireAuth('write a review')) return;
    setSubmitting(true);
    try {
      await reviewsAPI.create({
        listingId: id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      if (user?.id) {
        analyticsAPI
          .trackUserActivity(user.id, 'write_review', {
            listingId: id,
            rating: reviewData.rating,
          })
          .catch(() => {});
      }
      success('✅ Review submitted successfully!');
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
      fetchListingDetails();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'Price on request';
    return `MK ${Number(price).toLocaleString()}`;
  };

  const renderStars = (rating) => {
    const fullStars = Math.round(rating || 0);
    const emptyStars = 5 - fullStars;
    return '⭐'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  // ============================================================
  // ★ MESSAGE SELLER — the in-app chat
  // ============================================================
  const handleMessageSeller = async () => {
    if (!requireAuth('message the seller')) return;

    const sellerId = resolveSellerUserId(listing);
    if (!sellerId) {
      showToast('Seller information is unavailable for this listing', 'error');
      return;
    }
    if (sellerId === user.id) {
      showToast("You can't message yourself about your own listing", 'warning');
      return;
    }

    setOpeningChat(true);
    try {
      const res = await messagesAPI.createConversation(sellerId, listing.id);
      const conversationId = res?.data?.conversation?.id;
      if (!conversationId) throw new Error('Could not open conversation');

      if (user?.id) {
        analyticsAPI
          .trackUserActivity(user.id, 'open_chat', {
            listingId: id,
            businessId: listing.businesses?.id,
            method: 'chat',
          })
          .catch(() => {});
      }

      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Open chat error:', err);
      const status = err?.response?.status;
      const msg =
        status === 401
          ? 'Please sign in again to message the seller'
          : status === 404
          ? 'Seller account could not be found'
          : status === 400
          ? 'Unable to start a chat with this seller'
          : err?.response?.data?.error ||
            err?.message ||
            'Failed to open chat';
      showToast(msg, 'error');
    } finally {
      setOpeningChat(false);
    }
  };

  // ============================================================
  // ★ CONTACT THE SELLER ON WHATSAPP — opens a DIRECT chat
  //    with the seller (not the share flow)
  // ============================================================
  const handleContactWhatsApp = () => {
    if (!requireAuth('contact the seller')) return;
    const phone = resolveSellerPhone(listing);
    if (!phone) {
      showToast('This seller has not provided a WhatsApp number yet.', 'warning');
      return;
    }

    if (user?.id) {
      analyticsAPI.trackContact({ listingId: id }).catch(() => {});
      analyticsAPI
        .trackUserActivity(user.id, 'contact_business', {
          listingId: id,
          businessId: listing.businesses?.id,
          method: 'whatsapp',
        })
        .catch(() => {});
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const withCountryCode = cleanPhone.startsWith('265')
      ? cleanPhone
      : cleanPhone.startsWith('0')
      ? `265${cleanPhone.slice(1)}`
      : `265${cleanPhone}`;

    const message = `Hi, I'm interested in your listing: "${listing.title}" on Kumsika.`;
    const url = `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  };

  // ============================================================
  // ★ CONTACT THE SELLER ON FACEBOOK MESSENGER
  // ============================================================
  const handleContactFacebook = () => {
    if (!requireAuth('contact the seller')) return;
    const messengerUrl = resolveSellerFacebook(listing);
    if (!messengerUrl) {
      showToast(
        'This seller has not linked a Facebook page yet.',
        'warning'
      );
      return;
    }
    if (user?.id) {
      analyticsAPI.trackContact({ listingId: id }).catch(() => {});
      analyticsAPI
        .trackUserActivity(user.id, 'contact_business', {
          listingId: id,
          businessId: listing.businesses?.id,
          method: 'facebook',
        })
        .catch(() => {});
    }
    window.open(messengerUrl, '_blank', 'noopener');
  };

  // ============================================================
  // ★ CALL THE SELLER (direct)
  // ============================================================
  const openPhoneDialer = () => {
    if (!requireAuth('call the seller')) return;
    const phone = resolveSellerPhone(listing);
    if (!phone) {
      showToast('This seller has not provided a phone number yet.', 'warning');
      return;
    }
    if (user?.id) {
      analyticsAPI.trackContact({ listingId: id }).catch(() => {});
      analyticsAPI
        .trackUserActivity(user.id, 'contact_business', {
          listingId: id,
          businessId: listing.businesses?.id,
          method: 'phone',
        })
        .catch(() => {});
    }
    window.open(`tel:${phone}`, '_blank');
  };

  // ============================================================
  // ★ SHARE THE LISTING (public — share the URL with anyone)
  // ============================================================
  const shareOnWhatsApp = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    const message = `🛒 ${listing.title}\n🏪 ${
      listing.businesses?.business_name || 'Business'
    }\n💰 ${formatPrice(listing.price)}\n📍 ${
      listing.location_area || 'Malawi'
    }\n\nView: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const shareOnTwitter = () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    const text = `${listing.title} - Check this out on Kumsika`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/listing/${listing.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareSuccess('Link copied!');
      success('Link copied to clipboard!');
      setTimeout(() => setShareSuccess(''), 3000);
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const handleBottomNav = (navId) => {
    if (navId === 'home') navigate('/landing');
    else if (navId === 'search') navigate('/search');
    else if (navId === 'sell') navigate('/create-listing');
    else if (navId === 'messages') navigate('/messages');
    else if (navId === 'profile') navigate('/profile');
  };

  const devTogglePremium = () => {
    setListing((prev) => {
      if (!prev) return prev;
      const nowPremium = isPremium(prev);
      return nowPremium
        ? { ...prev, is_premium: false, premium_until: null }
        : {
            ...prev,
            is_premium: true,
            premium_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          };
    });
    success('Dev toggle applied (not saved to server)');
  };

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-header" />
        <div className="skeleton-image" />
        <div className="skeleton-content">
          <div className="skeleton-title" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-button" />
        </div>
        <style jsx>{`
          .loading-skeleton { min-height: 100vh; background: #f8fafc; padding: 16px; padding-bottom: 80px; max-width: 800px; margin: 0 auto; }
          .skeleton-header { height: 50px; background: #e2e8f0; border-radius: 12px; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-image { height: 200px; background: #e2e8f0; border-radius: 12px; margin-bottom: 16px; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-content { display: flex; flex-direction: column; gap: 10px; }
          .skeleton-title { height: 30px; width: 70%; background: #e2e8f0; border-radius: 8px; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-line { height: 16px; background: #e2e8f0; border-radius: 8px; animation: pulse 1.5s ease-in-out infinite; }
          .skeleton-line.short { width: 60%; }
          .skeleton-button { height: 48px; background: #e2e8f0; border-radius: 10px; margin-top: 8px; animation: pulse 1.5s ease-in-out infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        `}</style>
      </div>
    );
  }

  if (errorMsg || !listing) {
    return (
      <div className="error-container">
        <div className="error-icon">😕</div>
        <h3 className="error-title">{errorMsg || 'Listing not found'}</h3>
        <p className="error-text">
          The listing you're looking for doesn't exist or has been removed.
        </p>
        <button className="btn-primary" onClick={() => navigate('/landing')}>
          <Icon name="arrowLeft" size={16} color="#FFFFFF" strokeWidth={1.75} />
          Back to marketplace
        </button>
        <style jsx>{`
          .error-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; background: #f8fafc; padding: 20px; text-align: center; }
          .error-icon { font-size: 48px; }
          .error-title { color: #1e293b; font-size: clamp(18px, 2vw, 20px); font-weight: 700; margin: 0; }
          .error-text { color: #94a3b8; margin: 0 0 8px; font-size: clamp(14px, 1.2vw, 15px); }
          .btn-primary { padding: 10px 24px; background: #1e293b; border: none; border-radius: 10px; color: #fff; font-weight: 600; font-size: 14px; cursor: pointer; font-family: inherit; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
          .btn-primary:hover { background: #f59e0b; transform: scale(0.98); }
        `}</style>
      </div>
    );
  }

  const sellerPhone = resolveSellerPhone(listing);
  const sellerFacebook = resolveSellerFacebook(listing);
  const sellerUserId = resolveSellerUserId(listing);
  const isOwnListing = user?.id && sellerUserId === user.id;
  const canMessageSeller = user && sellerUserId && !isOwnListing;
  const isAnonymous = !user;

  const premium = isPremium(listing);
  const premiumUntil = getPremiumUntil(listing);
  const daysLeft = daysUntil(premiumUntil);
  const images = listing.images || [];
  const isLiked = !!listing.liked_by_me;
  const likeCount = listing.likes ?? 0;
  const commentCount = listing.comment_count ?? 0;

  return (
    <div className={`listing-details ${isMobile && !isOwnListing ? 'has-sticky-bar' : ''}`}>
      <div className="main-content">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <Icon name="arrowLeft" size={18} color="#1E293B" strokeWidth={1.75} />
          <span>Back</span>
        </button>

        {/* ============ SELLER-ONLY: BOOST CARD ============ */}
        {isOwnListing && !premium && (
          <div className="boost-card">
            <div className="boost-card-icon">
              <Icon name="crown" size={20} color="#201F1B" strokeWidth={2.2} />
            </div>
            <div className="boost-card-text">
              <div className="boost-card-title">Boost to Spotlight</div>
              <div className="boost-card-sub">
                Get more views — appear at the top of the homepage.
              </div>
            </div>
            <button className="boost-card-btn" onClick={() => setShowBoostModal(true)}>
              Boost
            </button>
          </div>
        )}
        {isOwnListing && premium && (
          <div className={`boost-card boost-card-active ${daysLeft <= 2 ? 'expiring' : ''}`}>
            <div className="boost-card-icon active">
              <Icon name="crown" size={20} color="#F0D9A8" strokeWidth={2.2} />
            </div>
            <div className="boost-card-text">
              <div className="boost-card-title">
                Boosted · Spotlight active
                {daysLeft > 0 && (
                  <span className="boost-days">
                    {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                  </span>
                )}
              </div>
              <div className="boost-card-sub">
                {premiumUntil
                  ? `Ends ${premiumUntil.toLocaleDateString()}`
                  : 'Your listing is featured on the homepage.'}
                {daysLeft <= 2 && daysLeft > 0 && ' · Renew to keep the boost active'}
              </div>
            </div>
            <button className="boost-card-btn renew" onClick={() => setShowBoostModal(true)}>
              <Icon name="refresh" size={13} color="#201F1B" strokeWidth={2.4} />
              Renew
            </button>
          </div>
        )}
        {isDev && isOwnListing && (
          <button className="dev-toggle" onClick={devTogglePremium}>
            <Icon name="zap" size={12} color="#7A5A16" strokeWidth={2.4} />
            DEV: {premium ? 'Remove premium' : 'Make premium'} (local only)
          </button>
        )}

        {/* ============ LISTING CARD ============ */}
        <div className="listing-card">
          {images.length > 0 ? (
            <div className="gallery">
              <div className="gallery-viewport">
                <div
                  className="gallery-track"
                  style={{ transform: `translateX(-${imageIdx * 100}%)` }}
                >
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${listing.title} ${i + 1}`}
                      className="gallery-image"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      onError={(e) => { e.target.style.opacity = 0; }}
                    />
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="gallery-arrow left"
                      onClick={() => setImageIdx((imageIdx - 1 + images.length) % images.length)}
                      aria-label="Previous photo"
                    >
                      <Icon name="chevronLeft" size={16} color="#FFFFFF" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      className="gallery-arrow right"
                      onClick={() => setImageIdx((imageIdx + 1) % images.length)}
                      aria-label="Next photo"
                    >
                      <Icon name="chevronRight" size={16} color="#FFFFFF" strokeWidth={2.4} />
                    </button>
                    <span className="gallery-count">{imageIdx + 1}/{images.length}</span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="gallery-thumbs">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`gallery-thumb ${i === imageIdx ? 'active' : ''}`}
                      onClick={() => setImageIdx(i)}
                      aria-label={`View photo ${i + 1}`}
                    >
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="no-image">
              <Icon name="image" size={48} color="#CBD5E1" strokeWidth={1.5} />
              <p>No image available</p>
            </div>
          )}

          <h1 className="listing-title">{listing.title}</h1>

          {listing.price != null && listing.price !== '' && (
            <div className="price-block">
              <span className="price-value">{formatPrice(listing.price)}</span>
              {listing.price_type === 'negotiable' && (
                <span className="price-note">Negotiable</span>
              )}
            </div>
          )}

          <div className="badge-group">
            <span className="badge badge-category">{listing.category || 'General'}</span>
            {listing.sub_category && (
              <span className="badge badge-sub">{listing.sub_category}</span>
            )}
            {listing.delivery_available && (
              <span className="badge badge-delivery">
                <Icon name="delivery" size={12} color="#1E40AF" strokeWidth={1.75} />
                Delivery
              </span>
            )}
            {premium && (
              <span className="badge badge-premium">
                <Icon name="crown" size={12} color="#7A5A16" strokeWidth={2} />
                Premium
              </span>
            )}
          </div>

          <div className="engage-row">
            <button
              className={`engage-btn like ${isLiked ? 'active' : ''}`}
              onClick={handleLike}
              disabled={liking}
            >
              <Icon name="heart" size={17} color={isLiked ? '#BC5B34' : '#6B6259'} strokeWidth={isLiked ? 2.6 : 1.8} />
              <span>{likeCount > 0 ? likeCount : 'Like'}</span>
            </button>
            <button className="engage-btn comment" onClick={handleOpenComments}>
              <Icon name="comment" size={16} color="#6B6259" strokeWidth={1.8} />
              <span>
                {commentCount > 0
                  ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`
                  : 'Comment'}
              </span>
            </button>
          </div>

          <p className="listing-description">
            {listing.description || 'No description provided'}
          </p>

          <div className="meta-row">
            {listing.location_area && (
              <span className="meta-item">
                <Icon name="mapPin" size={14} color="#94A3B8" strokeWidth={1.75} />
                {listing.location_area}
              </span>
            )}
            {listing.quantity && (
              <span className="meta-item">
                <Icon name="tag" size={14} color="#94A3B8" strokeWidth={1.75} />
                {listing.quantity} {listing.unit || 'units'}
              </span>
            )}
            {listing.delivery_fee && (
              <span className="meta-item">
                <Icon name="delivery" size={14} color="#94A3B8" strokeWidth={1.75} />
                Delivery: MK {listing.delivery_fee}
              </span>
            )}
            {listing.created_at && (
              <span className="meta-item">
                <Icon name="clock" size={14} color="#94A3B8" strokeWidth={1.75} />
                {new Date(listing.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* ============ ★ SELLER CARD — contact actions ============ */}
        {listing.businesses && !isOwnListing && (
          <div className="contact-card">
            <h3 className="section-title">
              <Icon name="store" size={20} color="#F59E0B" strokeWidth={1.75} />
              Contact the seller
            </h3>

            <p className="business-name">{listing.businesses.business_name}</p>

            {listing.businesses.rating > 0 && (
              <p className="business-rating">
                {renderStars(listing.businesses.rating)} ({listing.businesses.rating.toFixed(1)})
              </p>
            )}

            <div className="contact-actions">
              {isAnonymous ? (
                <button
                  className="contact-btn primary wide"
                  onClick={() => navigate('/login', { state: { from: location.pathname } })}
                >
                  <Icon name="user" size={16} color="#FFFFFF" strokeWidth={2} />
                  Sign in to contact the seller
                </button>
              ) : (
                <>
                  <button
                    className="contact-btn primary"
                    onClick={handleMessageSeller}
                    disabled={openingChat}
                  >
                    {openingChat ? (
                      <>
                        <span className="btn-spinner" />
                        Opening…
                      </>
                    ) : (
                      <>
                        <Icon name="message" size={16} color="#FFFFFF" strokeWidth={2} />
                        Message on Kumsika
                      </>
                    )}
                  </button>

                  {sellerPhone && (
                    <button className="contact-btn whatsapp" onClick={handleContactWhatsApp}>
                      <Icon name="whatsapp" size={16} color="#FFFFFF" strokeWidth={2} />
                      WhatsApp the seller
                    </button>
                  )}

                  {sellerFacebook && (
                    <button className="contact-btn facebook" onClick={handleContactFacebook}>
                      <Icon name="facebook" size={16} color="#FFFFFF" strokeWidth={2} />
                      Message on Facebook
                    </button>
                  )}

                  {sellerPhone && (
                    <button className="contact-btn call" onClick={openPhoneDialer}>
                      <Icon name="phone" size={16} color="#FFFFFF" strokeWidth={2} />
                      Call the seller
                    </button>
                  )}
                </>
              )}
            </div>

            {sellerPhone && (
              <p className="contact-phone-row">
                <Icon name="phone" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>{sellerPhone}</span>
              </p>
            )}
            {listing.businesses.address && (
              <p className="contact-phone-row">
                <Icon name="mapPin" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>{listing.businesses.address}</span>
              </p>
            )}
          </div>
        )}

        {/* ============ OWNER-ONLY: business + edit ============ */}
        {listing.businesses && isOwnListing && (
          <div className="contact-card">
            <h3 className="section-title">
              <Icon name="store" size={20} color="#F59E0B" strokeWidth={1.75} />
              Your business
            </h3>
            <p className="business-name">{listing.businesses.business_name}</p>
            {sellerPhone && (
              <p className="contact-phone-row">
                <Icon name="phone" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>{sellerPhone}</span>
              </p>
            )}
            {listing.businesses.address && (
              <p className="contact-phone-row">
                <Icon name="mapPin" size={14} color="#94A3B8" strokeWidth={1.75} />
                <span>{listing.businesses.address}</span>
              </p>
            )}
            <div className="contact-actions">
              <button
                className="contact-btn primary"
                onClick={() => navigate(`/create-listing?edit=${listing.id}`)}
              >
                <Icon name="pencil" size={16} color="#FFFFFF" strokeWidth={2} />
                Edit listing
              </button>
            </div>
          </div>
        )}

        {/* ============ REVIEWS ============ */}
        <div className="reviews-card">
          <div className="reviews-header">
            <h3 className="section-title">
              <Icon name="star" size={20} color="#F59E0B" strokeWidth={1.75} />
              Reviews ({reviews.length})
            </h3>
            {isAuthenticated && (
              <button
                className="btn-write-review"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <Icon name="pencil" size={14} color="#FFFFFF" strokeWidth={1.75} />
                Write review
              </button>
            )}
          </div>

          {showReviewForm && (
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <select
                  value={reviewData.rating}
                  onChange={(e) =>
                    setReviewData({ ...reviewData, rating: parseInt(e.target.value) })
                  }
                  className="form-select"
                >
                  {[5, 4, 3, 2, 1].map((num) => (
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
                  {submitting ? 'Submitting...' : 'Submit review'}
                </button>
                <button
                  type="button"
                  className="btn-cancel-review"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header-row">
                  <span className="review-stars">
                    {renderStars(review.rating)} {review.rating}/5
                  </span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="no-reviews">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {/* ============ ★ SHARE (public broadcast only — no "contact" here) ============ */}
        <div className="share-card">
          <h3 className="section-title">
            <Icon name="share" size={18} color="#F59E0B" strokeWidth={1.75} />
            {isOwnListing ? 'Promote this listing' : 'Share this listing'}
          </h3>
          <p className="share-sub">
            {isOwnListing
              ? 'Share this listing with your customers on WhatsApp, Facebook, or Twitter.'
              : 'Share this listing with friends on WhatsApp, Facebook, or Twitter.'}
          </p>
          <div className="share-buttons">
            <button className="share-btn whatsapp" onClick={shareOnWhatsApp}>
              <Icon name="whatsapp" size={14} color="#FFFFFF" strokeWidth={1.75} />
              Share
            </button>
            <button className="share-btn facebook" onClick={shareOnFacebook}>
              <Icon name="share" size={14} color="#FFFFFF" strokeWidth={1.75} />
              Facebook
            </button>
            <button className="share-btn twitter" onClick={shareOnTwitter}>
              <Icon name="share" size={14} color="#FFFFFF" strokeWidth={1.75} />
              Twitter
            </button>
            <button className="share-btn copy" onClick={copyLink}>
              <Icon name="copy" size={14} color="#FFFFFF" strokeWidth={1.75} />
              {shareSuccess || 'Copy link'}
            </button>
          </div>
        </div>
      </div>

      {/* ============ STICKY CONTACT BAR (mobile, buyer only) ============ */}
      {isMobile && !isOwnListing && (
        <div className="sticky-contact">
          {isAnonymous ? (
            <button
              className="sticky-btn primary wide"
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
            >
              <Icon name="user" size={16} color="#FFFFFF" strokeWidth={2} />
              Sign in to contact seller
            </button>
          ) : (
            <>
              <button
                className="sticky-btn primary"
                onClick={handleMessageSeller}
                disabled={openingChat}
              >
                {openingChat ? (
                  <span className="btn-spinner" />
                ) : (
                  <>
                    <Icon name="message" size={16} color="#FFFFFF" strokeWidth={2} />
                    Message
                  </>
                )}
              </button>
              {sellerPhone && (
                <button
                  className="sticky-btn whatsapp"
                  onClick={handleContactWhatsApp}
                  aria-label="WhatsApp the seller"
                >
                  <Icon name="whatsapp" size={18} color="#FFFFFF" strokeWidth={2} />
                </button>
              )}
              {sellerFacebook && (
                <button
                  className="sticky-btn facebook"
                  onClick={handleContactFacebook}
                  aria-label="Message the seller on Facebook"
                >
                  <Icon name="facebook" size={16} color="#FFFFFF" strokeWidth={2} />
                </button>
              )}
              {sellerPhone && (
                <button
                  className="sticky-btn call"
                  onClick={openPhoneDialer}
                  aria-label="Call the seller"
                >
                  <Icon name="phone" size={16} color="#FFFFFF" strokeWidth={2} />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ COMMENTS POP-UP ============ */}
      {showComments && (
        <div className="pop-overlay" onClick={() => setShowComments(false)} role="dialog" aria-modal="true">
          <div className="pop" onClick={(e) => e.stopPropagation()}>
            <div className="pop-handle" />
            <div className="pop-preview">
              <div className="pop-thumb">
                {listing.images?.length ? (
                  <img src={listing.images[0]} alt={listing.title} />
                ) : (
                  <div className="pop-thumb-fallback">
                    <Icon name="store" size={18} color="#BFA97B" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="pop-preview-text">
                <div className="pop-preview-title">{listing.title}</div>
                <div className="pop-preview-sub">
                  {listing.businesses?.business_name || 'Local seller'}
                  {listing.location_area ? ` · ${listing.location_area}` : ''}
                </div>
              </div>
              <button className="pop-close" onClick={() => setShowComments(false)} aria-label="Close">
                <Icon name="close" size={16} color="#201F1B" strokeWidth={2.2} />
              </button>
            </div>
            <div className="pop-body">
              <CommentSection
                listingId={listing.id}
                onCountChange={(count) => {
                  setListing((prev) => (prev ? { ...prev, comment_count: count } : prev));
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ============ BOOST MODAL ============ */}
      {showBoostModal && (
        <BoostModal
          listing={listing}
          onClose={() => setShowBoostModal(false)}
          onActivated={(updatedListing) => {
            if (updatedListing) setListing(updatedListing);
            else {
              setListing((prev) =>
                prev
                  ? {
                      ...prev,
                      is_premium: true,
                      premium_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    }
                  : prev
              );
            }
          }}
        />
      )}

      {/* ============ BOTTOM NAV ============ */}
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
              <button key={item.id} className="nav-btn" onClick={() => handleBottomNav(item.id)}>
                <div className={`nav-icon-wrap ${active ? 'active' : ''}`}>
                  <Icon name={item.icon} size={20} color={active ? '#FFFFFF' : '#94A3B8'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .listing-details {
          min-height: 100vh;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
          padding-bottom: 80px;
        }
        @media (min-width: 769px) { .listing-details { padding-bottom: 0; } }
        .listing-details.has-sticky-bar { padding-bottom: 148px; }

        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 16px 16px 40px;
        }

        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 12px; background: #ffffff;
          border: 1px solid #f1f5f9; border-radius: 10px;
          font-size: 13px; font-weight: 500; color: #64748b;
          cursor: pointer; font-family: inherit;
          transition: all 0.2s; margin-bottom: 16px;
        }
        .back-btn:hover { background: #f1f5f9; border-color: #e2e8f0; }

        /* ====== BOOST CARD ====== */
        .boost-card {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #24453B 0%, #16261F 100%);
          border-radius: 12px; margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(22, 38, 31, 0.18);
        }
        .boost-card-active {
          background: linear-gradient(135deg, #D99A3B 0%, #B8802A 100%);
          box-shadow: 0 8px 24px rgba(217, 154, 59, 0.28);
        }
        .boost-card-active.expiring {
          background: linear-gradient(135deg, #BC5B34 0%, #8B3A1E 100%);
        }
        .boost-card-icon {
          width: 40px; height: 40px; border-radius: 11px;
          background: #F0D9A8;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .boost-card-icon.active { background: rgba(255, 255, 255, 0.22); }
        .boost-card-text { flex: 1; min-width: 0; }
        .boost-card-title {
          font-size: 14px; font-weight: 700; color: #F7F1E3;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .boost-card-active .boost-card-title { color: #FFFFFF; }
        .boost-days {
          padding: 2px 7px; border-radius: 5px;
          background: rgba(255, 255, 255, 0.22);
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
        }
        .boost-card-sub {
          font-size: 12px; color: rgba(247, 241, 227, 0.7); margin-top: 2px;
        }
        .boost-card-active .boost-card-sub { color: rgba(255,255,255,0.85); }
        .boost-card-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 16px; background: #F0D9A8;
          color: #201F1B; border: none; border-radius: 9px;
          font-size: 13px; font-weight: 700;
          font-family: inherit; cursor: pointer;
          transition: all 0.18s; flex-shrink: 0;
        }
        .boost-card-btn:hover { background: #F7F1E3; transform: translateY(-1px); }
        .boost-card-btn.renew { background: rgba(255, 255, 255, 0.9); }

        .dev-toggle {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; margin-bottom: 12px;
          background: #FEF3C7; border: 1px dashed #D99A3B;
          border-radius: 8px; color: #7A5A16;
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer; font-family: inherit;
        }

        /* ====== LISTING CARD ====== */
        .listing-card {
          background: #ffffff; border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid #f1f5f9; margin-bottom: 16px;
        }
        .gallery { margin-bottom: 16px; }
        .gallery-viewport {
          position: relative; width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 12px; overflow: hidden;
          background: #f1f5f9;
        }
        .gallery-track {
          display: flex; height: 100%; width: 100%;
          transition: transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .gallery-image {
          flex: 0 0 100%; width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        .gallery-arrow {
          position: absolute; top: 50%;
          transform: translateY(-50%);
          width: 34px; height: 34px;
          border: none; cursor: pointer; border-radius: 50%;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
        }
        .gallery-arrow.left { left: 10px; }
        .gallery-arrow.right { right: 10px; }
        .gallery-count {
          position: absolute; right: 10px; top: 10px;
          padding: 4px 9px; border-radius: 6px;
          background: rgba(15, 23, 42, 0.6);
          color: #fff; font-size: 11px; font-weight: 600;
        }
        .gallery-thumbs {
          display: flex; gap: 8px;
          overflow-x: auto; margin-top: 10px;
          scrollbar-width: none;
        }
        .gallery-thumbs::-webkit-scrollbar { display: none; }
        .gallery-thumb {
          flex: 0 0 auto;
          width: 60px; height: 60px; padding: 0;
          border: 2px solid transparent;
          border-radius: 8px; overflow: hidden;
          cursor: pointer; background: #f1f5f9;
        }
        .gallery-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .gallery-thumb.active {
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
        }
        .no-image {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #f8fafc; border-radius: 10px;
          padding: 24px; margin-bottom: 14px;
          min-height: 120px; color: #94a3b8;
        }
        .no-image p { margin: 8px 0 0; font-size: 14px; }
        .listing-title {
          font-size: clamp(20px, 2.5vw, 24px);
          font-weight: 700; color: #1e293b;
          margin: 0 0 10px; line-height: 1.2;
        }
        .price-block {
          display: flex; align-items: baseline; gap: 10px;
          margin-bottom: 10px;
        }
        .price-value {
          font-family: Georgia, serif;
          font-size: clamp(24px, 3.4vw, 32px);
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
        }
        .price-note {
          font-size: 12px; color: #92400e;
          background: #fef3c7; padding: 3px 8px;
          border-radius: 6px; font-weight: 600;
        }
        .badge-group {
          display: flex; gap: 6px; flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .badge {
          padding: 3px 12px; border-radius: 14px;
          font-size: 11px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 3px;
        }
        .badge-category { background: #ede9f5; color: #1e293b; }
        .badge-sub { background: #f1f5f9; color: #64748b; }
        .badge-delivery { background: #dbeafe; color: #1e40af; }
        .badge-premium { background: #F0D9A8; color: #7A5A16; }

        .engage-row {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 0 14px;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 14px;
        }
        .engage-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px; border-radius: 9px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          font-family: inherit;
          font-size: 13px; font-weight: 600;
          color: #475569; cursor: pointer;
        }
        .engage-btn.like.active {
          background: #fef2f2; border-color: #fecaca; color: #BC5B34;
        }
        .engage-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .listing-description {
          font-size: 14px; color: #64748b;
          line-height: 1.6; margin: 0 0 12px;
          white-space: pre-wrap;
        }
        .meta-row {
          display: flex; flex-wrap: wrap; gap: 14px;
          padding-top: 12px; border-top: 1px solid #f1f5f9;
        }
        .meta-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 13px; color: #94a3b8;
        }

        /* ====== SELLER / CONTACT CARD ====== */
        .contact-card, .reviews-card, .share-card {
          background: #ffffff; border-radius: 12px;
          padding: 16px 18px;
          border: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 16px; font-weight: 700;
          color: #1e293b; margin: 0 0 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .business-name {
          font-size: 15px; font-weight: 600;
          color: #1e293b; margin: 0 0 4px;
        }
        .business-rating { color: #f59e0b; font-size: 14px; margin: 4px 0 0; }
        .contact-phone-row {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #94a3b8; margin: 6px 0 0;
        }

        /* ★ Contact buttons — bigger, primary-style */
        .contact-actions {
          display: flex; flex-direction: column; gap: 8px;
          margin-top: 12px;
        }
        .contact-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 16px;
          border: none; border-radius: 10px;
          color: #ffffff;
          font-family: inherit;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
        }
        .contact-btn:active:not(:disabled) { transform: scale(0.98); }
        .contact-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .contact-btn.primary { background: #f59e0b; }
        .contact-btn.primary:hover:not(:disabled) { background: #d97706; }
        .contact-btn.whatsapp { background: #25d366; }
        .contact-btn.whatsapp:hover:not(:disabled) { background: #1da851; }
        .contact-btn.facebook { background: #1877f2; }
        .contact-btn.facebook:hover:not(:disabled) { background: #1462cf; }
        .contact-btn.call { background: #1e293b; }
        .contact-btn.call:hover:not(:disabled) { background: #0f172a; }
        .contact-btn.wide { width: 100%; }

        .btn-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ====== SHARE ====== */
        .share-sub {
          font-size: 12.5px; color: #94a3b8;
          margin: 0 0 10px; line-height: 1.5;
        }
        .share-buttons {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;
        }
        .share-btn {
          padding: 8px 16px; border: none; border-radius: 9px;
          font-size: 12px; font-weight: 600; color: #ffffff;
          cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .share-btn.whatsapp { background: #25d366; }
        .share-btn.facebook { background: #1877f2; }
        .share-btn.twitter { background: #1da1f2; }
        .share-btn.copy { background: #64748b; }

        /* ====== REVIEWS ====== */
        .reviews-header {
          display: flex; justify-content: space-between;
          align-items: center; flex-wrap: wrap; gap: 8px;
        }
        .btn-write-review {
          padding: 6px 16px; background: #1e293b;
          border: none; border-radius: 10px;
          color: #ffffff; font-weight: 600; font-size: 13px;
          cursor: pointer; font-family: inherit;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .review-form {
          margin-top: 12px; padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        .form-group { margin-bottom: 10px; }
        .form-label {
          display: block; font-size: 12px;
          font-weight: 600; color: #475569; margin-bottom: 4px;
        }
        .form-select, .form-textarea {
          width: 100%; padding: 6px 12px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 14px; color: #1e293b; outline: none;
          font-family: inherit; background: #ffffff;
        }
        .form-textarea { resize: vertical; min-height: 60px; }
        .form-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn-submit-review {
          padding: 6px 20px; background: #10b981;
          border: none; border-radius: 8px;
          color: #ffffff; font-weight: 600; font-size: 13px;
          cursor: pointer; font-family: inherit;
        }
        .btn-submit-review:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel-review {
          padding: 6px 20px; background: #f1f5f9;
          border: 1px solid #e2e8f0; border-radius: 8px;
          color: #64748b; font-weight: 600; font-size: 13px;
          cursor: pointer; font-family: inherit;
        }
        .review-item {
          padding-top: 12px; margin-top: 12px;
          border-top: 1px solid #f1f5f9;
        }
        .review-item:first-of-type { border-top: none; margin-top: 12px; }
        .review-header-row {
          display: flex; justify-content: space-between;
          flex-wrap: wrap; gap: 8px;
        }
        .review-stars { font-weight: 600; font-size: 14px; color: #1e293b; }
        .review-date { font-size: 12px; color: #94a3b8; }
        .review-comment { font-size: 14px; color: #64748b; margin: 4px 0 0; }
        .no-reviews { color: #94a3b8; font-size: 14px; margin: 12px 0 0; }

        /* ====== STICKY CONTACT BAR ====== */
        .sticky-contact {
          position: fixed;
          bottom: 64px;
          left: 0; right: 0;
          display: flex; gap: 8px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(14px);
          border-top: 1px solid #f1f5f9;
          z-index: 90;
          align-items: center;
        }
        .sticky-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px;
          height: 44px;
          padding: 0 18px;
          border: none; border-radius: 10px;
          color: #ffffff;
          font-family: inherit;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
        }
        .sticky-btn:active:not(:disabled) { transform: scale(0.97); }
        .sticky-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sticky-btn.primary { flex: 1; background: #f59e0b; }
        .sticky-btn.primary:hover:not(:disabled) { background: #d97706; }
        .sticky-btn.primary.wide { flex: 1; }
        .sticky-btn.whatsapp { background: #25d366; width: 46px; padding: 0; }
        .sticky-btn.facebook { background: #1877f2; width: 46px; padding: 0; }
        .sticky-btn.call { background: #1e293b; width: 46px; padding: 0; }

        /* ====== COMMENTS POP-UP ====== */
        .pop-overlay {
          position: fixed; inset: 0;
          z-index: 200;
          background: rgba(22, 38, 31, 0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-end; justify-content: center;
          animation: popFade 0.2s ease;
        }
        @keyframes popFade { from { opacity: 0; } to { opacity: 1; } }
        .pop {
          width: 100%;
          max-width: 560px;
          height: 88vh;
          max-height: 88vh;
          background: #FFFDF8;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          display: flex; flex-direction: column;
          animation: popUp 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
          overflow: hidden;
        }
        @keyframes popUp {
          from { transform: translateY(40px); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        .pop-handle {
          width: 42px; height: 4px;
          background: #E4D9BD; border-radius: 4px;
          margin: 8px auto 0; flex-shrink: 0;
        }
        .pop-preview {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          border-bottom: 1px solid #EFE6CE;
          flex-shrink: 0;
        }
        .pop-thumb {
          width: 42px; height: 42px; border-radius: 10px;
          overflow: hidden; background: #F0E9D6;
          flex-shrink: 0; border: 1px solid #EFE6CE;
        }
        .pop-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pop-thumb-fallback {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .pop-preview-text { flex: 1; min-width: 0; }
        .pop-preview-title {
          font-size: 13px; font-weight: 600; color: #201F1B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pop-preview-sub {
          font-size: 11px; color: #9C9482; margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pop-close {
          width: 30px; height: 30px;
          border-radius: 8px; border: 1px solid #EFE6CE;
          background: #FFFDF8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }
        .pop-body {
          flex: 1; overflow-y: auto;
          padding: 12px 14px 18px;
          background: #FFFDF8;
        }

        /* ====== BOOST MODAL ====== */
        .boost-overlay {
          position: fixed; inset: 0;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 500;
        }
        .boost-modal {
          width: 100%; max-width: 440px; max-height: 92vh;
          overflow-y: auto; background: #FFFDF8;
          border-radius: 18px;
          display: flex; flex-direction: column;
        }
        .boost-head {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 16px 12px;
          border-bottom: 1px solid #EFE6CE;
        }
        .boost-head-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: #24453B;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .boost-head-text { flex: 1; min-width: 0; }
        .boost-title {
          font-family: Georgia, serif;
          font-size: 17px; font-weight: 600;
          color: #201F1B; margin: 0;
        }
        .boost-sub { font-size: 12px; color: #9C9482; margin: 2px 0 0; }
        .boost-close {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid #EFE6CE; background: #FFFDF8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
        }
        .boost-body { padding: 14px 16px 8px; }
        .boost-preview-title {
          font-size: 13px; color: #6B6259; font-style: italic;
          margin: 0 0 12px; padding: 8px 10px;
          background: #F7F1E3; border-radius: 8px;
          border-left: 3px solid #D99A3B;
        }
        .boost-benefits { display: flex; flex-direction: column; gap: 10px; margin-bottom: 18px; }
        .boost-benefit { display: flex; align-items: flex-start; gap: 10px; }
        .boost-benefit-icon {
          width: 28px; height: 28px; border-radius: 8px;
          background: #F7F1E3;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .boost-benefit-title { font-size: 13px; font-weight: 600; color: #201F1B; }
        .boost-benefit-desc { font-size: 11.5px; color: #9C9482; margin-top: 1px; }
        .boost-section-label {
          font-size: 11px; font-weight: 700; color: #6B6259;
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .boost-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
        .boost-option {
          position: relative; display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; background: #FFFDF8;
          border: 1.5px solid #EFE6CE; border-radius: 12px;
          cursor: pointer; font-family: inherit;
          text-align: left;
        }
        .boost-option.active {
          border-color: #24453B; background: #FDF9EF;
          box-shadow: 0 0 0 3px rgba(36, 69, 59, 0.08);
        }
        .boost-option-days { font-size: 14px; font-weight: 700; color: #201F1B; flex: 1; }
        .boost-option-price {
          font-family: Georgia, serif; font-size: 15px; font-weight: 600;
          color: #24453B;
        }
        .boost-option-tag {
          position: absolute; top: -8px; left: 12px;
          padding: 2px 7px; border-radius: 5px;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .boost-option-tag.popular { background: #BC5B34; color: #FFFDF8; }
        .boost-option-tag.best { background: #D99A3B; color: #201F1B; }
        .boost-option-check {
          width: 20px; height: 20px; border-radius: 50%;
          background: #24453B;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
        }
        .boost-option.active .boost-option-check { opacity: 1; }

        .boost-status {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          text-align: center; padding: 20px 8px 12px;
        }
        .boost-status-badge {
          width: 52px; height: 52px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .boost-status-badge.amber { background: #FEF3C7; }
        .boost-status-badge.green { background: #D1FAE5; }
        .boost-status-badge.red { background: #FEE2E2; }
        .boost-status-spinner {
          width: 32px; height: 32px;
          border: 3px solid #EFE6CE;
          border-top-color: #24453B;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .boost-status-text {
          font-family: Georgia, serif;
          font-size: 15px; font-weight: 600;
          color: #201F1B; margin: 0;
        }
        .boost-status-sub {
          font-size: 12.5px; color: #6B6259;
          margin: 0; max-width: 320px; line-height: 1.5;
        }
        .boost-foot {
          display: flex; gap: 10px;
          padding: 12px 16px 16px;
          border-top: 1px solid #EFE6CE;
        }
        .boost-cancel {
          flex: 1; padding: 12px; background: #F7F1E3;
          border: 1px solid #EFE6CE; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 600;
          color: #6B6259; cursor: pointer;
        }
        .boost-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
        .boost-cancel.wide { flex: 1; }
        .boost-confirm {
          flex: 1.6;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 6px;
          padding: 12px;
          background: #24453B; color: #F7F1E3;
          border: none; border-radius: 10px;
          font-family: inherit; font-size: 13px; font-weight: 700;
          cursor: pointer;
        }
        .boost-confirm:disabled { opacity: 0.7; cursor: not-allowed; }
        .boost-confirm.wide { flex: 1; }

        /* ====== BOTTOM NAV ====== */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(226, 232, 240, 0.4);
          display: flex; justify-content: space-around;
          padding: 4px 0 8px; z-index: 100;
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; background: none; border: none;
          cursor: pointer; padding: 4px 8px;
          font-family: inherit; min-width: 44px;
        }
        .nav-icon-wrap {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .nav-icon-wrap.active { background: #1e293b; }
        .nav-label { font-size: 9px; font-weight: 500; color: #94a3b8; }
        .nav-label.active { color: #1e293b; font-weight: 600; }

        @media (max-width: 480px) {
          .main-content { padding: 12px 12px 32px; }
          .listing-card, .contact-card, .reviews-card, .share-card {
            padding: 14px 16px;
          }
          .gallery-thumb { width: 52px; height: 52px; }
          .listing-title { font-size: 18px; }
          .price-value { font-size: 24px; }
          .boost-card { flex-wrap: wrap; }
          .boost-card-btn { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .contact-btn, .sticky-btn, .engage-btn, .share-btn,
          .boost-option, .boost-confirm, .boost-cancel, .boost-close,
          .gallery-track, .gallery-arrow, .gallery-thumb {
            transition: none; animation: none;
          }
          .btn-spinner, .boost-status-spinner { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default ListingDetails;