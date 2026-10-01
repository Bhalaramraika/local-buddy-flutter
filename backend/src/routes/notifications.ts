/**
 * Notification Routes
 * In-app notification list/read state + preferences.
 * Stored as subcollection: users/{uid}/notifications
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, getDb, timestamp } from '../models';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

const listSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(30),
  offset: z.coerce.number().min(0).default(0),
  unreadOnly: z.coerce.boolean().optional(),
});

const prefsSchema = z.object({
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  email: z.boolean().optional(),
  sms: z.boolean().optional(),
  categories: z.record(z.boolean()).optional(),
  quietHours: z
    .object({ enabled: z.boolean(), start: z.string(), end: z.string() })
    .optional(),
});

router.get('/', requireAuth, validateQuery(listSchema), async (req: Request, res: Response) => {
  const { limit, offset, unreadOnly } = req.query as any;
  let query = collections.users
    .doc(req.user!.uid)
    .collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(limit + offset);
  if (unreadOnly) {
    query = query.where('read', '==', false);
  }
  const snap = await query.get();
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const notifications = all.slice(offset, offset + limit);
  const unreadCount = await collections.users
    .doc(req.user!.uid)
    .collection('notifications')
    .where('read', '==', false)
    .get()
    .then((s) => s.size)
    .catch(() => 0);
  res.json({ success: true, notifications, unreadCount, hasMore: all.length === limit + offset });
});

router.put('/:id/read', requireAuth, validateParams(z.object({ id: z.string() })), async (req: Request, res: Response) => {
  const ref = collections.users.doc(req.user!.uid).collection('notifications').doc(req.params.id);
  const doc = await ref.get();
  if (!doc.exists) throw new NotFoundError('Notification not found');
  await ref.update({ read: true, readAt: timestamp() });
  res.json({ success: true });
});

router.put('/read-all', requireAuth, async (req: Request, res: Response) => {
  const snap = await collections.users
    .doc(req.user!.uid)
    .collection('notifications')
    .where('read', '==', false)
    .get();
  const batch = getDb().batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true, readAt: timestamp() }));
  await batch.commit();
  res.json({ success: true, updated: snap.size });
});

router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  const prefs = (userDoc.data() as any)?.preferences?.notifications || {};
  res.json({ success: true, preferences: prefs });
});

router.put('/preferences', requireAuth, validateBody(prefsSchema), async (req: Request, res: Response) => {
  const userRef = collections.users.doc(req.user!.uid);
  const userDoc = await userRef.get();
  const current = (userDoc.data() as any)?.preferences || {};
  const merged = {
    ...current,
    notifications: { ...(current.notifications || {}), ...req.body },
  };
  await userRef.update({ preferences: merged, updatedAt: timestamp() });
  res.json({ success: true, preferences: merged.notifications });
});

export default router;
