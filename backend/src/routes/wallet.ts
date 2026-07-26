/**
 * Wallet Routes
 * Balance, transactions, PayU integration, withdrawals
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, TransactionDocument, TransactionType, TransactionStatus, runTransaction, timestamp } from '../models';
import { requireAuth, requireKYC, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { config } from '../config';
import crypto from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const addMoneySchema = z.object({
  amount: z.number().positive().max(50000),
  paymentMode: z.enum(['payu']).default('payu'),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  upiId: z.string().min(1),
});

const payuCallbackSchema = z.object({
  mihpayid: z.string(),
  status: z.string(),
  txnid: z.string(),
  amount: z.string(),
  productinfo: z.string(),
  firstname: z.string(),
  email: z.string(),
  phone: z.string(),
  hash: z.string(),
  // ... other PayU fields
});

const transactionQuerySchema = z.object({
  type: z.enum(['add', 'release', 'commission_payment', 'lock', 'withdraw']).optional(),
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
  // PayU hash sequence: key|txnid|amount|productinfo|firstname|email|udf1|...|udf10|salt
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

function verifyPayUHash(params: Record<string, string>, salt: string): boolean {
  const receivedHash = params.hash;
  delete params.hash;
  const calculatedHash = generatePayUHash(params, salt);
  return receivedHash === calculatedHash;
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

    // Generate PayU hash
    const payuParams = {
      key: config.payu.merchantKey,
      txnid,
      amount: amount.toFixed(2),
      productinfo: 'Wallet Top-up',
      firstname: req.user!.userDoc?.name || 'User',
      email: req.user!.userDoc?.email || 'user@localbuddy.app',
      phone: req.user!.phone,
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
 * PayU payment callback (server-to-server)
 */
router.post(
  '/payu/callback',
  validateBody(payuCallbackSchema),
  async (req: Request, res: Response) => {
    const params = req.body;

    // Verify hash
    if (!verifyPayUHash(params, config.payu.merchantSalt)) {
      console.error('[PayU] Invalid hash');
      return res.redirect(`${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=failed`);
    }

    const txnid = params.txnid;
    const status = params.status === 'success' ? 'success' : 'failed';
    const amount = parseFloat(params.amount);

    // Find transaction
    const txnSnap = await collections.transactions.where('txnid', '==', txnid).limit(1).get();
    if (txnSnap.empty) {
      console.error('[PayU] Transaction not found:', txnid);
      return res.redirect(`${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=failed`);
    }

    const txnDoc = txnSnap.docs[0];
    const transaction = txnDoc.data() as TransactionDocument;

    if (transaction.status !== 'pending') {
      console.warn('[PayU] Transaction already processed:', txnid);
      return res.redirect(`${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=${status}`);
    }

    await runTransaction(async (t) => {
      if (status === 'success') {
        // Update wallet balance
        t.update(collections.users.doc(transaction.userId), {
          'wallet.balance': FieldValue.increment(amount),
          updatedAt: timestamp(),
        });

        t.update(txnDoc.ref, {
          status: 'success',
          updatedAt: timestamp(),
          metadata: { ...transaction.metadata, payuResponse: params },
        });
      } else {
        t.update(txnDoc.ref, {
          status: 'failed',
          updatedAt: timestamp(),
          metadata: { ...transaction.metadata, payuResponse: params },
        });
      }
    });

    // Redirect to app
    const redirectUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=${status}&txnid=${txnid}`;
    res.redirect(redirectUrl);
  }
);

/**
 * POST /api/v1/wallet/withdraw
 * Request withdrawal to UPI
 */
router.post(
  '/withdraw',
  requireAuth,
  requireKYC,
  requireRole('buddy'),
  validateBody(withdrawSchema),
  async (req: Request, res: Response) => {
    const { amount, upiId } = req.body;
    const userId = req.user!.uid;

    const userDoc = await collections.users.doc(userId).get();
    const user = userDoc.data() as any;

    const availableBalance = (user.wallet?.balance || 0) - (user.wallet?.pendingBalance || 0);
    if (amount > availableBalance) {
      throw new BadRequestError('Insufficient balance');
    }

    if (amount < 100) {
      throw new BadRequestError('Minimum withdrawal amount is ₹100');
    }

    const txnid = generateTxnId();
    const txnRef = collections.transactions.doc();

    await runTransaction(async (t) => {
      // Lock amount
      t.update(collections.users.doc(userId), {
        'wallet.pendingBalance': FieldValue.increment(amount),
        updatedAt: timestamp(),
      });

      // Create withdrawal transaction
      t.set(txnRef, {
        id: txnRef.id,
        userId,
        type: 'withdraw',
        amount,
        gateway: 'wallet',
        status: 'pending',
        txnid,
        description: `Withdraw ₹${amount} to ${upiId}`,
        metadata: { upiId },
        createdAt: timestamp(),
        updatedAt: timestamp(),
      });
    });

    // TODO: Trigger actual UPI payout via payment gateway
    // For now, auto-approve in development
    if (config.server.isDev) {
      setTimeout(async () => {
        await runTransaction(async (t) => {
          t.update(collections.users.doc(userId), {
            'wallet.balance': FieldValue.increment(-amount),
            'wallet.pendingBalance': FieldValue.increment(-amount),
            updatedAt: timestamp(),
          });
          t.update(txnRef, {
            status: 'success',
            updatedAt: timestamp(),
          });
        });
      }, 2000);
    }

    res.json({ success: true, transactionId: txnRef.id, message: 'Withdrawal request submitted' });
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
 * Release payment for completed task (customer only)
 */
router.post(
  '/release/:taskId',
  requireAuth,
  requireKYC,
  requireRole('customer'),
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

    await runTransaction(async (t) => {
      // Deduct from customer wallet
      t.update(collections.users.doc(req.user!.uid), {
        'wallet.balance': FieldValue.increment(-totalAmount),
        'stats.totalSpent': FieldValue.increment(totalAmount),
        updatedAt: timestamp(),
      });

      // Credit buddy wallet (minus platform fee)
      t.update(collections.users.doc(task.buddyId), {
        'wallet.balance': FieldValue.increment(buddyAmount),
        'wallet.pendingBalance': FieldValue.increment(-buddyAmount), // Release pending
        'stats.totalEarnings': FieldValue.increment(buddyAmount),
        'commissionDue': FieldValue.increment(platformFee),
        updatedAt: timestamp(),
      });

      // Create release transaction for customer
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

      // Create credit transaction for buddy
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

      // Update task status
      t.update(taskDoc.ref, {
        status: 'paid',
        paidAt: timestamp(),
        updatedAt: timestamp(),
      });
    });

    res.json({ success: true, message: 'Payment released successfully' });
  }
);

export default router;