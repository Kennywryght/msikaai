// mobile/src/services/api.js
import axios from 'axios';
import { supabase } from '../lib/supabase';
import cacheService from './cacheService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔍 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// TOKEN HELPERS
// ============================================

async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch (err) {
    console.warn('⚠️ Could not read Supabase session:', err?.message);
  }
  return localStorage.getItem('access_token') || null;
}

async function tryRefreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session?.access_token) return null;
    localStorage.setItem('access_token', data.session.access_token);
    if (data.session.refresh_token) {
      localStorage.setItem('refresh_token', data.session.refresh_token);
    }
    return data.session.access_token;
  } catch (err) {
    console.warn('⚠️ Session refresh failed:', err?.message);
    return null;
  }
}

// ============================================
// RESPONSE NORMALIZERS
// ============================================

const isBlobUrl = (url) =>
  typeof url === 'string' && url.startsWith('blob:');

const normalizeBusiness = (b) => {
  if (!b) return b;
  const phone = b.phone ?? b.phone_number ?? null;
  const whatsapp =
    b.whatsappNumber ?? b.whatsapp_number ?? b.whatsapp ?? phone ?? null;

  return {
    ...b,
    user_id: b.userId ?? b.user_id ?? null,
    business_name: b.businessName ?? b.business_name ?? null,
    logo_url: b.logoUrl ?? b.logo_url ?? null,
    whatsapp_number: whatsapp,
    phone,
    address: b.address ?? null,
    location_text: b.locationText ?? b.location_text ?? null,
    rating: Number(b.rating ?? 0) || 0,
    review_count: b.reviewCount ?? b.review_count ?? 0,
    delivery_available:
      b.deliveryAvailable ?? b.delivery_available ?? false,
    is_premium: b.isPremium ?? b.is_premium ?? false,
    is_featured: b.isFeatured ?? b.is_featured ?? false,
    verified: b.verified ?? false,
  };
};

const normalizeListing = (raw) => {
  if (!raw) return raw;

  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  const images = rawImages.filter((src) => !isBlobUrl(src));

  return {
    ...raw,

    business_id: raw.businessId ?? raw.business_id ?? null,
    sub_category: raw.subCategory ?? raw.sub_category ?? null,
    price_type: raw.priceType ?? raw.price_type ?? null,
    location_area: raw.locationArea ?? raw.location_area ?? null,
    delivery_available:
      raw.deliveryAvailable ?? raw.delivery_available ?? false,
    delivery_fee: raw.deliveryFee ?? raw.delivery_fee ?? null,
    contact_phone: raw.contactPhone ?? raw.contact_phone ?? null,
    view_count: raw.viewCount ?? raw.view_count ?? 0,
    contact_count: raw.contactCount ?? raw.contact_count ?? 0,
    created_at: raw.createdAt ?? raw.created_at ?? null,
    updated_at: raw.updatedAt ?? raw.updated_at ?? null,
    is_premium: raw.isPremium ?? raw.is_premium ?? false,
    is_featured:
      raw.featured ?? raw.isFeatured ?? raw.is_featured ?? false,
    premium_until: raw.premiumUntil ?? raw.premium_until ?? null,

    likes: raw.likes ?? 0,
    liked_by_me: raw.likedByMe ?? raw.liked_by_me ?? false,
    comment_count: raw.commentCount ?? raw.comment_count ?? 0,

    businesses: raw.businesses
      ? normalizeBusiness(raw.businesses)
      : raw.business
      ? normalizeBusiness(raw.business)
      : undefined,

    images,
  };
};

const normalizeComment = (c) => {
  if (!c) return c;
  return {
    ...c,
    listing_id: c.listingId ?? c.listing_id ?? null,
    user_id: c.userId ?? c.user_id ?? null,
    parent_id: c.parentId ?? c.parent_id ?? null,
    created_at: c.createdAt ?? c.created_at ?? null,
    likes: c.likes ?? 0,
    liked_by_me: c.likedByMe ?? c.liked_by_me ?? false,
    users: c.users ?? c.user ?? null,
  };
};

const normalizeMessage = (m) => {
  if (!m) return m;
  return {
    ...m,
    sender_id: m.senderId ?? m.sender_id ?? m.user_id ?? null,
    conversation_id: m.conversationId ?? m.conversation_id ?? null,
    image_url: m.imageUrl ?? m.image_url ?? m.image ?? null,
    audio_url: m.audioUrl ?? m.audio_url ?? m.audio ?? null,
    duration_ms: m.durationMs ?? m.duration_ms ?? null,
    created_at: m.createdAt ?? m.created_at ?? null,
    read_at: m.readAt ?? m.read_at ?? null,
  };
};

const normalizeInteractionCounts = (payload) => {
  if (!payload) return {};
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    out[k] = Number(v) || 0;
  }
  return out;
};

