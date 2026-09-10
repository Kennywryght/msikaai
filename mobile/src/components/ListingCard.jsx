// mobile/src/components/ListingCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// ============================================================
// LUCIDE-STYLE ICONS
// ============================================================
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 1.75, fill = 'none' }) => {
  const icons = {
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
    clock: "M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    check: "M20 6L9 17l-5-5",
    image: "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21",
  };

  const d = icons[name] || icons.store;
  
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
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
};

// ============================================================
// HELPER: Format relative time
// ============================================================
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// ============================================================
// LISTING CARD COMPONENT
// ============================================================
const ListingCard = ({
  listing,
  showBusiness = true,
  showLocation = true,
  showDate = true,
  showRating = true,
  variant = 'default', // 'default' | 'compact' | 'horizontal'
  onClick,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const {
    id,
    title,
    price,
    images,
    category,
    locationArea,
    location_area,
    createdAt,
    created_at,
    business,
    businesses,
    viewCount,
    view_count,
    contactCount,
    contact_count,
    status,
    rating,
    deliveryAvailable,
    delivery_available,
    isService,
    is_service,
  } = listing || {};

  // Handle both snake_case and camelCase
  const displayLocation = locationArea || location_area || '';
  const displayDate = createdAt || created_at;
  const displayBusiness = business?.businessName || businesses?.business_name;
  const displayViewCount = viewCount || view_count || 0;
  const displayRating = rating || businesses?.rating || 4.5;
  const isDelivery = deliveryAvailable || delivery_available;
  const isServiceItem = isService || is_service || 
    category?.toLowerCase().includes('plumber') ||
    category?.toLowerCase().includes('electrician') ||
    category?.toLowerCase().includes('service');

  const isActive = status === 'active' || status === 'published';
  const isSold = status === 'sold';
  const isInactive = status === 'inactive' || status === 'draft';

  const handleImageLoad = () => setImageLoaded(true);
  const handleImageError = () => setImageError(true);

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(listing);
    }
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const formatPrice = (p) => {
    if (!p && p !== 0) return 'Price on request';
    return `MK ${Number(p).toLocaleString()}`;
  };

  const isHorizontal = variant === 'horizontal';

  return (
    <Link
      to={`/listing/${id}`}
      className={`listing-card ${isHorizontal ? 'listing-card-horizontal' : ''} ${className}`}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="card-image-wrap">
        {images?.[0] && !imageError ? (
          <>
            {!imageLoaded && <div className="image-skeleton" />}
            <img
              src={images[0]}
              alt={title || 'Listing'}
              className={`card-image ${imageLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="card-image-placeholder">
            <Icon name="image" size={28} color="#CBD5E1" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges */}
        <div className="card-badges">
          {category && (
            <span className={`badge badge-category ${isServiceItem ? 'badge-service' : ''}`}>
              {isServiceItem ? 'Service' : category}
            </span>
          )}
        </div>

        {/* Delivery badge */}
        {isDelivery && (
          <div className="delivery-badge">
            <Icon name="truck" size={10} color="#FFFFFF" strokeWidth={2} />
          </div>
        )}

        {/* Like Button */}
        <button
          className="like-btn"
          onClick={handleLike}
          aria-label="Like"
        >
          <Icon
            name="heart"
            size={14}
            color={isLiked ? '#EF4444' : '#64748B'}
            strokeWidth={isLiked ? 2.5 : 1.5}
            fill={isLiked ? '#EF4444' : 'none'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="card-body">
        <h3 className="card-title">{title || 'Untitled Listing'}</h3>

        {/* Business */}
        {showBusiness && displayBusiness && (
          <div className="card-business">
            <Icon name="store" size={10} color="#94A3B8" strokeWidth={1.75} />
            <span>{displayBusiness}</span>
          </div>
        )}

        {/* Footer */}
        <div className="card-footer">
          <span className="card-price">{formatPrice(price)}</span>

          <div className="card-meta">
            {showRating && displayRating && (
              <span className="meta-rating">
                <Icon name="star" size={10} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                {Number(displayRating).toFixed(1)}
              </span>
            )}
            {displayViewCount > 0 && (
              <span className="meta-view">
                <Icon name="eye" size={10} color="#94A3B8" strokeWidth={1.75} />
                {displayViewCount}
              </span>
            )}
          </div>
        </div>

        {/* Location + Date */}
        {(showLocation || showDate) && (
          <div className="card-bottom">
            {showLocation && displayLocation && (
              <span className="card-location">
                <Icon name="mapPin" size={10} color="#94A3B8" strokeWidth={1.75} />
                {displayLocation}
              </span>
            )}
            {showDate && displayDate && (
              <span className="card-date">
                {formatRelativeTime(displayDate)}
              </span>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .listing-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #F1F5F9;
          text-decoration: none;
          color: inherit;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
        }

        .listing-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(30, 41, 59, 0.06);
          border-color: #E2E8F0;
        }

        /* Horizontal variant */
        .listing-card-horizontal {
          flex-direction: row;
        }

        /* ===== IMAGE ===== */
        .card-image-wrap {
          position: relative;
          width: 100%;
          height: 140px;
          background: #F8FAFC;
          overflow: hidden;
          flex-shrink: 0;
        }

        .listing-card-horizontal .card-image-wrap {
          width: 100px;
          height: auto;
          min-height: 100px;
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.4s ease, transform 0.5s ease;
        }

        .card-image.loaded {
          opacity: 1;
        }

        .listing-card:hover .card-image {
          transform: scale(1.05);
        }

        .image-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .card-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
        }

        /* ===== BADGES ===== */
        .card-badges {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .badge {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .badge-category {
          background: rgba(255, 255, 255, 0.95);
          color: #1E293B;
        }

        .badge-service {
          background: rgba(139, 92, 246, 0.95);
          color: #FFFFFF;
        }

        .delivery-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }

        /* ===== LIKE BUTTON ===== */
        .like-btn {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .like-btn:hover {
          transform: scale(1.1);
          background: #FFFFFF;
        }

        .like-btn:active {
          transform: scale(0.95);
        }

        /* ===== BODY ===== */
        .card-body {
          padding: 10px 12px 12px;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .listing-card-horizontal .card-body {
          padding: 12px 14px;
        }

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.3;
        }

        .listing-card-horizontal .card-title {
          font-size: 14px;
          white-space: normal;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card-business {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #94A3B8;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* ===== FOOTER ===== */
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          padding-top: 6px;
          border-top: 1px solid #F8FAFC;
          margin-top: auto;
        }

        .card-price {
          font-size: 14px;
          font-weight: 700;
          color: #10B981;
          flex-shrink: 0;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .meta-rating,
        .meta-view {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10px;
          font-weight: 600;
          color: #64748B;
          background: #F8FAFC;
          padding: 2px 6px;
          border-radius: 6px;
        }

        /* ===== BOTTOM ===== */
        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          flex-wrap: wrap;
        }

        .card-location,
        .card-date {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #94A3B8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-location {
          max-width: 60%;
        }

        .card-date {
          flex-shrink: 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .card-image-wrap {
            height: 120px;
          }
          .listing-card-horizontal .card-image-wrap {
            width: 88px;
          }
          .card-title {
            font-size: 12.5px;
          }
          .card-price {
            font-size: 13px;
          }
          .card-body {
            padding: 9px 10px 10px;
          }
        }

        @media (max-width: 380px) {
          .card-image-wrap {
            height: 105px;
          }
          .card-title {
            font-size: 12px;
          }
          .card-price {
            font-size: 12px;
          }
          .card-meta {
            gap: 4px;
          }
          .meta-rating,
          .meta-view {
            font-size: 9px;
            padding: 2px 4px;
          }
          .badge {
            font-size: 8px;
            padding: 2px 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .listing-card,
          .card-image,
          .like-btn {
            transition: none;
          }
          .listing-card:hover {
            transform: none;
          }
          .listing-card:hover .card-image {
            transform: none;
          }
          .image-skeleton {
            animation: none;
          }
        }
      `}</style>
    </Link>
  );
};

export default ListingCard;