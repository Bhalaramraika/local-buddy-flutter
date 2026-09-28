/**
 * App Constants
 * Based on PRD.md, Features_And_Integrations.md, and Architecture.md
 */

// App Info
export const APP = {
  name: 'Local Buddy',
  scheme: 'localbuddy',
  version: '1.0.0',
  buildNumber: 1,
  supportEmail: 'support@localbuddy.in',
  privacyPolicyUrl: 'https://localbuddy.in/privacy',
  termsOfServiceUrl: 'https://localbuddy.in/terms',
} as const;

// Supported Languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇮🇳' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Default City (Balotra, Rajasthan)
export const DEFAULT_CITY = {
  name: 'Balotra',
  state: 'Rajasthan',
  country: 'India',
  lat: 25.8333,
  lng: 72.2333,
  pincode: '344022',
} as const;

// Supported Cities (Tier-2/3 Rajasthan focus)
export const SUPPORTED_CITIES = [
  { name: 'Balotra', state: 'Rajasthan', lat: 25.8333, lng: 72.2333, pincode: '344022' },
  { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lng: 73.0243, pincode: '342001' },
  { name: 'Pali', state: 'Rajasthan', lat: 25.7725, lng: 73.3234, pincode: '306401' },
  { name: 'Barmer', state: 'Rajasthan', lat: 25.7497, lng: 71.4172, pincode: '344001' },
  { name: 'Jaisalmer', state: 'Rajasthan', lat: 26.9157, lng: 70.9083, pincode: '345001' },
  { name: 'Bikaner', state: 'Rajasthan', lat: 28.0229, lng: 73.3119, pincode: '334001' },
  { name: 'Nagaur', state: 'Rajasthan', lat: 27.2009, lng: 73.7365, pincode: '341001' },
  { name: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lng: 74.6399, pincode: '305001' },
] as const;

// Task Categories (from PRD.md)
export const TASK_CATEGORIES = [
  { id: 'grocery', name: 'Grocery', nameHi: 'किराना', icon: 'cart', color: '#4F46E5' },
  { id: 'medicine', name: 'Medicine', nameHi: 'दवा', icon: 'medical-bag', color: '#EF4444' },
  { id: 'food', name: 'Food Delivery', nameHi: 'खाना डिलीवरी', icon: 'food', color: '#F59E0B' },
  { id: 'courier', name: 'Courier/Parcel', nameHi: 'कूरियर/पार्सल', icon: 'package', color: '#06B6D4' },
  { id: 'bill_payment', name: 'Bill Payment', nameHi: 'बिल भुगतान', icon: 'receipt', color: '#10B981' },
  { id: 'shopping', name: 'Shopping', nameHi: 'खरीदारी', icon: 'shopping-bag', color: '#8B5CF6' },
  { id: 'errand', name: 'General Errand', nameHi: 'सामान्य काम', icon: 'help-circle', color: '#64748B' },
  { id: 'other', name: 'Other', nameHi: 'अन्य', icon: 'more-horizontal', color: '#94A3B8' },
] as const;

export type TaskCategoryId = typeof TASK_CATEGORIES[number]['id'];

// Task Status (from PRD.md)
export const TASK_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Task Status Labels
export const TASK_STATUS_LABELS: Record<TaskStatus, { en: string; hi: string }> = {
  [TASK_STATUS.OPEN]: { en: 'Open', hi: 'खुला' },
  [TASK_STATUS.ASSIGNED]: { en: 'Assigned', hi: 'असाइन किया गया' },
  [TASK_STATUS.IN_PROGRESS]: { en: 'In Progress', hi: 'प्रगति में' },
  [TASK_STATUS.COMPLETED]: { en: 'Completed', hi: 'पूर्ण' },
  [TASK_STATUS.CANCELLED]: { en: 'Cancelled', hi: 'रद्द' },
  [TASK_STATUS.DISPUTED]: { en: 'Disputed', hi: 'विवादित' },
};

// Task Status Colors
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TASK_STATUS.OPEN]: '#3B82F6',
  [TASK_STATUS.ASSIGNED]: '#8B5CF6',
  [TASK_STATUS.IN_PROGRESS]: '#F59E0B',
  [TASK_STATUS.COMPLETED]: '#10B981',
  [TASK_STATUS.CANCELLED]: '#EF4444',
  [TASK_STATUS.DISPUTED]: '#F97316',
};

