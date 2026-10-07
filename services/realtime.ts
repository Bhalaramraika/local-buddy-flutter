/**
 * Realtime Sync Service
 *
 * Firestore onSnapshot listeners that sync Firestore data into the
 * zustand stores. Replaces the old Socket.IO layer — the app writes
 * through the REST API (backend) and listens to Firestore directly.
 *
 * MVP scope: chat list, chat messages, my tasks, nearby/open tasks,
 * assigned tasks, live location (via task doc chatId based listeners
 * can be added later).
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  onSnapshot,
  Unsubscribe,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { useChatStore } from '@/store/chatStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useKYCStore } from '@/store/kycStore';
import type { Task, Chat, Message } from '@/types';

const listeners: Map<string, Unsubscribe> = new Map();

// ============================================================
// Mappers: Firestore doc -> app domain type
// ============================================================

function mapTask(id: string, d: DocumentData): Task {
  return {
    id,
    title: d.title ?? '',
    description: d.description ?? '',
    category: d.category ?? 'other',
    urgency: d.urgency ?? 'medium',
    status: d.status ?? 'open',
    budget: {
      amount: typeof d.budget === 'number' ? d.budget : (d.budget?.amount ?? 0),
      currency: 'INR',
      type: d.budget?.type ?? 'fixed',
    },
    location: {
      address: d.location?.address ?? '',
      area: d.location?.area ?? '',
      city: d.location?.city ?? '',
      coordinates: {
        latitude: d.location?.latitude ?? d.location?.coordinates?.latitude ?? 0,
        longitude: d.location?.longitude ?? d.location?.coordinates?.longitude ?? 0,
      },
      landmark: d.location?.landmark,
    },
    deadline: d.deadline ?? '',
    posterId: d.posterId ?? '',
    buddyId: d.buddyId,
    paymentMode: d.paymentMode ?? 'online',
    tip: d.tip ?? 0,
    attachments: d.attachments ?? [],
    requirements: d.requirements ?? [],
    chatId: d.chatId,
    createdAt: d.createdAt ?? '',
    updatedAt: d.updatedAt ?? '',
    completedAt: d.completedAt,
    paidAt: d.paidAt,
  } as unknown as Task;
}

function mapMessage(chatId: string, id: string, d: DocumentData): Message {
  return {
    id,
    chatId,
    senderId: d.senderId ?? '',
    senderName: d.senderName ?? '',
    senderAvatar: d.senderAvatar,
    type: d.type ?? 'text',
    content: d.text ?? d.content ?? '',
    metadata: d.metadata,
    createdAt: d.timestamp ?? d.createdAt ?? '',
    isRead: d.isRead ?? false,
  } as unknown as Message;
}

function mapChat(id: string, d: DocumentData, currentUserId: string): Chat {
  const participantIds: string[] = d.participants ?? [];
  return {
    id,
    taskId: d.taskId,
    participants: participantIds.map((pid) => ({
      id: pid,
      name: '',
    })) as Chat['participants'],
    lastMessage: d.lastMessage
      ? ({
          id: '',
          chatId: id,
          senderId: d.lastMessage.senderId,
          senderName: '',
          type: 'text',
          content: d.lastMessage.text,
          createdAt: d.lastMessage.timestamp,
          isRead: true,
        } as unknown as Message)
      : undefined,
    unreadCount: d.unreadCounts?.[currentUserId] ?? 0,
    isGroup: d.isGroup ?? false,
    groupName: d.groupName,
    groupAvatar: d.groupAvatar,
    createdAt: d.createdAt ?? '',
    updatedAt: d.updatedAt ?? '',
  } as Chat;
}

// ============================================================
// Listeners
// ============================================================

function snapshotToArray<T>(snap: QuerySnapshot<DocumentData>, map: (id: string, d: DocumentData) => T): T[] {
  return snap.docs.map((docSnap) => map(docSnap.id, docSnap.data()));
}

/**
 * Convert any timestamp-ish value (Firestore Timestamp, ISO string, epoch
 * ms, Date) to epoch milliseconds for sorting.
 */
function toMillis(v: any): number {
  if (!v) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  if (v instanceof Date) return v.getTime();
  return 0;
}

/**
 * Sort newest-first by a timestamp field.
 * Client-side sorting keeps the listeners free of compound indexes
 * (a `where(...) + orderBy(...)` mix requires a composite index; when it is
 * missing the whole listener fails and the app shows no data at all).
 */
function sortNewestFirst<T>(arr: T[], pickField: (item: T) => any): T[] {
  return [...arr].sort((a, b) => toMillis(pickField(b)) - toMillis(pickField(a)));
}

