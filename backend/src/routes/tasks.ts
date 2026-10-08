/**
 * Task Routes
 * CRUD for tasks, status transitions, assignment
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, TaskDocument, TaskStatus, runTransaction, timestamp } from '../models';
import { requireAuth, requireKYC, requireRole } from '../middleware/auth';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../middleware/errorHandler';
import { getPushNotificationService } from '../services/pushNotificationService';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const createTaskSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  category: z.string().min(1).max(50),
  budget: z.number().positive().max(100000),
  tip: z.number().min(0).default(0),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(5).max(200),
  }),
  deadline: z.string().datetime(), // ISO string
  paymentMode: z.enum(['online', 'cash']),
  requirements: z.array(z.string()).max(10).default([]),
  attachments: z.array(z.string().url()).max(5).default([]),
});

const updateTaskSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).max(2000).optional(),
  budget: z.number().positive().max(100000).optional(),
  tip: z.number().min(0).optional(),
  deadline: z.string().datetime().optional(),
  requirements: z.array(z.string()).max(10).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
});

const assignTaskSchema = z.object({
  buddyId: z.string().min(1),
});

const updateStatusSchema = z.object({
  status: z.enum(['open', 'assigned', 'completed', 'paid', 'deleted']),
});

const taskQuerySchema = z.object({
  status: z.enum(['open', 'assigned', 'completed', 'paid', 'deleted']).optional(),
  category: z.string().optional(),
  minBudget: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  radiusKm: z.coerce.number().min(1).max(100).default(10),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['createdAt', 'deadline', 'budget']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================
// Helpers
// ============================================================

function calculateGeohash(lat: number, lng: number, precision = 7): string {
  // Simple geohash implementation (use ngeohash in production)
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latMin = -90, latMax = 90;
  let lngMin = -180, lngMax = 180;
  let hash = '';
  let bit = 0;
  let ch = 0;
  let even = true;

  while (hash.length < precision) {
    if (even) {
      const mid = (lngMin + lngMax) / 2;
      if (lng > mid) {
        ch |= 1 << (4 - bit);
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat > mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    if (bit < 4) {
      bit++;
    } else {
      hash += base32[ch];
      bit = 0;
      ch = 0;
      even = !even;
    }
  }
  return hash;
}

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/v1/tasks
 * Create a new task (customer only, KYC required)
 */
router.post(
  '/',
  requireAuth,
  requireKYC,
  // Both roles can post tasks in the marketplace (buddies can also request help)
  requireRole('customer', 'buddy'),
  validateBody(createTaskSchema),
  async (req: Request, res: Response) => {
    const data = req.body;
    const geohash = calculateGeohash(data.location.latitude, data.location.longitude);

    const taskRef = collections.tasks.doc();
    const task: TaskDocument = {
      id: taskRef.id,
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      tip: data.tip,
      location: {
        ...data.location,
        geohash,
      },
      deadline: data.deadline,
      posterId: req.user!.uid,
      paymentMode: data.paymentMode,
      status: 'open',
      attachments: data.attachments,
      requirements: data.requirements,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    };

    await taskRef.set(task);

    // Update poster stats
    await collections.users.doc(req.user!.uid).update({
      'stats.tasksPosted': FieldValue.increment(1),
      updatedAt: timestamp(),
    });

    res.status(201).json({ success: true, task });
  }
);

/**
 * GET /api/v1/tasks
 * List tasks with filters
 */
router.get(
  '/',
  requireAuth,
  validateQuery(taskQuerySchema),
  async (req: Request, res: Response) => {
    const { status, category, minBudget, maxBudget, latitude, longitude, radiusKm, limit, offset, sortBy, sortOrder } = req.query as any;

    let query: FirebaseFirestore.Query = collections.tasks;

    // Apply filters
    if (status) query = query.where('status', '==', status);
    if (category) query = query.where('category', '==', category);
    if (minBudget) query = query.where('budget', '>=', minBudget);
    if (maxBudget) query = query.where('budget', '<=', maxBudget);

    // For location-based search, we'd use geohash prefix in production
    // For now, simple ordering
    query = query.orderBy(sortBy, sortOrder);

    // Apply pagination
    if (offset) query = query.offset(offset);
    query = query.limit(limit);

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(d => d.data() as TaskDocument);

    res.json({ success: true, tasks, total: tasks.length });
  }
);