// User Roles
export const USER_ROLES = {
  POSTER: 'poster',
  BUDDY: 'buddy',
  BOTH: 'both',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// KYC Status
export const KYC_STATUS = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type KycStatus = typeof KYC_STATUS[keyof typeof KYC_STATUS];

// KYC Document Types
export const KYC_DOC_TYPES = {
  AADHAAR: 'aadhaar',
  PAN: 'pan',
  DRIVING_LICENSE: 'driving_license',
  VOTER_ID: 'voter_id',
} as const;

export type KycDocType = typeof KYC_DOC_TYPES[keyof typeof KYC_DOC_TYPES];

// Payment Methods
export const PAYMENT_METHODS = {
  WALLET: 'wallet',
  UPI: 'upi',
  CARD: 'card',
  NET_BANKING: 'net_banking',
  CASH: 'cash',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// Transaction Types
export const TRANSACTION_TYPES = {
  TASK_PAYMENT: 'task_payment',
  WALLET_TOPUP: 'wallet_topup',
  WALLET_WITHDRAWAL: 'wallet_withdrawal',
  REFUND: 'refund',
  PLATFORM_FEE: 'platform_fee',
  BUDDY_PAYOUT: 'buddy_payout',
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

// Notification Types
export const NOTIFICATION_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_ASSIGNED: 'task_assigned',
  TASK_ACCEPTED: 'task_accepted',
  TASK_STARTED: 'task_started',
  TASK_COMPLETED: 'task_completed',
  TASK_CANCELLED: 'task_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  KYC_SUBMITTED: 'kyc_submitted',
  KYC_APPROVED: 'kyc_approved',
  KYC_REJECTED: 'kyc_rejected',
  RATING_RECEIVED: 'rating_received',
  CHAT_MESSAGE: 'chat_message',
  SOS_ALERT: 'sos_alert',
  PROMOTIONAL: 'promotional',
  SYSTEM: 'system',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Chat Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LOCATION: 'location',
  VOICE: 'voice',
  SYSTEM: 'system',
  TASK_UPDATE: 'task_update',
  PAYMENT_REQUEST: 'payment_request',
  PAYMENT_CONFIRMED: 'payment_confirmed',
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// Map Configuration
export const MAP_CONFIG = {
  // OSM Tile Server
  tileServer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
  minZoom: 10,
  defaultZoom: 15,
  // Default center (Balotra)
  defaultCenter: {
    latitude: 25.8333,
    longitude: 72.2333,
  },
  // Location update interval (meters)
  locationUpdateDistance: 50,
  // Location update interval (ms) - background
  backgroundLocationInterval: 30000,
  // Location update interval (ms) - foreground
  foregroundLocationInterval: 10000,
} as const;

// Search Radius Options (km)
export const SEARCH_RADIUS_OPTIONS = [1, 2, 5, 10, 20] as const;

// Default Search Radius
export const DEFAULT_SEARCH_RADIUS = 5; // km

// Platform Fee (from PRD.md)
export const PLATFORM_FEE_PERCENT = 10; // 10%

// Minimum Task Amount
export const MIN_TASK_AMOUNT = 10; // ₹10

// Maximum Task Amount
export const MAX_TASK_AMOUNT = 50000; // ₹50,000

// Wallet Limits
export const WALLET_LIMITS = {
  minTopup: 10,
  maxTopup: 50000,
  minWithdrawal: 100,
  maxWithdrawal: 50000,
  maxBalance: 100000,
} as const;

// KYC Requirements
export const KYC_REQUIREMENTS = {
  requiredForBuddy: true,
  requiredForPoster: false,
  requiredForWithdrawal: true,
  minAge: 18,
  documentsRequired: [KYC_DOC_TYPES.AADHAAR, KYC_DOC_TYPES.PAN] as KycDocType[],
  selfieRequired: true,
  liveSelfieRequired: true,
} as const;

// Rating System
export const RATING = {
  min: 1,
  max: 5,
  default: 5,
} as const;

// SOS Configuration
export const SOS_CONFIG = {
  longPressDuration: 3000, // 3 seconds
  hapticFeedback: true,
  alertContacts: 3, // Max emergency contacts
  autoCallPolice: false, // Requires user confirmation
  shareLocation: true,
} as const;

// Image Upload Config
export const IMAGE_CONFIG = {
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 0.7,
  formats: ['jpeg', 'jpg', 'png'] as const,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxImagesPerTask: 5,
  maxImagesPerChat: 3,
} as const;

// Cache Configuration
export const CACHE_CONFIG = {
  tasks: 5 * 60 * 1000, // 5 minutes
  userProfile: 10 * 60 * 1000, // 10 minutes
  categories: 60 * 60 * 1000, // 1 hour
  cities: 24 * 60 * 60 * 1000, // 24 hours
  chatMessages: 2 * 60 * 1000, // 2 minutes
} as const;

// Pagination
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 50,
  feedLimit: 15,
  chatLimit: 30,
} as const;

// Deep Link Paths
export const DEEP_LINKS = {
  task: '/task/',
  chat: '/chat/',
  profile: '/profile/',
  wallet: '/wallet',
  settings: '/settings',
  onboarding: '/onboarding',
  login: '/login',
  register: '/register',
  kyc: '/kyc',
  notifications: '/notifications',
  sos: '/sos',
} as const;

// Feature Flags (for phased rollout)
export const FEATURE_FLAGS = {
  sosEnabled: true,
  liveTrackingEnabled: true,
  voiceMessagesEnabled: true,
  hindiEnabled: true,
  cashPaymentEnabled: true,
  upiPaymentEnabled: true,
  cardPaymentEnabled: true,
  referralEnabled: true,
  disputeResolutionEnabled: true,
} as const;

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  KYC_REQUIRED: 'KYC_REQUIRED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TASK_NOT_AVAILABLE: 'TASK_NOT_AVAILABLE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  LOCATION_PERMISSION_DENIED: 'LOCATION_PERMISSION_DENIED',
  CAMERA_PERMISSION_DENIED: 'CAMERA_PERMISSION_DENIED',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  authToken: 'auth_token',
  refreshToken: 'refresh_token',
  userProfile: 'user_profile',
  language: 'language',
  city: 'city',
  fcmToken: 'fcm_token',
  onboardingComplete: 'onboarding_complete',
  kycSubmitted: 'kyc_submitted',
  pushNotificationsEnabled: 'push_notifications_enabled',
  locationPermissionGranted: 'location_permission_granted',
  cameraPermissionGranted: 'camera_permission_granted',
  lastKnownLocation: 'last_known_location',
  walletBalance: 'wallet_balance',
  theme: 'theme',
} as const;
// Payment (MVP: PayU only)
export const PAYMENT_CONFIG = {
  currency: 'INR',
} as const;
