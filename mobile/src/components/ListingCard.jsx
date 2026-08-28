// mobile/src/components/ListingCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const ListingCard = ({ 
  listing, 
  showBusiness = true,
  showLocation = true,
  showDate = true,
  onClick,
  className = '',
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { 
    id, 
    title, 
    price, 
    images, 
    category, 
    locationArea, 
    createdAt, 
    business,
    viewCount,
    contactCount,
    status,
  } = listing || {};

  const isActive = status === 'active' || status === 'published';
  const isSold = status === 'sold';
  const isInactive = status === 'inactive' || status === 'draft';

  const getStatusBadge = () => {
    if (isSold) {
      return <span className="badge badge-red">Sold</span>;
    }
    if (isInactive) {
      return <span className="badge badge-gray">Inactive</span>;
    }
    if (isActive) {
      return <span className="badge badge-green">Active</span>;
    }
    return null;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(listing);
    }
  };

  return (
    <Link 
      to={`/listing/${id}`} 
      className={`block group ${className}`}
      onClick={handleClick}
    >
      <div className="card hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          {images?.[0] && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 skeleton"></div>
              )}
              <img
                src={images[0]}
                alt={title || 'Listing image'}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-accent text-champion-blue">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {category && (
              <span className="badge badge-primary text-xs">
                {category}
              </span>
            )}
            {getStatusBadge()}
          </div>

          {/* View Count */}
          {viewCount > 0 && (
            <div className="absolute bottom-3 right-3 glass px-2 py-1 rounded-full text-xs text-gray-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {viewCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-lavender-tonic transition-colors">
            {title || 'Untitled Listing'}
          </h3>
          
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-champion-blue">
              MK {price?.toLocaleString() || '0'}
            </span>
            {showBusiness && business?.businessName && (
              <span className="text-sm text-gray-500 truncate max-w-[120px]">
                {business.businessName}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              {showLocation && (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{locationArea || 'Malawi'}</span>
                </>
              )}
            </div>
            {showDate && createdAt && (
              <span>
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Contact Count */}
          {contactCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              {contactCount} contact{contactCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;