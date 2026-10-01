/**
 * API Service
 * Based on Architecture.md - Axios with Firebase ID token interceptor
 * Backend base URL from environment variables
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { auth } from './firebase';

// API Base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.localbuddy.in/v1';

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
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
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