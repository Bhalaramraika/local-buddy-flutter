/**
 * Wallet Routes
 * Balance, transactions, PayU top-up and in-app payment release.
 * NOTE: Withdrawals are removed from the MVP.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, TransactionDocument, runTransaction, timestamp } from '../models';
import { requireAuth, requireKYC } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { config } from '../config';
import { getPushNotificationService } from '../services/pushNotificationService';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// ============================================================
// Schemas
// NOTE: All money amounts are in whole INR (₹), not paise.
// ============================================================

const addMoneySchema = z.object({
  amount: z.number().positive().max(50000),
  paymentMode: z.enum(['payu']).default('payu'),
});

// PayU sends response hash in REVERSE sequence:
// salt|status||||||udf10|udf9|...|udf1|email|firstname|productinfo|amount|txnid|key
const payuCallbackSchema = z.object({
  mihpayid: z.string(),
  status: z.string(),
  txnid: z.string(),
  amount: z.string(),
  productinfo: z.string(),
  firstname: z.string(),
  email: z.string(),
  phone: z.string().optional().default(''),
  hash: z.string(),
  udf1: z.string().optional().default(''),
  udf2: z.string().optional().default(''),
  udf3: z.string().optional().default(''),
  udf4: z.string().optional().default(''),
  udf5: z.string().optional().default(''),
  udf6: z.string().optional().default(''),
  udf7: z.string().optional().default(''),
  udf8: z.string().optional().default(''),
  udf9: z.string().optional().default(''),
  udf10: z.string().optional().default(''),
});

const transactionQuerySchema = z.object({
  type: z.enum(['add', 'release', 'commission_payment', 'lock']).optional(),
  status: z.enum(['pending', 'success', 'failed', 'refunded']).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================
// Helpers
// ============================================================

function generateTxnId(): string {
  return `LB_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

function generatePayUHash(params: Record<string, string>, salt: string): string {
  // PayU request hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|...|udf10|salt
  const sequence = [
    config.payu.merchantKey,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    params.udf6 || '',
    params.udf7 || '',
    params.udf8 || '',
    params.udf9 || '',
    params.udf10 || '',
    salt,
  ];
  const hashString = sequence.join('|');
  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Verify PayU response hash.
 * Sequence: salt|status|udf10|udf9|...|udf1|email|firstname|productinfo|amount|txnid|key
 * (response hash is the REVERSE of the request hash)
 */
function verifyPayUResponseHash(params: Record<string, string>, salt: string): boolean {
  const receivedHash = params.hash;
  if (!receivedHash) return false;

  const sequence = [
    salt,
    params.status,
    params.udf10 || '',
    params.udf9 || '',
    params.udf8 || '',
    params.udf7 || '',
    params.udf6 || '',
    params.udf5 || '',
    params.udf4 || '',
    params.udf3 || '',
    params.udf2 || '',
    params.udf1 || '',
    params.email,
    params.firstname,
    params.productinfo,
    params.amount,
    params.txnid,
    config.payu.merchantKey,
  ];
  const calculatedHash = crypto
    .createHash('sha512')
    .update(sequence.join('|'))
    .digest('hex');
  return receivedHash.toLowerCase() === calculatedHash.toLowerCase();
}

// ============================================================
// Routes
// ============================================================

/**
 * GET /api/v1/wallet
 * Get wallet balance
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }

  const user = userDoc.data() as any;
  res.json({
    success: true,
    wallet: {
      balance: user.wallet?.balance || 0,
      pendingBalance: user.wallet?.pendingBalance || 0,
      currency: user.wallet?.currency || 'INR',
      upiId: user.wallet?.upiId,
    },
  });
});

/**
 * POST /api/v1/wallet/add-money
 * Initiate add money via PayU
 */
