/**
 * Referral Routes
 * Code generation, apply, stats
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, timestamp } from '../models';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import crypto from 'crypto';

const router = Router();

function generateCode(name: string, uid: string): string {
  const base = (name || 'LB').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 4) || 'LB';
  const rand = crypto.createHash('sha256').update(uid + Date.now().toString()).digest('hex').slice(0, 4).toUpperCase();
  return `${base}${rand}`;
}

/**
 * GET /api/v1/referral/code
 */
router.get('/code', requireAuth, async (req: Request, res: Response) => {
  const userRef = collections.users.doc(req.user!.uid);
  const userDoc = await userRef.get();
  const user = userDoc.data() as any;
  let code = user?.referralCode;
  if (!code) {
    code = generateCode(user?.name || 'LB', req.user!.uid);
    await userRef.update({ referralCode: code, updatedAt: timestamp() });
  }
  res.json({ success: true, code, shareUrl: `https://localbuddy.app/r/${code}` });
});

/**
 * POST /api/v1/referral/apply
 */
router.post(
  '/apply',
  requireAuth,
  validateBody(z.object({ code: z.string().min(3).max(30) })),
  async (req: Request, res: Response) => {
    const { code } = req.body;
    const uid = req.user!.uid;
    const userRef = collections.users.doc(uid);
    const user = (await userRef.get()).data() as any;
    if (user?.referredBy) throw new BadRequestError('Referral already applied');
    const snap = await collections.users.where('referralCode', '==', code).limit(1).get();
    if (snap.empty) throw new NotFoundError('Invalid referral code');
    const referrer = snap.docs[0].data() as any;
    if (snap.docs[0].id === uid) throw new BadRequestError('Cannot refer yourself');

    await collections.referrals.doc().set({
      id: '',
      userId: referrer.id,
      referredUserId: uid,
      code,
      status: 'pending',
      createdAt: timestamp(),
    });
    await userRef.update({ referredBy: referrer.id, updatedAt: timestamp() });
    res.json({ success: true });
  }
);

/**
 * GET /api/v1/referral/stats
 */
router.get('/stats', requireAuth, async (req: Request, res: Response) => {
  const snap = await collections.referrals.where('userId', '==', req.user!.uid).get();
  const items = snap.docs.map((d) => d.data());
  const total = items.length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const pending = total - completed;
  const rewards = completed * 50; // ₹50 per completed referral (business rule placeholder from constants?)
  res.json({ success: true, stats: { total, completed, pending, rewards } });
});

export default router;
