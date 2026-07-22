/**
 * Firestore Collections and Models
 * Centralized collection references and type definitions
 */

import { getFirestore, Firestore, CollectionReference, DocumentReference } from 'firebase-admin/firestore';
import { getFirebaseApp } from './firebase';

// Initialize Firestore
let db: Firestore | null = null;

export function getFirestoreInstance(): Firestore {
  if (!db) {
    const app = getFirebaseApp();
    if (app) {
      db = getFirestore(app);
    } else {
      throw new Error('Firebase not initialized');
    }
  }
  return db;
}

// Collection references
export const collections = {
  users: getCollection('users'),
  tasks: getCollection('tasks'),
  chats: getCollection('chats'),
  messages: getCollection('messages'),
  wallets: getCollection('wallets'),
  transactions: getCollection('transactions'),
  reviews: getCollection('reviews'),
  notifications: getCollection('notifications'),
  locations: getCollection('locations'),
  auditLogs: getCollection('auditLogs'),
  paymentOrders: getCollection('paymentOrders'),
  kycDocuments: getCollection('kycDocuments'),
  sosAlerts: getCollection('sosAlerts'),
  userLocks: getCollection('userLocks'),
};

function getCollection(name: string): CollectionReference {
  const db = getFirestoreInstance();
  return db.collection(name);
}

// Type definitions
export interface User {
  uid: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  role: 'customer' | 'buddy' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  rating: number;
  totalReviews: number;
  completedTasks: number;
  xp: number;
  level: number;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  fcmTokens: string[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  privacy: {
    showPhone: boolean;
    showLocation: boolean;
  };
  language: string;
  currency: string;
}

export interface Task {
  id: string;
  customerId: string;
  buddyId?: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  budget: number;
  currency: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  images: string[];
  requirements: string[];
  assignedBuddies: string[];
  maxBuddies: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  taskId: string;
  customerId: string;
  buddyId: string;
  status: 'active' | 'closed' | 'archived';
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: { customer: number; buddy: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: 'customer' | 'buddy';
  type: 'text' | 'image' | 'location' | 'payment' | 'system';
  content: string;
  metadata?: Record<string, any>;
  readBy: string[];
  createdAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  escrowBalance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: 'credit' | 'debit' | 'escrow_hold' | 'escrow_release' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  referenceId?: string;
  referenceType?: 'task' | 'withdrawal' | 'deposit' | 'refund' | 'payout';
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerRole: 'customer' | 'buddy';
  rating: number;
  comment?: string;
  categories: {
    punctuality: number;
    quality: number;
    communication: number;
  };
  isAnonymous: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assigned' | 'task_completed' | 'payment_received' | 'review_received' | 'sos_alert' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  sentAt?: Date;
  createdAt: Date;
}

export interface LocationSession {
  id: string;
  taskId: string;
  buddyId: string;
  status: 'active' | 'paused' | 'ended';
  startLocation: { latitude: number; longitude: number };
  currentLocation?: { latitude: number; longitude: number };
  path: Array<{ latitude: number; longitude: number; timestamp: Date }>;
  startedAt: Date;
  endedAt?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  taskId?: string;
  amount: number;
  currency: string;
  provider: 'payu' | 'cash';
  providerOrderId?: string;
  status: 'created' | 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentUrl?: string;
  callbackData?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface KYCDocument {
  id: string;
  userId: string;
  type: 'aadhaar' | 'pan' | 'driving_license' | 'passport' | 'selfie';
  documentUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
}

export interface SOSAlert {
  id: string;
  userId: string;
  taskId?: string;
  location: { latitude: number; longitude: number; address?: string };
  status: 'active' | 'resolved' | 'cancelled';
  responders: string[];
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

export interface UserLock {
  id: string;
  userId: string;
  lockedBy: string;
  reason: string;
  expiresAt: Date;
  createdAt: Date;
}