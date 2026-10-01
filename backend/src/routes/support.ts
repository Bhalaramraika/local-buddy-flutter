/**
 * Support Routes
 * Tickets + FAQ
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, getDb, timestamp } from '../models';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = Router();

const FAQ = [
  {
    id: 'account',
    question: 'How do I create an account?',
    answer:
      'Open the app and tap Sign Up. Enter your name and email, verify with the OTP sent to your email, and your account is ready. All posting and verification happens server-side.',
  },
  {
    id: 'otp',
    question: 'I did not receive the OTP email. What should I do?',
    answer:
      'Check spam/junk folder and wait a moment. Tap Resend OTP on the verification screen. If it still fails, contact support with your email address.',
  },
  {
    id: 'kyc',
    question: 'Do I need KYC to add money or withdraw?',
    answer:
      'Wallet top-ups and task payments require KYC on this marketplace. Document uploads are reviewed by the ops team.',
  },
  {
    id: 'payments',
    question: 'Which payment methods are supported?',
    answer:
      'We use PayU for all payments: UPI, cards, net banking and wallets. Payments are verified server-side before your wallet is credited.',
  },
  {
    id: 'cash',
    question: 'Can I pay cash for a task?',
    answer:
      'A task can be marked cash-on-completion. The escrow release for wallet tasks stays in-app.',
  },
  {
    id: 'data',
    question: 'How do I clear my app data?',
    answer:
      'You can refresh by logging out and logging in again. Delete-account flow is available in Settings → Account Settings.',
  },
];

router.get('/faq', (_req: Request, res: Response) => {
  res.json({ success: true, faq: FAQ });
});

router.post(
  '/tickets',
  requireAuth,
  validateBody(
    z.object({
      subject: z.string().min(3).max(200),
      description: z.string().min(10).max(2000),
    })
  ),
  async (req: Request, res: Response) => {
    const ticketRef = getDb().collection('support_tickets').doc();
    await ticketRef.set({
      id: ticketRef.id,
      userId: req.user!.uid,
      subject: req.body.subject,
      description: req.body.description,
      status: 'open',
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
    res.json({ success: true, ticket: (await ticketRef.get()).data() });
  }
);

router.get('/tickets', requireAuth, async (req: Request, res: Response) => {
  const snap = await getDb()
    .collection('support_tickets')
    .where('userId', '==', req.user!.uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();
  res.json({ success: true, tickets: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

export default router;
