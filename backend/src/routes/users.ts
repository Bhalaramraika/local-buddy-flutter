/**
 * User Routes
 * Profile, KYC, preferences, location
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { collections, UserDocument, KYCStatus, runTransaction, timestamp } from '../models';
import { requireAuth, requireRole, requireKYC, optionalAuth } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { getAuth } from '../config/firebase';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const updateProfileSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string().max(40)).max(20).optional(),
  dateOfBirth: z.string().optional(),
  profileCompleted: z.boolean().optional(),
  referralCode: z.string().max(30).optional(),
  role: z.enum(['customer', 'buddy']).optional(),
  language: z.enum(['en', 'hi']).optional(),
  city: z.string().max(50).optional(),
  area: z.string().max(100).optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  preferences: z.record(z.any()).optional(),
});

const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

const kycSubmitSchema = z.object({
  type: z.enum(['aadhaar', 'pan', 'driving_license', 'voter_id', 'passport']),
  documentUrls: z.object({
    front: z.string().url(),
    back: z.string().url().optional(),
    selfie: z.string().url().optional(),
  }),
});

const fcmTokenSchema = z.object({
  token: z.string().min(1),
});

// ============================================================
// Routes (note: static /me/* and /search paths are registered before /:id)
// ============================================================

/**
 * GET /api/v1/users/me/profile
 * Get current user's full profile
 */
router.get('/me/profile', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }
  res.json({ success: true, user: userDoc.data() });
});

/**
 * GET /api/v1/users
 * List active users (for chat/new-chat flows). Excludes sensitive fields.
 */
router.get(
  '/',
  requireAuth,
  validateQuery(z.object({ limit: z.coerce.number().min(1).max(100).default(50), offset: z.coerce.number().min(0).default(0) })),
  async (req: Request, res: Response) => {
    const { limit, offset } = req.query as any;
    const snap = await collections.users
      .where('status', '==', 'active')
      .limit(limit + offset)
      .get();
    const users = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((u) => u.id !== req.user!.uid)
      .slice(offset, offset + limit)
      .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar, role: u.role, city: u.city }));
    res.json({ success: true, users });
  }
);

/**
 * PUT /api/v1/users/me/profile
 * Update current user profile
 */
router.put(
  '/me/profile',
  requireAuth,
  validateBody(updateProfileSchema),
  async (req: Request, res: Response) => {
    const updates = req.body;
    const userRef = collections.users.doc(req.user!.uid);
    
    await userRef.update({
      ...updates,
      updatedAt: timestamp(),
    });

    const updatedDoc = await userRef.get();
    res.json({ success: true, user: updatedDoc.data() });
  }
);

/**
 * PUT /api/v1/users/me/location
 * Update current user's location
 */
router.put(
  '/me/location',
  requireAuth,
  validateBody(updateLocationSchema),
  async (req: Request, res: Response) => {
    const { latitude, longitude, address } = req.body;
    const userRef = collections.users.doc(req.user!.uid);
    
    await userRef.update({
      currentLocation: {
        latitude,
        longitude,
        updatedAt: timestamp(),
      },
      city: address?.split(',')[0] || req.user!.userDoc?.city || '',
      updatedAt: timestamp(),
    });

    res.json({ success: true });
  }
);

/**
 * POST /api/v1/users/me/kyc
 * Submit KYC documents
 */
router.post(
  '/me/kyc',
  requireAuth,
  validateBody(kycSubmitSchema),
  async (req: Request, res: Response) => {
    const { type, documentUrls } = req.body;
    const userRef = collections.users.doc(req.user!.uid);
    const userDoc = await userRef.get();
    const user = userDoc.data() as UserDocument;

    // Check if already verified
    if (user.kyc.status === 'verified') {
      throw new BadRequestError('KYC already verified');
    }

    // Create verification document
    const verificationRef = collections.verifications.doc();
    await verificationRef.set({
      id: verificationRef.id,
      userId: req.user!.uid,
      type,
      documentUrls,
      status: 'pending',
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });

    // Update user KYC status
    await userRef.update({
      'kyc.status': 'pending',
      'kyc.documents': FieldValue.arrayUnion({
        type,
        verificationId: verificationRef.id,
        submittedAt: timestamp(),
      }),
      updatedAt: timestamp(),
    });

    res.json({ success: true, verificationId: verificationRef.id });
  }
);

