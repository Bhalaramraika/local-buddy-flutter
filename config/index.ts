/**
 * App Configuration
 * Centralized configuration for the Local Buddy app
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.localbuddy.app',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Socket Configuration
export const SOCKET_CONFIG = {
  URL: process.env.EXPO_PUBLIC_SOCKET_URL || 'wss://socket.localbuddy.app',
  RECONNECTION_ATTEMPTS: 5,
  RECONNECTION_DELAY: 1000,
  TIMEOUT: 20000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Local Buddy',
  VERSION: '1.0.0',
  BUILD_NUMBER: '1',
  SUPPORT_EMAIL: 'support@localbuddy.app',
  PRIVACY_POLICY_URL: 'https://localbuddy.app/privacy',
  TERMS_URL: 'https://localbuddy.app/terms',
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_CHAT: true,
  ENABLE_WALLET: true,
  ENABLE_KYC: true,
  ENABLE_REFERRALS: true,
  ENABLE_GEOFENCING: true,
  ENABLE_SOS: true,
  ENABLE_RATINGS: true,
  ENABLE_NOTIFICATIONS: true,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  FCM_TOKEN: 'fcm_token',
  PREFERENCES: 'preferences',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LANGUAGE: 'language',
  THEME: 'theme',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  MAX_ZOOM: 20,
  MIN_ZOOM: 5,
  DEFAULT_CENTER: {
    latitude: 28.6139,
    longitude: 77.2090, // New Delhi
  },
  MARKER_CLUSTER_RADIUS: 50,
};

// Chat Configuration
export const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 5000,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  TYPING_INDICATOR_TIMEOUT: 3000,
  MESSAGE_RETRY_ATTEMPTS: 3,
};

// Task Configuration
export const TASK_CONFIG = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MIN_BUDGET: 5000, // 50 INR in paise
  MAX_BUDGET: 10000000, // 1,00,000 INR in paise
  MAX_DISTANCE: 50, // km
  AUTO_ASSIGN_TIMEOUT: 300000, // 5 minutes
  COMPLETION_CONFIRMATION_TIMEOUT: 86400000, // 24 hours
};

// Wallet Configuration
export const WALLET_CONFIG = {
  MIN_WITHDRAWAL: 10000, // 100 INR in paise
  MAX_WITHDRAWAL: 50000000, // 5,00,000 INR in paise
  WITHDRAWAL_FEE_PERCENTAGE: 2,
  MIN_DEPOSIT: 10000, // 100 INR in paise
  MAX_DEPOSIT: 10000000, // 1,00,000 INR in paise
  UPI_INTENT_TIMEOUT: 300000, // 5 minutes
};

// KYC Configuration
export const KYC_CONFIG = {
  DOCUMENT_TYPES: ['aadhaar', 'pan', 'driving_license', 'voter_id', 'passport'] as const,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  EXPIRY_DAYS: 365,
  AUTO_VERIFY_THRESHOLD: 0.85, // confidence score
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  CHANNELS: {
    TASK: 'task_notifications',
    CHAT: 'chat_notifications',
    WALLET: 'wallet_notifications',
    KYC: 'kyc_notifications',
    SYSTEM: 'system_notifications',
    PROMO: 'promo_notifications',
    SOS: 'sos_notifications',
    REVIEW: 'review_notifications',
  },
  PRIORITIES: {
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low',
  },
  QUIET_HOURS_DEFAULT_START: '22:00',
  QUIET_HOURS_DEFAULT_END: '08:00',
};

// Referral Configuration
export const REFERRAL_CONFIG = {
  REFERRER_BONUS: 5000, // 50 INR in paise
  REFEREE_BONUS: 5000, // 50 INR in paise
  MIN_TASKS_FOR_BONUS: 1,
  CODE_LENGTH: 8,
};

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  KYC_REQUIRED: 'KYC_REQUIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TASK_EXPIRED: 'TASK_EXPIRED',
  TASK_ALREADY_ASSIGNED: 'TASK_ALREADY_ASSIGNED',
  RATE_LIMITED: 'RATE_LIMITED',
  MAINTENANCE: 'MAINTENANCE',
};

// Default Values
export const DEFAULTS = {
  LANGUAGE: 'en' as const,
  THEME: 'system' as const,
  CURRENCY: 'INR',
  TIMEZONE: 'Asia/Kolkata',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
};

// Environment
export const ENV = {
  IS_DEV: __DEV__,
  IS_PROD: !__DEV__,
  IS_TEST: process.env.NODE_ENV === 'test',
};