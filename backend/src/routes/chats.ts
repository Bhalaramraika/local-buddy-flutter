/**
 * Chat Routes
 * CRUD for chats and messages, real-time messaging
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, subCollections, getDb, ChatDocument, MessageDocument, timestamp } from '../models';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { getPushNotificationService } from '../services/pushNotificationService';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const createChatSchema = z.object({
  participantId: z.string().min(1),
  taskId: z.string().optional(),
});

const sendMessageSchema = z.object({
  text: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'payment_request']).default('text'),
  metadata: z.record(z.any()).optional(),
});

const messageQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  before: z.string().datetime().optional(), // ISO timestamp
});

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/v1/chats
 * Create or get existing chat with another user
 */
router.post(
  '/',
  requireAuth,
  validateBody(createChatSchema),
  async (req: Request, res: Response) => {
    const { participantId, taskId } = req.body;
    const currentUserId = req.user!.uid;

    if (participantId === currentUserId) {
      throw new BadRequestError('Cannot create chat with yourself');
    }

    // Check if participant exists
    const participantDoc = await collections.users.doc(participantId).get();
    if (!participantDoc.exists) {
      throw new NotFoundError('Participant not found');
    }

    // Check for existing chat between these users (and task if provided)
    let query = collections.chats
      .where('participants', 'array-contains', currentUserId);

    const snapshot = await query.get();
    let existingChat: ChatDocument | null = null;

    for (const doc of snapshot.docs) {
      const chat = doc.data() as ChatDocument;
      if (chat.participants.includes(participantId) && 
          (!taskId || chat.taskId === taskId)) {
        existingChat = chat;
        break;
      }
    }

    if (existingChat) {
      res.json({ success: true, chat: existingChat, isNew: false });
      return;
    }

    // Create new chat
    const chatRef = collections.chats.doc();
    const chat: ChatDocument = {
      id: chatRef.id,
      participants: [currentUserId, participantId],
      taskId,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await chatRef.set(chat);

    // Add chat reference to both users' subcollections (optional, for quick access)
    await Promise.all([
      collections.users.doc(currentUserId).collection('chats').doc(chatRef.id).set({
        chatId: chatRef.id,
        otherUserId: participantId,
        taskId,
        createdAt: timestamp(),
      }),
      collections.users.doc(participantId).collection('chats').doc(chatRef.id).set({
        chatId: chatRef.id,
        otherUserId: currentUserId,
        taskId,
        createdAt: timestamp(),
      }),
    ]);

    res.status(201).json({ success: true, chat, isNew: true });
  }
);

/**
 * GET /api/v1/chats
 * List current user's chats
 */
router.get(
  '/',
  requireAuth,
  validateQuery(z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    offset: z.coerce.number().min(0).default(0),
  })),
  async (req: Request, res: Response) => {
    const { limit, offset } = req.query as any;

    // Get chats where user is a participant
    const snapshot = await collections.chats
      .where('participants', 'array-contains', req.user!.uid)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const chats = snapshot.docs.map(d => d.data() as ChatDocument);

    // Enrich with other participant info
    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      const otherUserId = chat.participants.find(p => p !== req.user!.uid);
      let otherUser = null;
      if (otherUserId) {
        const userDoc = await collections.users.doc(otherUserId).get();
        if (userDoc.exists) {
          const u = userDoc.data() as any;
          otherUser = { id: u.id, name: u.name, avatar: u.avatar };
        }
      }
      return { ...chat, otherUser };
    }));

    res.json({ success: true, chats: enrichedChats });
  }
);

/**
 * GET /api/v1/chats/:id
 * Get chat details
 */
router.get(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const chatDoc = await collections.chats.doc(id).get();

    if (!chatDoc.exists) {
      throw new NotFoundError('Chat not found');
    }

    const chat = chatDoc.data() as ChatDocument;

    if (!chat.participants.includes(req.user!.uid)) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    // Get other participant info
    const otherUserId = chat.participants.find(p => p !== req.user!.uid);
    let otherUser = null;
    if (otherUserId) {
      const userDoc = await collections.users.doc(otherUserId).get();
      if (userDoc.exists) {
        const u = userDoc.data() as any;
        otherUser = { id: u.id, name: u.name, avatar: u.avatar, phone: u.phone };
      }
    }

    res.json({ success: true, chat: { ...chat, otherUser } });
  }
);