const normalizeTrust = (raw) => {
  if (!raw) return raw;
  return {
    ...raw,
    user_id: raw.userId ?? raw.user_id ?? null,
    trust_score: raw.trustScore ?? raw.trust_score ?? 0,
    escrow_limit: Number(raw.escrowLimit ?? raw.escrow_limit ?? 0) || 0,
    email_verified: raw.emailVerified ?? raw.email_verified ?? false,
    phone_verified: raw.phoneVerified ?? raw.phone_verified ?? false,
    id_verified: raw.idVerified ?? raw.id_verified ?? false,
    business_verified: raw.businessVerified ?? raw.business_verified ?? false,
    tier_name: raw.tierName ?? raw.tier_name ?? null,
    tier_description: raw.tierDescription ?? raw.tier_description ?? null,
    next_tier_requirements:
      raw.nextTierRequirements ?? raw.next_tier_requirements ?? [],
    average_rating: Number(raw.averageRating ?? raw.average_rating ?? 0) || 0,
    total_reviews: raw.totalReviews ?? raw.total_reviews ?? 0,
    listings_count: raw.listingsCount ?? raw.listings_count ?? 0,
    responses_count: raw.responsesCount ?? raw.responses_count ?? 0,
    fulfilled_requests_count:
      raw.fulfilledRequestsCount ?? raw.fulfilled_requests_count ?? 0,
    deliveries_completed_count:
      raw.deliveriesCompletedCount ?? raw.deliveries_completed_count ?? 0,
    last_computed_at: raw.lastComputedAt ?? raw.last_computed_at ?? null,
  };
};

const normalizeRequestAuthor = (author) => {
  if (!author) return null;
  return {
    ...author,
    full_name: author.fullName ?? author.full_name ?? null,
    avatar_url: author.avatarUrl ?? author.avatar_url ?? null,
    location_text: author.locationText ?? author.location_text ?? null,
    trust: author.trust ? normalizeTrust(author.trust) : null,
  };
};

const normalizeRequest = (raw) => {
  if (!raw) return raw;
  return {
    ...raw,
    user_id: raw.userId ?? raw.user_id ?? null,
    location_area: raw.locationArea ?? raw.location_area ?? null,
    location_lat: raw.locationLat ?? raw.location_lat ?? null,
    location_lng: raw.locationLng ?? raw.location_lng ?? null,
    budget_min: raw.budgetMin ?? raw.budget_min ?? null,
    budget_max: raw.budgetMax ?? raw.budget_max ?? null,
    responses_count: raw.responsesCount ?? raw.responses_count ?? 0,
    view_count: raw.viewCount ?? raw.view_count ?? 0,
    expires_at: raw.expiresAt ?? raw.expires_at ?? null,
    fulfilled_at: raw.fulfilledAt ?? raw.fulfilled_at ?? null,
    cancelled_at: raw.cancelledAt ?? raw.cancelled_at ?? null,
    created_at: raw.createdAt ?? raw.created_at ?? null,
    updated_at: raw.updatedAt ?? raw.updated_at ?? null,
    is_mine: raw.isMine ?? raw.is_mine ?? false,
    can_respond: raw.canRespond ?? raw.can_respond ?? false,
    effective_status: raw.effectiveStatus ?? raw.effective_status ?? raw.status,
    author: normalizeRequestAuthor(raw.author),
    responses: Array.isArray(raw.responses)
      ? raw.responses.map(normalizeResponse)
      : undefined,
  };
};

const normalizeResponse = (raw) => {
  if (!raw) return raw;
  return {
    ...raw,
    request_id: raw.requestId ?? raw.request_id ?? null,
    responder_id: raw.responderId ?? raw.responder_id ?? null,
    offered_price: raw.offeredPrice ?? raw.offered_price ?? null,
    conversation_id: raw.conversationId ?? raw.conversation_id ?? null,
    accepted_at: raw.acceptedAt ?? raw.accepted_at ?? null,
    rejected_at: raw.rejectedAt ?? raw.rejected_at ?? null,
    withdrawn_at: raw.withdrawnAt ?? raw.withdrawn_at ?? null,
    created_at: raw.createdAt ?? raw.created_at ?? null,
    updated_at: raw.updatedAt ?? raw.updated_at ?? null,
    is_mine: raw.isMine ?? raw.is_mine ?? false,
    is_accepted: raw.isAccepted ?? raw.is_accepted ?? false,
    responder: normalizeRequestAuthor(raw.responder),
  };
};

const normalizeDeliveryParty = (party) => {
  if (!party) return null;
  return {
    ...party,
    full_name: party.fullName ?? party.full_name ?? null,
    avatar_url: party.avatarUrl ?? party.avatar_url ?? null,
    location_text: party.locationText ?? party.location_text ?? null,
    trust: party.trust ? normalizeTrust(party.trust) : null,
  };
};

