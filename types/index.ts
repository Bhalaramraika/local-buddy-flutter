/**
 * TypeScript Types for Local Buddy App
 * Based on Architecture.md and Features_And_Integrations.md
 */

// User Types
export type UserRole = 'customer' | 'buddy' | 'admin';
export type KYCStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'not_started';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  bio?: string;
  skills?: string[];
  dateOfBirth?: string;
  profileCompleted?: boolean;
  referralCode?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  language: 'en' | 'hi';
  city: string;
  area?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  kyc: {
    status: KYCStatus;
    documents: KYCDocument[];
    submittedAt?: string;
    verifiedAt?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    expiryDate?: string;
  };
  wallet: {
    balance: number;
    pendingBalance: number;
    currency: string;
    upiId?: string;
    bankAccounts: BankAccount[];
  };
  rating: {
    average: number;
    count: number;
    breakdown: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  stats: {
    tasksCompleted: number;
    tasksPosted: number;
    totalEarnings: number;
    totalSpent: number;
    responseTime: number; // in minutes
    completionRate: number; // percentage
  };
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface KYCDocument {
  id: string;
  type: 'aadhaar' | 'pan' | 'driving_license' | 'voter_id' | 'passport';
  frontUrl: string;
  backUrl?: string;
  selfieUrl?: string;
  status: 'pending' | 'verified' | 'rejected';
  extractedData?: Record<string, any>;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  ifsc: string;
  accountHolderName: string;
  bankName: string;
  isVerified: boolean;
  isDefault: boolean;
  addedAt: string;
}

export interface UserPreferences {
  notifications: {
    push: boolean;
    inApp: boolean;
    email: boolean;
    sms: boolean;
    categories: {
      task: boolean;
      chat: boolean;
      wallet: boolean;
      kyc: boolean;
      system: boolean;
      promo: boolean;
      sos: boolean;
      review: boolean;
    };
    quietHours: {
      enabled: boolean;
      start: string; // HH:mm
      end: string; // HH:mm
    };
  };
  privacy: {
    showProfile: boolean;
    showRating: boolean;
    showLocation: boolean;
    allowDirectMessages: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'hi';
    fontSize: 'small' | 'medium' | 'large';
  };
  location: {
    shareLocation: boolean;
    autoAcceptNearby: boolean;
    maxDistance: number; // in km
  };
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginCredentials {
  phone: string;
  otp?: string;
  firebaseToken?: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  email?: string;
  role: UserRole;
  city: string;
  area?: string;
  referralCode?: string;
}

export interface OTPRequest {
  phone: string;
  purpose: 'login' | 'register' | 'verify' | 'reset_password';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn: number;
  sessionId?: string;
}

// Task Types
export type TaskStatus = 
  | 'open' 
  | 'assigned' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed' 
  | 'expired';

export type TaskCategory = 
  | 'delivery' 
  | 'pickup' 
  | 'shopping' 
  | 'errand' 
  | 'repair' 
  | 'cleaning' 
  | 'tutoring' 
  | 'tech_help' 
  | 'transport' 
  | 'other';

export type TaskUrgency = 'low' | 'normal' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  urgency: TaskUrgency;
  status: TaskStatus;
  budget: {
    amount: number; // in paise
    currency: string;
    type: 'fixed' | 'hourly' | 'negotiable';
  };
  location: {
    address: string;
    area: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    landmark?: string;
  };
  customer: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    phone: string;
  };
  buddy?: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    phone: string;
    distance?: number; // in meters
  };
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: 'customer' | 'buddy' | 'system';
  cancellationReason?: string;
  deadline?: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  images: TaskImage[];
  requirements: string[];
  tags: string[];
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentTaskId?: string;
  chatId?: string;
  paymentId?: string;
  review?: TaskReview;
  createdAt: string;
  updatedAt: string;
}

export interface TaskImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'before' | 'after' | 'proof' | 'issue';
  uploadedBy: 'customer' | 'buddy';
  uploadedAt: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[]; // 0-6, Sunday=0
  dayOfMonth?: number;
  endDate?: string;
  maxOccurrences?: number;
}

export interface TaskReview {
  id: string;
  rating: number; // 1-5
  comment?: string;
  categories: {
    punctuality: number;
    quality: number;
    communication: number;
    professionalism: number;
  };
  images: string[];
  isAnonymous: boolean;
  createdAt: string;
  repliedAt?: string;
  reply?: string;
}