/**
 * GET /api/v1/chats/:id/messages
 * Get chat messages with pagination
 */
router.get(
  '/:id/messages',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  validateQuery(messageQuerySchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit, before } = req.query as any;

    const chatDoc = await collections.chats.doc(id).get();
    if (!chatDoc.exists) {
      throw new NotFoundError('Chat not found');
    }

    const chat = chatDoc.data() as ChatDocument;
    if (!chat.participants.includes(req.user!.uid)) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    let query = subCollections.messages(id).orderBy('timestamp', 'desc').limit(limit);
    if (before) {
      query = query.where('timestamp', '<', before);
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MessageDocument)).reverse();

    res.json({ success: true, messages });
  }
);

/**
 * POST /api/v1/chats/:id/messages
 * Send a message
 */
router.post(
  '/:id/messages',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(sendMessageSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { text, type, metadata } = req.body;

    const chatDoc = await collections.chats.doc(id).get();
    if (!chatDoc.exists) {
      throw new NotFoundError('Chat not found');
    }

    const chat = chatDoc.data() as ChatDocument;
    if (!chat.participants.includes(req.user!.uid)) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    // Create message
    const messageRef = subCollections.messages(id).doc();
    const message: MessageDocument = {
      id: messageRef.id,
      senderId: req.user!.uid,
      text,
      timestamp: timestamp(),
      type,
      metadata,
    };

    await messageRef.set(message);

    // Update chat's last message
    await chatDoc.ref.update({
      lastMessage: {
        text: text.length > 100 ? text.substring(0, 100) + '...' : text,
        senderId: req.user!.uid,
        timestamp: timestamp(),
      },
      updatedAt: timestamp(),
    });

    // Push notification to the other participant (realtime delivery is
    // handled client-side via Firestore listeners on the messages subcollection)
    const otherUserId = chat.participants.find(p => p !== req.user!.uid);
    if (otherUserId) {
      const senderName = req.user!.userDoc?.name || 'Someone';
      getPushNotificationService()
        .sendChatNotification(otherUserId, {
          chatId: id,
          senderName,
          message: text,
          senderId: req.user!.uid,
        })
        .catch((err) => console.error('[FCM] chat notification failed:', err));
    }

    res.status(201).json({ success: true, message });
  }
);

/**
 * PUT /api/v1/chats/:id/read
 * Mark messages as read
 */
router.put(
  '/:id/read',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const chatDoc = await collections.chats.doc(id).get();
    if (!chatDoc.exists) {
      throw new NotFoundError('Chat not found');
    }

    const chat = chatDoc.data() as ChatDocument;
    if (!chat.participants.includes(req.user!.uid)) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    // In a real app, you'd track read receipts per user
    // For now, just acknowledge
    res.json({ success: true });
  }
);

/**
 * DELETE /api/v1/chats/:id
 * Delete/leave chat
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const chatDoc = await collections.chats.doc(id).get();
    if (!chatDoc.exists) {
      throw new NotFoundError('Chat not found');
    }

    const chat = chatDoc.data() as ChatDocument;
    if (!chat.participants.includes(req.user!.uid)) {
      throw new ForbiddenError('Not a participant in this chat');
    }

    // Soft delete: remove user from participants
    const updatedParticipants = chat.participants.filter(p => p !== req.user!.uid);
    
    if (updatedParticipants.length === 0) {
      // Last participant left - delete chat and messages
      const messagesSnap = await subCollections.messages(id).get();
      const batch = getDb().batch();
      messagesSnap.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(chatDoc.ref);
      await batch.commit();
    } else {
      await chatDoc.ref.update({
        participants: updatedParticipants,
        updatedAt: timestamp(),
      });
    }

    res.json({ success: true, message: 'Chat deleted' });
  }
);

export default router;