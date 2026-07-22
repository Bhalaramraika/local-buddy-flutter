/**
 * Transaction Routes
 * Wallet transactions, payment history, refunds
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { collections, Transaction, runTransaction, timestamp, query, where, orderBy, limit, startAfter, getDocs } from '../models';
import { BadRequestError, NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { getFirebaseAdmin } from '../firebase';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================================
// Schemas
// ============================================================

const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(['credit', 'debit']).optional(),
  category: z.enum(['wallet_topup', 'task_payment', 'task_earning', 'refund', 'withdrawal', 'cash_deposit', 'cash_withdrawal', 'bonus', 'penalty']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const refundSchema = z.object({
  transactionId: z.string().min(1),
  amount: z.number().positive().optional(),
  reason: z.string().min(1).max(500).default('Customer requested'),
});

const cashDepositSchema = z.object({
  amount: z.number().positive().max(100000), // Max 1 lakh per deposit
  depositedBy: z.string().min(1), // Buddy ID who collected cash
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

const cashWithdrawalSchema = z.object({
  amount: z.number().positive().max(50000), // Max 50k per withdrawal
  collectedBy: z.string().min(1), // Buddy ID who collected cash
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================
// GET /api/v1/transactions - List transactions
// ============================================================

router.get('/', validateQuery(transactionQuerySchema), async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
  const { page, limit, type, category, status, startDate, endDate, sortBy, sortOrder } = req.query as any;

  try {
    let q = query(
      collections.transactions,
      where('userId', '==', userId),
      orderBy(sortBy, sortOrder),
      limit(limit)
    );

    // Apply filters
    if (type) {
      q = query(q, where('type', '==', type));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (startDate) {
      q = query(q, where('createdAt', '>=', new Date(startDate)));
    }
    if (endDate) {
      q = query(q, where('createdAt', '<=', new Date(endDate)));
    }

    // Pagination
    if (page > 1) {
      // For simplicity, we'll use offset-based pagination
      // In production, use cursor-based pagination with startAfter
      const offset = (page - 1) * limit;
      // Note: Firestore doesn't support offset directly, would need cursor
    }

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    // Get total count for pagination
    const countQuery = query(
      collections.transactions,
      where('userId', '==', userId)
    );
    const countSnapshot = await getDocs(countQuery);
    const total = countSnapshot.size;

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('[Transactions] List error:', error);
    throw error;
  }
});

// ============================================================
// GET /api/v1/transactions/summary - Get transaction summary
// ============================================================

router.get('/summary', async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;

  try {
    const snapshot = await getDocs(
      query(collections.transactions, where('userId', '==', userId))
    );

    const transactions = snapshot.docs.map(doc => doc.data()) as Transaction[];

    const summary = {
      totalCredits: 0,
      totalDebits: 0,
      netFlow: 0,
      byCategory: {} as Record<string, { count: number; amount: number }>,
      byStatus: {} as Record<string, number>,
      recentActivity: transactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };

    transactions.forEach(tx => {
      if (tx.type === 'credit') {
        summary.totalCredits += tx.amount;
      } else {
        summary.totalDebits += tx.amount;
      }
      summary.netFlow = summary.totalCredits - summary.totalDebits;

      if (!summary.byCategory[tx.category]) {
        summary.byCategory[tx.category] = { count: 0, amount: 0 };
      }
      summary.byCategory[tx.category].count++;
      summary.byCategory[tx.category].amount += tx.amount;

      summary.byStatus[tx.status] = (summary.byStatus[tx.status] || 0) + 1;
    });

    res.json(summary);
  } catch (error) {
    console.error('[Transactions] Summary error:', error);
    throw error;
  }
});

// ============================================================
// GET /api/v1/transactions/:id - Get transaction by ID
// ============================================================

router.get('/:id', validateParams(z.object({ id: z.string().min(1) })), async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
  const { id } = req.params;

  try {
    const doc = await collections.transactions.doc(id).get();
    
    if (!doc.exists) {
      throw new NotFoundError('Transaction not found');
    }

    const transaction = { id: doc.id, ...doc.data() } as Transaction;

    // Verify ownership
    if (transaction.userId !== userId) {
      throw new ForbiddenError('Not authorized to view this transaction');
    }

    res.json(transaction);
  } catch (error) {
    console.error('[Transactions] Get error:', error);
    throw error;
  }
});

// ============================================================
// POST /api/v1/transactions/refund - Request refund
// ============================================================

router.post('/refund', validateBody(refundSchema), async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
  const { transactionId, amount, reason } = req.body;

  try {
    const txDoc = await collections.transactions.doc(transactionId).get();
    
    if (!txDoc.exists) {
      throw new NotFoundError('Transaction not found');
    }

    const transaction = { id: txDoc.id, ...txDoc.data() } as Transaction;

    // Verify ownership
    if (transaction.userId !== userId) {
      throw new ForbiddenError('Not authorized to refund this transaction');
    }

    // Check if refundable
    if (transaction.status !== 'completed') {
      throw new BadRequestError('Only completed transactions can be refunded');
    }

    if (transaction.type !== 'debit') {
      throw new BadRequestError('Only debit transactions can be refunded');
    }

    // Check if already refunded
    const existingRefund = await getDocs(
      query(
        collections.transactions,
        where('userId', '==', userId),
        where('category', '==', 'refund'),
        where('metadata.originalTransactionId', '==', transactionId)
      )
    );

    if (!existingRefund.empty) {
      throw new BadRequestError('Transaction already refunded');
    }

    const refundAmount = amount || transaction.amount;

    // Create refund transaction
    const refundTx: Omit<Transaction, 'id'> = {
      userId,
      type: 'credit',
      category: 'refund',
      amount: refundAmount,
      currency: 'INR',
      status: 'completed',
      description: `Refund: ${reason}`,
      metadata: {
        originalTransactionId: transactionId,
        refundReason: reason,
      },
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await runTransaction(async (tx) => {
      // Add refund transaction
      const refundRef = collections.transactions.doc();
      tx.set(refundRef, refundTx);

      // Update wallet balance
      const walletRef = collections.wallets.doc(userId);
      const walletDoc = await tx.get(walletRef);
      if (walletDoc.exists) {
        const wallet = walletDoc.data();
        tx.update(walletRef, {
          balance: (wallet.balance || 0) + refundAmount,
          availableBalance: (wallet.availableBalance || 0) + refundAmount,
          updatedAt: timestamp(),
        });
      }
    });

    res.json({
      success: true,
      refundId: refundTx.id,
      amount: refundAmount,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('[Transactions] Refund error:', error);
    throw error;
  }
});

// ============================================================
// POST /api/v1/transactions/cash-deposit - Cash deposit
// ============================================================

router.post('/cash-deposit', validateBody(cashDepositSchema), async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
  const { amount, depositedBy, location, notes } = req.body;

  try {
    // Verify the buddy exists and is active
    const buddyDoc = await collections.users.doc(depositedBy).get();
    if (!buddyDoc.exists) {
      throw new NotFoundError('Buddy not found');
    }
    const buddy = buddyDoc.data();
    if (buddy.role !== 'buddy' || buddy.status !== 'active') {
      throw new BadRequestError('Invalid buddy for cash deposit');
    }

    const transaction: Omit<Transaction, 'id'> = {
      userId,
      type: 'credit',
      category: 'cash_deposit',
      amount: Math.round(amount * 100), // Store in paise
      currency: 'INR',
      status: 'completed',
      description: `Cash deposit collected by buddy`,
      metadata: {
        depositedBy,
        location,
        notes,
      },
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await runTransaction(async (tx) => {
      // Add transaction
      const txRef = collections.transactions.doc();
      tx.set(txRef, transaction);

      // Update wallet balance
      const walletRef = collections.wallets.doc(userId);
      const walletDoc = await tx.get(walletRef);
      if (walletDoc.exists) {
        const wallet = walletDoc.data();
        tx.update(walletRef, {
          balance: (wallet.balance || 0) + Math.round(amount * 100),
          availableBalance: (wallet.availableBalance || 0) + Math.round(amount * 100),
          updatedAt: timestamp(),
        });
      }
    });

    res.json({
      success: true,
      transactionId: transaction.id,
      message: 'Cash deposit recorded successfully',
    });
  } catch (error) {
    console.error('[Transactions] Cash deposit error:', error);
    throw error;
  }
});

// ============================================================
// POST /api/v1/transactions/cash-withdrawal - Cash withdrawal
// ============================================================

router.post('/cash-withdrawal', validateBody(cashWithdrawalSchema), async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
  const { amount, collectedBy, location, notes } = req.body;

  try {
    // Check wallet balance
    const walletDoc = await collections.wallets.doc(userId).get();
    if (!walletDoc.exists) {
      throw new NotFoundError('Wallet not found');
    }
    const wallet = walletDoc.data();
    const availableBalance = wallet.availableBalance || 0;
    const amountInPaise = Math.round(amount * 100);

    if (availableBalance < amountInPaise) {
      throw new BadRequestError('Insufficient available balance');
    }

    // Verify the buddy exists and is active
    const buddyDoc = await collections.users.doc(collectedBy).get();
    if (!buddyDoc.exists) {
      throw new NotFoundError('Buddy not found');
    }
    const buddy = buddyDoc.data();
    if (buddy.role !== 'buddy' || buddy.status !== 'active') {
      throw new BadRequestError('Invalid buddy for cash withdrawal');
    }

    const transaction: Omit<Transaction, 'id'> = {
      userId,
      type: 'debit',
      category: 'cash_withdrawal',
      amount: amountInPaise,
      currency: 'INR',
      status: 'completed',
      description: `Cash withdrawal collected by buddy`,
      metadata: {
        collectedBy,
        location,
        notes,
      },
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await runTransaction(async (tx) => {
      // Add transaction
      const txRef = collections.transactions.doc();
      tx.set(txRef, transaction);

      // Update wallet balance
      const walletRef = collections.wallets.doc(userId);
      tx.update(walletRef, {
        balance: (wallet.balance || 0) - amountInPaise,
        availableBalance: (wallet.availableBalance || 0) - amountInPaise,
        updatedAt: timestamp(),
      });
    });

    res.json({
      success: true,
      transactionId: transaction.id,
      message: 'Cash withdrawal recorded successfully',
    });
  } catch (error) {
    console.error('[Transactions] Cash withdrawal error:', error);
    throw error;
  }
});

// ============================================================
// GET /api/v1/transactions/export - Export transactions
// ============================================================

router.get('/export', validateQuery(z.object({
  format: z.enum(['csv', 'json']).default('csv'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})), async (req: Request, res: Response) => {
  const userId = (req as any).user.uid;
  const { format, startDate, endDate } = req.query as any;

  try {
    let q = query(
      collections.transactions,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (startDate) {
      q = query(q, where('createdAt', '>=', new Date(startDate)));
    }
    if (endDate) {
      q = query(q, where('createdAt', '<=', new Date(endDate)));
    }

    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    if (format === 'csv') {
      const headers = ['Date', 'Type', 'Category', 'Amount (₹)', 'Status', 'Description', 'Transaction ID'];
      const rows = transactions.map(tx => [
        new Date(tx.createdAt).toLocaleDateString('en-IN'),
        tx.type,
        tx.category,
        (tx.amount / 100).toFixed(2),
        tx.status,
        tx.description,
        tx.id,
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({ transactions });
    }
  } catch (error) {
    console.error('[Transactions] Export error:', error);
    throw error;
  }
});

export default router;