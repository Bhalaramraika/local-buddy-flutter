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

/** Subscribe to all realtime data for the signed-in user. */
export function startRealtimeSync(userId: string): void {
  if (!db) return;
  stopRealtimeSync();

  const firestore = db;

  // --- Chats for this user ---
  listeners.set(
    'chats',
    onSnapshot(
      query(
        collection(firestore, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc'),
        fbLimit(50)
      ),
      (snap) => {
        const chats = snapshotToArray(snap, (id, d) => mapChat(id, d, userId));
        useChatStore.getState().setChats(chats);
      },
      (err) => console.warn('[Realtime] chats listener error:', err)
    )
  );

  // --- My posted tasks ---
  listeners.set(
    'myTasks',
    onSnapshot(
      query(
        collection(firestore, 'tasks'),
        where('posterId', '==', userId),
        orderBy('createdAt', 'desc'),
        fbLimit(50)
      ),
      (snap) => {
        useTaskStore.getState().setMyTasks(snapshotToArray(snap, mapTask));
      },
      (err) => console.warn('[Realtime] myTasks listener error:', err)
    )
  );

  // --- Tasks assigned to me ---
  listeners.set(
    'assignedTasks',
    onSnapshot(
      query(
        collection(firestore, 'tasks'),
        where('buddyId', '==', userId),
        orderBy('createdAt', 'desc'),
        fbLimit(50)
      ),
      (snap) => {
        useTaskStore.getState().setAssignedTasks(snapshotToArray(snap, mapTask));
      },
      (err) => console.warn('[Realtime] assignedTasks listener error:', err)
    )
  );

  // --- Open marketplace tasks (nearby filtering is client-side) ---
  listeners.set(
    'nearbyTasks',
    onSnapshot(
      query(
        collection(firestore, 'tasks'),
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc'),
        fbLimit(100)
      ),
      (snap) => {
        useTaskStore.getState().setNearbyTasks(snapshotToArray(snap, mapTask));
      },
      (err) => console.warn('[Realtime] nearbyTasks listener error:', err)
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
    (err) => console.warn('[Realtime] messages listener error:', err)
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
