/**
 * API Service
 * Based on Architecture.md - Axios with Firebase ID token interceptor
 * Backend base URL from environment variables
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';

// API Base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.localbuddy.in/v1';

// ============================================================
// Central error-message helper
// Backend error shape is `{ error: string, code?: string, details?: any }`
// (see backend/src/middleware/errorHandler.ts) — NOT `{ message }`.
// Axios' default e.message ("Request failed with status code 400") must
// never be shown to the user when a real server message exists.
// ============================================================
export const getApiErrorMessage = (
  error: any,
  fallback = 'Something went wrong. Please try again.'
): string => {
  const data = error?.response?.data;
  if (data) {
    if (typeof data === 'string' && data.trim()) return data;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    // Zod validation errors: { error: 'Validation failed', errors: [{field, message}] }
    if (Array.isArray(data.errors) && data.errors.length) {
      const first = data.errors[0];
      if (typeof first === 'string') return first;
      if (first?.message) return first.field ? `${first.field}: ${first.message}` : first.message;
    }
  }
  const status = error?.response?.status;
  if (status === 400) return fallback;
  if (status === 401) return 'Session expired or invalid credentials. Please try again.';
  if (status === 403) return 'You are not allowed to perform this action.';
  if (status === 404) return 'Requested resource was not found.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  if (typeof status === 'number' && status >= 500) return 'Server error. Please try again in a moment.';
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Please check your internet connection.';
  if (!error?.response && error?.request) return 'Network error. Please check your internet connection.';
  if (typeof error?.message === 'string' && error.message && !/status code \d+/i.test(error.message)) {
    return error.message;
  }
  return fallback;
};

// ============================================================
// Global loading tracker — every API call briefly shows the app's
// centered orange loader (components/ui/GlobalLoader.tsx). A counter
// keeps concurrent requests truthful. Pass `skipGlobalLoader: true`
// in the axios config to opt a request out.
// Lazy-require uiStore to avoid the api.ts <-> uiStore.ts import cycle.
// ============================================================
let pendingRequests = 0;
const setLoaderVisible = (visible: boolean) => {
  try {
    const { useUIStore } = require('@/store/uiStore');
    useUIStore.getState().setGlobalLoading({ isLoading: visible });
  } catch {
    // UI store may not be ready during very early bootstrap — non-fatal.
  }
};
const trackRequestStart = (config: any) => {
  if (config?.skipGlobalLoader) return;
  pendingRequests += 1;
  if (pendingRequests === 1) setLoaderVisible(true);
};
const trackRequestEnd = (config: any) => {
  if (config?.skipGlobalLoader) return;
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) setLoaderVisible(false);
};

// Mock API no longer exists. All calls go to the real backend.
export const isMockApiEnabled = false;
// (env var EXPO_PUBLIC_MOCK_API был retired)

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - Add Firebase ID token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      // Check if Firebase Auth is configured
      if (!auth) {
        console.warn('[API] Firebase Auth not configured - skipping auth token');
        return config;
      }
      
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true); // Force refresh
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add language header
      const language = getStoredLanguage();
      if (language) {
        config.headers['Accept-Language'] = language;
      }
      
      // Add city header for location-based queries
      const city = getStoredCity();
      if (city) {
        config.headers['X-City'] = city;
      }
    } catch (error) {
      console.warn('[API] Failed to attach auth token:', error);
    }

    trackRequestStart(config);
    return config;
  },
  (error: AxiosError) => {
    trackRequestEnd(error?.config);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    trackRequestEnd(response?.config);
    return response;
  },
  async (error: AxiosError) => {
    trackRequestEnd(error?.config);
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Check if Firebase Auth is configured
        if (!auth) {
          console.warn('[API] Firebase Auth not configured - cannot refresh token');
          return Promise.reject(error);
        }
        
        const user = auth.currentUser;
        if (user) {
          // Force token refresh
          const newToken = await user.getIdToken(true);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
        // Auth store will handle logout
      }
    }
    
    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 400:
          console.error('[API] Bad Request:', data?.message || 'Validation error');
          break;
        case 403:
          console.error('[API] Forbidden:', data?.message || 'Access denied');
          break;
        case 404:
          console.error('[API] Not Found:', data?.message || 'Resource not found');
          break;
        case 422:
          console.error('[API] Validation Error:', data?.errors || data?.message);
          break;
        case 429:
          console.error('[API] Rate Limited:', data?.message || 'Too many requests');
          break;
        case 500:
          console.error('[API] Server Error:', data?.message || 'Internal server error');
          break;
        case 503:
          console.error('[API] Service Unavailable:', data?.message || 'Service temporarily unavailable');
          break;
        default:
          console.error(`[API] Error ${status}:`, data?.message || 'Unknown error');
      }
    } else if (error.request) {
      console.error('[API] Network Error:', error.message);
    } else {
      console.error('[API] Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for headers
let storedLanguage: string | null = null;
let storedCity: string | null = null;

export const setStoredLanguage = (language: string): void => {
  storedLanguage = language;
};

export const getStoredLanguage = (): string | null => {
  return storedLanguage;
};

export const setStoredCity = (city: string): void => {
  storedCity = city;
};

export const getStoredCity = (): string | null => {
  return storedCity;
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    otpSend: '/auth/otp/send',
    otpVerify: '/auth/otp/verify',
    verifyPhone: '/auth/otp/verify',
    resendOtp: '/auth/otp/send',
    firebaseToken: '/auth/firebase-token', // Exchange Firebase token for custom token
  },
  
  // User Profile
  user: {
    profile: '/users/me/profile',
    updateProfile: '/users/me/profile',
    updateLocation: '/users/me/location',
    updateLanguage: '/users/me/language',
    updateFcmToken: '/users/me/fcm-token',
    deleteAccount: '/users/me/account',
  },
  
  // KYC
  kyc: {
    submit: '/users/me/kyc',
    status: '/users/me/kyc',
    documents: '/users/me/kyc',
    verify: '/users/me/kyc',
  },
  
  // Tasks
  tasks: {
    list: '/tasks',
    create: '/tasks',
    get: (id: string) => `/tasks/${id}`,
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
    accept: (id: string) => `/tasks/${id}/assign`,
    apply: (id: string) => `/tasks/${id}/apply`,
    applications: (id: string) => `/tasks/${id}/applications`,
    decideApplication: (id: string, buddyId: string) => `/tasks/${id}/applications/${buddyId}/decide`,
    start: (id: string) => `/tasks/${id}/status`,
    complete: (id: string) => `/tasks/${id}/status`,
    cancel: (id: string) => `/tasks/${id}/status`,
    dispute: (id: string) => `/tasks/${id}/dispute`,
    rate: (id: string) => `/tasks/${id}/rate`,
    nearby: '/tasks',
    myTasks: '/tasks/my/assigned',
    postedTasks: '/tasks/my/posted',
    buddyTasks: '/tasks/my/assigned',
  },
  
  // Chat
  chat: {
    list: '/chats',
    create: '/chats',
    get: (id: string) => `/chats/${id}`,
    messages: (id: string) => `/chats/${id}/messages`,
    sendMessage: (id: string) => `/chats/${id}/messages`,
    markRead: (id: string) => `/chats/${id}/read`,
    uploadMedia: (id: string) => `/chats/${id}/media`,
  },
  
  // Wallet
  wallet: {
    balance: '/wallet',
    transactions: '/wallet/transactions',
    topup: '/wallet/add-money',
    payuCallback: '/wallet/payu/callback',
    release: (taskId: string) => `/wallet/release/${taskId}`,
    // Withdrawals are removed from the MVP (kept for type-compatibility
    // with legacy callers; all are no-ops).
    withdraw: '/wallet/withdraw',
    paymentMethods: '/wallet/payment-methods',
    addPaymentMethod: '/wallet/payment-methods',
    removePaymentMethod: (id: string) => `/wallet/payment-methods/${id}`,
  },
  
  // Payments (MVP: only PayU top-up hash/callback used)
  payments: {
    createOrder: '/payments/create-order',
    verify: '/payments/verify',
    verifyPayU: '/payments/verify',
    webhook: '/payments/webhook',
    refund: '/payments/refund',
  },
  
  // Notifications
  notifications: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
    preferences: '/notifications/preferences',
    updatePreferences: '/notifications/preferences',
  },
  
  // SOS
  sos: {
    trigger: '/sos/trigger',
    contacts: '/sos/contacts',
    addContact: '/sos/contacts',
    removeContact: (id: string) => `/sos/contacts/${id}`,
    history: '/sos/history',
  },
  
  // Location
  location: {
    update: '/location/update',
    live: '/location/live',
    nearbyBuddies: '/location/nearby-buddies',
  },
  
  // Categories & Cities
  meta: {
    categories: '/meta/categories',
    cities: '/meta/cities',
    config: '/meta/config',
  },
  
  // Upload
  upload: {
    image: '/upload/image',
    document: '/upload/document',
    profileImage: '/upload/profile-image',
  },
  
  // Referral
  referral: {
    code: '/referral/code',
    apply: '/referral/apply',
    stats: '/referral/stats',
  },
  
  // Support
  support: {
    tickets: '/support/tickets',
    createTicket: '/support/tickets',
    faq: '/support/faq',
  },
} as const;

// Typed API helpers
export const apiGet = <T>(url: string, config?: AxiosRequestConfig) => 
  api.get<T>(url, config).then(res => res.data);

export const apiPost = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  api.post<T>(url, data, config).then(res => res.data);

export const apiPut = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  api.put<T>(url, data, config).then(res => res.data);

export const apiPatch = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  api.patch<T>(url, data, config).then(res => res.data);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) => 
  api.delete<T>(url, config).then(res => res.data);

export default api;