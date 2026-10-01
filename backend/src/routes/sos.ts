/**
 * SOS Routes
 * Emergency contacts + SOS events
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, timestamp } from '../models';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParams } from '../middleware/validation';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(1).max(80),
  phone: z.string().min(5).max(20),
  relation: z.string().max(40).optional(),
  isPrimary: z.boolean().optional(),
});

const triggerSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  message: z.string().max(300).optional(),
});

router.get('/contacts', requireAuth, async (req: Request, res: Response) => {
  const snap = await collections.users.doc(req.user!.uid).collection('sosContacts').get();
  res.json({ success: true, contacts: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.post('/contacts', requireAuth, validateBody(contactSchema), async (req: Request, res: Response) => {
  const { name, phone, relation, isPrimary } = req.body;
  const col = collections.users.doc(req.user!.uid).collection('sosContacts');
  if (isPrimary) {
    const snap = await col.get();
    const batch = col.firestore.batch();
    snap.docs.forEach((d) => batch.update(d.ref, { isPrimary: false }));
    await batch.commit();
  }
  const ref = col.doc();
  await ref.set({ id: ref.id, name, phone, relation: relation || '', isPrimary: !!isPrimary, createdAt: timestamp() });
  res.json({ success: true, contact: (await ref.get()).data() });
});

router.delete('/contacts/:id', requireAuth, validateParams(z.object({ id: z.string() })), async (req: Request, res: Response) => {
  const ref = collections.users.doc(req.user!.uid).collection('sosContacts').doc(req.params.id);
  if (!(await ref.get()).exists) throw new NotFoundError('Contact not found');
  await ref.delete();
  res.json({ success: true });
});

router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const snap = await collections.users
    .doc(req.user!.uid)
    .collection('sosEvents')
    .orderBy('triggeredAt', 'desc')
    .limit(50)
    .get();
  res.json({ success: true, events: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.post('/trigger', requireAuth, validateBody(triggerSchema), async (req: Request, res: Response) => {
  const contactsSnap = await collections.users.doc(req.user!.uid).collection('sosContacts').get();
  const contacts = contactsSnap.docs.map((d) => d.data());
  const ref = collections.users.doc(req.user!.uid).collection('sosEvents').doc();
  await ref.set({
    id: ref.id,
    triggeredAt: timestamp(),
    location: { latitude: req.body.latitude ?? null, longitude: req.body.longitude ?? null },
    message: req.body.message || null,
    notifiedContacts: contacts.map((c: any) => ({ name: c.name, phone: c.phone })),
    status: 'sent',
  });
  // Push notifications to contacts' app users (best-effort; MVP logs only)
  res.json({ success: true, eventId: ref.id, notified: contacts.length });
});

export default router;
