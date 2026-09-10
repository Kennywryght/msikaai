// mobile/src/pages/RatingReview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    arrowLeft: "M19 12H5M12 19l-7-7 7-7",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    check: "M20 6L9 17l-5-5",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a3 3 0 100-6 3 3 0 000 6z",
    sparkles: "M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z",
    thumbsUp: "M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    x: "M18 6L6 18M6 6l12 12",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
  };

  const d = icons[name] || icons.star;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
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
// RATING LABELS
// ============================================================
const RATING_LABELS = {
  1: { label: 'Poor', emoji: '😞', color: '#EF4444' },
  2: { label: 'Fair', emoji: '🙁', color: '#F97316' },
  3: { label: 'Good', emoji: '😊', color: '#F59E0B' },
  4: { label: 'Very Good', emoji: '😄', color: '#10B981' },
  5: { label: 'Excellent', emoji: '🤩', color: '#10B981' },
};

// ============================================================
// QUICK TAGS
// ============================================================
const QUICK_TAGS = [
  { id: 'friendly', label: '😊 Friendly seller', type: 'positive' },
  { id: 'fast', label: '⚡ Fast response', type: 'positive' },
  { id: 'quality', label: '✨ Great quality', type: 'positive' },
  { id: 'accurate', label: '✓ As described', type: 'positive' },
  { id: 'ontime', label: '⏰ On time', type: 'positive' },
  { id: 'value', label: '💰 Great value', type: 'positive' },
  { id: 'slow', label: '🐌 Slow response', type: 'negative' },
  { id: 'mismatch', label: '❌ Not as described', type: 'negative' },
  { id: 'late', label: '⏳ Late pickup', type: 'negative' },
];