router.post(
  '/add-money',
  requireAuth,
  requireKYC,
  validateBody(addMoneySchema),
  async (req: Request, res: Response) => {
    const { amount, paymentMode } = req.body;
    const userId = req.user!.uid;
    const txnid = generateTxnId();

    // Create pending transaction
    const txnRef = collections.transactions.doc();
    const transaction: TransactionDocument = {
      id: txnRef.id,
      userId,
      type: 'add',
      amount,
      gateway: 'payu',
      status: 'pending',
      txnid,
      description: `Add ₹${amount} to wallet`,
      metadata: { paymentMode },
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await txnRef.set(transaction);

    // PayU mandatory params include surl/furl (success/failure redirect URLs).
    // Without them PayU rejects the transaction with
    // "One or more mandatory parameters are missing" before checkout opens.
    // Priority: API_PUBLIC_URL env → request-derived origin (https via proxy).
    const apiBase =
      process.env.API_PUBLIC_URL ||
      `${req.protocol}://${req.get('host')}`;
    const callbackUrl = `${apiBase}/api/v1/wallet/payu/callback`;

    // Generate PayU hash
    const payuParams = {
      key: config.payu.merchantKey,
      txnid,
      amount: amount.toFixed(2),
      productinfo: 'Wallet Top-up',
      firstname: req.user!.userDoc?.name || 'User',
      email: req.user!.userDoc?.email || 'user@localbuddy.app',
      phone: req.user!.phone || req.user!.userDoc?.phone || '9999999999',
      surl: callbackUrl,
      furl: callbackUrl,
      udf1: userId,
      udf2: 'wallet_add',
      service_provider: 'payu_paisa',
    };

    const hash = generatePayUHash(payuParams, config.payu.merchantSalt);

    res.json({
      success: true,
      payuParams: { ...payuParams, hash },
      payuUrl: config.payu.baseUrl + '/_payment',
      transactionId: txnRef.id,
    });
  }
);

/**
 * POST /api/v1/wallet/payu/callback
 * PayU payment callback (browser redirect after payment).
 * The response hash is verified before crediting anything (idempotent
 * via the transaction's pending->success transition).
 */
router.post(
  '/payu/callback',
  validateBody(payuCallbackSchema),
  async (req: Request, res: Response) => {
    const params = req.body;
    const failureUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=failed`;

    // Verify response hash
    if (!verifyPayUResponseHash(params, config.payu.merchantSalt)) {
      console.error('[PayU] Invalid response hash for txnid:', params.txnid);
      return res.redirect(failureUrl);
    }

    const txnid = params.txnid;
    const status = params.status === 'success' ? 'success' : 'failed';
    const amount = parseFloat(params.amount);

    // Find transaction
    const txnSnap = await collections.transactions.where('txnid', '==', txnid).limit(1).get();
    if (txnSnap.empty) {
      console.error('[PayU] Transaction not found:', txnid);
      return res.redirect(failureUrl);
    }

    const txnDoc = txnSnap.docs[0];
    const transaction = txnDoc.data() as TransactionDocument;

    // Idempotency: only process once
    if (transaction.status !== 'pending') {
      console.warn('[PayU] Transaction already processed:', txnid);
      return res.redirect(`${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=${status}`);
    }

    let newBalance = 0;

    await runTransaction(async (t) => {
      const userRef = collections.users.doc(transaction.userId);
      const userSnap = await t.get(userRef);
      const currentBalance = (userSnap.data() as any)?.wallet?.balance || 0;
      newBalance = status === 'success' ? currentBalance + amount : currentBalance;

      if (status === 'success') {
        t.update(userRef, {
          'wallet.balance': newBalance,
          updatedAt: timestamp(),
        });
      }

      t.update(txnDoc.ref, {
        status,
        updatedAt: timestamp(),
        metadata: { ...transaction.metadata, payuResponse: params },
      });
    });

    if (status === 'success') {
      getPushNotificationService()
        .sendWalletNotification(transaction.userId, 'add_money', {
          amount,
          balance: newBalance,
          transactionId: txnDoc.id,
        })
        .catch((err) => console.error('[FCM] wallet notification failed:', err));
    }

    const redirectUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=${status}&txnid=${txnid}`;
    res.redirect(redirectUrl);
  }
);

/**
 * GET /api/v1/wallet/transactions
 * Get transaction history
 */
router.get(
  '/transactions',
  requireAuth,
  validateQuery(transactionQuerySchema),
  async (req: Request, res: Response) => {
    const { type, status, limit, offset } = req.query as any;

    let query = collections.transactions
      .where('userId', '==', req.user!.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (type) query = query.where('type', '==', type);
    if (status) query = query.where('status', '==', status);
    if (offset) query = query.offset(offset);

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TransactionDocument));

    res.json({ success: true, transactions });
  }
);

/**
 * GET /api/v1/wallet/transactions/:id
 * Get transaction details
 */
router.get(
  '/transactions/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const txnDoc = await collections.transactions.doc(id).get();

    if (!txnDoc.exists) {
      throw new NotFoundError('Transaction not found');
    }

    const transaction = txnDoc.data() as TransactionDocument;
    if (transaction.userId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Not authorized to view this transaction');
    }

    res.json({ success: true, transaction });
  }
);

