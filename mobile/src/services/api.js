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

// Pull the freshest access token available (Supabase session > localStorage)
async function getAccessToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
  } catch (err) {
    console.warn('⚠️ Could not read Supabase session:', err?.message);
  }
  return localStorage.getItem('access_token') || null;
}

// Try to refresh the Supabase session; returns new token or null
async function tryRefreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data?.session?.access_token) return null;
    // Keep the mirror copies in sync
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
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();

    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // GET cache handling
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
    // Cached GET short-circuit
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

    // =========================================
    // 401 HANDLING — refresh once, then retry
    // =========================================
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

      // Refresh failed — clear session and bounce to login
      console.error(`❌ Session refresh failed — signing out`);
      try {
        await supabase.auth.signOut();
      } catch {}
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Only redirect if we're in a browser and not already on /login
      if (typeof window !== 'undefined') {
        const here = window.location.pathname + window.location.search;
        if (!here.startsWith('/login')) {
          window.location.href = `/login?from=${encodeURIComponent(here)}`;
        }
      }

      return Promise.reject(error);
    }

    // Log other failures
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
  getByBusiness: (businessId, params) =>
    api.get(`/listings/business/${businessId}`, {
      params,
      cacheTTL: 5 * 60 * 1000,
    }),
  getById: (id) =>
    api.get(`/listings/${id}`, { cacheTTL: 10 * 60 * 1000 }),
  update: (id, data) => api.put(`/listings/${id}`, data),
  delete: (id) => api.delete(`/listings/${id}`),
  search: (params) =>
    api.get('/listings/search', { params, cacheTTL: 3 * 60 * 1000 }),

  // ===== LIKES (persisted) =====
  like: (id) => api.post(`/listings/${id}/like`, {}, { cache: false }),
  unlike: (id) => api.delete(`/listings/${id}/like`, { cache: false }),
  getLikes: (id, params) =>
    api.get(`/listings/${id}/likes`, { params, cacheTTL: 60 * 1000 }),

  // ===== COMMENTS =====
  getComments: (id, params) =>
    api.get(`/listings/${id}/comments`, {
      params,
      cache: false,
    }),
  addComment: (id, content, parentId = null) =>
    api.post(
      `/listings/${id}/comments`,
      { content, parent_id: parentId },
      { cache: false }
    ),
  updateComment: (id, commentId, content) =>
    api.put(`/listings/${id}/comments/${commentId}`, { content }, { cache: false }),
  deleteComment: (id, commentId) =>
    api.delete(`/listings/${id}/comments/${commentId}`, { cache: false }),

  // ===== BOOST / PREMIUM =====
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

  getConversation: (conversationId, params) =>
    api.get(`/messages/conversations/${conversationId}`, {
      params,
      cache: false,
    }),

  createConversation: (otherUserId, listingId = null) =>
    api.post('/messages/conversations', { otherUserId, listingId }),

  sendMessage: (conversationId, content) =>
    api.post(`/messages/conversations/${conversationId}`, content, {
      cache: false,
    }),

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
    Promise.resolve({
      data: {
        plans: [
          { days: 7, amount: 2000, currency: 'MWK', label: '7 days' },
          { days: 14, amount: 3500, currency: 'MWK', label: '14 days' },
          { days: 30, amount: 6000, currency: 'MWK', label: '30 days' },
        ],
      },
    }),
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