/**
 * GET /api/v1/users/me/kyc
 * Get KYC status
 */
router.get('/me/kyc', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  const user = userDoc.data() as UserDocument;
  
  // Get verification documents
  const verifications = await collections.verifications
    .where('userId', '==', req.user!.uid)
    .get();

  res.json({
    success: true,
    kyc: user.kyc,
    documents: verifications.docs.map(d => d.data()),
  });
});

/**
 * POST /api/v1/users/me/fcm-token
 * Register FCM token for push notifications
 */
router.post(
  '/me/fcm-token',
  requireAuth,
  validateBody(fcmTokenSchema),
  async (req: Request, res: Response) => {
    const { token } = req.body;
    const userRef = collections.users.doc(req.user!.uid);
    
    await userRef.update({
      fcmTokens: FieldValue.arrayUnion(token),
      updatedAt: timestamp(),
    });

    res.json({ success: true });
  }
);

/**
 * DELETE /api/v1/users/me/fcm-token
 * Remove FCM token
 */
router.delete(
  '/me/fcm-token',
  requireAuth,
  validateBody(fcmTokenSchema),
  async (req: Request, res: Response) => {
    const { token } = req.body;
    const userRef = collections.users.doc(req.user!.uid);
    
    await userRef.update({
      fcmTokens: FieldValue.arrayRemove(token),
      updatedAt: timestamp(),
    });

    res.json({ success: true });
  }
);

/**
 * GET /api/v1/users/me/blocked
 * Get blocked users list
 */
router.get('/me/blocked', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  const blockedIds: string[] = (userDoc.data() as any)?.blockedUsers || [];
  if (blockedIds.length === 0) {
    res.json({ success: true, blocked: [] });
    return;
  }
  const snaps = await Promise.all(blockedIds.slice(0, 30).map((id) => collections.users.doc(id).get()));
  const blocked = snaps
    .filter((s) => s.exists)
    .map((s) => {
      const u = s.data() as any;
      return { id: u.id, name: u.name, avatar: u.avatar, role: u.role };
    });
  res.json({ success: true, blocked });
});

/**
 * PUT /api/v1/users/me/blocked/:id
 * Toggle block/unblock a user
 */
router.put(
  '/me/blocked/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const targetId = req.params.id;
    if (targetId === req.user!.uid) throw new BadRequestError('Cannot block yourself');
    const targetDoc = await collections.users.doc(targetId).get();
    if (!targetDoc.exists) throw new NotFoundError('User not found');
    const userRef = collections.users.doc(req.user!.uid);
    const user = (await userRef.get()).data() as any;
    const blockedList: string[] = user?.blockedUsers || [];
    const blocked = !blockedList.includes(targetId);
    await userRef.update({
      blockedUsers: blocked ? FieldValue.arrayUnion(targetId) : FieldValue.arrayRemove(targetId),
      updatedAt: timestamp(),
    });
    res.json({ success: true, blocked });
  }
);

/**
 * GET /api/v1/users/me/stats
 * Get user statistics
 */
router.get('/me/stats', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  const user = userDoc.data() as UserDocument;
  
  res.json({ success: true, stats: user.stats });
});

/**
 * GET /api/v1/users/search
 * Search users by name/phone (admin only)
 */
router.get(
  '/search',
  requireAuth,
  requireRole('admin'),
  validateQuery(z.object({
    q: z.string().min(1),
    limit: z.coerce.number().min(1).max(50).default(20),
  })),
  async (req: Request, res: Response) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    
    // Search by name (Firestore doesn't support full-text search natively)
    // In production, use Algolia or Typesense
    const usersSnap = await collections.users
      .where('name', '>=', q)
      .where('name', '<=', q + '\uf8ff')
      .limit(limit)
      .get();

    const users = usersSnap.docs.map(d => {
      const u = d.data() as UserDocument;
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        avatar: u.avatar,
        role: u.role,
        status: u.status,
        city: u.city,
      };
    });

    res.json({ success: true, users });
  }
);

export default router;