/**
 * POST /api/v1/wallet/release/:taskId
 * Release escrow payment for a completed task (poster only).
 * Runs in a single Firestore transaction with an upfront balance check.
 */
router.post(
  '/release/:taskId',
  requireAuth,
  requireKYC,
  validateParams(z.object({ taskId: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }

    const task = taskDoc.data() as any;
    if (task.posterId !== req.user!.uid) {
      throw new ForbiddenError('Only the poster can release payment');
    }

    if (task.status !== 'completed') {
      throw new BadRequestError('Task must be completed before payment release');
    }

    if (!task.buddyId) {
      throw new BadRequestError('No buddy assigned to this task');
    }

    const totalAmount = task.budget + (task.tip || 0);
    const platformFee = Math.round(totalAmount * 0.1); // 10% platform fee
    const buddyAmount = totalAmount - platformFee;
    let buddyNewBalance = 0;

    await runTransaction(async (t) => {
      const posterRef = collections.users.doc(req.user!.uid);
      const buddyRef = collections.users.doc(task.buddyId);

      // Read docs INSIDE the transaction so the balance check is atomic
      const [posterSnap, buddySnap] = await Promise.all([t.get(posterRef), t.get(buddyRef)]);
      const posterBalance = (posterSnap.data() as any)?.wallet?.balance || 0;
      const posterPending = (posterSnap.data() as any)?.wallet?.pendingBalance || 0;

      // Escrow model: the amount was locked at task creation, so deduct
      // from pending first; fall back to available balance check.
      if (posterBalance - posterPending < totalAmount && posterBalance < totalAmount) {
        throw new BadRequestError('Insufficient wallet balance to release payment');
      }

      const buddyBalance = (buddySnap.data() as any)?.wallet?.balance || 0;
      const buddyPending = (buddySnap.data() as any)?.wallet?.pendingBalance || 0;
      buddyNewBalance = buddyBalance + buddyAmount;

      // Deduct from poster wallet (clamp at 0 to avoid negatives)
      t.update(posterRef, {
        'wallet.balance': Math.max(0, posterBalance - totalAmount),
        'wallet.pendingBalance': Math.max(0, posterPending - totalAmount),
        'stats.totalSpent': FieldValue.increment(totalAmount),
        updatedAt: timestamp(),
      });

      // Credit buddy wallet (minus platform fee)
      t.update(buddyRef, {
        'wallet.balance': buddyNewBalance,
        'wallet.pendingBalance': Math.max(0, buddyPending - buddyAmount),
        'stats.totalEarnings': FieldValue.increment(buddyAmount),
        'commissionDue': FieldValue.increment(platformFee),
        updatedAt: timestamp(),
      });

      // Ledger entries
      const customerTxnRef = collections.transactions.doc();
      t.set(customerTxnRef, {
        id: customerTxnRef.id,
        userId: req.user!.uid,
        taskId,
        type: 'release',
        amount: -totalAmount,
        gateway: 'wallet',
        status: 'success',
        txnid: generateTxnId(),
        description: `Payment released for task: ${task.title}`,
        metadata: { buddyId: task.buddyId, platformFee },
        createdAt: timestamp(),
        updatedAt: timestamp(),
      });

      const buddyTxnRef = collections.transactions.doc();
      t.set(buddyTxnRef, {
        id: buddyTxnRef.id,
        userId: task.buddyId,
        taskId,
        type: 'release',
        amount: buddyAmount,
        gateway: 'wallet',
        status: 'success',
        txnid: generateTxnId(),
        description: `Payment received for task: ${task.title}`,
        metadata: { posterId: req.user!.uid, platformFee },
        createdAt: timestamp(),
        updatedAt: timestamp(),
      });

      t.update(taskDoc.ref, {
        status: 'paid',
        paidAt: timestamp(),
        updatedAt: timestamp(),
      });
    });

    getPushNotificationService()
      .sendWalletNotification(task.buddyId, 'money_released', {
        amount: buddyAmount,
        balance: buddyNewBalance,
      })
      .catch((err) => console.error('[FCM] release notification failed:', err));

    res.json({ success: true, message: 'Payment released successfully' });
  }
);

export default router;