/** Subscribe to all realtime data for the signed-in user. */
export function startRealtimeSync(userId: string): void {
  if (!db) return;
  stopRealtimeSync();

  const firestore = db;

  // --- My user profile (KYC approval is controlled by the `kycApproved`
  // boolean field on the user doc — admin toggles it in the Firestore
  // console and the app unlocks KYC-gated features instantly) ---
  listeners.set(
    'userProfile',
    onSnapshot(
      doc(firestore, 'users', userId),
      (snap) => {
        if (!snap.exists()) return;
        const d = snap.data() as any;

        const approved = d.kycApproved === true || d.kyc?.status === 'verified';
        const kycStatus = approved
          ? 'verified'
          : (d.kyc?.status || 'not_started');

        // Sync auth store (drives KYC gating across the app)
        try {
          useAuthStore.getState().updateKYCStatus(kycStatus, {
            ...(d.kyc || {}),
            approved,
          });
        } catch (e) {
          console.warn('[Realtime] auth KYC sync failed:', e);
        }

        // Sync KYC store
        try {
          useKYCStore.getState().setIsVerified(approved);
          useKYCStore.getState().setKYCStatus({
            status: approved ? 'approved' : (d.kyc?.status === 'pending' ? 'pending' : d.kyc?.status === 'rejected' ? 'rejected' : 'not_started'),
            submittedAt: d.kyc?.submittedAt ?? null,
            reviewedAt: d.kyc?.reviewedAt ?? null,
            rejectionReason: d.kyc?.rejectionReason ?? null,
            documents: d.kyc?.documents ?? [],
          });
        } catch (e) {
          console.warn('[Realtime] KYC store sync failed:', e);
        }

        // Sync wallet from user doc — balance AND the `wallet` object used
        // by the Wallet tab, with the SAME semantics as GET /api/v1/wallet
        // (balance = available; pendingBalance separate; total = sum).
        try {
          if (d.wallet && typeof d.wallet.balance === 'number') {
            const { useWalletStore } = require('@/store/walletStore');
            const bal = d.wallet.balance;
            const pending = d.wallet.pendingBalance ?? 0;
            const currency = d.wallet.currency ?? 'INR';
            const earnings = d.stats?.totalEarnings ?? 0;
            const spent = d.stats?.totalSpent ?? 0;
            useWalletStore.setState({
              wallet: {
                balance: bal,
                pendingBalance: pending,
                currency,
                upiId: d.wallet.upiId,
                totalEarnings: earnings,
                totalSpent: spent,
              },
              balance: {
                available: bal,
                pending,
                total: bal + pending,
                currency,
              },
            });
          }
        } catch {
          // wallet store sync is best-effort — non-fatal
        }
      },
      (err) => console.warn('[Realtime] userProfile listener error:', err?.code, err?.message)
    )
  );

  // --- Chats for this user ---
  listeners.set(
    'chats',
    onSnapshot(
      query(
        collection(firestore, 'chats'),
        where('participants', 'array-contains', userId),
        fbLimit(50)
      ),
      (snap) => {
        const chats = snapshotToArray(snap, (id, d) => mapChat(id, d, userId));
        useChatStore.getState().setChats(sortNewestFirst(chats, (c) => c.updatedAt));
      },
      (err) => console.warn('[Realtime] chats listener error:', err?.code, err?.message)
    )
  );

  // --- My posted tasks ---
  listeners.set(
    'myTasks',
    onSnapshot(
      query(
        collection(firestore, 'tasks'),
        where('posterId', '==', userId),
        fbLimit(50)
      ),
      (snap) => {
        const tasks = snapshotToArray(snap, mapTask);
        useTaskStore.getState().setMyTasks(sortNewestFirst(tasks, (t) => t.createdAt));
      },
      (err) => console.warn('[Realtime] myTasks listener error:', err?.code, err?.message)
    )
  );

  // --- Tasks assigned to me ---
  listeners.set(
    'assignedTasks',
    onSnapshot(
      query(
        collection(firestore, 'tasks'),
        where('buddyId', '==', userId),
        fbLimit(50)
      ),
      (snap) => {
        const tasks = snapshotToArray(snap, mapTask);
        useTaskStore.getState().setAssignedTasks(sortNewestFirst(tasks, (t) => t.createdAt));
      },
      (err) => console.warn('[Realtime] assignedTasks listener error:', err?.code, err?.message)
    )
  );

  // --- Open marketplace tasks (nearby filtering is client-side) ---
  listeners.set(
    'nearbyTasks',
    onSnapshot(
      query(
        collection(firestore, 'tasks'),
        where('status', '==', 'open'),
        fbLimit(100)
      ),
      (snap) => {
        const tasks = snapshotToArray(snap, mapTask);
        useTaskStore.getState().setNearbyTasks(sortNewestFirst(tasks, (t) => t.createdAt));
      },
      (err) => console.warn('[Realtime] nearbyTasks listener error:', err?.code, err?.message)
    )
  );
}

/** Subscribe to messages of one chat. Returns unsubscribe. */
export function subscribeToChatMessages(chatId: string): (() => void) | null {
  if (!db) return null;
  const key = `messages:${chatId}`;
  listeners.get(key)?.();

  const firestore = db;
  const unsub = onSnapshot(
    query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc'),
      fbLimit(200)
    ),
    (snap) => {
      const store = useChatStore.getState();
      snap.docChanges().forEach((change) => {
        const msg = mapMessage(chatId, change.doc.id, change.doc.data());
        if (change.type === 'added' || change.type === 'modified') {
          store.handleNewMessage(msg);
        } else if (change.type === 'removed') {
          store.removeMessage(chatId, change.doc.id);
        }
      });
    },
    (err) => console.warn('[Realtime] messages listener error:', err?.code, err?.message)
  );

  listeners.set(key, unsub);
  return () => {
    listeners.delete(key);
    unsub();
  };
}

/** Stop all realtime listeners (on logout). */
export function stopRealtimeSync(): void {
  listeners.forEach((unsub) => unsub());
  listeners.clear();
}
