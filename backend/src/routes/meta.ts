/**
 * Meta Routes
 * Categories, cities, public app config
 * Public (no auth) — read-only reference data for pickers.
 */

import { Router, Request, Response } from 'express';
import { getDb } from '../models';

const router = Router();

const DEFAULT_CATEGORIES = [
  { id: 'grocery', name: 'Grocery', icon: 'cart', color: '#4F46E5' },
  { id: 'medicine', name: 'Medicine', icon: 'medical-bag', color: '#EF4444' },
  { id: 'food', name: 'Food Delivery', icon: 'fast-food', color: '#F59E0B' },
  { id: 'courier', name: 'Courier/Parcel', icon: 'cube', color: '#06B6D4' },
  { id: 'bill_payment', name: 'Bill Payment', icon: 'receipt', color: '#10B981' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-handle', color: '#8B5CF6' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles', color: '#3B82F6' },
  { id: 'errand', name: 'General Errand', icon: 'help-circle', color: '#64748B' },
  { id: 'other', name: 'Other', icon: 'more-horizontal', color: '#94A3B8' },
];

const DEFAULT_CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

function safeAllowPublicConfig() {
  return {
    payment: {
      minAmount: 1,
      maxAmount: 50000,
      currency: 'INR',
      supportedMethods: ['upi', 'card', 'netbanking', 'wallet'],
    },
    payu: { baseUrl: process.env.PAYU_BASE_URL || 'https://test.payu.in' },
  };
}

/**
 * GET /api/v1/meta/categories
 */
router.get('/categories', async (_req: Request, res: Response) => {
  const doc = await getDb().collection('meta').doc('categories').get();
  if (doc.exists) {
    res.json({ success: true, categories: doc.data()?.items ?? DEFAULT_CATEGORIES });
    return;
  }
  // Seed once for self-serve consistency (idempotent write; fire-and-forget safe)
  await getDb()
    .collection('meta')
    .doc('categories')
    .set({ items: DEFAULT_CATEGORIES, updatedAt: new Date().toISOString() })
    .catch(() => {});
  res.json({ success: true, categories: DEFAULT_CATEGORIES });
});

/**
 * GET /api/v1/meta/cities
 */
router.get('/cities', async (_req: Request, res: Response) => {
  const doc = await getDb().collection('meta').doc('cities').get();
  res.json({ success: true, cities: doc.exists ? (doc.data()?.items ?? []) : DEFAULT_CITIES });
});

/**
 * GET /api/v1/meta/config
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json({ success: true, ...safeAllowPublicConfig() });
});

export default router;