/**
 * GET /api/v1/tasks/:id
 * Get task details
 */
router.get(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const taskDoc = await collections.tasks.doc(id).get();

    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }

    const task = taskDoc.data() as TaskDocument;

    // Check access: poster, assigned buddy, or admin
    const isPoster = task.posterId === req.user!.uid;
    const isBuddy = task.buddyId === req.user!.uid;
    const isAdmin = req.user!.role === 'admin';

    if (!isPoster && !isBuddy && !isAdmin) {
      throw new ForbiddenError('Not authorized to view this task');
    }

    res.json({ success: true, task });
  }
);

/**
 * PUT /api/v1/tasks/:id
 * Update task (only poster, only if open)
 */
router.put(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateTaskSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const taskRef = collections.tasks.doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }

    const task = taskDoc.data() as TaskDocument;

    if (task.posterId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only the poster can update this task');
    }

    if (task.status !== 'open' && req.user!.role !== 'admin') {
      throw new BadRequestError('Can only update open tasks');
    }

    await taskRef.update({
      ...updates,
      updatedAt: timestamp(),
    });

    const updatedDoc = await taskRef.get();
    res.json({ success: true, task: updatedDoc.data() });
  }
);

/**
 * POST /api/v1/tasks/:id/apply
 * Buddy applies to an open task (MVP: single-record application)
 */
router.post(
  '/:id/apply',
  requireAuth,
  requireKYC,
  requireRole('buddy', 'customer'),
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(z.object({
    message: z.string().max(500).optional(),
    proposedAmount: z.number().positive().optional(),
  }).partial().optional().default({})),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const buddyId = req.user!.uid;
    const body = (req.body as any) || {};

    const taskRef = collections.tasks.doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }
    const task = taskDoc.data() as TaskDocument & { applicants?: string[] };
    if (task.status !== 'open') {
      throw new BadRequestError('Task is not open');
    }
    if (task.posterId === buddyId) {
      throw new BadRequestError('Cannot apply to your own task');
    }

    const appRef = taskRef.collection('applications').doc(buddyId);
    const existing = await appRef.get();
    if (existing.exists) {
      throw new ConflictError('Already applied to this task');
    }

    await appRef.set({
      buddyId,
      message: body.message || '',
      proposedAmount: body.proposedAmount ?? task.budget,
      status: 'pending',
      createdAt: timestamp(),
    });

    await taskRef.update({
      applicants: FieldValue.arrayUnion(buddyId),
      updatedAt: timestamp(),
    });

    getPushNotificationService()
      .sendTaskNotification(task.posterId, 'new_applicant', {
        taskId: id,
        title: task.title,
        amount: task.budget,
        buddyName: req.user!.userDoc?.name || 'A buddy',
      })
      .catch((err) => console.error('[FCM] apply notification failed:', err));

    res.status(201).json({ success: true, application: { buddyId, status: 'pending' } });
  }
);

/**
 * GET /api/v1/tasks/:id/applications
 * List applications for a task (poster only)
 */
router.get(
  '/:id/applications',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const taskDoc = await collections.tasks.doc(id).get();
    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }
    const task = taskDoc.data() as TaskDocument;
    if (task.posterId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only the poster can view applications');
    }

    const appsSnap = await collections.tasks.doc(id).collection('applications').orderBy('createdAt', 'desc').get();
    const applications = appsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, applications });
  }
);

/**
 * POST /api/v1/tasks/:id/applications/:buddyId/decide
 * Accept or reject an application (poster only). Accept = assign task.
 */