const normalizeDelivery = (raw) => {
  if (!raw) return raw;
  return {
    ...raw,

    poster_id: raw.posterId ?? raw.poster_id ?? null,
    courier_id: raw.courierId ?? raw.courier_id ?? null,
    request_id: raw.requestId ?? raw.request_id ?? null,
    conversation_id: raw.conversationId ?? raw.conversation_id ?? null,

    package_size: raw.packageSize ?? raw.package_size ?? 'medium',

    pickup_location: raw.pickupLocation ?? raw.pickup_location ?? null,
    pickup_lat: raw.pickupLat ?? raw.pickup_lat ?? null,
    pickup_lng: raw.pickupLng ?? raw.pickup_lng ?? null,
    pickup_contact_name:
      raw.pickupContactName ?? raw.pickup_contact_name ?? null,
    pickup_contact_phone:
      raw.pickupContactPhone ?? raw.pickup_contact_phone ?? null,

    dropoff_location: raw.dropoffLocation ?? raw.dropoff_location ?? null,
    dropoff_lat: raw.dropoffLat ?? raw.dropoff_lat ?? null,
    dropoff_lng: raw.dropoffLng ?? raw.dropoff_lng ?? null,
    dropoff_contact_name:
      raw.dropoffContactName ?? raw.dropoff_contact_name ?? null,
    dropoff_contact_phone:
      raw.dropoffContactPhone ?? raw.dropoff_contact_phone ?? null,

    courier_fee: raw.courierFee ?? raw.courier_fee ?? null,

    expires_at: raw.expiresAt ?? raw.expires_at ?? null,
    accepted_at: raw.acceptedAt ?? raw.accepted_at ?? null,
    picked_up_at: raw.pickedUpAt ?? raw.picked_up_at ?? null,
    delivered_at: raw.deliveredAt ?? raw.delivered_at ?? null,
    confirmed_at: raw.confirmedAt ?? raw.confirmed_at ?? null,
    cancelled_at: raw.cancelledAt ?? raw.cancelled_at ?? null,
    cancel_reason: raw.cancelReason ?? raw.cancel_reason ?? null,

    created_at: raw.createdAt ?? raw.created_at ?? null,
    updated_at: raw.updatedAt ?? raw.updated_at ?? null,

    effective_status: raw.effectiveStatus ?? raw.effective_status ?? raw.status,
    is_mine: raw.isMine ?? raw.is_mine ?? false,
    is_mine_as_courier:
      raw.isMineAsCourier ?? raw.is_mine_as_courier ?? false,
    can_accept: raw.canAccept ?? raw.can_accept ?? false,
    can_confirm: raw.canConfirm ?? raw.can_confirm ?? false,
    can_cancel: raw.canCancel ?? raw.can_cancel ?? false,
    can_pickup: raw.canPickup ?? raw.can_pickup ?? false,
    can_deliver: raw.canDeliver ?? raw.can_deliver ?? false,

    poster: normalizeDeliveryParty(raw.poster),
    courier: normalizeDeliveryParty(raw.courier),
  };
};