export interface TaskFilters {
  status?: TaskStatus[];
  category?: TaskCategory[];
  urgency?: TaskUrgency[];
  minBudget?: number;
  maxBudget?: number;
  distance?: number; // in km
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface TaskSortOptions {
  field: 'createdAt' | 'budget' | 'distance' | 'deadline' | 'urgency';
  order: 'asc' | 'desc';
}

// Chat Types
export type MessageType = 'text' | 'image' | 'location' | 'voice' | 'file' | 'system' | 'payment' | 'task_update';

export interface Chat {
  id: string;
  taskId?: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'buddy' | 'admin';
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  media?: MessageMedia;
  location?: MessageLocation;
  voice?: MessageVoice;
  file?: MessageFile;
  systemData?: SystemMessageData;
  paymentData?: PaymentMessageData;
  taskUpdateData?: TaskUpdateMessageData;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
}

export interface MessageMedia {
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size: number;
  mimeType: string;
  duration?: number; // for video
}

export interface MessageLocation {
  latitude: number;
  longitude: number;
  address: string;
  name?: string;
}

export interface MessageVoice {
  url: string;
  duration: number; // in seconds
  waveform?: number[];
}

export interface MessageFile {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface SystemMessageData {
  type: 'task_assigned' | 'task_started' | 'task_completed' | 'task_cancelled' | 'payment_received' | 'buddy_arrived' | 'kyc_update' | 'review_received';
  taskId?: string;
  data: Record<string, any>;
}

export interface PaymentMessageData {
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
}

export interface TaskUpdateMessageData {
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  updatedBy: string;
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

// Wallet Types
export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  category: 'task_earning' | 'task_payment' | 'wallet_topup' | 'withdrawal' | 'refund' | 'bonus' | 'penalty' | 'referral';
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  referenceId?: string;
  referenceType?: 'task' | 'payment' | 'withdrawal' | 'refund';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    bankName: string;
  };
  upiId?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

export interface WalletStats {
  totalEarnings: number;
  totalSpent: number;
  totalWithdrawn: number;
  currentBalance: number;
  pendingBalance: number;
  thisMonthEarnings: number;
  thisMonthSpending: number;
}

// Location Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: number;
  address?: string;
  city?: string;
  area?: string;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  type: 'task' | 'area' | 'restricted';
  taskId?: string;
  isActive: boolean;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
  createdAt: string;
}

export interface NearbyBuddy {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  distance: number; // in meters
  isAvailable: boolean;
  categories: TaskCategory[];
  lastSeen: string;
}

// Notification Types
export type NotificationType = 
  | 'task_assigned' 
  | 'task_updated' 
  | 'task_completed' 
  | 'task_cancelled'
  | 'chat_message'
  | 'payment_received'
  | 'payment_failed'
  | 'wallet_low_balance'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'kyc_expired'
  | 'sos_alert'
  | 'buddy_nearby'
  | 'review_received'
  | 'system_announcement'
  | 'promo_offer';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  priority: 'high' | 'normal' | 'low';
  actionUrl?: string;
  imageUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categories: Record<NotificationType, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// KYC Types
export interface KYCSubmission {
  documents: {
    aadhaar?: { front: string; back: string };
    pan?: { front: string };
    drivingLicense?: { front: string; back: string };
    voterId?: { front: string; back: string };
    passport?: { front: string };
    selfie: string;
  };
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
}

// Payment Types
export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid' | 'failed';
  attempts: number;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'payu' | 'cash' | 'upi';
  name: string;
  details: {
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
  };
  isDefault: boolean;
}

export interface PayUFormData {
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  curl: string;
  hash: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  service_provider: string;
}

