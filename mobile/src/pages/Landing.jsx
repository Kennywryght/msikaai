// mobile/src/pages/Landing.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, messagesAPI, interactionsAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import CommentSection from '../components/CommentSection';

/* ---------- Icons ---------- */
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '' }) => {
  const icons = {
    home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    store: "M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    fire: "M12 2c1.5 3.5 4 5.5 4 9a4 4 0 11-8 0c0-1.4.5-2.5 1.2-3.4.3-.4.6-.9.8-1.4.2-.5.2-1 0-1.4-.2-.4-.3-.6-.3-.8 0-.3.2-.6.5-.7.3-.2.6-.1.8.2.6.7.8 1.4.5 2.5.7-.5 1.2-1.1 1.5-1.9.1-.4.1-.7 0-1 0-.2 0-.4.2-.5.2-.1.4-.1.5 0 .3.3.4.6.3.9z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z",
    truck: "M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    coffee: "M8 3v3m4-3v3m4-3v3M4 14h16a2 2 0 002-2v-1a2 2 0 00-2-2H4a2 2 0 00-2 2v1a2 2 0 002 2zm0 0v4a4 4 0 004 4h8a4 4 0 004-4v-4",
    shirt: "M16 3l4 4-3 3-2-2v13H9V8L7 10 4 7l4-4 2 2h4l2-2z",
    wrench: "M14.7 6.3a4 4 0 11-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 015.4-5.4z",
    wheat: "M12 22V8M12 8c0-3 2-5 5-5-1 3-2 5-5 5zM12 8c0-3-2-5-5-5 1 3 2 5 5 5zM12 14c2.5 0 4-1.5 4-4-2.5 0-4 1.5-4 4zM12 14c-2.5 0-4-1.5-4-4 2.5 0 4 1.5 4 4z",
    hammer: "M14.5 4.5l5 5L17 12l-5-5 2.5-2.5zM3 21l7.5-7.5M13 8L6 15l-1 4 4-1 7-7",
    layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    close: "M6 18L18 6M6 6l12 12",
    comment: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
    sparkle: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z",
    flame: "M12 2s4 5 4 9a4 4 0 11-8 0c0-1.5.7-2.7 1.5-3.5C10 6 12 2 12 2z",
    crown: "M3 8l4 4 5-7 5 7 4-4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V8z",
    chevronLeft: "M15 18l-6-6 6-6",
    chevronRight: "M9 18l6-6-6-6",
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

/* ============================================================
   LIVE BURNING FIRE — more realistic
   ============================================================ */
const BurningFire = ({ size = 16 }) => (
  <span className="burning-fire" style={{ width: size, height: size }} aria-hidden="true">
    <svg viewBox="0 0 24 24" width={size} height={size} className="burning-fire-svg">
      <defs>
        <radialGradient id="bfOuter" cx="50%" cy="82%" r="70%">
          <stop offset="0%"   stopColor="#B91C1C" />
          <stop offset="45%"  stopColor="#EA580C" />
          <stop offset="78%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FCD34D" />
        </radialGradient>
        <radialGradient id="bfMid" cx="50%" cy="82%" r="70%">
          <stop offset="0%"   stopColor="#EA580C" />
          <stop offset="55%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FDE68A" />
        </radialGradient>
        <radialGradient id="bfCore" cx="50%" cy="82%" r="70%">
          <stop offset="0%"   stopColor="#FEF3C7" />
          <stop offset="100%" stopColor="#FFFBEB" />
        </radialGradient>
        <radialGradient id="bfEmberGlow" cx="50%" cy="85%" r="60%">
          <stop offset="0%"   stopColor="rgba(249,115,22,0.35)" />
          <stop offset="100%" stopColor="rgba(249,115,22,0)" />
        </radialGradient>
      </defs>

      <circle cx="12" cy="15" r="10" fill="url(#bfEmberGlow)" />

      <path
        className="flame-outer"
        d="M12 2
           C 11.2 4.2, 9.8 6.4, 8.6 8.2
           C 7.4 9.9, 6.4 11.4, 6.4 13.4
           C 6.4 16.4, 8.9 19.2, 12 19.2
           C 15.1 19.2, 17.6 16.4, 17.6 13.4
           C 17.6 11.6, 16.8 10.2, 15.8 8.9
           C 15.0 7.9, 14.2 6.9, 13.6 5.6
           C 13.0 4.4, 12.5 3.2, 12 2 Z"
        fill="url(#bfOuter)"
      />

      <path
        className="flame-mid"
        d="M12 6
           C 11.4 7.8, 10.4 9.2, 9.6 10.6
           C 8.8 12.0, 8.2 13.0, 8.2 14.3
           C 8.2 16.4, 9.9 18.2, 12 18.2
           C 14.1 18.2, 15.8 16.4, 15.8 14.3
           C 15.8 13.0, 15.3 12.0, 14.6 10.8
           C 14.0 9.8, 13.4 8.9, 13.0 7.9
           C 12.6 6.9, 12.3 6.4, 12 6 Z"
        fill="url(#bfMid)"
      />

      <path
        className="flame-core"
        d="M12 10.5
           C 11.6 11.6, 11.0 12.4, 10.6 13.2
           C 10.2 14.0, 10.0 14.6, 10.0 15.2
           C 10.0 16.4, 10.9 17.4, 12 17.4
           C 13.1 17.4, 14.0 16.4, 14.0 15.2
           C 14.0 14.6, 13.8 14.0, 13.4 13.4
           C 13.1 12.8, 12.7 12.3, 12.5 11.6
           C 12.3 11.1, 12.2 10.7, 12 10.5 Z"
        fill="url(#bfCore)"
      />

      <circle className="ember ember-1" cx="10.2" cy="4.4" r="0.55" fill="#FCD34D" />
      <circle className="ember ember-2" cx="13.6" cy="3.6" r="0.4"  fill="#F59E0B" />
      <circle className="ember ember-3" cx="11.8" cy="2.6" r="0.35" fill="#FBBF24" />
    </svg>
  </span>
);

const CATEGORIES = [
  { label: 'All', icon: 'layers', color: '#BC5B34' },
  { label: 'Food', icon: 'coffee', color: '#BC5B34' },
  { label: 'Clothing', icon: 'shirt', color: '#8B5A83' },
  { label: 'Services', icon: 'wrench', color: '#3E6C76' },
  { label: 'Farm Inputs', icon: 'wheat', color: '#5B7B5E' },
  { label: 'Hardware', icon: 'hammer', color: '#6B6259' },
];

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;
const ASPECT_RATIOS = ['4 / 5', '4 / 5.4', '4 / 5', '4 / 5.4'];
const SPOTLIGHT_MAX = 8;
const SPOTLIGHT_IMAGE_MS = 2000;
const SPOTLIGHT_HOLD_MS = 1600;

const getCategoryColor = (category) => {
  if (!category) return '#6B6259';
  const c = category.toLowerCase();
  if (c.includes('food') || c.includes('coffee') || c.includes('drink')) return '#BC5B34';
  if (c.includes('cloth') || c.includes('shirt') || c.includes('fashion')) return '#8B5A83';
  if (c.includes('service') || c.includes('plumber') || c.includes('electric') || c.includes('mechanic') || c.includes('tailor') || c.includes('hair')) return '#3E6C76';
  if (c.includes('farm') || c.includes('wheat') || c.includes('seed') || c.includes('fert')) return '#5B7B5E';
  if (c.includes('hardware') || c.includes('tool') || c.includes('hammer')) return '#6B6259';
  return '#BC5B34';
};

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

/* ---------- Photo slider ---------- */
const PhotoSlider = ({
  images = [],
  alt = '',
  className = '',
  showArrows = true,
  showDots = true,
  onImageClick,
  eager = false,
}) => {
  const [idx, setIdx] = useState(0);
  const startXRef = useRef(null);
  const total = images.length;
  const safeIdx = total ? Math.min(idx, total - 1) : 0;

  const go = useCallback((n) => {
    if (!total) return;
    setIdx(((n % total) + total) % total);
  }, [total]);

  const next = useCallback((e) => { e?.stopPropagation?.(); go(safeIdx + 1); }, [go, safeIdx]);
  const prev = useCallback((e) => { e?.stopPropagation?.(); go(safeIdx - 1); }, [go, safeIdx]);

  const onTouchStart = (e) => { startXRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (startXRef.current == null) return;
    const dx = e.changedTouches[0].clientX - startXRef.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next(); else prev();
    }
    startXRef.current = null;
  };

  if (!total) {
    return (
      <div className={`pslider ${className}`}>
        <div className="pslider-empty">
          <Icon name="store" size={26} color="#C9BB98" strokeWidth={1.3} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pslider ${className}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="pslider-track" style={{ transform: `translateX(-${safeIdx * 100}%)` }}>
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${alt} ${i + 1}`}
            className="pslider-img"
            loading={eager && i === 0 ? 'eager' : 'lazy'}
            draggable={false}
            onClick={onImageClick}
          />
        ))}
      </div>

      {total > 1 && showArrows && (
        <>
          <button
            type="button"
            className="pslider-arrow left"
            onClick={prev}
            aria-label="Previous photo"
          >
            <Icon name="chevronLeft" size={14} color="#F7F1E3" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            className="pslider-arrow right"
            onClick={next}
            aria-label="Next photo"
          >
            <Icon name="chevronRight" size={14} color="#F7F1E3" strokeWidth={2.4} />
          </button>
        </>
      )}

      {total > 1 && showDots && (
        <div className="pslider-dots" onClick={(e) => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`pslider-dot ${i === safeIdx ? 'active' : ''}`}
              onClick={() => go(i)}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {total > 1 && (
        <span className="pslider-count">{safeIdx + 1}/{total}</span>
      )}
    </div>
  );
};

/* ---------- Product card ---------- */
const ProductCard = ({
  item, index, user, openingChatId, likeState, commentCount,
  onLike, onOpen, onMessage, onOpenComments,
}) => {
  const liked = !!likeState?.liked;
  const likeCount = likeState?.count ?? 0;
  const sellerUserId = item.businesses?.user_id || item.businesses?.userId || item.businesses?.owner_id || null;
  const canMessage = !!sellerUserId && sellerUserId !== user?.id;
  const catColor = getCategoryColor(item.category);
  const aspect = ASPECT_RATIOS[index % ASPECT_RATIOS.length];

  return (
    <article className="pcard">
      <div className="pcard-media" style={{ aspectRatio: aspect }}>
        <PhotoSlider
          images={item.images || []}
          alt={item.title}
          className="pcard-slider"
          onImageClick={() => onOpen(item)}
        />

        {item.category && (
          <span
            className="pcard-cat"
            style={{ background: `${catColor}E6` }}
            title={item.category}
          >
            {item.category}
          </span>
        )}

        <button
          className={`pcard-heart ${liked ? 'liked' : ''}`}
          onClick={(e) => onLike(e, item)}
          aria-label={liked ? 'Unflame' : 'Flame'}
        >
          <Icon name="fire" size={14} color="#F7F1E3" strokeWidth={liked ? 2.2 : 1.8} />
        </button>

        {item.delivery_available && (
          <span className="pcard-delivery" title="Delivery available">
            <Icon name="truck" size={10} color="#F7F1E3" strokeWidth={2} />
          </span>
        )}
      </div>

      <div className="pcard-body">
        <div className="pcard-price">
          {item.price != null && item.price !== '' ? (
            <span className="pcard-price-value">{`MK ${Number(item.price).toLocaleString()}`}</span>
          ) : (
            <span className="pcard-price-muted">On request</span>
          )}
        </div>

        <h3 className="pcard-title" onClick={() => onOpen(item)}>{item.title}</h3>

        <div className="pcard-meta">
          <span className="pcard-avatar" style={{ background: `${catColor}22`, color: catColor }}>
            {(item.businesses?.business_name || 'L').trim().charAt(0).toUpperCase()}
          </span>
          <span className="pcard-seller">{item.businesses?.business_name || 'Local seller'}</span>
          {item.location_area && (
            <>
              <span className="pcard-dot" />
              <span className="pcard-loc">{item.location_area}</span>
            </>
          )}
        </div>

        <div className="pcard-actions">
          <button
            className={`pcard-icon-btn ${liked ? 'liked' : ''}`}
            onClick={(e) => onLike(e, item)}
            aria-label="Flame"
          >
            <Icon name="fire" size={14} color={liked ? '#EA580C' : '#8A8578'} strokeWidth={liked ? 2.3 : 1.7} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          <button
            className="pcard-icon-btn"
            onClick={(e) => { e.stopPropagation(); onOpenComments(item); }}
            aria-label="Comments"
          >
            <Icon name="comment" size={13} color="#8A8578" strokeWidth={1.9} />
            {commentCount > 0 && <span>{commentCount}</span>}
          </button>

          {canMessage && (
            <button
              className="pcard-msg"
              onClick={(e) => onMessage(e, item)}
              disabled={openingChatId === item.id}
              aria-label="Message seller"
            >
              <Icon name="message" size={12} color="#F7F1E3" strokeWidth={2} />
              <span>{openingChatId === item.id ? '…' : 'Message'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

/* ---------- Featured card ---------- */
const FeaturedCard = ({ item, user, openingChatId, likeState, commentCount, onLike, onOpen, onMessage, onOpenComments }) => {
  const liked = !!likeState?.liked;
  const likeCount = likeState?.count ?? 0;
  const sellerUserId = item.businesses?.user_id || item.businesses?.userId || item.businesses?.owner_id || null;
  const canMessage = !!sellerUserId && sellerUserId !== user?.id;
  const catColor = getCategoryColor(item.category);
  const premium = isPremium(item);

  return (
    <article className="fcard">
      <div className="fcard-media">
        <PhotoSlider
          images={item.images || []}
          alt={item.title}
          className="fcard-slider"
          onImageClick={() => onOpen(item)}
          eager
        />

        <div className="fcard-top">
          <span className={`fchip fchip-spotlight ${premium ? 'is-premium' : ''}`}>
            <Icon name={premium ? 'crown' : 'sparkle'} size={11} color="#F0D9A8" strokeWidth={2} />
            {premium ? 'Premium' : 'Spotlight'}
          </span>
          {item.category && (
            <span className="fchip fchip-cat" style={{ background: `${catColor}E0` }}>
              {item.category}
            </span>
          )}
        </div>

        <button
          className={`fcard-heart ${liked ? 'liked' : ''}`}
          onClick={(e) => onLike(e, item)}
          aria-label={liked ? 'Unflame' : 'Flame'}
        >
          <Icon name="fire" size={15} color="#F7F1E3" strokeWidth={liked ? 2.3 : 1.8} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <div className="fcard-glass" onClick={(e) => e.stopPropagation()}>
          <div className="fcard-glass-row">
            <h3 className="fcard-title" onClick={() => onOpen(item)}>{item.title}</h3>
            <span className="fcard-price">
              {item.price != null && item.price !== '' ? `MK ${Number(item.price).toLocaleString()}` : 'On request'}
            </span>
          </div>
          <div className="fcard-meta">
            <span className="fcard-seller">{item.businesses?.business_name || 'Local seller'}</span>
            {item.location_area && (
              <>
                <span className="fcard-dot" />
                <span className="fcard-loc">
                  <Icon name="mapPin" size={10} color="#EFE6CE" strokeWidth={1.9} />
                  {item.location_area}
                </span>
              </>
            )}
            {item.delivery_available && (
              <span className="fcard-delivery">
                <Icon name="truck" size={10} color="#F7F1E3" strokeWidth={2} />
                Delivery
              </span>
            )}
          </div>
          <div className="fcard-actions">
            <button              className="fcard-action"
              onClick={(e) => { e.stopPropagation(); onOpenComments(item); }}
            >
              <Icon name="comment" size={13} color="#F7F1E3" strokeWidth={1.9} />
              <span>{commentCount > 0 ? `${commentCount} comments` : 'Comment'}</span>
            </button>
            {canMessage && (
              <button
                className="fcard-action fcard-msg"
                onClick={(e) => onMessage(e, item)}
                disabled={openingChatId === item.id}
              >
                <Icon name="message" size={12} color="#201F1B" strokeWidth={2} />
                <span>{openingChatId === item.id ? '…' : 'Message'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/* ---------- Spotlight tile ---------- */
const SpotlightTile = ({ item, onOpen }) => {
  const catColor = getCategoryColor(item.category);
  const premium = isPremium(item);
  const images = (item.images || []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const total = images.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setTimeout(() => {
      setIdx((prev) => (prev + 1) % total);
    }, SPOTLIGHT_HOLD_MS);
    return () => clearTimeout(t);
  }, [idx, total]);

  return (
    <button className={`spot-tile ${premium ? 'is-premium' : ''}`} onClick={() => onOpen(item)}>
      <div className="spot-media">
        {total > 0 ? (
          <div className="spot-slider">
            <div
              className="spot-slider-track"
              style={{ transform: `translateX(-${Math.min(idx, total - 1) * 100}%)` }}
            >
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${item.title} ${i + 1}`}
                  className="spot-slider-img"
                  loading="lazy"
                  draggable={false}
                />
              ))}
            </div>
            {total > 1 && (
              <div className="spot-slider-dots">
                {images.map((_, i) => (
                  <span key={i} className={`spot-slider-dot ${i === idx ? 'active' : ''}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="spot-media-empty">
            <Icon name="store" size={22} color="#C9BB98" strokeWidth={1.3} />
          </div>
        )}

        {item.category && (
          <span className="spot-cat" style={{ background: `${catColor}E6` }}>
            {item.category}
          </span>
        )}
        {premium && (
          <span className="spot-premium" title="Premium listing">
            <Icon name="crown" size={10} color="#201F1B" strokeWidth={2.2} />
          </span>
        )}
      </div>
      <div className="spot-info">
        <div className="spot-title">{item.title}</div>
        <div className="spot-price">
          {item.price != null && item.price !== '' ? `MK ${Number(item.price).toLocaleString()}` : 'On request'}
        </div>
      </div>
    </button>
  );
};

const Landing = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [allListings, setAllListings] = useState([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [activeTab, setActiveTab] = useState('all');
  const [openingChatId, setOpeningChatId] = useState(null);
  const [commentsListing, setCommentsListing] = useState(null);

  const [likeStates, setLikeStates] = useState({});
  const [commentCounts, setCommentCounts] = useState({});

  const searchInputRef = useRef(null);
  const spotlightScrollRef = useRef(null);
  const spotlightTileRefs = useRef([]);
  const isMobile = windowWidth <= 768;

  const commentsListingIdRef = useRef(null);
  useEffect(() => {
    commentsListingIdRef.current = commentsListing?.id ?? null;
  }, [commentsListing?.id]);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (commentsListing) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [commentsListing]);

  useEffect(() => {
    if (!commentsListing) return;
    const onKey = (e) => { if (e.key === 'Escape') setCommentsListing(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commentsListing]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, bizRes] = await Promise.all([
          listingsAPI.search({ limit: 50 }).catch(() => ({ data: { listings: [] } })),
          businessAPI.getAll({ limit: 20 }).catch(() => ({ data: { businesses: [] } })),
        ]);
        if (!mounted) return;

        let listingsData = listingsRes.data?.listings || [];
        const businessesData = bizRes.data?.businesses || [];

        if (listingsData.length === 0 && businessesData.length > 0) {
          listingsData = businessesData.map((b) => ({
            id: `biz-${b.id}`,
            title: b.business_name,
            description: b.description || '',
            category: b.category,
            price: null,
            images: b.logo_url ? [b.logo_url] : [],
            businesses: { business_name: b.business_name, id: b.id, user_id: b.user_id, is_premium: b.is_premium },
            created_at: b.created_at,
            is_business: true,
            location_area: b.location_text || '',
            delivery_available: b.delivery_available || false,
            business_id: b.id,
          }));
        }
        if (mounted) {
          setAllListings(listingsData);
          setFeaturedBusinesses(businessesData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        if (mounted) setAllListings([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const realListingIds = allListings
      .filter((item) => !item.is_business && item.id && !String(item.id).startsWith('biz-'))
      .map((item) => item.id);

    if (realListingIds.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const [likesRes, countsRes] = await Promise.all([
          interactionsAPI.batchLikeStates(realListingIds).catch(() => ({ data: {} })),
          interactionsAPI.getCommentCounts(realListingIds).catch(() => ({ data: {} })),
        ]);

        if (cancelled) return;

        const counts = likesRes?.data?.counts || {};
        const userLikes = likesRes?.data?.userLikes || {};

        const nextLikeState = {};
        for (const id of realListingIds) {
          nextLikeState[id] = {
            count: counts[id] || 0,
            liked: !!userLikes[id],
          };
        }
        setLikeStates(nextLikeState);
        setCommentCounts(countsRes?.data?.counts || {});
      } catch (err) {
        console.warn('Failed to load interactions:', err?.message);
      }
    })();

    return () => { cancelled = true; };
  }, [allListings, isAuthenticated]);

  const handleLike = useCallback(async (e, item) => {
    e.stopPropagation();
    if (!isAuthenticated) { showToast('Please sign in to flame', 'warning'); return; }
    if (item.is_business) { showToast('Businesses can\u2019t be flamed yet', 'info'); return; }

    const listingId = item.id;
    const current = likeStates[listingId] || { count: 0, liked: false };

    setLikeStates((prev) => ({
      ...prev,
      [listingId]: {
        count: current.liked ? Math.max(0, current.count - 1) : current.count + 1,
        liked: !current.liked,
      },
    }));

    try {
      const res = await interactionsAPI.toggleLike(listingId);
      const real = res.data;
      setLikeStates((prev) => ({
        ...prev,
        [listingId]: { count: real.count, liked: real.liked },
      }));
    } catch (err) {
      console.error('like error:', err);
      setLikeStates((prev) => ({
        ...prev,
        [listingId]: current,
      }));
      showToast('Failed to update', 'error');
    }
  }, [isAuthenticated, showToast, likeStates]);

  const handleQuickMessage = useCallback(async (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) { showToast('Please sign in to message the seller', 'warning'); navigate('/login'); return; }

    const sellerUserId = item?.businesses?.user_id || item?.businesses?.userId || item?.businesses?.owner_id || null;
    if (!sellerUserId) { showToast('Seller information is unavailable', 'error'); return; }
    if (sellerUserId === user.id) { showToast("You can't message yourself about your own listing", 'warning'); return; }
    if (openingChatId === item.id) return;
    setOpeningChatId(item.id);

    try {
      const res = await messagesAPI.createConversation(sellerUserId, item.id);
      const conversationId = res?.data?.conversation?.id;
      if (!conversationId) throw new Error('Could not open conversation');
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Quick message error:', err);
      showToast(err?.response?.data?.error || 'Failed to open chat', 'error');
    } finally {
      setOpeningChatId(null);
    }
  }, [user, navigate, showToast, openingChatId]);

  const isService = useCallback((item) => {
    const serviceCategories = ['Plumber', 'Electrician', 'Carpenter', 'Mechanic', 'Tailor', 'Hairdresser', 'Services'];
    return serviceCategories.some((cat) => item.category?.toLowerCase().includes(cat.toLowerCase()));
  }, []);

  const baseFiltered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return allListings.filter((item) => {
      const categoryMatch = selectedCategory === 'All' || item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const searchMatch = !query ||
        item.title?.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.businesses?.business_name?.toLowerCase().includes(query);
      let tabMatch = true;
      if (activeTab === 'goods') tabMatch = !isService(item);
      else if (activeTab === 'services') tabMatch = isService(item);
      return categoryMatch && searchMatch && tabMatch;
    });
  }, [allListings, selectedCategory, searchQuery, activeTab, isService]);

  const spotlight = useMemo(() => {
    const premium = baseFiltered.filter(isPremium);
    const pool = premium.length
      ? premium
      : [...baseFiltered]
          .filter((l) => l.created_at)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, SPOTLIGHT_MAX);
    return pool
      .sort((a, b) => {
        const pa = isPremium(a) ? 1 : 0;
        const pb = isPremium(b) ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      })
      .slice(0, SPOTLIGHT_MAX);
  }, [baseFiltered]);

  const spotlightHasPremium = useMemo(() => spotlight.some(isPremium), [spotlight]);

  const scrollSpotlightTo = useCallback((index) => {
    const container = spotlightScrollRef.current;
    const tile = spotlightTileRefs.current[index];
    if (!container || !tile) return;
    container.scrollTo({
      left: tile.offsetLeft - 20,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (spotlight.length <= 1) return;
    const container = spotlightScrollRef.current;
    if (!container) return;

    let cancelled = false;
    let currentIndex = 0;

    scrollSpotlightTo(0);

    const advance = () => {
      if (cancelled) return;
      currentIndex = (currentIndex + 1) % spotlight.length;
      scrollSpotlightTo(currentIndex);
    };

    const interval = setInterval(advance, SPOTLIGHT_IMAGE_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [spotlight, scrollSpotlightTo]);

  const featured = useMemo(() => {
    const recent = baseFiltered.filter(
      (l) => l.created_at && Date.now() - new Date(l.created_at).getTime() < NEW_WINDOW_MS
    );
    const pool = recent.length ? recent : baseFiltered;
    if (pool.length < 3) return null;
    const premiumPool = pool.filter(isPremium);
    const chooseFrom = premiumPool.length ? premiumPool : pool;
    return [...chooseFrom].sort((a, b) => {
      const la = likeStates[a.id]?.count ?? 0;
      const lb = likeStates[b.id]?.count ?? 0;
      return lb - la;
    })[0] || null;
  }, [baseFiltered, likeStates]);

  const featuredId = featured?.id;

  const freshListings = useMemo(
    () => baseFiltered.filter((l) => l.id !== featuredId && l.created_at && Date.now() - new Date(l.created_at).getTime() < NEW_WINDOW_MS),
    [baseFiltered, featuredId]
  );

  const freshIds = useMemo(() => new Set(freshListings.map((l) => l.id)), [freshListings]);

  const otherListings = useMemo(
    () => baseFiltered.filter((l) => l.id !== featuredId && !freshIds.has(l.id)),
    [baseFiltered, featuredId, freshIds]
  );

  const hasResults = baseFiltered.length > 0;

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, navigate]);

  const handleListingClick = useCallback((item) => {
    if (item.is_business) navigate(`/search?q=${encodeURIComponent(item.title)}`);
    else navigate(`/listing/${item.id}`);
  }, [navigate]);

  const handleBusinessClick = useCallback((business) => {
    navigate(`/search?q=${encodeURIComponent(business.business_name)}`);
  }, [navigate]);

  const handleOpenComments = useCallback((item) => {
    if (!item) return;
    const id = String(item.id || '');
    if (item.is_business || id.startsWith('biz-')) {
      showToast('Comments are only available on listings', 'info');
      return;
    }
    setCommentsListing(item);
  }, [showToast]);

  const handleCommentCountChange = useCallback((count) => {
    const id = commentsListingIdRef.current;
    if (!id) return;
    setCommentCounts((prev) => {
      if (prev[id] === count) return prev;
      return { ...prev, [id]: count };
    });
  }, []);

  const handleBottomNav = (id) => {
    if (id === 'home') navigate('/landing');
    else if (id === 'search') navigate('/search');
    else if (id === 'sell') navigate('/create-listing');
    else if (id === 'messages') navigate('/messages');
    else if (id === 'profile') navigate('/profile');
  };

  if (loading) {
    return (
      <div className="loading-skeleton">
        <div className="skeleton-hero" />
        <div className="skeleton-search" />
        <div className="skeleton-grid">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="skeleton-card" />)}
        </div>
        <style jsx>{`
          .loading-skeleton { min-height: 100vh; background: #F7F1E3; padding-bottom: 80px; }
          .skeleton-hero { height: 200px; background: linear-gradient(160deg, #24453B, #16261F); }
          .skeleton-search { height: 52px; margin: -26px 20px 20px; border-radius: 12px; background: #FFFDF8; box-shadow: 0 12px 24px rgba(22,38,31,0.12); }
          .skeleton-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 20px; }
          .skeleton-card { aspect-ratio: 4 / 5; background: #ECE3CC; border-radius: 14px; animation: pulse 1.6s ease-in-out infinite; }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      {/* HERO */}
      <div className="hero-block">
        <div className="hero-texture" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="hero-dot" />
            Mitundu Trading Centre
          </div>
          <h1 className="hero-title">
            Find what you need, <em>right here.</em>
          </h1>
          <p className="hero-desc">Local goods, services, and tradespeople — a step from your door.</p>
        </div>
      </div>

      {/* STICKY SEARCH */}
      <div className="search-sticky">
        <div className="search-sticky-inner">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-wrapper">
              <Icon name="search" size={17} color="#7C9083" strokeWidth={1.75} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search the marketplace…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <Icon name="arrowRight" size={16} color="#F7F1E3" strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SPOTLIGHT */}
      {spotlight.length > 0 && (
        <div className="spotlight-section">
          <div className="spotlight-header">
            <h2 className="spotlight-heading">
              Spotlight
              {spotlightHasPremium && (
                <span className="spotlight-premium-badge">
                  <Icon name="crown" size={10} color="#F0D9A8" strokeWidth={2.2} />
                  Premium
                </span>
              )}
            </h2>
            <span className="spotlight-sub">
              {spotlightHasPremium ? 'Featured sellers' : 'Just arrived'}
            </span>
          </div>
          <div className="spotlight-scroll" ref={spotlightScrollRef}>
            {spotlight.map((item, i) => (
              <div
                key={item.id}
                ref={(el) => { spotlightTileRefs.current[i] = el; }}
                className="spot-tile-wrap"
              >
                <SpotlightTile item={item} onOpen={handleListingClick} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORY PILL BAR */}
      <div className="cats-wrap">
        <div className="cats-bar">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                className={`cat-pill ${active ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.label)}
                style={active ? { background: cat.color, borderColor: cat.color } : {}}
              >
                <Icon name={cat.icon} size={12} color={active ? '#F7F1E3' : cat.color} strokeWidth={2} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS */}
      <div className="tabs-section">
        {[
          { id: 'all', label: 'All' },
          { id: 'goods', label: 'Goods' },
          { id: 'services', label: 'Services' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* FEATURED */}
      {featured && (
        <section className="featured-wrap">
          <FeaturedCard
            item={featured}
            user={user}
            openingChatId={openingChatId}
            likeState={likeStates[featured.id]}
            commentCount={commentCounts[featured.id] || 0}
            onLike={handleLike}
            onOpen={handleListingClick}
            onMessage={handleQuickMessage}
            onOpenComments={handleOpenComments}
          />
        </section>
      )}

      {/* FEED */}
      {hasResults ? (
        <>
          {freshListings.length > 0 && (
            <section className="section">
              <header className="section-head">
                <h2 className="section-title">
                  Fresh this week
                  <span className="section-title-count">{freshListings.length}</span>
                </h2>
                <span className="fresh-live-badge">
                  <BurningFire size={14} />
                  <span className="fresh-live-text">NEW</span>
                </span>
              </header>
              <div className="grid">
                {freshListings.map((item, i) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={i}
                    user={user}
                    openingChatId={openingChatId}
                    likeState={likeStates[item.id]}
                    commentCount={commentCounts[item.id] || 0}
                    onLike={handleLike}
                    onOpen={handleListingClick}
                    onMessage={handleQuickMessage}
                    onOpenComments={handleOpenComments}
                  />
                ))}
              </div>
            </section>
          )}

          {otherListings.length > 0 && (
            <section className="section">
              <header className="section-head">
                <h2 className="section-title">
                  {freshListings.length > 0 ? 'More from Mitundu' : 'All listings'}
                  <span className="section-title-count">{otherListings.length}</span>
                </h2>
                <button className="filter-btn" onClick={() => {}} aria-label="Filter">
                  <Icon name="filter" size={14} color="#3A362E" strokeWidth={1.9} />
                </button>
              </header>
              <div className="grid">
                {otherListings.map((item, i) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    index={i}
                    user={user}
                    openingChatId={openingChatId}
                    likeState={likeStates[item.id]}
                    commentCount={commentCounts[item.id] || 0}
                    onLike={handleLike}
                    onOpen={handleListingClick}
                    onMessage={handleQuickMessage}
                    onOpenComments={handleOpenComments}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <section className="section">
          <div className="empty-state">
            <Icon name="store" size={44} color="#BFA97B" strokeWidth={1.4} />
            <h3 className="empty-title">No listings found</h3>
            <p className="empty-desc">
              {searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters' : 'Be the first to post something!'}
            </p>
          </div>
        </section>
      )}

      {/* BUSINESSES */}
      {featuredBusinesses.length > 0 && (
        <section className="section biz-section">
          <header className="section-head">
            <h2 className="section-title">Businesses near you</h2>
          </header>
          <div className="biz-scroll">
            {featuredBusinesses.map((biz) => (
              <button key={biz.id} className="biz-card" onClick={() => handleBusinessClick(biz)}>
                <div className="biz-logo">
                  {biz.logo_url ? <img src={biz.logo_url} alt={biz.business_name} /> : <Icon name="store" size={16} color="#BFA97B" strokeWidth={1.5} />}
                </div>
                <div className="biz-text">
                  <div className="biz-name">{biz.business_name}</div>
                  {biz.category && <div className="biz-cat">{biz.category}</div>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* COMMENTS POP-UP */}
      {commentsListing && (
        <div className="pop-overlay" onClick={() => setCommentsListing(null)} role="dialog" aria-modal="true">
          <div className="pop" onClick={(e) => e.stopPropagation()}>
            <div className="pop-handle" />
            <div className="pop-preview">
              <div className="pop-thumb">
                {commentsListing.images?.length ? (
                  <img src={commentsListing.images[0]} alt={commentsListing.title} />
                ) : (
                  <div className="pop-thumb-fallback">
                    <Icon name="store" size={18} color="#BFA97B" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="pop-preview-text">
                <div className="pop-preview-title">{commentsListing.title}</div>
                <div className="pop-preview-sub">
                  {commentsListing.businesses?.business_name || 'Local seller'}
                  {commentsListing.location_area ? ` · ${commentsListing.location_area}` : ''}
                </div>
              </div>
              <button className="pop-close" onClick={() => setCommentsListing(null)} aria-label="Close">
                <Icon name="close" size={16} color="#201F1B" strokeWidth={2.2} />
              </button>
            </div>
            <div className="pop-body">
              <CommentSection
                key={commentsListing.id}
                listingId={commentsListing.id}
                onCountChange={handleCommentCountChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
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
                  <Icon name={item.icon} size={19} color={active ? '#F7F1E3' : '#9C9482'} strokeWidth={1.75} />
                </div>
                <span className={`nav-label ${active ? 'active' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Work+Sans:wght@400;500;600;700&display=swap');

        .app {
          min-height: 100vh;
          background: #F7F1E3;
          font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #201F1B;
          padding-bottom: 84px;
        }
        @media (min-width: 769px) { .app { padding-bottom: 0; } }

        /* HERO */
        .hero-block {
          position: relative;
          background: linear-gradient(155deg, #24453B 0%, #16261F 100%);
          padding: 30px 20px 60px;
          overflow: hidden;
        }
        .hero-texture {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(217, 154, 59, 0.15) 1px, transparent 1px);
          background-size: 18px 18px;
          opacity: 0.55;
          mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
          pointer-events: none;
        }
        .hero-inner { position: relative; max-width: 1200px; margin: 0 auto; }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em;
          text-transform: uppercase; color: #D99A3B;
          margin-bottom: 12px;
        }
        .hero-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #D99A3B; box-shadow: 0 0 0 3px rgba(217, 154, 59, 0.18);
        }
        .hero-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 500;
          font-size: clamp(26px, 4.2vw, 40px);
          letter-spacing: -0.02em;
          margin: 0 0 6px; line-height: 1.1;
          color: #F7F1E3;
          max-width: 620px;
        }
        .hero-title em { font-style: italic; font-weight: 500; color: #D99A3B; }
        .hero-desc {
          font-size: 13.5px; line-height: 1.5;
          color: rgba(247, 241, 227, 0.6);
          margin: 0; max-width: 440px;
        }

        /* SEARCH */
        .search-sticky {
          position: sticky;
          top: 64px;
          z-index: 50;
          padding: 0 20px;
          margin-top: -26px;
          padding-bottom: 10px;
          background: linear-gradient(to bottom, #F7F1E3 78%, rgba(247, 241, 227, 0.85));
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .search-sticky-inner { max-width: 1200px; margin: 0 auto; }
        .search-form { max-width: 620px; }
        .search-wrapper {
          display: flex; align-items: center; gap: 10px;
          background: #FFFDF8; border-radius: 13px;
          padding: 5px 5px 5px 16px;
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.04),
            0 16px 34px rgba(22, 38, 31, 0.14),
            0 0 0 1px rgba(239, 230, 206, 0.9);
          transition: box-shadow 0.25s ease;
        }
        .search-wrapper:focus-within {
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.05),
            0 20px 44px rgba(22, 38, 31, 0.18),
            0 0 0 1px rgba(188, 91, 52, 0.5);
        }
        .search-input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 12px 0; font-size: 14px; font-family: inherit; color: #201F1B;
        }
        .search-input::placeholder { color: #9C9482; }
        .search-btn {
          padding: 10px 14px; background: #24453B; border: none;
          border-radius: 9px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .search-btn:hover { background: #BC5B34; transform: translateY(-1px); }

        /* PHOTO SLIDER */
        .pslider {
          position: absolute; inset: 0;
          overflow: hidden;
          background: #F0E9D6;
          touch-action: pan-y;
          user-select: none;
        }
        .pslider-track {
          display: flex;
          height: 100%;
          width: 100%;
          transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
          will-change: transform;
        }
        .pslider-img {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          -webkit-user-drag: none;
          background: #F0E9D6;
          image-rendering: -webkit-optimize-contrast;
        }
        .pslider-empty {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
        }
        .pslider-arrow {
          position: absolute; top: 50%;
          transform: translateY(-50%);
          width: 26px; height: 26px;
          border: none; cursor: pointer;
          border-radius: 999px;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s;
          z-index: 3;
        }
        .pslider:hover .pslider-arrow { opacity: 1; }
        .pslider-arrow:hover { background: rgba(22, 38, 31, 0.78); }
        .pslider-arrow.left { left: 6px; }
        .pslider-arrow.right { right: 6px; }
        @media (hover: none) {
          .pslider-arrow { opacity: 0.7; }
        }
        .pslider-dots {
          position: absolute;
          left: 0; right: 0; bottom: 6px;
          display: flex; justify-content: center; align-items: center;
          gap: 4px;
          z-index: 3;
        }
        .pslider-dot {
          width: 5px; height: 5px;
          border-radius: 999px;
          background: rgba(247, 241, 227, 0.55);
          border: none; padding: 0; cursor: pointer;
          transition: all 0.2s ease;
        }
        .pslider-dot.active {
          width: 14px;
          background: #F7F1E3;
        }
        .pslider-count {
          position: absolute;
          right: 8px; top: 8px;
          padding: 3px 7px;
          border-radius: 6px;
          background: rgba(22, 38, 31, 0.6);
          color: #F7F1E3;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.02em;
          z-index: 3;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        /* LIVE BURNING FIRE */
        .burning-fire {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          vertical-align: middle;
        }
        .burning-fire-svg {
          display: block;
          filter: drop-shadow(0 1px 2px rgba(220, 38, 38, 0.35))
                  drop-shadow(0 0 5px rgba(251, 146, 60, 0.35));
        }
        .flame-outer {
          transform-origin: 50% 90%;
          animation: flameFlickerOuter 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .flame-mid {
          transform-origin: 50% 90%;
          animation: flameFlickerMid 0.95s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .flame-core {
          transform-origin: 50% 90%;
          animation: flameFlickerCore 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .ember {
          transform-origin: center;
          animation: emberRise 2.2s ease-out infinite;
          opacity: 0;
        }
        .ember-1 { animation-delay: 0s;    }
        .ember-2 { animation-delay: 0.6s;  }
        .ember-3 { animation-delay: 1.2s;  }
        @keyframes flameFlickerOuter {
          0%   { transform: scale(1, 1) rotate(0deg); }
          22%  { transform: scale(1.02, 1.07) rotate(-1.2deg); }
          45%  { transform: scale(0.98, 1.03) rotate(0.8deg); }
          70%  { transform: scale(1.03, 1.06) rotate(-0.6deg); }
          100% { transform: scale(1, 1) rotate(0deg); }
        }
        @keyframes flameFlickerMid {
          0%   { transform: scale(1, 1) rotate(0deg); }
          30%  { transform: scale(1.05, 1.12) rotate(-1.8deg); }
          60%  { transform: scale(0.96, 1.05) rotate(1.6deg); }
          100% { transform: scale(1, 1) rotate(0deg); }
        }
        @keyframes flameFlickerCore {
          0%   { transform: scale(1, 1) rotate(0deg); opacity: 1; }
          50%  { transform: scale(1.08, 1.16) rotate(1.4deg); opacity: 0.92; }
          100% { transform: scale(1, 1) rotate(0deg); opacity: 1; }
        }
        @keyframes emberRise {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          15%  { opacity: 1; }
          60%  { transform: translateY(-3px) scale(0.7); opacity: 0.7; }
          100% { transform: translateY(-6px) scale(0.3); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .flame-outer, .flame-mid, .flame-core, .ember { animation: none; }
        }

        .fresh-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px 4px 8px;
          border-radius: 999px;
          background: linear-gradient(135deg, #FFF3E0 0%, #FFE4C4 100%);
          border: 1px solid rgba(234, 88, 12, 0.25);
          box-shadow: 0 1px 3px rgba(234, 88, 12, 0.1);
        }
        .fresh-live-text {
          font-family: 'Work Sans', sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #C2410C;
          text-transform: uppercase;
          line-height: 1;
        }

        /* SPOTLIGHT */
        .spotlight-section {
          max-width: 1200px;
          margin: 6px auto 0;
          padding: 4px 0 4px;
        }
        .spotlight-header {
          display: flex; align-items: baseline; gap: 10px;
          padding: 0 20px;
          margin-bottom: 10px;
        }
        .spotlight-heading {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600; font-size: 16px;
          margin: 0; color: #201F1B;
          letter-spacing: -0.01em;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .spotlight-premium-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 7px; border-radius: 6px;
          background: #24453B;
          color: #F0D9A8;
          font-family: 'Work Sans', sans-serif;
          font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .spotlight-sub {
          font-size: 11px; color: #9C9482;
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-left: auto;
        }
        .spotlight-scroll {
          display: flex; gap: 12px;
          overflow-x: auto; scrollbar-width: none;
          padding: 4px 20px 8px;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }
        .spotlight-scroll::-webkit-scrollbar { display: none; }
        .spot-tile-wrap {
          flex: 0 0 auto;
          scroll-snap-align: start;
        }
        .spot-tile {
          flex: 0 0 auto;
          width: 172px;
          background: transparent;
          border: none; padding: 0;
          text-align: left; cursor: pointer;
          font-family: inherit;
          transition: transform 0.25s ease;
          position: relative;
          display: block;
        }
        .spot-tile:hover { transform: translateY(-2px); }
        .spot-tile.is-premium .spot-media {
          box-shadow:
            0 1px 2px rgba(22, 38, 31, 0.05),
            0 14px 30px rgba(36, 69, 59, 0.18),
            0 0 0 1.5px rgba(217, 154, 59, 0.55);
        }
        .spot-media {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 5.6;
          border-radius: 14px;
          overflow: hidden;
          background: #F0E9D6;
          box-shadow:
            0 1px 2px rgba(22, 38, 31, 0.05),
            0 12px 26px rgba(22, 38, 31, 0.12);
        }
        .spot-media-empty {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .spot-slider {
          position: absolute; inset: 0;
          overflow: hidden;
          background: #F0E9D6;
        }
        .spot-slider-track {
          display: flex;
          height: 100%;
          width: 100%;
          transition: transform 0.55s cubic-bezier(0.25, 0.8, 0.25, 1);
          will-change: transform;
        }
        .spot-slider-img {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          -webkit-user-drag: none;
          image-rendering: -webkit-optimize-contrast;
        }
        .spot-slider-dots {
          position: absolute;
          left: 0; right: 0; bottom: 8px;
          display: flex; justify-content: center; align-items: center;
          gap: 4px;
          z-index: 4;
        }
        .spot-slider-dot {
          width: 5px; height: 5px;
          border-radius: 999px;
          background: rgba(247, 241, 227, 0.55);
          transition: all 0.25s ease;
        }
        .spot-slider-dot.active {
          width: 14px;
          background: #F7F1E3;
        }
        .spot-cat {
          position: absolute; top: 8px; left: 8px;
          font-size: 9px; font-weight: 700;
          color: #F7F1E3;
          padding: 3px 7px; border-radius: 6px;
          letter-spacing: 0.04em;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 5;
        }
        .spot-premium {
          position: absolute; top: 8px; right: 8px;
          width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          background: #F0D9A8;
          box-shadow: 0 2px 6px rgba(22, 38, 31, 0.25);
          z-index: 5;
        }
        .spot-info {
          padding: 10px 2px 0;
          display: flex; flex-direction: column; gap: 3px;
        }
        .spot-title {
          font-size: 12.5px; font-weight: 600;
          color: #201F1B;
          line-height: 1.3;
          overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .spot-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 13px; font-weight: 600;
          color: #24453B;
          letter-spacing: -0.01em;
        }

        /* CATEGORY PILL BAR */
        .cats-wrap {
          max-width: 1200px;
          margin: 14px auto 0;
          padding: 0 20px;
        }
        .cats-bar {
          display: flex; gap: 6px;
          overflow-x: auto; scrollbar-width: none;
          padding: 2px 0 2px;
        }
        .cats-bar::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; border-radius: 999px;
          border: 1.5px solid #EFE6CE;
          background: #FFFDF8;
          font-family: inherit; font-size: 11.5px; font-weight: 600;
          color: #3A362E;
          cursor: pointer; flex-shrink: 0;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .cat-pill:not(.active):hover {
          border-color: #D9C79E;
          background: #FFFDF8;
        }
        .cat-pill.active { color: #F7F1E3; }

        /* TABS */
        .tabs-section {
          display: flex; gap: 22px;
          padding: 14px 20px 0;
          border-bottom: 1px solid #EFE6CE;
          margin: 12px auto 0;
          max-width: 1200px;
        }
        .tab-btn {
          position: relative; padding: 4px 2px 11px;
          border: none; background: transparent;
          font-size: 13px; font-weight: 600; color: #9C9482;
          cursor: pointer; font-family: inherit;
          transition: color 0.15s;
        }
        .tab-btn:hover { color: #3A362E; }
        .tab-btn.active { color: #201F1B; }
        .tab-btn.active::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -1px;
          height: 2px; background: #BC5B34; border-radius: 2px;
        }

        /* FEATURED */
        .featured-wrap {
          max-width: 1200px;
          margin: 16px auto 0;
          padding: 0 20px;
        }
        .fcard { position: relative; }
        .fcard-media {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 18px;
          overflow: hidden;
          background: #F0E9D6;
          box-shadow:
            0 2px 6px rgba(22, 38, 31, 0.06),
            0 22px 44px rgba(22, 38, 31, 0.14);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        @media (min-width: 640px) {
          .fcard-media { aspect-ratio: 16 / 7; }
        }
        .fcard:hover .fcard-media {
          transform: translateY(-3px);
          box-shadow:
            0 4px 8px rgba(22, 38, 31, 0.08),
            0 28px 56px rgba(22, 38, 31, 0.2);
        }
        .fcard-slider { border-radius: 18px; }
        .fcard-top {
          position: absolute; top: 12px; left: 12px; right: 12px;
          display: flex; gap: 6px; align-items: flex-start;
          pointer-events: none;
          z-index: 4;
        }
        .fchip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 8px;
          font-size: 10px; font-weight: 700;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          letter-spacing: 0.05em;
        }
        .fchip-spotlight {
          background: rgba(36, 69, 59, 0.9);
          color: #F0D9A8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .fchip-spotlight.is-premium {
          background: rgba(217, 154, 59, 0.95);
          color: #201F1B;
        }
        .fchip-cat {
          color: #F7F1E3;
          text-transform: none;
          letter-spacing: 0.02em;
          font-weight: 600;
          font-size: 10px;
        }
        .fcard-heart {
          position: absolute;
          top: 12px; right: 12px;
          z-index: 5;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 7px 11px;
          border: none; cursor: pointer;
          border-radius: 999px;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #F7F1E3;
          font-size: 11.5px; font-weight: 600;
          font-family: inherit;
          transition: background 0.2s, transform 0.15s;
        }
        .fcard-heart:hover { background: rgba(22, 38, 31, 0.78); transform: scale(1.04); }
        .fcard-heart.liked {
          background: linear-gradient(135deg, #F97316 0%, #DC2626 100%);
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.35);
        }
        .fcard-glass {
          position: absolute;
          left: 12px; right: 12px; bottom: 12px;
          z-index: 2;
          padding: 13px 15px 12px;
          border-radius: 14px;
          background: rgba(22, 38, 31, 0.55);
          backdrop-filter: blur(16px) saturate(150%);
          -webkit-backdrop-filter: blur(16px) saturate(150%);
          border: 1px solid rgba(247, 241, 227, 0.16);
          color: #F7F1E3;
          display: flex; flex-direction: column; gap: 8px;
        }
        .fcard-glass-row {
          display: flex; align-items: flex-start; gap: 12px;
        }
        .fcard-title {
          flex: 1;
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px; font-weight: 600;
          line-height: 1.2;
          color: #FFFDF8; margin: 0;
          cursor: pointer;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          letter-spacing: -0.01em;
        }
        .fcard-title:hover { color: #F0D9A8; }
        .fcard-price {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 16px; font-weight: 600;
          color: #F0D9A8;
          white-space: nowrap;
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
        }
        .fcard-meta {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px;
          color: rgba(247, 241, 227, 0.8);
          overflow: hidden;
        }
        .fcard-seller {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 160px; font-weight: 500;
        }
        .fcard-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: rgba(247, 241, 227, 0.5); flex-shrink: 0;
        }
        .fcard-loc {
          display: inline-flex; align-items: center; gap: 3px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .fcard-delivery {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 7px; border-radius: 6px;
          background: rgba(247, 241, 227, 0.16);
          font-size: 10px; font-weight: 600;
        }
        .fcard-actions {
          display: flex; align-items: center; gap: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(247, 241, 227, 0.16);
        }
        .fcard-action {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px;
          background: rgba(247, 241, 227, 0.14);
          border: none; cursor: pointer;
          border-radius: 8px;
          font-family: inherit;
          font-size: 11.5px; font-weight: 600;
          color: #F7F1E3;
          transition: background 0.18s, transform 0.15s;
        }
        .fcard-action:hover { background: rgba(247, 241, 227, 0.24); }
        .fcard-msg {
          margin-left: auto;
          background: #F7F1E3; color: #201F1B;
        }
        .fcard-msg:hover { background: #F0D9A8; }
        .fcard-msg:disabled { opacity: 0.6; cursor: not-allowed; }

        /* FEED */
        .section {
          max-width: 1200px;
          margin: 22px auto 0;
          padding: 0 20px;
        }
        .section-head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px;
          gap: 10px;
        }
        .section-title {
          font-family: 'Fraunces', Georgia, serif;
          font-weight: 600; font-size: 17px;
          margin: 0; color: #201F1B;
          letter-spacing: -0.01em;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .section-title-count {
          font-family: 'Work Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #9C9482;
          margin-left: 2px;
        }
        .filter-btn {
          width: 32px; height: 32px; border-radius: 9px;
          border: 1px solid #EFE6CE; background: #FFFDF8;
          cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          transition: border-color 0.2s, transform 0.15s;
        }
        .filter-btn:hover { border-color: #BC5B34; transform: translateY(-1px); }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (min-width: 640px) { .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; } }
        @media (min-width: 1024px) { .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; } }

        /* PRODUCT CARD */
        .pcard {
          display: flex; flex-direction: column;
          background: #FFFDF8;
          border-radius: 14px;
          overflow: hidden;
          box-shadow:
            0 1px 2px rgba(22, 38, 31, 0.04),
            0 0 0 1px rgba(239, 230, 206, 0.85);
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        .pcard:hover {
          transform: translateY(-3px);
          box-shadow:
            0 2px 4px rgba(22, 38, 31, 0.05),
            0 18px 36px rgba(22, 38, 31, 0.1),
            0 0 0 1px rgba(217, 199, 158, 0.9);
        }
        .pcard-media {
          position: relative;
          width: 100%;
          background: #F0E9D6;
          overflow: hidden;
        }
        .pcard-cat {
          position: absolute;
          top: 8px; left: 8px;
          display: inline-flex; align-items: center;
          padding: 3px 7px; border-radius: 6px;
          font-size: 9px; font-weight: 700;
          color: #F7F1E3;
          letter-spacing: 0.04em;
          text-transform: none;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          z-index: 4;
        }
        .pcard-heart {
          position: absolute;
          top: 8px; right: 8px;
          width: 30px; height: 30px;
          border: none; cursor: pointer;
          border-radius: 999px;
          background: rgba(22, 38, 31, 0.5);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
          z-index: 5;
        }
        .pcard-heart:hover { background: rgba(22, 38, 31, 0.72); transform: scale(1.06); }
        .pcard-heart.liked {
          background: linear-gradient(135deg, #F97316 0%, #DC2626 100%);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
          animation: heartPop 0.35s ease;
        }
        @keyframes heartPop {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        .pcard-delivery {
          position: absolute;
          bottom: 8px; left: 8px;
          display: inline-flex; align-items: center; justify-content: center;
          width: 22px; height: 22px;
          border-radius: 6px;
          background: rgba(22, 38, 31, 0.75);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 4;
        }
        .pcard-body {
          padding: 10px 12px 11px;
          display: flex; flex-direction: column; gap: 5px;
        }
        .pcard-price { display: flex; align-items: baseline; }
        .pcard-price-value {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 15.5px; font-weight: 600;
          color: #24453B;
          letter-spacing: -0.015em;
          font-variant-numeric: tabular-nums;
        }
        .pcard-price-muted {
          font-size: 11.5px;
          color: #9C9482;
          font-style: italic;
          font-weight: 500;
        }
        .pcard-title {
          font-size: 13px; font-weight: 600; line-height: 1.32;
          color: #201F1B; margin: 0; cursor: pointer;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
          letter-spacing: -0.005em;
        }
        .pcard-title:hover { color: #24453B; }
        .pcard-meta {
          display: flex; align-items: center; gap: 5px;
          font-size: 10.5px; color: #9C9482;
          overflow: hidden;
          margin-top: 1px;
        }
        .pcard-avatar {
          width: 18px; height: 18px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9.5px; font-weight: 700;
          flex-shrink: 0;
        }
        .pcard-seller {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          max-width: 90px;
          font-weight: 500;
        }
        .pcard-dot {
          width: 3px; height: 3px; border-radius: 50%;
          background: #D9C79E; flex-shrink: 0;
        }
        .pcard-loc {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pcard-actions {
          display: flex; align-items: center; gap: 4px;
          margin-top: 3px; padding-top: 8px;
          border-top: 1px solid #F2EBD9;
        }
        .pcard-icon-btn {
          display: inline-flex; align-items: center; gap: 4px;
          background: none; border: none;
          padding: 5px 7px; border-radius: 8px;
          font-size: 11px; font-weight: 500;
          color: #8A8578; cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, color 0.15s, transform 0.1s;
        }
        .pcard-icon-btn:hover { background: rgba(234, 88, 12, 0.08); color: #201F1B; }
        .pcard-icon-btn:active { transform: scale(0.96); }
        .pcard-icon-btn.liked { color: #EA580C; font-weight: 700; }

        .pcard-msg {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 5px;
          background: #24453B; color: #F7F1E3;
          padding: 5px 10px; border-radius: 8px;
          border: none; cursor: pointer;
          font-family: inherit;
          font-size: 10.5px; font-weight: 600;
          transition: background 0.2s, transform 0.15s;
        }
        .pcard-msg:hover { background: #BC5B34; }
        .pcard-msg:disabled { opacity: 0.55; cursor: not-allowed; }

        /* BUSINESSES */
        .biz-section { padding-bottom: 10px; }
        .biz-scroll {
          display: flex; gap: 10px;
          overflow-x: auto; scrollbar-width: none;
          padding-bottom: 2px;
        }
        .biz-scroll::-webkit-scrollbar { display: none; }
        .biz-card {
          flex: 0 0 auto;
          display: flex; align-items: center; gap: 10px;
          width: 170px; background: #FFFDF8;
          border: 1px solid #EFE6CE; border-radius: 12px;
          padding: 9px 11px; text-align: left;
          cursor: pointer; font-family: inherit;
          transition: border-color 0.2s, transform 0.15s;
        }
        .biz-card:hover { border-color: #D9C79E; transform: translateY(-1px); }
        .biz-logo {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: #F7F1E3; border: 1px solid #EFE6CE;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .biz-logo img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
        .biz-text { min-width: 0; }
        .biz-name {
          font-size: 12px; font-weight: 600; color: #201F1B;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .biz-cat {
          font-size: 10px; color: #9C9482; margin-top: 1px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* COMMENTS POP-UP */
        .pop-overlay {
          position: fixed; inset: 0;
          z-index: 200;
          background: rgba(22, 38, 31, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
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
          box-shadow: 0 -20px 60px rgba(22, 38, 31, 0.3);
          display: flex; flex-direction: column;
          animation: popUp 0.3s cubic-bezier(0.2, 0.9, 0.2, 1);
          overflow: hidden;
        }
        @keyframes popUp {
          from { transform: translateY(40px); opacity: 0.6; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (min-width: 640px) {
          .pop {
            height: auto;
            max-height: 86vh;
            min-height: 70vh;
            margin-bottom: 24px;
            border-radius: 20px;
          }
        }
        .pop-handle {
          width: 42px; height: 4px;
          background: #E4D9BD; border-radius: 4px;
          margin: 8px auto 0; flex-shrink: 0;
        }
        .pop-preview {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px 10px;
          border-bottom: 1px solid #EFE6CE;
          flex-shrink: 0;
        }
        .pop-thumb {
          width: 42px; height: 42px; border-radius: 10px;
          overflow: hidden; background: #F0E9D6;
          flex-shrink: 0; border: 1px solid #EFE6CE;
        }
        .pop-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
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
          border-radius: 8px;
          border: 1px solid #EFE6CE;
          background: #FFFDF8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0;
          transition: background 0.18s, border-color 0.18s;
        }
        .pop-close:hover { background: #F7F1E3; border-color: #D9C79E; }
        .pop-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 12px 14px 18px;
          background: #FFFFFF;
        }
        .pop-body :global(.cs-title) { color: #101010; font-weight: 700; }
        .pop-body :global(.cs-subtitle) { color: #6B6259; }
        .pop-body :global(.cmt-name) { color: #101010; }
        .pop-body :global(.cmt-text) { color: #1F1B15; }
        .pop-body :global(.cmt-time) { color: #6B6259; }
        .pop-body :global(.cmt-act) { color: #5A554C; font-weight: 600; }

        /* EMPTY */
        .empty-state { text-align: center; padding: 56px 20px; }
        .empty-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px; font-weight: 600; color: #201F1B; margin: 12px 0 4px;
        }
        .empty-desc { font-size: 13px; color: #9C9482; margin: 0; }

        /* BOTTOM NAV */
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: rgba(255, 253, 248, 0.97);
          backdrop-filter: blur(14px);
          border-top: 1px solid #EFE6CE;
          display: flex; justify-content: space-around;
          padding: 6px 0 10px; z-index: 100;
        }
        .nav-btn {
          display: flex; flex-direction: column; align-items: center;
          gap: 3px; background: none; border: none;
          cursor: pointer; padding: 4px 8px;
          font-family: inherit; min-width: 44px;
        }
        .nav-icon-wrap {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-icon-wrap.active { background: #24453B; }
        .nav-btn:hover .nav-icon-wrap:not(.active) { background: #F0E9D6; }
        .nav-label { font-size: 9px; font-weight: 500; color: #9C9482; }
        .nav-label.active { color: #201F1B; font-weight: 600; }

        @media (max-width: 480px) {
          .hero-block { padding: 22px 16px 48px; }
          .hero-title { font-size: 22px; }
          .hero-desc { font-size: 12.5px; }
          .search-sticky { padding: 0 16px 10px; }
          .spotlight-header { padding: 0 16px; }
          .spotlight-scroll { padding: 4px 16px 8px; }
          .spot-tile { width: 152px; }
          .cats-wrap { padding: 0 16px; }
          .tabs-section { padding: 12px 16px 0; }
          .featured-wrap { padding: 0 16px; }
          .section { padding: 0 16px; }
          .grid { gap: 10px; }
          .pcard-title { font-size: 12.5px; }
          .pcard-price-value { font-size: 14.5px; }
          .fcard-title { font-size: 15px; }
          .fcard-price { font-size: 14.5px; }
          .fcard-glass { left: 10px; right: 10px; bottom: 10px; padding: 11px 13px 10px; }
          .pslider-arrow { display: none; }
          .fresh-live-text { font-size: 9px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pslider-track, .spot-slider-track { transition: none; }
          .pcard, .pcard-heart, .pcard-icon-btn, .pcard-msg,
          .fcard-media, .fcard-heart, .fcard-action, .fcard-msg,
          .spot-tile, .search-btn, .filter-btn, .biz-card,
          .nav-icon-wrap, .pop, .pop-overlay { transition: none; animation: none; }
          .flame-outer, .flame-mid, .flame-core, .ember { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Landing;