// ============================================
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.method === 'get' && config.cache !== false) {
      const cacheKey = `${config.url}${config.params ? JSON.stringify(config.params) : ''}`;
      const cachedData = cacheService.get(cacheKey);

      if (cachedData) {
        console.log(`📦 Cache hit for: ${config.url}`);
        return Promise.reject({
          __cached: true,
          data: cachedData,
          config,
        });
      }

      config._cacheKey = cacheKey;
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`
    );

    if (response.config.method === 'get' && response.config._cacheKey) {
      const cacheTTL = response.config.cacheTTL || 5 * 60 * 1000;
      cacheService.set(response.config._cacheKey, response.data, cacheTTL);
    }

    return response;
  },
  async (error) => {
    if (error.__cached) {
      return Promise.resolve({
        data: error.data,
        __cached: true,
        config: error.config,
      });
    }

    const originalRequest = error.config || {};
    const method = originalRequest.method?.toUpperCase() ?? 'GET';
    const url = originalRequest.url ?? '(unknown)';

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.warn(`🔐 401 on ${method} ${url} — attempting session refresh…`);

      const newToken = await tryRefreshSession();

      if (newToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        console.log(`🔁 Retrying ${method} ${url} with refreshed token`);
        return api(originalRequest);
      }

      console.error(`❌ Session refresh failed — signing out`);
      try {
        await supabase.auth.signOut();
      } catch {}
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      if (typeof window !== 'undefined') {
        const here = window.location.pathname + window.location.search;
        if (!here.startsWith('/login')) {
          window.location.href = `/login?from=${encodeURIComponent(here)}`;
        }
      }

      return Promise.reject(error);
    }

    if (error.response) {
      console.error(`❌ ${method} ${url} → HTTP ${error.response.status}`);
    } else if (error.request) {
      console.warn(`🌐 ${method} ${url} → no response (network/CORS/backend down)`);
    } else {
      console.error(`❌ ${method} ${url} → request setup error:`, error.message);
    }

    return Promise.reject(error);
  }
);

// ============================================
// CACHE UTILITIES
// ============================================
export const clearCache = () => cacheService.clear();
export const invalidateCache = (pattern) => {
  const keys = cacheService.keys();
  const toRemove = keys.filter((key) => key.includes(pattern));
  toRemove.forEach((key) => cacheService.delete(key));
  return toRemove.length;
};
export const getCacheStats = () => cacheService.getInfo();
export const getCacheKeys = () => cacheService.keys();

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  signup: (data) => api.post('/auth/signup-email', data),
  login: (data) => api.post('/auth/login-email', data),
  sendOTP: (data) => api.post('/auth/send-otp', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/signout'),
};

// ============================================
// BUSINESS API
// ============================================
export const businessAPI = {
  create: (data) => api.post('/business/create', data),
  getByUser: (userId) =>
    api.get(`/business/user/${userId}`, { cacheTTL: 10 * 60 * 1000 }),
  getById: (id) =>
    api.get(`/business/${id}`, { cacheTTL: 10 * 60 * 1000 }),
  update: (id, data) => api.put(`/business/${id}`, data),
  getAll: (params) =>
    api.get('/business', { params, cacheTTL: 5 * 60 * 1000 }),
  delete: (id) => api.delete(`/business/${id}`),
};

// ============================================
// LISTINGS API
// ============================================
export const listingsAPI = {
  create: (data) => api.post('/listings/create', data),

  getByBusiness: async (businessId, params) => {
    const res = await api.get(`/listings/business/${businessId}`, {
      params,
      cacheTTL: 5 * 60 * 1000,
    });
    if (Array.isArray(res?.data?.listings)) {
      return {
        ...res,
        data: {
          ...res.data,
          listings: res.data.listings.map(normalizeListing),
        },
      };
    }
    return res;
  },

  getById: async (id) => {
    const res = await api.get(`/listings/${id}`, { cacheTTL: 10 * 60 * 1000 });

    if (res?.data?.listing) {
      return {
        ...res,
        data: {
          ...res.data,
          listing: normalizeListing(res.data.listing),
        },
      };
    }

    if (res?.data?.id) {
      return {
        ...res,
        data: { listing: normalizeListing(res.data) },
      };
    }

    return res;
  },

  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),

  search: async (params) => {
    const res = await api.get('/listings/search', {
      params,
      cacheTTL: 3 * 60 * 1000,
    });
    if (Array.isArray(res?.data?.listings)) {
      return {
        ...res,
        data: {
          ...res.data,
          listings: res.data.listings.map(normalizeListing),
        },
      };
    }
    return res;
  },

  like: (id) => api.post(`/listings/${id}/like`, {}, { cache: false }),
  unlike: (id) => api.delete(`/listings/${id}/like`, { cache: false }),
  getLikes: (id, params) =>
    api.get(`/listings/${id}/likes`, { params, cacheTTL: 60 * 1000 }),

  getComments: async (id, params) => {
    const res = await api.get(`/listings/${id}/comments`, {
      params,
      cache: false,
    });
    const raw = res?.data?.comments || res?.data || [];
    if (Array.isArray(raw)) {
      return {
        ...res,
        data: { comments: raw.map(normalizeComment) },
      };
    }
    return res;
  },
  addComment: async (id, content, parentId = null) => {
    const res = await api.post(
      `/listings/${id}/comments`,
      { content, parent_id: parentId },
      { cache: false }
    );
    const saved = res?.data?.comment || res?.data;
    if (saved) {
      return { ...res, data: { comment: normalizeComment(saved) } };
    }
    return res;
  },
  updateComment: (id, commentId, content) =>
    api.put(`/listings/${id}/comments/${commentId}`, { content }, { cache: false }),
  deleteComment: (id, commentId) =>
    api.delete(`/listings/${id}/comments/${commentId}`, { cache: false }),

  boost: (id, opts = {}) =>
    api.post(
      `/listings/${id}/boost`,
      {
        duration_days: opts.durationDays ?? 7,
        payment_ref: opts.paymentRef ?? null,
      },
      { cache: false }
    ),
  unboost: (id) =>
    api.delete(`/listings/${id}/boost`, { cache: false }),
  getBoostStatus: (id) =>
    api.get(`/listings/${id}/boost`, { cache: false }),
};

// ============================================
// INTERACTIONS API
// ============================================
export const interactionsAPI = {
  toggleLike: async (listingId) => {
    const res = await api.post(
      `/interactions/likes/${listingId}`,
      {},
      { cache: false }
    );
    const data = res?.data || {};
    return {
      ...res,
      data: {
        ...data,
        liked: !!data.liked,
        count: Number(data.count || 0),
      },
    };
  },

  batchLikeStates: async (listingIds) => {
    const res = await api.post(
      '/interactions/likes/batch',
      { listingIds },
      { cache: false }
    );
    const data = res?.data || {};
    return {
      ...res,
      data: {
        ...data,
        counts: normalizeInteractionCounts(data.counts),
        userLikes: data.userLikes || {},
      },
    };
  },

  getCommentCounts: async (listingIds) => {
    const res = await api.post(
      '/interactions/comments/counts',
      { listingIds },
      { cache: false }
    );
    const data = res?.data || {};
    return {
      ...res,
      data: {
        ...data,
        counts: normalizeInteractionCounts(data.counts),
      },
    };
  },

  getComments: async (listingId, params) => {
    const res = await api.get(`/interactions/comments/${listingId}`, {
      params,
      cache: false,
    });
    const raw = res?.data?.comments || [];
    return {
      ...res,
      data: {
        ...res.data,
        comments: Array.isArray(raw) ? raw.map(normalizeComment) : [],
        total: Number(res?.data?.total || raw.length || 0),
      },
    };
  },

  createComment: async (listingId, text) => {
    const res = await api.post(
      `/interactions/comments/${listingId}`,
      { text },
      { cache: false }
    );
    const saved = res?.data?.comment;
    if (saved) {
      return { ...res, data: { ...res.data, comment: normalizeComment(saved) } };
    }
    return res;
  },

  deleteComment: (commentId) =>
    api.delete(`/interactions/comments/${commentId}`, { cache: false }),
};

// ============================================
// COMMENTS API
// ============================================
export const commentsAPI = {
  getById: (commentId) =>
    api.get(`/comments/${commentId}`, { cache: false }),
  like: (commentId) =>
    api.post(`/comments/${commentId}/like`, {}, { cache: false }),
  unlike: (commentId) =>
    api.delete(`/comments/${commentId}/like`, { cache: false }),
  getReplies: (commentId, params) =>
    api.get(`/comments/${commentId}/replies`, { params, cache: false }),
  report: (commentId, data) =>
    api.post(`/comments/${commentId}/report`, data),
};

// ============================================
// MESSAGES API
// ============================================
export const messagesAPI = {
  getConversations: (params) =>
    api.get('/messages/conversations', { params, cacheTTL: 20 * 1000 }),

  getConversation: async (conversationId, params) => {
    const res = await api.get(`/messages/conversations/${conversationId}`, {
      params,
      cache: false,
    });
    if (Array.isArray(res?.data?.messages)) {
      return {
        ...res,
        data: {
          ...res.data,
          messages: res.data.messages.map(normalizeMessage),
        },
      };
    }
    return res;
  },

  createConversation: (otherUserId, listingId = null) =>
    api.post('/messages/conversations', { otherUserId, listingId }),

  sendMessage: async (conversationId, content) => {
    const res = await api.post(
      `/messages/conversations/${conversationId}`,
      content,
      { cache: false }
    );
    if (res?.data?.message) {
      return {
        ...res,
        data: {
          ...res.data,
          message: normalizeMessage(res.data.message),
        },
      };
    }
    return res;
  },

  markConversationRead: (conversationId) =>
    api.put(
      `/messages/conversations/${conversationId}/read`,
      {},
      { cache: false }
    ),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('/messages/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      cache: false,
      timeout: 60 * 1000,
    });
  },

  uploadAudio: (file) => {
    const formData = new FormData();
    formData.append('audio', file);

    return api.post('/messages/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      cache: false,
      timeout: 120 * 1000,
    });
  },
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  getPlans: () => api.get('/payment/plans', { cacheTTL: 60 * 60 * 1000 }),
  initiatePayment: (data) => api.post('/payment/initiate', data),
  verifyPayment: (paymentId) =>
    api.post('/payment/verify', { paymentId }),
  getSubscription: (userId) =>
    api.get(`/payment/subscription/${userId}`, { cacheTTL: 5 * 60 * 1000 }),
  upgradeSubscription: (data) => api.post('/payment/upgrade', data),
  canCreateListing: (userId) =>
    api.get(`/payment/can-create-listing/${userId}`, {
      cacheTTL: 2 * 60 * 1000,
    }),

  getBoostPricing: () =>
    api.get('/payment/boost-pricing', { cacheTTL: 60 * 60 * 1000 }),
};

// ============================================
// REVIEWS API
// ============================================
export const reviewsAPI = {
  create: (data) => api.post('/reviews/create', data),
  getByBusiness: (businessId) =>
    api.get(`/reviews/business/${businessId}`, { cacheTTL: 5 * 60 * 1000 }),
  getByListing: (listingId) =>
    api.get(`/reviews/listing/${listingId}`, { cacheTTL: 5 * 60 * 1000 }),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

// ============================================
// AI API
// ============================================
export const aiAPI = {
  search: (data) => api.post('/ai/search', data),

  getSuggestions: (q) =>
    api.get('/ai/suggestions', { params: { q }, cacheTTL: 2 * 60 * 1000 }),

  // ★ PHASE 7A
  translateSearch: async (query, opts = {}) => {
    const q = String(query || '').trim();
    if (!q) {
      return {
        data: {
          success: true,
          original: '',
          translated: '',
          detectedLanguage: 'unknown',
          confidence: 0,
          keywords: [],
        },
      };
    }

    try {
      const res = await api.post(
        '/ai/translate-search',
        { q },
        { cache: false, timeout: opts.timeout || 8000 }
      );
      return res;
    } catch (err) {
      console.warn('⚠️ translateSearch failed, using raw query:', err?.message || err);
      return {
        data: {
          success: true,
          original: q,
          translated: q,
          detectedLanguage: 'unknown',
          confidence: 0,
          keywords: [q],
          fallback: true,
        },
      };
    }
  },

  // ★ PHASE 7B
  priceSuggest: async ({ title, category } = {}, opts = {}) => {
    const cleanTitle = String(title || '').trim();
    if (cleanTitle.length < 3) {
      return {
        data: {
          success: true,
          suggestion: {
            hasSuggestion: false,
            reason: 'invalid_input',
            message: 'Title is too short.',
          },
        },
      };
    }

    try {
      const res = await api.post(
        '/ai/price-suggest',
        { title: cleanTitle, category: category || null },
        { cache: false, timeout: opts.timeout || 8000 }
      );
      return res;
    } catch (err) {
      console.warn('⚠️ priceSuggest failed:', err?.message || err);
      return {
        data: {
          success: true,
          suggestion: {
            hasSuggestion: false,
            reason: 'network_error',
            message: 'Could not analyze pricing right now.',
          },
        },
      };
    }
  },

  // ★ PHASE 7C: Listing Quality Score
  // input: { listingId } OR { title, description, category, price, images, ... }
  // Returns: { success, quality: { score, grade, breakdown, tips } }
  // Never throws — always resolves.
  qualityScore: async (input = {}, opts = {}) => {
    const hasId = !!input?.listingId;
    const title = String(input?.title || '').trim();

    if (!hasId && title.length < 3) {
      return {
        data: {
          success: true,
          quality: {
            score: 0,
            grade: 'poor',
            breakdown: {},
            tips: [],
            reason: 'invalid_input',
          },
        },
      };
    }

    try {
      const res = await api.post(
        '/ai/quality-score',
        {
          listingId: input.listingId || undefined,
          title: input.title || undefined,
          description: input.description || undefined,
          category: input.category || undefined,
          subCategory: input.subCategory || input.sub_category || undefined,
          price: input.price,
          quantity: input.quantity,
          unit: input.unit || undefined,
          images: Array.isArray(input.images) ? input.images : undefined,
          locationArea: input.locationArea || input.location_area || undefined,
          deliveryAvailable:
            input.deliveryAvailable ?? input.delivery_available ?? undefined,
          contactPhone: input.contactPhone || input.contact_phone || undefined,
        },
        { cache: false, timeout: opts.timeout || 8000 }
      );
      return res;
    } catch (err) {
      console.warn('⚠️ qualityScore failed:', err?.message || err);
      return {
        data: {
          success: true,
          quality: {
            score: 0,
            grade: 'poor',
            breakdown: {},
            tips: [],
            reason: 'network_error',
          },
        },
      };
    }
  },

  // ★ PHASE 7D: Sales Assistant
  // input: { buyerMessage, listing?, history?, tone? }
  // Returns: { success, assist: { draft, alternatives, tone } }
  // Never throws.
  salesAssist: async (input = {}, opts = {}) => {
    const buyerMessage = String(input?.buyerMessage || '').trim();
    if (!buyerMessage) {
      return {
        data: {
          success: true,
          assist: {
            draft: '',
            alternatives: [],
            tone: input.tone || 'friendly',
            reason: 'invalid_input',
          },
        },
      };
    }

    try {
      const res = await api.post(
        '/ai/sales-assist',
        {
          buyerMessage,
          listing: input.listing || {},
          history: Array.isArray(input.history) ? input.history : [],
          tone: input.tone || 'friendly',
        },
        { cache: false, timeout: opts.timeout || 8000 }
      );
      return res;
    } catch (err) {
      console.warn('⚠️ salesAssist failed:', err?.message || err);
      return {
        data: {
          success: true,
          assist: {
            draft: 'Thanks for your message! I will get back to you shortly.',
            alternatives: [],
            tone: input.tone || 'friendly',
            reason: 'network_error',
          },
        },
      };
    }
  },
};

// ============================================
// VOICE API
// ============================================
export const voiceAPI = {
  processVoice: (formData) =>
    api.post('/ai/voice/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createListing: (formData) =>
    api.post('/ai/voice/create-listing', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPrompts: (language) =>
    api.get('/ai/voice/prompts', {
      params: { language },
      cacheTTL: 60 * 60 * 1000,
    }),
};

// ============================================
// AD GENERATOR API
// ============================================
export const adAPI = {
  generate: (formData) =>
    api.post('/ai/ads/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  batchGenerate: (data) => api.post('/ai/ads/batch-generate', data),
};

// ============================================
// LOCATION API
// ============================================
export const locationAPI = {
  nearby: (params) =>
    api.get('/location/nearby', { params, cacheTTL: 10 * 60 * 1000 }),
  update: (data) => api.post('/location/update', data),
};

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
  getByUser: (userId) =>
    api.get(`/profile/user/${userId}`, { cacheTTL: 10 * 60 * 1000 }),
  update: (data) => api.put('/profile/update', data),
  updateBusiness: (data) => api.put('/profile/business/update', data),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  trackView: (data) => api.post('/analytics/view', data),
  trackContact: (data) => api.post('/analytics/contact', data),

  trackUserActivity: (userId, action, metadata = {}) => {
    if (!userId) return Promise.resolve({ data: { ok: true } });
    return api.post('/analytics/user-activity', {
      userId,
      action,
      metadata,
    });
  },

  getListingStats: (id) =>
    api.get(`/analytics/listing/${id}`, { cacheTTL: 5 * 60 * 1000 }),
  getBusinessAnalytics: (businessId, params) =>
    api.get(`/analytics/business/${businessId}`, {
      params,
      cacheTTL: 5 * 60 * 1000,
    }),
  getPopularListings: (params) =>
    api.get('/analytics/popular', { params, cacheTTL: 5 * 60 * 1000 }),
  getUserActivity: (userId, params) =>
    api.get(`/analytics/user/${userId}`, {
      params,
      cacheTTL: 5 * 60 * 1000,
    }),
};

// ============================================
// EXPORT API
// ============================================
export const exportAPI = {
  exportListingsCSV: (businessId, params) =>
    api.get(`/export/listings/${businessId}/csv`, { params }),
  exportBusinessJSON: (businessId) =>
    api.get(`/export/business/${businessId}/json`),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getNotifications: (userId, params) =>
    api.get(`/notifications/user/${userId}`, {
      params,
      cacheTTL: 2 * 60 * 1000,
    }),
  markAsRead: (id, userId) =>
    api.put(`/notifications/${id}/read`, { userId }),
  markAllAsRead: (userId) =>
    api.put('/notifications/all/read', { userId }),
  deleteNotification: (id, userId) =>
    api.delete(`/notifications/${id}`, { data: { userId } }),
  create: (data) => api.post('/notifications/create', data),

  getPushPublicKey: () =>
    api.get('/notifications/push/public-key', { cacheTTL: 60 * 60 * 1000 }),

  subscribePush: (subscription) =>
    api.post('/notifications/push/subscribe', { subscription }),

  unsubscribePush: (endpoint) =>
    api.post('/notifications/push/unsubscribe', { endpoint }),

  testPush: () => api.post('/notifications/push/test'),
};

// ============================================
// MATCHING API
// ============================================
export const matchingAPI = {
  postNeed: (data) => api.post('/matching/needs', data),
  getBusinessNeeds: (businessId, params) =>
    api.get(`/matching/business-needs/${businessId}`, {
      params,
      cacheTTL: 5 * 60 * 1000,
    }),
  getNeeds: (params) =>
    api.get('/matching/needs', { params, cacheTTL: 5 * 60 * 1000 }),
  closeNeed: (id, userId) =>
    api.put(`/matching/needs/${id}/close`, { userId }),
};

// ============================================
// TRUST API
// ============================================
export const trustAPI = {
  getMe: async () => {
    const res = await api.get('/trust/me', { cache: false });
    if (res?.data?.trust) {
      return {
        ...res,
        data: { ...res.data, trust: normalizeTrust(res.data.trust) },
      };
    }
    return res;
  },

  getUser: async (userId) => {
    const res = await api.get(`/trust/${userId}`, {
      cacheTTL: 5 * 60 * 1000,
    });
    if (res?.data?.trust) {
      return {
        ...res,
        data: { ...res.data, trust: normalizeTrust(res.data.trust) },
      };
    }
    return res;
  },

  recompute: async () => {
    const res = await api.post('/trust/recompute', {}, { cache: false });
    if (res?.data?.trust) {
      return {
        ...res,
        data: { ...res.data, trust: normalizeTrust(res.data.trust) },
      };
    }
    return res;
  },

  submitPhone: (phone) =>
    api.post('/trust/verify-phone', { phone }, { cache: false }),
  confirmPhone: (requestId, otp) =>
    api.post('/trust/verify-phone/confirm', { requestId, otp }, { cache: false }),

  submitEmail: (email) =>
    api.post('/trust/verify-email', { email }, { cache: false }),

  submitId: ({ idType, idNumber, documentUrl }) =>
    api.post(
      '/trust/verify-id',
      { idType, idNumber, documentUrl },
      { cache: false }
    ),

  submitBusiness: ({ businessName, registrationNumber, documentUrl }) =>
    api.post(
      '/trust/verify-business',
      { businessName, registrationNumber, documentUrl },
      { cache: false }
    ),

  uploadDocument: (file, onProgress) => {
    const formData = new FormData();
    formData.append('document', file);

    return api.post('/trust/verify-documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      cache: false,
      timeout: 90 * 1000,
      onUploadProgress: onProgress
        ? (evt) => {
            if (evt.total) {
              onProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          }
        : undefined,
    });
  },

  getMyVerifications: () =>
    api.get('/trust/verifications/mine', { cache: false }),

  getPendingVerifications: () =>
    api.get('/trust/verifications/pending', { cache: false }),

  approveVerification: (id) =>
    api.post(`/trust/verifications/${id}/approve`, {}, { cache: false }),

  rejectVerification: (id, reason) =>
    api.post(
      `/trust/verifications/${id}/reject`,
      { reason },
      { cache: false }
    ),
};

// ============================================
// REQUESTS API
// ============================================
export const requestsAPI = {
  create: async (data) => {
    const res = await api.post('/requests', data, { cache: false });
    if (res?.data?.request) {
      return {
        ...res,
        data: { ...res.data, request: normalizeRequest(res.data.request) },
      };
    }
    return res;
  },

  list: async (params = {}) => {
    const res = await api.get('/requests', {
      params,
      cacheTTL: 30 * 1000,
    });
    if (Array.isArray(res?.data?.requests)) {
      return {
        ...res,
        data: {
          ...res.data,
          requests: res.data.requests.map(normalizeRequest),
        },
      };
    }
    return res;
  },

  mine: async (params = {}) => {
    const res = await api.get('/requests/mine', {
      params,
      cache: false,
    });
    if (Array.isArray(res?.data?.requests)) {
      return {
        ...res,
        data: {
          ...res.data,
          requests: res.data.requests.map(normalizeRequest),
        },
      };
    }
    return res;
  },

  get: async (id) => {
    const res = await api.get(`/requests/${id}`, { cache: false });
    if (res?.data?.request) {
      return {
        ...res,
        data: { ...res.data, request: normalizeRequest(res.data.request) },
      };
    }
    return res;
  },

  respond: async (id, { message, offeredPrice }) => {
    const res = await api.post(
      `/requests/${id}/respond`,
      { message, offeredPrice },
      { cache: false }
    );
    if (res?.data?.response) {
      return {
        ...res,
        data: { ...res.data, response: normalizeResponse(res.data.response) },
      };
    }
    return res;
  },

  withdraw: (id, responseId) =>
    api.delete(`/requests/${id}/responses/${responseId}`, { cache: false }),

  accept: async (id, responseId) => {
    const res = await api.post(
      `/requests/${id}/responses/${responseId}/accept`,
      {},
      { cache: false }
    );
    if (res?.data?.response) {
      return {
        ...res,
        data: { ...res.data, response: normalizeResponse(res.data.response) },
      };
    }
    return res;
  },

  fulfill: (id) =>
    api.post(`/requests/${id}/fulfill`, {}, { cache: false }),

  remove: (id) => api.delete(`/requests/${id}`, { cache: false }),
};

// ============================================
// DELIVERIES API
// ============================================
export const deliveriesAPI = {
  create: async (data) => {
    const res = await api.post('/deliveries', data, { cache: false });
    if (res?.data?.delivery) {
      return {
        ...res,
        data: { ...res.data, delivery: normalizeDelivery(res.data.delivery) },
      };
    }
    return res;
  },

  list: async (params = {}) => {
    const res = await api.get('/deliveries', {
      params,
      cacheTTL: 30 * 1000,
    });
    if (Array.isArray(res?.data?.deliveries)) {
      return {
        ...res,
        data: {
          ...res.data,
          deliveries: res.data.deliveries.map(normalizeDelivery),
        },
      };
    }
    return res;
  },

  mine: async (params = {}) => {
    const res = await api.get('/deliveries/mine', {
      params,
      cache: false,
    });
    if (Array.isArray(res?.data?.deliveries)) {
      return {
        ...res,
        data: {
          ...res.data,
          deliveries: res.data.deliveries.map(normalizeDelivery),
        },
      };
    }
    return res;
  },

  active: async (params = {}) => {
    const res = await api.get('/deliveries/active', {
      params,
      cache: false,
    });
    if (Array.isArray(res?.data?.deliveries)) {
      return {
        ...res,
        data: {
          ...res.data,
          deliveries: res.data.deliveries.map(normalizeDelivery),
        },
      };
    }
    return res;
  },

  earnings: async () => {
    const res = await api.get('/deliveries/earnings', { cache: false });
    const data = res?.data || {};
    if (Array.isArray(data.recent)) {
      return {
        ...res,
        data: {
          ...data,
          recent: data.recent.map(normalizeDelivery),
        },
      };
    }
    return res;
  },

  get: async (id) => {
    const res = await api.get(`/deliveries/${id}`, { cache: false });
    if (res?.data?.delivery) {
      return {
        ...res,
        data: { ...res.data, delivery: normalizeDelivery(res.data.delivery) },
      };
    }
    return res;
  },

  accept: async (id) => {
    const res = await api.post(`/deliveries/${id}/accept`, {}, { cache: false });
    if (res?.data?.delivery) {
      return {
        ...res,
        data: { ...res.data, delivery: normalizeDelivery(res.data.delivery) },
      };
    }
    return res;
  },

  pickup: async (id) => {
    const res = await api.post(`/deliveries/${id}/pickup`, {}, { cache: false });
    if (res?.data?.delivery) {
      return {
        ...res,
        data: { ...res.data, delivery: normalizeDelivery(res.data.delivery) },
      };
    }
    return res;
  },

  deliver: async (id) => {
    const res = await api.post(`/deliveries/${id}/deliver`, {}, { cache: false });
    if (res?.data?.delivery) {
      return {
        ...res,
        data: { ...res.data, delivery: normalizeDelivery(res.data.delivery) },
      };
    }
    return res;
  },

  confirm: async (id) => {
    const res = await api.post(`/deliveries/${id}/confirm`, {}, { cache: false });
    if (res?.data?.delivery) {
      return {
        ...res,
        data: { ...res.data, delivery: normalizeDelivery(res.data.delivery) },
      };
    }
    return res;
  },

  remove: (id, reason = null) =>
    api.delete(`/deliveries/${id}`, {
      data: { reason },
      cache: false,
    }),
};

// ============================================
// FILE UPLOAD HELPERS
// ============================================
export const uploadWithAuth = async (url, formData) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const response = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getWithAuth = async (url) => {
  const token = await getAccessToken();
  const response = await fetch(`${API_URL}${url}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

export default api;