export interface PayUCallbackParams {
  mihpayid: string;
  request_id: string;
  bank_ref_num: string;
  amt: string;
  transaction_amount: string;
  txnid: string;
  additional_charges: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  status: string;
  hash: string;
  key: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

export interface PaymentVerification {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMode: 'payu' | 'cash' | 'upi';
  metadata?: Record<string, any>;
}

export interface CashPaymentDetails {
  transactionId: string;
  amount: number;
  collectedBy?: string;
  collectedAt: string;
  notes?: string;
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// UI Types
export interface ModalState {
  isVisible: boolean;
  type?: string;
  data?: any;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface FormFieldError {
  field: string;
  message: string;
}

// SOS Types
export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  location: LocationData;
  address: string;
  status: 'active' | 'responded' | 'resolved' | 'cancelled';
  responders: SOSResponder[];
  createdAt: string;
  resolvedAt?: string;
}

export interface SOSResponder {
  id: string;
  name: string;
  phone: string;
  distance: number;
  status: 'notified' | 'en_route' | 'arrived' | 'completed';
  eta?: number; // in minutes
}

// Referral Types
export interface ReferralCode {
  code: string;
  userId: string;
  uses: number;
  maxUses: number;
  reward: {
    referrer: number;
    referee: number;
  };
  expiresAt?: string;
  isActive: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  referralCode: string;
}

// App Config Types
export interface AppConfig {
  version: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  firebaseConfig: FirebaseConfig;
  supabaseConfig: SupabaseConfig;
  payuConfig: PayUConfig;
  mapConfig: MapConfig;
  features: FeatureFlags;
  limits: AppLimits;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  vapidKey?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  baseUrl: string;
  webhookSecret: string;
}

export interface MapConfig {
  provider: 'osm' | 'google' | 'mapbox';
  apiKey?: string;
  style?: string;
  defaultCenter: { latitude: number; longitude: number };
  defaultZoom: number;
}

export interface FeatureFlags {
  enableSOS: boolean;
  enableReferral: boolean;
  enableWallet: boolean;
  enableKYC: boolean;
  enableChat: boolean;
  enableLiveTracking: boolean;
  enableRecurringTasks: boolean;
  enableGroupChat: boolean;
  enableVoiceMessages: boolean;
  enableVideoCall: boolean;
}

export interface AppLimits {
  maxTaskImages: number;
  maxChatImages: number;
  maxFileSize: number; // in bytes
  maxVoiceDuration: number; // in seconds
  maxTaskDistance: number; // in km
  minTaskBudget: number; // in paise
  maxTaskBudget: number; // in paise
  minWithdrawal: number; // in paise
  maxWithdrawal: number; // in paise
  platformFeePercent: number;
  kycExpiryDays: number;
  sosResponseTimeMinutes: number;
}

// Error Types
export interface AppError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
  isOperational: boolean;
}

// Event Types
export interface AppEvents {
  'auth:login': { user: User };
  'auth:logout': void;
  'auth:token_refresh': { token: string };
  'task:created': { task: Task };
  'task:updated': { task: Task; previousStatus?: TaskStatus };
  'task:assigned': { task: Task; buddyId: string };
  'task:completed': { task: Task };
  'chat:message': { message: Message };
  'chat:read': { chatId: string; messageId: string };
  'wallet:updated': { balance: WalletBalance };
  'wallet:transaction': { transaction: Transaction };
  'location:updated': { location: LocationData };
  'notification:received': { notification: Notification };
  'notification:read': { notificationId: string };
  'kyc:status_changed': { status: KYCStatus };
  'sos:triggered': { alert: SOSAlert };
  'sos:resolved': { alertId: string };
  'app:background': void;
  'app:foreground': void;
  'network:change': { isConnected: boolean };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Nullable<T> = T | null;

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: AppError | null;
};

// Constants
export const USER_ROLES: UserRole[] = ['customer', 'buddy', 'admin'];
export const KYC_STATUSES: KYCStatus[] = ['pending', 'verified', 'rejected', 'expired', 'not_started'];
export const TASK_STATUSES: TaskStatus[] = ['open', 'assigned', 'in_progress', 'completed', 'cancelled', 'disputed', 'expired'];
export const TASK_CATEGORIES: TaskCategory[] = ['delivery', 'pickup', 'shopping', 'errand', 'repair', 'cleaning', 'tutoring', 'tech_help', 'transport', 'other'];
export const TASK_URGENCIES: TaskUrgency[] = ['low', 'normal', 'high', 'urgent'];
export const MESSAGE_TYPES: MessageType[] = ['text', 'image', 'location', 'voice', 'file', 'system', 'payment', 'task_update'];
export const NOTIFICATION_TYPES: NotificationType[] = [
  'task_assigned', 'task_updated', 'task_completed', 'task_cancelled',
  'chat_message', 'payment_received', 'payment_failed', 'wallet_low_balance',
  'kyc_approved', 'kyc_rejected', 'kyc_expired', 'sos_alert', 'buddy_nearby',
  'review_received', 'system_announcement', 'promo_offer'
];