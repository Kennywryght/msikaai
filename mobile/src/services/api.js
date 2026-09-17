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
// REQUEST INTERCEPTOR
// ============================================
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

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
  (error) => {
    if (error.__cached) {
      return Promise.resolve({
        data: error.data,
        __cached: true,
        config: error.config,
      });
    }

    const method = error.config?.method?.toUpperCase() ?? 'GET';
    const url = error.config?.url ?? '(unknown)';

    if (error.response) {
      console.error(`❌ ${method} ${url} → HTTP ${error.response.status}`);
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
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
      cache: false, // always fresh — comments change often
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
};

// ============================================
// COMMENTS API (top-level comment actions)
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
  // List all conversations for current user
  getConversations: (params) =>
    api.get('/messages/conversations', { params, cacheTTL: 20 * 1000 }),

  // Get a single conversation + its messages
  getConversation: (conversationId, params) =>
    api.get(`/messages/conversations/${conversationId}`, {
      params,
      cache: false, // never cache active conversations
    }),

  // Find or create a conversation with another user
  createConversation: (otherUserId, listingId = null) =>
    api.post('/messages/conversations', { otherUserId, listingId }),

  // Send a message in a conversation (text, imageUrl, or both)
  sendMessage: (conversationId, content) =>
    api.post(`/messages/conversations/${conversationId}`, content, {
      cache: false,
    }),

  // Mark a conversation as read for current user
  markConversationRead: (conversationId) =>
    api.put(
      `/messages/conversations/${conversationId}/read`,
      {},
      { cache: false }
    ),

  // ✅ Upload an image for chat — returns Cloudinary URL
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('/messages/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      cache: false,
      // Longer timeout for uploads
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

  // ✅ Web push endpoints
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
  const token = localStorage.getItem('access_token') || '';
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
  const token = localStorage.getItem('access_token') || '';
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