router.post(
  '/:id/applications/:buddyId/decide',
  requireAuth,
  requireRole('customer'),
  validateParams(z.object({ id: z.string().min(1), buddyId: z.string().min(1) })),
  validateBody(z.object({ action: z.enum(['accept', 'reject']) })),
  async (req: Request, res: Response) => {
    const { id, buddyId } = req.params;
    const { action } = req.body;

    const taskRef = collections.tasks.doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }
    const task = taskDoc.data() as TaskDocument;
    if (task.posterId !== req.user!.uid) {
      throw new ForbiddenError('Only the poster can decide applications');
    }

    const appRef = taskRef.collection('applications').doc(buddyId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) {
      throw new NotFoundError('Application not found');
    }

    if (action === 'reject') {
      await appRef.update({ status: 'rejected', updatedAt: timestamp() });
      res.json({ success: true, status: 'rejected' });
      return;
    }

    // accept → assign (full assignment rules live in /:id/assign; here we
    // enforce the basics and reuse the same transaction pattern)
    if (task.status !== 'open') {
      throw new BadRequestError('Task is not open for assignment');
    }

    await runTransaction(async (t) => {
      const freshTaskSnap = await t.get(taskRef);
      const freshTask = freshTaskSnap.data() as TaskDocument | undefined;
      if (!freshTask || freshTask.status !== 'open') {
        throw new ConflictError('Task is no longer open');
      }

      const buddySnap = await t.get(collections.users.doc(buddyId));
      if (!buddySnap.exists) {
        throw new NotFoundError('Buddy not found');
      }

      const chatRef = collections.chats.doc();
      t.set(chatRef, {
        id: chatRef.id,
        participants: [req.user!.uid, buddyId],
        taskId: id,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      });

      t.update(taskRef, {
        buddyId,
        status: 'assigned',
        chatId: chatRef.id,
        updatedAt: timestamp(),
      });

      t.update(appRef, { status: 'accepted', updatedAt: timestamp() });
    });

    getPushNotificationService()
      .sendTaskNotification(buddyId, 'assigned', { taskId: id, title: task.title, amount: task.budget })
      .catch((err) => console.error('[FCM] assign notification failed:', err));

    res.json({ success: true, status: 'accepted' });
  }
);

/**
 * POST /api/v1/tasks/:id/assign
 * Assign buddy to task (customer only)
 */
router.post(
  '/:id/assign',
  requireAuth,
  requireKYC,
  requireRole('customer'),
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(assignTaskSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { buddyId } = req.body;

    await runTransaction(async (transaction) => {
      const taskRef = collections.tasks.doc(id);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists) {
        throw new NotFoundError('Task not found');
      }

      const task = taskDoc.data() as TaskDocument;

      if (task.posterId !== req.user!.uid) {
        throw new ForbiddenError('Only the poster can assign this task');
      }

      if (task.status !== 'open') {
        throw new BadRequestError('Task is not open for assignment');
      }

      // Verify buddy exists and is active
      const buddyDoc = await transaction.get(collections.users.doc(buddyId));
      if (!buddyDoc.exists) {
        throw new NotFoundError('Buddy not found');
      }
      const buddy = buddyDoc.data() as any;
      if (buddy.status !== 'active' || buddy.role !== 'buddy') {
        throw new BadRequestError('Invalid buddy');
      }

      // Check buddy KYC
      if (buddy.kyc?.status !== 'verified') {
        throw new BadRequestError('Buddy KYC not verified');
      }

      // Create chat for task
      const chatRef = collections.chats.doc();
      const chat = {
        id: chatRef.id,
        participants: [req.user!.uid, buddyId],
        taskId: id,
        createdAt: timestamp(),
        updatedAt: timestamp(),
      };
      transaction.set(chatRef, chat);

      // Update task
      transaction.update(taskRef, {
        buddyId,
        status: 'assigned',
        chatId: chatRef.id,
        updatedAt: timestamp(),
      });

      // Update buddy stats
      transaction.update(collections.users.doc(buddyId), {
        'stats.tasksCompleted': FieldValue.increment(0), // Will increment on completion
        updatedAt: timestamp(),
      });

      return { taskId: id, chatId: chatRef.id, buddyId };
    });

    res.json({ success: true, message: 'Task assigned successfully' });
  }
);

