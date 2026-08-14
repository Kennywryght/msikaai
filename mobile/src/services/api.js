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
  withCredentials: true,
});

// ============================================
// REQUEST INTERCEPTOR - Auth + Cache
// ============================================
api.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📤 Token present:`, token ? '✅ Yes' : '❌ No');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`📤 Authorization header set`);
    } else {
      console.log(`📤 No active Supabase session — request sent without token`);
    }

    // ✅ Check cache for GET requests
    if (config.method === 'get' && config.cache !== false) {
      const cacheKey = `${config.url}${config.params ? JSON.stringify(config.params) : ''}`;
      const cachedData = cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`📦 Cache hit for: ${config.url}`);
        // Return cached data
        return Promise.reject({
          __cached: true,
          data: cachedData,
          config: config
        });
      }
      
      // Store cache key for later
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
// RESPONSE INTERCEPTOR - Cache + Error Handling
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    
    // ✅ Cache GET requests
    if (response.config.method === 'get' && response.config._cacheKey) {
      const cacheTTL = response.config.cacheTTL || 5 * 60 * 1000; // 5 minutes
      cacheService.set(response.config._cacheKey, response.data, cacheTTL);
      console.log(`📦 Cached: ${response.config._cacheKey}`);
    }
    
    return response;
  },
  (error) => {
    // ✅ Handle cached responses
    if (error.__cached) {
      console.log(`📦 Using cached data for: ${error.config.url}`);
      return Promise.resolve({
        data: error.data,
        __cached: true,
        config: error.config
      });
    }
    
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, error.response?.status);
    console.error(`❌ Response data:`, error.response?.data);

    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing stale legacy tokens (if any)');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
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
  const toRemove = keys.filter(key => key.includes(pattern));
  toRemove.forEach(key => cacheService.delete(key));
  return toRemove.length;
};
export const getCacheStats = () => cacheService.getInfo();
export const getCacheKeys = () => cacheService.keys();

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  signup: (data) => {
    console.log('📤 Calling /auth/signup-email');
    return api.post('/auth/signup-email', data);
  },
  login: (data) => {
    console.log('📤 Calling /auth/login-email');
    return api.post('/auth/login-email', data);
  },
  sendOTP: (data) => {
    console.log('📤 Calling /auth/send-otp');
    return api.post('/auth/send-otp', data);
  },
  verifyOTP: (data) => {
    console.log('📤 Calling /auth/verify-otp');
    return api.post('/auth/verify-otp', data);
  },
  getMe: () => {
    console.log('📤 Calling /auth/me');
    return api.get('/auth/me');
  },
  logout: () => {
    console.log('📤 Calling /auth/signout');
    return api.post('/auth/signout');
  },
};

// ============================================
// BUSINESS API
// ============================================
export const businessAPI = {
  create: (data) => {
    console.log('📤 Calling /business/create');
    return api.post('/business/create', data);
  },
  getByUser: (userId) => {
    console.log('📤 Calling /business/user/' + userId);
    return api.get(`/business/user/${userId}`, { cacheTTL: 10 * 60 * 1000 });
  },
  getById: (id) => {
    console.log('📤 Calling /business/' + id);
    return api.get(`/business/${id}`, { cacheTTL: 10 * 60 * 1000 });
  },
  update: (id, data) => {
    console.log('📤 Calling /business/' + id);
    return api.put(`/business/${id}`, data);
  },
  getAll: (params) => {
    console.log('📤 Calling /business with params:', params);
    return api.get('/business', { params, cacheTTL: 5 * 60 * 1000 });
  },
  delete: (id) => {
    console.log('📤 Calling DELETE /business/' + id);
    return api.delete(`/business/${id}`);
  },
};

// ============================================
// LISTINGS API
// ============================================
export const listingsAPI = {
  create: (data) => {
    console.log('📤 Calling /listings/create');
    return api.post('/listings/create', data);
  },
  getByBusiness: (businessId, params) => {
    console.log('📤 Calling /listings/business/' + businessId);
    return api.get(`/listings/business/${businessId}`, { params, cacheTTL: 5 * 60 * 1000 });
  },
  getById: (id) => {
    console.log('📤 Calling /listings/' + id);
    return api.get(`/listings/${id}`, { cacheTTL: 10 * 60 * 1000 });
  },
  update: (id, data) => {
    console.log('📤 Calling PUT /listings/' + id);
    return api.put(`/listings/${id}`, data);
  },
  delete: (id) => {
    console.log('📤 Calling DELETE /listings/' + id);
    return api.delete(`/listings/${id}`);
  },
  search: (params) => {
    console.log('📤 Calling /listings/search with params:', params);
    return api.get('/listings/search', { params, cacheTTL: 3 * 60 * 1000 });
  },
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  getPlans: async () => {
    try {
      console.log('📤 Calling /payment/plans');
      const response = await api.get('/payment/plans', { cacheTTL: 60 * 60 * 1000 });
      return response;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  },
  initiatePayment: async (data) => {
    try {
      console.log('📤 Calling /payment/initiate');
      const response = await api.post('/payment/initiate', data);
      return response;
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    }
  },
  verifyPayment: async (paymentId) => {
    try {
      console.log('📤 Calling /payment/verify/' + paymentId);
      const response = await api.get(`/payment/verify/${paymentId}`);
      return response;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  },
  getSubscription: async (userId) => {
    try {
      console.log('📤 Calling /payment/subscription/' + userId);
      const response = await api.get(`/payment/subscription/${userId}`, { cacheTTL: 5 * 60 * 1000 });
      return response;
    } catch (error) {
      console.error('Get subscription error:', error);
      throw error;
    }
  },
  upgradeSubscription: async (data) => {
    try {
      console.log('📤 Calling /payment/upgrade');
      const response = await api.post('/payment/upgrade', data);
      return response;
    } catch (error) {
      console.error('Subscription upgrade error:', error);
      throw error;
    }
  },
  canCreateListing: async (userId) => {
    try {
      console.log('📤 Calling /payment/can-create-listing/' + userId);
      const response = await api.get(`/payment/can-create-listing/${userId}`, { cacheTTL: 2 * 60 * 1000 });
      return response;
    } catch (error) {
      console.error('Check listing permission error:', error);
      throw error;
    }
  },
};

// ============================================
// REVIEWS API
// ============================================
export const reviewsAPI = {
  create: (data) => {
    console.log('📤 Calling /reviews/create');
    return api.post('/reviews/create', data);
  },
  getByBusiness: (businessId) => {
    console.log('📤 Calling /reviews/business/' + businessId);
    return api.get(`/reviews/business/${businessId}`, { cacheTTL: 5 * 60 * 1000 });
  },
  getByListing: (listingId) => {
    console.log('📤 Calling /reviews/listing/' + listingId);
    return api.get(`/reviews/listing/${listingId}`, { cacheTTL: 5 * 60 * 1000 });
  },
  update: (id, data) => {
    console.log('📤 Calling PUT /reviews/' + id);
    return api.put(`/reviews/${id}`, data);
  },
  delete: (id) => {
    console.log('📤 Calling DELETE /reviews/' + id);
    return api.delete(`/reviews/${id}`);
  },
};

// ============================================
// AI API
// ============================================
export const aiAPI = {
  search: (data) => {
    console.log('📤 Calling /ai/search');
    return api.post('/ai/search', data);
  },
  getSuggestions: (q) => {
    console.log('📤 Calling /ai/suggestions with q:', q);
    return api.get('/ai/suggestions', { params: { q }, cacheTTL: 2 * 60 * 1000 });
  },
};

// ============================================
// VOICE API
// ============================================
export const voiceAPI = {
  processVoice: (formData) => {
    console.log('📤 Calling /ai/voice/process');
    return api.post('/ai/voice/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  createListing: (formData) => {
    console.log('📤 Calling /ai/voice/create-listing');
    return api.post('/ai/voice/create-listing', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getPrompts: (language) => {
    console.log('📤 Calling /ai/voice/prompts with language:', language);
    return api.get('/ai/voice/prompts', { params: { language }, cacheTTL: 60 * 60 * 1000 });
  },
};

// ============================================
// AD GENERATOR API
// ============================================
export const adAPI = {
  generate: (formData) => {
    console.log('📤 Calling /ai/ads/generate');
    return api.post('/ai/ads/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  batchGenerate: (data) => {
    console.log('📤 Calling /ai/ads/batch-generate');
    return api.post('/ai/ads/batch-generate', data);
  },
};

// ============================================
// LOCATION API
// ============================================
export const locationAPI = {
  nearby: (params) => {
    console.log('📤 Calling /location/nearby with params:', params);
    return api.get('/location/nearby', { params, cacheTTL: 10 * 60 * 1000 });
  },
  update: (data) => {
    console.log('📤 Calling /location/update');
    return api.post('/location/update', data);
  },
};

export default api;

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
  getByUser: (userId) => {
    console.log('📤 Calling /profile/user/' + userId);
    return api.get(`/profile/user/${userId}`, { cacheTTL: 10 * 60 * 1000 });
  },
  update: (data) => {
    console.log('📤 Calling /profile/update');
    return api.put('/profile/update', data);
  },
  updateBusiness: (data) => {
    console.log('📤 Calling /profile/business/update');
    return api.put('/profile/business/update', data);
  },
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  trackView: (data) => {
    console.log('📤 Tracking view');
    return api.post('/analytics/view', data);
  },
  trackContact: (data) => {
    console.log('📤 Tracking contact');
    return api.post('/analytics/contact', data);
  },
  getListingStats: (id) => {
    console.log('📤 Getting listing stats for:', id);
    return api.get(`/analytics/listing/${id}`, { cacheTTL: 5 * 60 * 1000 });
  },
  getBusinessAnalytics: (businessId, params) => {
    console.log('📤 Getting business analytics for:', businessId);
    return api.get(`/analytics/business/${businessId}`, { params, cacheTTL: 5 * 60 * 1000 });
  },
  getPopularListings: (params) => {
    console.log('📤 Getting popular listings');
    return api.get('/analytics/popular', { params, cacheTTL: 5 * 60 * 1000 });
  },
  getUserActivity: (userId, params) => {
    console.log('📤 Getting user activity for:', userId);
    return api.get(`/analytics/user/${userId}`, { params, cacheTTL: 5 * 60 * 1000 });
  },
};

// ============================================
// EXPORT API
// ============================================
export const exportAPI = {
  exportListingsCSV: (businessId, params) => {
    console.log('📤 Exporting listings CSV for:', businessId);
    return api.get(`/export/listings/${businessId}/csv`, { params });
  },
  exportBusinessJSON: (businessId) => {
    console.log('📤 Exporting business JSON for:', businessId);
    return api.get(`/export/business/${businessId}/json`);
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getNotifications: (userId, params) => {
    console.log('📤 Getting notifications for:', userId);
    return api.get(`/notifications/user/${userId}`, { params, cacheTTL: 2 * 60 * 1000 });
  },
  markAsRead: (id, userId) => {
    console.log('📤 Marking notification as read:', id);
    return api.put(`/notifications/${id}/read`, { userId });
  },
  markAllAsRead: (userId) => {
    console.log('📤 Marking all notifications as read');
    return api.put('/notifications/all/read', { userId });
  },
  deleteNotification: (id, userId) => {
    console.log('📤 Deleting notification:', id);
    return api.delete(`/notifications/${id}`, { data: { userId } });
  },
};

// ============================================
// MATCHING API
// ============================================
export const matchingAPI = {
  postNeed: (data) => {
    console.log('📤 Posting need:', data);
    return api.post('/matching/needs', data);
  },
  getBusinessNeeds: (businessId, params) => {
    console.log('📤 Getting needs for business:', businessId);
    return api.get(`/matching/business-needs/${businessId}`, { params, cacheTTL: 5 * 60 * 1000 });
  },
  getNeeds: (params) => {
    console.log('📤 Getting all needs:', params);
    return api.get('/matching/needs', { params, cacheTTL: 5 * 60 * 1000 });
  },
  closeNeed: (id, userId) => {
    console.log('📤 Closing need:', id);
    return api.put(`/matching/needs/${id}/close`, { userId });
  },
};