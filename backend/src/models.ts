/**
 * Database Models & Firestore Collection References
 * Type-safe collection helpers matching Architecture.md schema
 */

import { getFirestore } from './firebase';
import { FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// ============================================================
// Collection References
// ============================================================

export const collections = {
  users: db.collection('users'),
  tasks: db.collection('tasks'),
  chats: db.collection('chats'),
  transactions: db.collection('transactions'),
  reviews: db.collection('reviews'),
  verifications: db.collection('verifications'),
  otpSessions: db.collection('otp_sessions'),
  userLocks: db.collection('user_locks'),
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
export type TaskStatus = 'open' | 'assigned' | 'completed' | 'paid' | 'deleted';
export type PaymentMode = 'online' | 'cash';
export type TransactionType = 'add' | 'release' | 'commission_payment' | 'lock' | 'withdraw';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface UserDocument {
  id: string;
  phone: string;
  email?: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended' | 'banned';
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
  referralCode?: string;
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
  completedAt?: string;
  paidAt?: string;
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
  phone: string;
  otp: string;
  attempts: number;
  expiresAt: string;
  createdAt: string;
  verified: boolean;
}

export interface UserLock {
  id: string;
  phone: string;
  reason: string;
  lockedUntil: string;
  createdAt: string;
}

// ============================================================
// Firestore Helpers
// ============================================================

export const timestamp = () => new Date().toISOString();
export const serverTimestamp = () => FieldValue.serverTimestamp();

/**
 * Run a Firestore transaction with retries
 */
export async function runTransaction<T>(
  updateFn: (transaction: FirebaseFirestore.Transaction) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await db.runTransaction(updateFn);
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