import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, businessAPI, messagesAPI, interactionsAPI, requestsAPI } from '../services/api';
import { useToast } from '../components/ToastContainer';
import CommentSection from '../components/CommentSection';
import RoleChoiceBlock from '../components/RoleChoiceBlock';

// ---------- Icons ----------
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, className = '', fill = 'none' }) => {
  const icons = {
    home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6',
    search: 'M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z',
    plus: 'M12 5v14M5 12h14',
    user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 2.582-8 6h16c0-3.418-3.582-6-8-6z',
    arrowRight: 'M5 12h14M13 5l7 7-7 7',
    store: 'M3 9l1-5h16l1 5M3 9v10a2 2 0 002 2h14a2 2 0 002-2V9M3 9h18M9 21V12h6v9',
    heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
    fire: 'M12 2c1.5 3.5 4 5 4 9a4 4 0 11-8 0c0-4 2.5-5.5 4-9z',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    message: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10a3 3 0 100-6 3 3 0 000 6z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    clock: 'M12 6v6l4 2M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z',
    filter: 'M22 3H2l8 9.46V19l4 2v-11.54L22 3z',
    truck: 'M1 3h13v13H1V3zM14 8h4l4 4v4h-8V8zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
    close: 'M18 6L6 18M6 6l12 12',
    chevronRight: 'M9 18l6-6-6-6',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
    shield: 'M12 3l7 3v6c0 4.5-3.12 8.7-7 10-3.88-1.3-7-5.5-7-10V6l7-3z',
    check: 'M20 6L9 17l-5-5',
  };
  const d = icons[name] || icons.home;
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

const REQUESTS_SPOTLIGHT_LIMIT = 4;
const FALLBACK_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#F8FAFC"/>
  <rect x="30" y="30" width="740" height="540" rx="24" fill="#E2E8F0"/>
  <circle cx="400" cy="260" r="90" fill="#CBD5E1"/>
  <path d="M288 420c28-74 90-110 112-110s84 36 112 110H288Z" fill="#CBD5E1"/>
  <text x="400" y="520" text-anchor="middle" font-size="38" font-family="Arial, sans-serif" fill="#64748B">No image</text>
</svg>
`);

const normalizeListingImages = (listing) => {
  if (!listing || !Array.isArray(listing.images)) return [];
  return listing.images
    .map((img) => (typeof img === 'string' ? img.trim() : ''))
    .filter((img) => img && img !== 'null' && img !== 'undefined' && !img.startsWith('blob:'));
};

const formatPrice = (n) => `MK ${Number(n || 0).toLocaleString()}`;

const SectionTitle = ({ icon, title, subtitle }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#F8FAFC' }}>
          <Icon name={icon} size={14} color="#475569" />
        </span>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>{title}</h2>
      </div>
      {subtitle && <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{subtitle}</div>}
    </div>
  </div>
);

const Landing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  const [allListings, setAllListings] = useState([]);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [requestSpotlight, setRequestSpotlight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [likeStates, setLikeStates] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [activeSpotlightIndex, setActiveSpotlightIndex] = useState(0);
  const [commentsListing, setCommentsListing] = useState(null);
  const [openingChatId, setOpeningChatId] = useState(null);

  const searchInputRef = useRef(null);
  const spotlightScrollRef = useRef(null);
  const spotlightTileRefs = useRef([]);
  const isMobile = windowWidth <= 768;

  const commentsListingIdRef = useRef(null);
  useEffect(() => { commentsListingIdRef.current = commentsListing?.id ?? null; }, [commentsListing?.id]);

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
          listingsAPI.search({ limit: 12, offset: 0 }).catch(() => ({ data: { listings: [] } })),
          businessAPI.getAll({ limit: 12 }).catch(() => ({ data: { businesses: [] } })),
        ]);
        if (!mounted) return;

        let listingsData = (listingsRes.data?.listings || []).map((listing) => ({
          ...listing,
          images: normalizeListingImages(listing),
        }));

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
            delivery_available: !!b.delivery_available,
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
    let mounted = true;
    setRequestsLoading(true);

    (async () => {
      try {
        const res = await requestsAPI.list({
          status: 'open',
          limit: REQUESTS_SPOTLIGHT_LIMIT,
          sort: 'recent',
        });
        const list = res?.data?.requests || [];
        if (mounted) setRequestSpotlight(list.slice(0, REQUESTS_SPOTLIGHT_LIMIT));
      } catch (err) {
        console.error('Error fetching requests:', err);
        if (mounted) setRequestSpotlight([]);
      } finally {
        if (mounted) setRequestsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const cartItems = useMemo(() => {
    const count = allListings.length;
    return count ? `${count} items` : 'No listings yet';
  }, [allListings]);

  useEffect(() => {
    if (!allListings.length) return;

    const ids = allListings
      .map((listing) => listing.id)
      .filter(Boolean);

    if (!ids.length) return;

    const loadCounts = async () => {
      try {
        const [likeRes, commentRes] = await Promise.all([
          interactionsAPI.batchLikeStates(ids).catch(() => ({ data: { counts: {}, userLikes: {} } })),
          interactionsAPI.getCommentCounts(ids).catch(() => ({ data: { counts: {} } })),
        ]);

        setLikeStates((prev) => ({
          ...prev,
          ...(likeRes?.data?.userLikes || {}),
        }));
        setCommentCounts((prev) => ({
          ...prev,
          ...(commentRes?.data?.counts || {}),
        }));
      } catch (err) {
        console.error('Error loading interactions:', err);
      }
    };

    loadCounts();
  }, [allListings]);

  const handleSpotlightScroll = (dir) => {
    if (!requestSpotlight.length) return;
    setActiveSpotlightIndex((prev) => {
      const next = dir === 'next'
        ? (prev + 1) % requestSpotlight.length
        : (prev - 1 + requestSpotlight.length) % requestSpotlight.length;
      const node = spotlightTileRefs.current[next];
      if (node) node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      return next;
    });
  };

  const handleLike = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to like listings', 'warning');
      navigate('/login');
      return;
    }

    const current = !!likeStates[listingId];
    try {
      await interactionsAPI.toggleLike(listingId);
      setLikeStates((prev) => ({ ...prev, [listingId]: !current }));
    } catch (err) {
      console.error('Like failed:', err);
      showToast('Could not update like status', 'error');
    }
  };

  const handleCommentClick = (e, listing) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentsListing(listing);
  };

  const handleMessage = async (e, listing) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to message the seller', 'warning');
      navigate('/login');
      return;
    }
    const sellerUserId = listing?.businesses?.user_id || listing?.businesses?.userId || listing?.businesses?.owner_id || null;
    if (!sellerUserId) {
      showToast('Seller information is unavailable', 'error');
      return;
    }
    if (sellerUserId === user.id) {
      showToast("You can't message yourself", 'warning');
      return;
    }
    if (openingChatId === listing.id) return;
    setOpeningChatId(listing.id);

    try {
      const res = await messagesAPI.createConversation(sellerUserId, listing.id);
      const conversationId = res?.data?.conversation?.id;
      if (!conversationId) throw new Error('Could not open conversation');
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error('Quick message error:', err);
      showToast(err?.response?.data?.error || 'Failed to open chat', 'error');
    } finally {
      setOpeningChatId(null);
    }
  };

  const renderListingCard = (listing) => {
    const primaryImage = normalizeListingImages(listing)[0] || FALLBACK_IMAGE;
    const liked = !!likeStates[listing.id];
    const commentCount = Number(commentCounts[listing.id] || 0);
    const priceLabel = listing.price ? formatPrice(listing.price) : 'Price on request';
    const locationLabel = listing.location_area || listing.location_name || 'Malawi';

    return (
      <div
        key={listing.id}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          transition: 'transform 0.2s ease',
          cursor: 'pointer',
        }}
        onClick={() => navigate(`/listing/${listing.id}`)}
      >
        <div style={{ position: 'relative', height: isMobile ? 180 : 200, background: '#F8FAFC' }}>
          <img
            src={primaryImage}
            alt={listing.title || 'Listing'}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />

          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {listing.category && (
              <span style={{ background: 'rgba(255,255,255,0.96)', color: '#0F172A', borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {listing.category}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => handleLike(e, listing.id)}
            style={{ position: 'absolute', right: 10, bottom: 10, width: 34, height: 34, border: 'none', borderRadius: '50%', background: 'rgba(255,255,255,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(15,23,42,0.12)' }}
            aria-label="Like listing"
          >
            <Icon name="heart" size={16} color={liked ? '#EF4444' : '#64748B'} fill={liked ? '#EF4444' : 'none'} strokeWidth={2} />
          </button>
        </div>

        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8, lineHeight: 1.3, minHeight: 38 }}>{listing.title || 'Untitled listing'}</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: '#10B981' }}>{priceLabel}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748B', fontSize: 12 }}>
              <Icon name="star" size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={1.5} />
              {Number(listing.rating || 4.5).toFixed(1)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, marginBottom: 8 }}>
            <Icon name="mapPin" size={12} color="#64748B" strokeWidth={1.7} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{locationLabel}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <button
              type="button"
              onClick={(e) => handleCommentClick(e, listing)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: 'none', borderRadius: 999, padding: '8px 10px', color: '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Icon name="message" size={12} color="#334155" strokeWidth={1.8} />
              {commentCount}
            </button>

            <button
              type="button"
              onClick={(e) => handleMessage(e, listing)}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#0F172A', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
              disabled={openingChatId === listing.id}
            >
              <Icon name="message" size={12} color="#fff" strokeWidth={1.8} />
              {openingChatId === listing.id ? 'Opening...' : 'Message'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '16px 0 40px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Discover</div>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.6rem', lineHeight: 1.2, color: '#0F172A' }}>Welcome to MsikaAI</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0F172A', color: '#FFFFFF', border: 'none', borderRadius: 999, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Icon name="search" size={15} color="#FFFFFF" strokeWidth={2} />
            Search
          </button>
        </div>

        {requestsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 22px' }}>Loading opportunities...</div>
        ) : requestSpotlight.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <SectionTitle icon="fire" title="Opportunity feed" subtitle={`${requestSpotlight.length} new listings nearby`} />
            <div style={{ position: 'relative' }}>
              <div ref={spotlightScrollRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x proximity' }}>
                {requestSpotlight.map((req, idx) => (
                  <div
                    key={req.id || idx}
                    ref={(el) => { spotlightTileRefs.current[idx] = el; }}
                    style={{ minWidth: isMobile ? 220 : 310, flex: 1, background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 18, padding: 16, scrollSnapAlign: 'start' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.2, color: '#10B981' }}>{req.category || 'Request'}</span>
                      {req.budget_min || req.budget_max ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{req.budget_min ? formatPrice(req.budget_min) : 'Flexible'}</span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{req.title || 'Open request'}</div>
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 10 }}>{req.description || 'Buyers are looking for a local solution near you.'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748B', fontSize: 12 }}>
                      <Icon name="mapPin" size={12} color="#64748B" strokeWidth={1.7} />
                      {req.location_area || req.location_name || 'Malawi'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 26 }}>
          <SectionTitle icon="store" title="Featured businesses" subtitle={`${featuredBusinesses.length} trusted sellers`} />
          {featuredBusinesses.length === 0 ? (
            <div style={{ color: '#64748B', fontSize: 14 }}>No businesses available right now.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              {featuredBusinesses.slice(0, 6).map((business) => (
                <div key={business.id} style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 18, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: '#F1F5F9' }}>
                      {business.logo_url ? (
                        <img src={business.logo_url} alt={business.business_name || 'Business'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 700 }}>{(business.business_name || 'B').slice(0, 1).toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{business.business_name || 'Business'}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{business.category || 'General'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{business.description || 'Local business variety with trusted service and quick replies.'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionTitle icon="home" title="Featured listings" subtitle={cartItems} />
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '20px 0' }}>Loading listings...</div>
          ) : allListings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748B', padding: '20px 0' }}>No listings available yet.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              {allListings.map((listing) => renderListingCard(listing))}
            </div>
          )}
        </div>
      </div>

      {commentsListing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 200 }} onClick={() => setCommentsListing(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '85vh', overflow: 'auto', background: '#fff', borderRadius: 18, boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }}>
            <CommentSection listing={commentsListing} onClose={() => setCommentsListing(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;

