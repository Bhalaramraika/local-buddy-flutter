/**
 * Database Models & Firestore Collection References
 * Type-safe collection helpers matching Architecture.md schema
 */

import { getFirestore } from './config/firebase';
import { FieldValue, Firestore } from 'firebase-admin/firestore';

// Lazy Firestore instance so importing this module never throws,
// even before Firebase Admin is initialized.
let _db: Firestore | null = null;
export function getDb(): Firestore {
  if (!_db) _db = getFirestore();
  return _db;
}

// ============================================================
// Collection References (lazy getters)
// ============================================================

export const collections = {
  get users() { return getDb().collection('users'); },
  get tasks() { return getDb().collection('tasks'); },
  get chats() { return getDb().collection('chats'); },
  get transactions() { return getDb().collection('transactions'); },
  get reviews() { return getDb().collection('reviews'); },
  get referrals() { return getDb().collection('referrals'); },
  get verifications() { return getDb().collection('verifications'); },
  get otpSessions() { return getDb().collection('otp_sessions'); },
  get userLocks() { return getDb().collection('user_locks'); },
  get jobs() { return getDb().collection('jobs'); },
};

// Sub-collection helpers
export const subCollections = {
  messages: (chatId: string) => collections.chats.doc(chatId).collection('messages'),
  notifications: (userId: string) => collections.users.doc(userId).collection('notifications'),
};

// ============================================================
// Domain Types (mirrors types/index.ts in mobile app)
// ============================================================

export type UserRole = 'customer' | 'buddy' | 'admin';
export type KYCStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'not_started';
// Task lifecycle is exactly these 4 states:
//   open      → visible to everyone (poster + all buddies); anyone can apply
//   assigned  → visible only to poster + assigned buddy
//   completed → visible only to poster (payment is tracked via `paidAt`, NOT a status)
//   deleted   → visible only to poster
export type TaskStatus = 'open' | 'assigned' | 'completed' | 'deleted';
export type PaymentMode = 'online' | 'cash';
export type TransactionType = 'add' | 'release' | 'commission_payment' | 'lock' | 'withdraw';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface UserDocument {
  id: string;
  email: string;
  phone?: string;
  name: string;
  bio?: string;
  skills?: string[];
  dateOfBirth?: string;
  profileCompleted?: boolean;
  referralCode?: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended' | 'banned' | 'deleted';
  isActive: boolean;
  language: 'en' | 'hi';
  city: string;
  area?: string;
  coordinates?: { latitude: number; longitude: number };
  kyc: {
    status: KYCStatus;
    documents: any[];
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
    bankAccounts: any[];
  };
  rating: {
    average: number;
    count: number;
    breakdown: Record<number, number>;
  };
  stats: {
    tasksCompleted: number;
    tasksPosted: number;
    totalEarnings: number;
    totalSpent: number;
    responseTime: number;
    completionRate: number;
  };
  preferences: Record<string, any>;
  fcmTokens: string[];
  currentLocation?: { latitude: number; longitude: number; updatedAt: string };
  referredBy?: string;
  commissionDue: number;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
}

export interface TaskDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  tip: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    geohash?: string;
  };
  deadline: string;
  posterId: string;
  buddyId?: string;
  paymentMode: PaymentMode;
  status: TaskStatus;
  chatId?: string;
  attachments: string[];
  requirements: string[];
  createdAt: string;
  updatedAt: string;
  /** Set when a buddy is assigned (assignment also creates the OTP secrets doc). */
  assignedAt?: string;
  /** Set when the buddy verifies the 4-digit START OTP (work begins). */
  startedAt?: string;
  /** Set when the buddy asks the poster to release payment (online tasks). */
  paymentRequestedAt?: string;
  completedAt?: string;
  /** Set when the poster releases payment (online). Task stays `completed`;
   *  payment is this timestamp, never a status value. */
  paidAt?: string;
}

/**
 * Task OTP secrets live in `tasks/{taskId}/secrets/otp` — a subcollection the
 * Firestore rules restrict to the POSTER only. The buddy must physically get
 * the code from the poster and enter it in their own app to start / complete
 * the task. Never store these on the task doc itself (buddy can read it while
 * assigned, which would defeat the verification).
 */
export interface TaskOtpSecrets {
  startCode: string;
  completeCode: string;
  startVerifiedAt?: string;
  completeVerifiedAt?: string;
  updatedAt: string;
}

export interface ChatDocument {
  id: string;
  participants: string[];
  taskId?: string;
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MessageDocument {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'system' | 'payment_request';
  metadata?: Record<string, any>;
}

export interface TransactionDocument {
  id: string;
  userId: string;
  taskId?: string;
  type: TransactionType;
  amount: number;
  gateway: 'payu' | 'wallet' | 'cash';
  status: TransactionStatus;
  txnid: string; // PayU idempotency key
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDocument {
  id: string;
  rating: number;
  comment: string;
  reviewerId: string;
  revieweeId: string;
  taskId: string;
  createdAt: string;
}

export interface VerificationDocument {
  id: string;
  userId: string;
  type: 'aadhaar' | 'pan' | 'driving_license' | 'voter_id' | 'passport';
  documentUrls: { front: string; back?: string; selfie?: string };
  status: 'pending' | 'verified' | 'rejected';
  extractedData?: Record<string, any>;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OTPSession {
  id: string;
  email: string;
  stateId: string;
  attempts: number;
  expiresAt: string;
  createdAt: string;
  verified: boolean;
  // Dev fallback only - OTP stored only when MOJOAUTH_API_KEY not set
  otp?: string;
}

export interface UserLock {
  id: string;
  email: string;
  reason: string;
  lockedUntil: string;
  attempts: number;
  createdAt: string;
}

// ============================================================
// Firestore Helpers
// ============================================================

export const timestamp = () => new Date().toISOString();
export const serverTimestamp = () => FieldValue.serverTimestamp();

/** Platform commission on every task (10%). The buddy always receives 100%
 *  of the task amount — the 10% platform charge accrues as a negative
 *  balance (`commissionDue`) on the buddy's account. */
export const PLATFORM_FEE_RATE = 0.10;
/** Buddy cannot apply to (or be assigned) new tasks while commissionDue
 *  exceeds this amount (₹), until they clear it via PayU. */
export const COMMISSION_BLOCK_THRESHOLD = 200;

/**
 * Run a Firestore transaction with retries
 */
export async function runTransaction<T>(
  updateFn: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getDb().runTransaction(updateFn);
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      if (err.code === 'aborted') {
        console.warn(`[DB] Transaction aborted, retry ${attempt}/${maxRetries}`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Transaction failed after max retries');
}