// ============================================================
// MOCK TRANSACTION
// ============================================================
const MOCK_TRANSACTION = {
  id: 'txn-1',
  type: 'purchase',
  listing: {
    title: 'Fresh Tomatoes, basket',
    price: 650,
    emoji: '🍅',
    image: null,
  },
  vendor: {
    name: 'Grace M.',
    initials: 'GM',
    color: '#F59E0B',
    rating: 4.8,
    totalReviews: 47,
    memberSince: '2024',
  },
  completedAt: 'Today, 5:30 PM',
  pickupLocation: 'Mitundu Trading Centre',
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const RatingReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast, success } = useToast();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);

  const transaction = MOCK_TRANSACTION;
  const isMobile = windowWidth <= 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'warning');
      return;
    }

    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setSubmitting(false);
    setSubmitted(true);
    success('Review submitted! Thank you ⭐');
  };

  const handleSkip = () => {
    navigate(-1);
  };

  const handleBottomNav = (navId) => {
    if (navId === 'home') navigate('/landing');
    else if (navId === 'search') navigate('/search');
    else if (navId === 'sell') navigate('/create-listing');
    else if (navId === 'messages') navigate('/messages');
    else if (navId === 'profile') navigate('/profile');
  };

  const formatPrice = (price) => `MK ${price.toLocaleString()}`;

  const currentRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS[currentRating] || { label: 'Tap a star to rate', emoji: '⭐', color: '#94A3B8' };

  // Submitted state
  if (submitted) {
    return (
      <div className="rating-review">
        <div className="success-screen">
          <div className="success-icon-wrap">
            <Icon name="check" size={40} color="#FFFFFF" strokeWidth={3} />
          </div>
          <h1 className="success-title">Thank you!</h1>
          <p className="success-desc">
            Your review helps other buyers in Mitundu make better decisions
          </p>
          <div className="success-rating">
            {[...Array(5)].map((_, i) => (
              <Icon 
                key={i} 
                name="star" 
                size={20} 
                color={i < rating ? '#F59E0B' : '#E2E8F0'} 
                fill={i < rating ? '#F59E0B' : 'none'}
                strokeWidth={1.75}
              />
            ))}
          </div>
          <button className="success-btn" onClick={() => navigate(-1)}>
            Back to Dashboard
          </button>
        </div>

        <style jsx>{`
          .rating-review {
            min-height: 100vh;
            background: #F8FAFC;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .success-screen {
            max-width: 400px;
            width: 100%;
            background: #FFFFFF;
            border-radius: 20px;
            padding: 40px 28px;
            text-align: center;
            border: 1px solid #F1F5F9;
            box-shadow: 0 4px 24px rgba(30, 41, 59, 0.04);
            animation: scaleIn 0.4s ease-out;
          }

          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }

          .success-icon-wrap {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #10B981, #059669);
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
            animation: pulseSuccess 1s ease-out;
          }

          @keyframes pulseSuccess {
            0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
            100% { transform: scale(1); box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3); }
          }

          .success-title {
            font-size: 26px;
            font-weight: 700;
            color: #1E293B;
            margin: 0 0 8px;
            font-family: 'Georgia', serif;
          }

          .success-desc {
            font-size: 14px;
            color: #94A3B8;
            margin: 0 0 20px;
            line-height: 1.6;
          }

          .success-rating {
            display: flex;
            justify-content: center;
            gap: 4px;
            margin-bottom: 28px;
          }

          .success-btn {
            width: 100%;
            padding: 14px;
            background: #1E293B;
            border: none;
            border-radius: 12px;
            color: #FFFFFF;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
          }

          .success-btn:hover {
            background: #F59E0B;
            transform: scale(0.98);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="rating-review">
      {/* Header */}
      <div className="page-header">
        <div className="header-top">
          <button className="header-btn" onClick={() => navigate(-1)}>
            <Icon name="arrowLeft" size={20} color="#1E293B" strokeWidth={1.75} />
          </button>
          <button className="skip-text-btn" onClick={handleSkip}>
            Skip
          </button>
        </div>

        <div className="header-content">
          <div className="header-badge">
            <Icon name="sparkles" size={14} color="#F59E0B" strokeWidth={1.75} />
            <span>Rate your experience</span>
          </div>
          <h1 className="page-title">How was your experience?</h1>
          <p className="page-subtitle">
            Your feedback helps others in the community
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="main-content">
        {/* Transaction Summary */}
        <div className="transaction-card">
          <div className="transaction-main">
            <div className="transaction-image">
              <span className="transaction-emoji">{transaction.listing.emoji}</span>
            </div>
            <div className="transaction-info">
              <h3 className="transaction-title">{transaction.listing.title}</h3>
              <span className="transaction-price">{formatPrice(transaction.listing.price)}</span>
              <span className="transaction-time">
                <Icon name="clock" size={10} color="#94A3B8" strokeWidth={1.75} />
                {transaction.completedAt}
              </span>
            </div>
          </div>

          {/* Vendor */}
          <div className="vendor-row">
            <div 
              className="vendor-avatar"
              style={{ background: `${transaction.vendor.color}15`, color: transaction.vendor.color }}
            >
              {transaction.vendor.initials}
            </div>
            <div className="vendor-info">
              <span className="vendor-name">{transaction.vendor.name}</span>
              <span className="vendor-meta">
                <Icon name="star" size={10} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                {transaction.vendor.rating} ({transaction.vendor.totalReviews} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="rating-section">
          <h2 className="section-label">
            <Icon name="star" size={16} color="#F59E0B" strokeWidth={1.75} />
            Your Rating <span className="required">*</span>
          </h2>

          <div className="stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className="star-btn"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                type="button"
              >
                <Icon 
                  name="star" 
                  size={40} 
                  color={star <= currentRating ? '#F59E0B' : '#E2E8F0'}
                  fill={star <= currentRating ? '#F59E0B' : 'none'}
                  strokeWidth={1.75}
                />
              </button>
            ))}
          </div>

          <div className="rating-label-wrap" style={{ color: ratingInfo.color }}>
            <span className="rating-emoji">{ratingInfo.emoji}</span>
            <span className="rating-label">{ratingInfo.label}</span>
          </div>
        </div>

        {/* Quick Tags (shown once rating is set) */}
        {rating > 0 && (
          <div className="tags-section">
            <h2 className="section-label">
              <Icon name="thumbsUp" size={16} color="#F59E0B" strokeWidth={1.75} />
              What stood out?
            </h2>

            <div className="tags-list">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    className={`tag-chip ${isSelected ? 'selected' : ''} ${tag.type}`}
                    onClick={() => handleTagToggle(tag.id)}
                    type="button"
                  >
                    {isSelected && (
                      <Icon name="check" size={12} color="#FFFFFF" strokeWidth={3} />
                    )}
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comment */}
        <div className="comment-section">
          <h2 className="section-label">
            <Icon name="message" size={16} color="#F59E0B" strokeWidth={1.75} />
            Add a Comment <span className="optional">(optional)</span>
          </h2>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience. What went well? What could be improved?"
            className="comment-textarea"
            rows={4}
            maxLength={500}
          />
          <div className="char-count">
            {comment.length}/500
          </div>
        </div>

        {/* Recommend */}
        <div className="recommend-section">
          <h2 className="section-label">
            <Icon name="thumbsUp" size={16} color="#F59E0B" strokeWidth={1.75} />
            Would you recommend?
          </h2>

          <div className="recommend-buttons">
            <button
              className={`recommend-btn ${wouldRecommend === true ? 'active yes' : ''}`}
              onClick={() => setWouldRecommend(true)}
              type="button"
            >
              <span className="recommend-emoji">👍</span>
              Yes
            </button>
            <button
              className={`recommend-btn ${wouldRecommend === false ? 'active no' : ''}`}
              onClick={() => setWouldRecommend(false)}
              type="button"
            >
              <span className="recommend-emoji">👎</span>
              No
            </button>
          </div>
        </div>

        {/* Trust Note */}
        <div className="trust-note">
          <Icon name="shield" size={14} color="#3B82F6" strokeWidth={1.75} />
          <span>Your review will be shown publicly on {transaction.vendor.name}'s profile</span>
        </div>

        {/* Submit */}
        <button 
          className={`submit-btn ${rating > 0 ? 'active' : ''}`}
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" />
              Submitting...
            </>
          ) : (
            <>
              <Icon name="check" size={18} color="#FFFFFF" strokeWidth={2.5} />
              Submit Review
            </>
          )}
        </button>
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
            const active = item.id === 'home';
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
        .rating-review {
          min-height: 100vh;
          background: #F8FAFC;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
          padding-bottom: 100px;
        }

        @media (min-width: 769px) {
          .rating-review {
            padding-bottom: 40px;
          }
        }

        /* ===== HEADER ===== */
        .page-header {
          background: #FFFFFF;
          padding: 14px 16px 20px;
          border-bottom: 1px solid #F1F5F9;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        .header-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .header-btn:hover {
          background: #F1F5F9;
        }

        .skip-text-btn {
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #94A3B8;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .skip-text-btn:hover {
          color: #1E293B;
          background: #F8FAFC;
        }

        .header-content {
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
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

        .page-title {
          font-size: clamp(22px, 3vw, 26px);
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 4px;
          font-family: 'Georgia', serif;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .page-subtitle {
          font-size: 14px;
          color: #94A3B8;
          margin: 0;
          line-height: 1.5;
        }

        /* ===== MAIN ===== */
        .main-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px 40px;
        }

        /* ===== TRANSACTION CARD ===== */
        .transaction-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 16px;
          border: 1px solid #F1F5F9;
          margin-bottom: 24px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .transaction-main {
          display: flex;
          gap: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #F8FAFC;
          margin-bottom: 12px;
        }

        .transaction-image {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .transaction-emoji {
          font-size: 28px;
        }

        .transaction-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .transaction-title {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .transaction-price {
          font-size: 14px;
          font-weight: 700;
          color: #10B981;
        }

        .transaction-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94A3B8;
        }

        .vendor-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vendor-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .vendor-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .vendor-name {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
        }

        .vendor-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94A3B8;
        }

        /* ===== SECTIONS ===== */
        .rating-section,
        .tags-section,
        .comment-section,
        .recommend-section {
          margin-bottom: 24px;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 12px;
        }

        .required {
          color: #EF4444;
          font-weight: 600;
        }

        .optional {
          color: #94A3B8;
          font-weight: 500;
          font-size: 12px;
        }

        /* ===== STARS ===== */
        .stars-container {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .star-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          transition: transform 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .star-btn:hover {
          transform: scale(1.15);
        }

        .star-btn:active {
          transform: scale(0.95);
        }

        .rating-label-wrap {
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 24px;
          transition: color 0.2s ease;
        }

        .rating-emoji {
          font-size: 20px;
        }

        .rating-label {
          font-size: 15px;
          font-weight: 700;
        }

        /* ===== TAGS ===== */
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          border-radius: 20px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .tag-chip:hover {
          border-color: #94A3B8;
          background: #F8FAFC;
        }

        .tag-chip.selected {
          background: #10B981;
          border-color: #10B981;
          color: #FFFFFF;
          font-weight: 600;
        }

        .tag-chip.selected.negative {
          background: #EF4444;
          border-color: #EF4444;
        }

        /* ===== COMMENT ===== */
        .comment-textarea {
          width: 100%;
          padding: 14px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
          line-height: 1.5;
          box-sizing: border-box;
          transition: all 0.2s;
        }

        .comment-textarea:focus {
          border-color: #F59E0B;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.08);
        }

        .comment-textarea::placeholder {
          color: #94A3B8;
        }

        .char-count {
          text-align: right;
          font-size: 11px;
          color: #94A3B8;
          margin-top: 6px;
        }

        /* ===== RECOMMEND ===== */
        .recommend-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .recommend-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          min-height: 52px;
        }

        .recommend-btn:hover {
          border-color: #94A3B8;
          background: #F8FAFC;
        }

        .recommend-btn.active.yes {
          background: #10B981;
          border-color: #10B981;
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);
        }

        .recommend-btn.active.no {
          background: #EF4444;
          border-color: #EF4444;
          color: #FFFFFF;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);
        }

        .recommend-emoji {
          font-size: 18px;
        }

        /* ===== TRUST NOTE ===== */
        .trust-note {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          background: rgba(59, 130, 246, 0.06);
          border-radius: 10px;
          border: 1px solid rgba(59, 130, 246, 0.12);
          font-size: 12px;
          color: #1E40AF;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        /* ===== SUBMIT ===== */
        .submit-btn {
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

        .submit-btn.active {
          background: #1E293B;
          color: #FFFFFF;
          cursor: pointer;
        }

        .submit-btn.active:hover:not(:disabled) {
          background: #F59E0B;
          transform: scale(0.98);
          box-shadow: 0 4px 16px rgba(245, 158, 11, 0.2);
        }

        .submit-btn:disabled {
          cursor: not-allowed;
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

        .nav-btn {
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

        .nav-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-icon-wrap.active {
          background: #1E293B;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 500;
          color: #94A3B8;
        }

        .nav-label.active {
          color: #1E293B;
          font-weight: 600;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .page-header {
            padding: 12px 12px 16px;
          }
          .main-content {
            padding: 16px 12px 40px;
          }
          .page-title {
            font-size: 20px;
          }
          .star-btn svg {
            width: 34px;
            height: 34px;
          }
          .transaction-title {
            font-size: 13px;
          }
          .transaction-price {
            font-size: 13px;
          }
        }

        @media (max-width: 380px) {
          .star-btn svg {
            width: 30px;
            height: 30px;
          }
          .tag-chip {
            font-size: 12px;
            padding: 6px 12px;
          }
          .recommend-btn {
            font-size: 13px;
            min-height: 48px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .star-btn,
          .tag-chip,
          .recommend-btn,
          .submit-btn {
            transition: none;
          }
          .star-btn:hover,
          .submit-btn.active:hover:not(:disabled) {
            transform: none;
          }
          .rating-section,
          .tags-section,
          .comment-section,
          .recommend-section {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default RatingReview;