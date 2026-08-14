import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🔍 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ✅ FIX: The old interceptor read `localStorage.getItem('auth_token')`,
// but this app uses Supabase auth, which never stores a token under that
// key — Supabase stores its session under `sb-<project-ref>-auth-token`
// and manages it internally. That meant no valid token was EVER sent,
// so every protected backend route (using authenticateToken, which
// correctly verifies via supabase.auth.getUser(token)) rejected the
// request with 401 AUTH_ERROR. Fix: pull the live access_token straight
// from the current Supabase session on every request.
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
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, error.response?.status);
    console.error(`❌ Response data:`, error.response?.data);

    // ✅ Do NOT force a full page reload here. window.location.href
    // remounts the entire React app from scratch, resetting App.jsx's
    // splash/bridge phase state and causing an infinite splash -> loading
    // -> landing loop. Just clear any stale legacy tokens and let
    // AuthContext / ProtectedRoute handle redirecting via React Router.
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing stale legacy tokens (if any)');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }

    return Promise.reject(error);
  }
);

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
    return api.get(`/business/user/${userId}`);
  },
  getById: (id) => {
    console.log('📤 Calling /business/' + id);
    return api.get(`/business/${id}`);
  },
  update: (id, data) => {
    console.log('📤 Calling /business/' + id);
    return api.put(`/business/${id}`, data);
  },
  getAll: (params) => {
    console.log('📤 Calling /business with params:', params);
    return api.get('/business', { params });
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
    return api.get(`/listings/business/${businessId}`, { params });
  },
  getById: (id) => {
    console.log('📤 Calling /listings/' + id);
    return api.get(`/listings/${id}`);
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
    return api.get('/listings/search', { params });
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
    return api.get(`/reviews/business/${businessId}`);
  },
  getByListing: (listingId) => {
    console.log('📤 Calling /reviews/listing/' + listingId);
    return api.get(`/reviews/listing/${listingId}`);
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
    return api.get('/ai/suggestions', { params: { q } });
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
    return api.get('/ai/voice/prompts', { params: { language } });
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
    return api.get('/location/nearby', { params });
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
    return api.get(`/profile/user/${userId}`);
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
    return api.get(`/analytics/listing/${id}`);
  },
  getBusinessAnalytics: (businessId, params) => {
    console.log('📤 Getting business analytics for:', businessId);
    return api.get(`/analytics/business/${businessId}`, { params });
  },
  getPopularListings: (params) => {
    console.log('📤 Getting popular listings');
    return api.get('/analytics/popular', { params });
  },
  getUserActivity: (userId, params) => {
    console.log('📤 Getting user activity for:', userId);
    return api.get(`/analytics/user/${userId}`, { params });
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
    return api.get(`/notifications/user/${userId}`, { params });
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
  // Post a need (someone looking for goods/services)
  postNeed: (data) => {
    console.log('📤 Posting need:', data);
    return api.post('/matching/needs', data);
  },

  // Get needs for a business (potential customers)
  getBusinessNeeds: (businessId, params) => {
    console.log('📤 Getting needs for business:', businessId);
    return api.get(`/matching/business-needs/${businessId}`, { params });
  },

  // Get all needs (public)
  getNeeds: (params) => {
    console.log('📤 Getting all needs:', params);
    return api.get('/matching/needs', { params });
  },

  // Close a need (mark as fulfilled)
  closeNeed: (id, userId) => {
    console.log('📤 Closing need:', id);
    return api.put(`/matching/needs/${id}/close`, { userId });
  },
};