/**
 * PUT /api/v1/tasks/:id/status
 * Update task status (buddy completes, customer pays)
 */
router.put(
  '/:id/status',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(updateStatusSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const taskRef = collections.tasks.doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }

    const task = taskDoc.data() as TaskDocument;

    // Validate status transitions
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      open: ['assigned', 'deleted'],
      assigned: ['completed', 'open'], // buddy can unassign
      completed: ['paid'],
      paid: [],
      deleted: [],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      throw new BadRequestError(`Invalid status transition from ${task.status} to ${status}`);
    }

    // Authorization checks
    if (status === 'completed' && task.buddyId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only assigned buddy can mark task as completed');
    }
    if (status === 'paid' && task.posterId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only poster can mark task as paid');
    }
    if (status === 'deleted' && task.posterId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only poster can delete task');
    }

    await runTransaction(async (transaction) => {
      transaction.update(taskRef, {
        status,
        updatedAt: timestamp(),
        ...(status === 'completed' && { completedAt: timestamp() }),
        ...(status === 'paid' && { paidAt: timestamp() }),
      });

      // Update stats on completion
      if (status === 'completed' && task.buddyId) {
        transaction.update(collections.users.doc(task.buddyId), {
          'stats.tasksCompleted': FieldValue.increment(1),
          updatedAt: timestamp(),
        });
      }
    });

    res.json({ success: true, message: `Task status updated to ${status}` });
  }
);

/**
 * DELETE /api/v1/tasks/:id
 * Delete task (only if open, poster only)
 */
router.delete(
  '/:id',
  requireAuth,
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const taskRef = collections.tasks.doc(id);
    const taskDoc = await taskRef.get();

    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }

    const task = taskDoc.data() as TaskDocument;

    if (task.posterId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only the poster can delete this task');
    }

    if (task.status !== 'open' && req.user!.role !== 'admin') {
      throw new BadRequestError('Can only delete open tasks');
    }

    await taskRef.update({
      status: 'deleted',
      updatedAt: timestamp(),
    });

    res.json({ success: true, message: 'Task deleted' });
  }
);

/**
 * GET /api/v1/tasks/my/posted
 * Get tasks posted by current user
 */
router.get(
  '/my/posted',
  requireAuth,
  validateQuery(z.object({
    status: z.enum(['open', 'assigned', 'completed', 'paid', 'deleted']).optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
    offset: z.coerce.number().min(0).default(0),
  })),
  async (req: Request, res: Response) => {
    const { status, limit, offset } = req.query as any;

    let query = collections.tasks.where('posterId', '==', req.user!.uid);
    if (status) query = query.where('status', '==', status);
    query = query.orderBy('createdAt', 'desc').limit(limit);
    if (offset) query = query.offset(offset);

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(d => d.data() as TaskDocument);

    res.json({ success: true, tasks });
  }
);

/**
 * GET /api/v1/tasks/my/assigned
 * Get tasks assigned to current user (buddy)
 */
router.get(
  '/my/assigned',
  requireAuth,
  requireRole('buddy'),
  validateQuery(z.object({
    status: z.enum(['assigned', 'completed', 'paid']).optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
    offset: z.coerce.number().min(0).default(0),
  })),
  async (req: Request, res: Response) => {
    const { status, limit, offset } = req.query as any;

    let query = collections.tasks.where('buddyId', '==', req.user!.uid);
    if (status) query = query.where('status', '==', status);
    query = query.orderBy('createdAt', 'desc').limit(limit);
    if (offset) query = query.offset(offset);

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(d => d.data() as TaskDocument);

    res.json({ success: true, tasks });
  }
);

export default router;