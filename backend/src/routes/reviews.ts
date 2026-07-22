/**
 * Review Routes
 * Create/read reviews, rating calculations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, ReviewDocument, runTransaction, timestamp } from '../models';
import { requireAuth, requireKYC } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../middleware/errorHandler';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const createReviewSchema = z.object({
  revieweeId: z.string().min(1),
  taskId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const reviewQuerySchema = z.object({
  revieweeId: z.string().optional(),
  reviewerId: z.string().optional(),
  taskId: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/v1/reviews
 * Create a review (after task completion)
 */
router.post(
  '/',
  requireAuth,
  requireKYC,
  validateBody(createReviewSchema),
  async (req: Request, res: Response) => {
    const { revieweeId, taskId, rating, comment } = req.body;
    const reviewerId = req.user!.uid;

    if (revieweeId === reviewerId) {
      throw new BadRequestError('Cannot review yourself');
    }

    // Verify task exists and is completed/paid
    const taskDoc = await collections.tasks.doc(taskId).get();
    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }

    const task = taskDoc.data() as any;
    if (!['completed', 'paid'].includes(task.status)) {
      throw new BadRequestError('Can only review completed tasks');
    }

    // Verify reviewer is part of the task
    const isPoster = task.posterId === reviewerId;
    const isBuddy = task.buddyId === reviewerId;
    if (!isPoster && !isBuddy) {
      throw new ForbiddenError('You were not part of this task');
    }

    // Verify reviewee is the other party
    const expectedRevieweeId = isPoster ? task.buddyId : task.posterId;
    if (revieweeId !== expectedRevieweeId) {
      throw new BadRequestError('Invalid reviewee for this task');
    }

    // Check if review already exists
    const existingReview = await collections.reviews
      .where('reviewerId', '==', reviewerId)
      .where('taskId', '==', taskId)
      .limit(1)
      .get();

    if (!existingReview.empty) {
      throw new ConflictError('Review already submitted for this task');
    }

    // Create review
    const reviewRef = collections.reviews.doc();
    const review: ReviewDocument = {
      id: reviewRef.id,
      rating,
      comment: comment || '',
      reviewerId,
      revieweeId,
      taskId,
      createdAt: timestamp(),
    };

    await runTransaction(async (t) => {
      t.set(reviewRef, review);

      // Update reviewee's rating
      const revieweeRef = collections.users.doc(revieweeId);
      const revieweeDoc = await t.get(revieweeRef);
      const reviewee = revieweeDoc.data() as any;

      const currentCount = reviewee.rating?.count || 0;
      const currentAvg = reviewee.rating?.average || 0;
      const newCount = currentCount + 1;
      const newAvg = ((currentAvg * currentCount) + rating) / newCount;

      const breakdown = reviewee.rating?.breakdown || {};
      breakdown[rating] = (breakdown[rating] || 0) + 1;

      t.update(revieweeRef, {
        'rating.average': newAvg,
        'rating.count': newCount,
        'rating.breakdown': breakdown,
        updatedAt: timestamp(),
      });
    });

    res.status(201).json({ success: true, review });
  }
);

/**
 * GET /api/v1/reviews
 * List reviews with filters
 */
router.get(
  '/',
  requireAuth,
  validateQuery(reviewQuerySchema),
  async (req: Request, res: Response) => {
    const { revieweeId, reviewerId, taskId, limit, offset } = req.query as any;

    let query = collections.reviews.orderBy('createdAt', 'desc').limit(limit);

    if (revieweeId) query = query.where('revieweeId', '==', revieweeId);
    if (reviewerId) query = query.where('reviewerId', '==', reviewerId);
    if (taskId) query = query.where('taskId', '==', taskId);
    if (offset) query = query.offset(offset);

    const snapshot = await query.get();
    const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReviewDocument));

    // Enrich with reviewer info
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      const reviewerDoc = await collections.users.doc(review.reviewerId).get();
      let reviewer = null;
      if (reviewerDoc.exists) {
        const u = reviewerDoc.data() as any;
        reviewer = { id: u.id, name: u.name, avatar: u.avatar };
      }
      return { ...review, reviewer };
    }));

    res.json({ success: true, reviews: enrichedReviews });
  }
);

/**
 * GET /api/v1/reviews/user/:userId
 * Get reviews for a specific user (public)
 */
router.get(
  '/user/:userId',
  validateParams(z.object({ userId: z.string().min(1) })),
  validateQuery(z.object({
    limit: z.coerce.number().min(1).max(50).default(20),
    offset: z.coerce.number().min(0).default(0),
  })),
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit, offset } = req.query as any;

    const query = collections.reviews
      .where('revieweeId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const snapshot = await query.get();
    const reviews = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReviewDocument));

    // Get rating summary
    const userDoc = await collections.users.doc(userId).get();
    const rating = userDoc.exists ? (userDoc.data() as any).rating : { average: 0, count: 0, breakdown: {} };

    // Enrich with reviewer info
    const enrichedReviews = await Promise.all(reviews.map(async (review) => {
      const reviewerDoc = await collections.users.doc(review.reviewerId).get();
      let reviewer = null;
      if (reviewerDoc.exists) {
        const u = reviewerDoc.data() as any;
        reviewer = { id: u.id, name: u.name, avatar: u.avatar };
      }
      return { ...review, reviewer };
    }));

    res.json({ success: true, reviews: enrichedReviews, rating });
  }
);

/**
 * GET /api/v1/reviews/:id
 * Get review details
 */
router.get(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const reviewDoc = await collections.reviews.doc(id).get();

    if (!reviewDoc.exists) {
      throw new NotFoundError('Review not found');
    }

    const review = reviewDoc.data() as ReviewDocument;
    res.json({ success: true, review });
  }
);

/**
 * DELETE /api/v1/reviews/:id
 * Delete review (reviewer or admin only)
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const reviewDoc = await collections.reviews.doc(id).get();

    if (!reviewDoc.exists) {
      throw new NotFoundError('Review not found');
    }

    const review = reviewDoc.data() as ReviewDocument;

    if (review.reviewerId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Not authorized to delete this review');
    }

    await runTransaction(async (t) => {
      t.delete(reviewDoc.ref);

      // Recalculate reviewee rating
      const revieweeRef = collections.users.doc(review.revieweeId);
      const revieweeDoc = await t.get(revieweeRef);
      const reviewee = revieweeDoc.data() as any;

      const currentCount = reviewee.rating?.count || 0;
      const currentAvg = reviewee.rating?.average || 0;
      const breakdown = reviewee.rating?.breakdown || {};

      if (currentCount > 0) {
        const newCount = currentCount - 1;
        const newAvg = newCount > 0 
          ? ((currentAvg * currentCount) - review.rating) / newCount 
          : 0;
        
        breakdown[review.rating] = Math.max(0, (breakdown[review.rating] || 1) - 1);

        t.update(revieweeRef, {
          'rating.average': newAvg,
          'rating.count': newCount,
          'rating.breakdown': breakdown,
          updatedAt: timestamp(),
        });
      }
    });

    res.json({ success: true, message: 'Review deleted' });
  }
);

export default router;