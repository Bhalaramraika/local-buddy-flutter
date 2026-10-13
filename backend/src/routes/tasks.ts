/**
 * Task Routes
 * CRUD for tasks, status transitions, assignment
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import {
  collections,
  TaskDocument,
  TaskOtpSecrets,
  TaskStatus,
  runTransaction,
  timestamp,
  PLATFORM_FEE_RATE,
  COMMISSION_BLOCK_THRESHOLD,
} from '../models';
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

/** 4-digit numeric OTP the buddy reads off the POSTER's app. */
const taskOtpSchema = z.object({
  otp: z.string().regex(/^\d{4}$/, 'Enter the 4-digit code shown on the poster app'),
});

// Tasks live in exactly 4 states (see models.ts). Payment after completion
// is tracked by the `paidAt` timestamp on the task, never by a status value.
const TASK_STATUSES = ['open', 'assigned', 'completed', 'deleted'] as const;

const updateStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

const taskQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
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

/** Random 4-digit task OTP (1000–9999, always 4 digits). */
function generateTaskOtp(): string {
  return String(crypto.randomInt(1000, 10000));
}

/**
 * Create the per-task OTP secrets doc (`tasks/{id}/secrets/otp`).
 * Only the poster can read it (firestore.rules); the buddy receives the code
 * physically and submits it back to /start or /complete for verification.
 */
function buildTaskOtpSecrets(): TaskOtpSecrets {
  return {
    startCode: generateTaskOtp(),
    completeCode: generateTaskOtp(),
    updatedAt: timestamp(),
  };
}

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
 * Per-task read access shared by the list and detail endpoints:
 *  - `open`       → every signed-in user (public marketplace)
 *  - `assigned`   → only the poster and the assigned buddy
 *  - `completed`  → only the poster
 *  - `deleted`    → only the poster
 * Admins can read everything.
 */
function canViewTask(task: TaskDocument, uid: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (task.status === 'open') return true;
  if (task.posterId === uid) return true;
  if (task.status === 'assigned' && task.buddyId === uid) return true;
  return false;
}

/**
 * GET /api/v1/tasks
 * List tasks with filters. Visibility is enforced per task state:
 * open tasks are public; assigned tasks reach poster+assigned buddy only;
 * completed/deleted tasks reach the poster only. Firestore has no OR across
 * fields, so candidate sets are fetched with simple single-field queries
 * (no composite indexes needed) and merged/filtered in memory.
 */
router.get(
  '/',
  requireAuth,
  validateQuery(taskQuerySchema),
  async (req: Request, res: Response) => {
    const { status, category, minBudget, maxBudget, limit, offset, sortBy, sortOrder } = req.query as any;
    const uid = req.user!.uid;
    const isAdmin = req.user!.role === 'admin';

    // Gather the visibility-scoped candidate set.
    const candidatesById = new Map<string, TaskDocument>();
    const collect = (snap: FirebaseFirestore.QuerySnapshot) => {
      snap.docs.forEach((d) => candidatesById.set(d.id, d.data() as TaskDocument));
    };

    if (isAdmin) {
      // Admins see everything (moderation view).
      let q: FirebaseFirestore.Query = collections.tasks;
      if (status) q = q.where('status', '==', status);
      collect(await q.get());
    } else {
      if (!status || status === 'open') {
        collect(await collections.tasks.where('status', '==', 'open').get());
      }
      if (!status || status !== 'open') {
        // Non-open tasks are only visible to their participants.
        collect(await collections.tasks.where('posterId', '==', uid).get());
      }
      if (!status || status === 'assigned') {
        collect(await collections.tasks.where('buddyId', '==', uid).get());
      }
    }

    // Visibility + requested status filter.
    let tasks = [...candidatesById.values()].filter(
      (t) => canViewTask(t, uid, isAdmin) && (!status || t.status === status)
    );

    // Remaining filters (kept in memory to avoid composite-index queries).
    if (category) tasks = tasks.filter((t) => t.category === category);
    if (minBudget !== undefined) tasks = tasks.filter((t) => t.budget >= minBudget);
    if (maxBudget !== undefined) tasks = tasks.filter((t) => t.budget <= maxBudget);

    // Sorting (in memory).
    const dir = sortOrder === 'asc' ? 1 : -1;
    const sortVal = (t: TaskDocument): number | string => {
      if (sortBy === 'budget') return t.budget;
      if (sortBy === 'deadline') return t.deadline || '';
      return t.createdAt || '';
    };
    tasks.sort((a, b) => {
      const va = sortVal(a);
      const vb = sortVal(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });

    const total = tasks.length;
    const paged = tasks.slice(offset, offset + limit);

    res.json({ success: true, tasks: paged, total });
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

    // Visibility by state (see canViewTask): open → everyone;
    // assigned → poster + assigned buddy; completed/deleted → poster only.
    if (!canViewTask(task, req.user!.uid, req.user!.role === 'admin')) {
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
 * Buddy applies to an open task and — first come, first served — is
 * IMMEDIATELY auto-assigned (no poster confirmation needed). The single
 * transaction: assigns the buddy, re-states the task as `assigned`, stamps
 * assignedAt, creates the chat, generates the start/complete OTP secrets,
 * and records the application as `accepted`. A concurrent second applicant
 * loses the race inside the transaction (409).
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
    const appRef = taskRef.collection('applications').doc(buddyId);

    // ---- Fast pre-checks (transaction re-verifies the race-prone ones) ----
    const [taskDoc, existing, buddyDoc] = await Promise.all([
      taskRef.get(),
      appRef.get(),
      collections.users.doc(buddyId).get(),
    ]);
    if (!taskDoc.exists) {
      throw new NotFoundError('Task not found');
    }
    const task = taskDoc.data() as TaskDocument & { applicants?: string[] };
    if (task.status !== 'open') {
      throw new BadRequestError('Task already assigned to another buddy');
    }
    if (task.posterId === buddyId) {
      throw new BadRequestError('Cannot apply to your own task');
    }
    if (existing.exists) {
      throw new ConflictError('Already applied to this task');
    }
    // Pending platform dues above ₹200 block new applications until cleared.
    const dues = (buddyDoc.data() as any)?.commissionDue ?? 0;
    if (dues > COMMISSION_BLOCK_THRESHOLD) {
      throw new ForbiddenError(
        `You have ₹${Math.round(dues)} in pending platform dues. Clear the dues from the Wallet screen to apply for tasks.`
      );
    }

    // ---- Atomic auto-assignment (first applicant wins) ----
    const { chatId } = await runTransaction(async (t) => {
      const freshTaskSnap = await t.get(taskRef);
      const freshTask = freshTaskSnap.data() as TaskDocument | undefined;
      if (!freshTask) throw new NotFoundError('Task not found');
      if (freshTask.status !== 'open') {
        throw new ConflictError('Task already assigned to another buddy');
      }
      const freshApp = await t.get(appRef);
      if (freshApp.exists) throw new ConflictError('Already applied to this task');

      const now = timestamp();

      // Chat thread for poster ↔ buddy
      const chatRef = collections.chats.doc();
      t.set(chatRef, {
        id: chatRef.id,
        participants: [freshTask.posterId, buddyId],
        taskId: id,
        createdAt: now,
        updatedAt: now,
      });

      // Task becomes assigned to this buddy
      t.update(taskRef, {
        buddyId,
        status: 'assigned',
        chatId: chatRef.id,
        assignedAt: now,
        updatedAt: now,
        applicants: FieldValue.arrayUnion(buddyId),
      });

      // Start/complete verification OTPs (poster-only readable doc).
      t.set(taskRef.collection('secrets').doc('otp'), buildTaskOtpSecrets());

      // Application record — accepted by definition (auto-assign).
      t.set(appRef, {
        buddyId,
        message: body.message || '',
        proposedAmount: body.proposedAmount ?? freshTask.budget,
        status: 'accepted',
        createdAt: now,
        updatedAt: now,
      });

      return { chatId: chatRef.id };
    });

    // Notify the buddy (assigned) and the poster (someone took the task).
    getPushNotificationService()
      .sendTaskNotification(buddyId, 'assigned', { taskId: id, title: task.title, amount: task.budget })
      .catch((err) => console.error('[FCM] assign notification failed:', err));
    getPushNotificationService()
      .sendTaskNotification(task.posterId, 'new_applicant', {
        taskId: id,
        title: task.title,
        amount: task.budget,
        buddyName: req.user!.userDoc?.name || 'A buddy',
      })
      .catch((err) => console.error('[FCM] apply notification failed:', err));

    res.status(201).json({
      success: true,
      assigned: true,
      application: { buddyId, status: 'accepted' },
      chatId,
    });
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

    // Enrich each application with the applicant's public profile so the
    // poster can make a decision (name, avatar, rating, track record).
    const applications = await Promise.all(
      appsSnap.docs.map(async (d: any) => {
        const app = d.data();
        const buddyId = app.buddyId || d.id;
        let buddy: Record<string, any> | null = null;
        try {
          const buddyDoc = await collections.users.doc(buddyId).get();
          if (buddyDoc.exists) {
            const u = buddyDoc.data() as any;
            buddy = {
              name: u.name || 'Buddy',
              avatar: u.avatar || null,
              rating: u.rating?.average ?? 0,
              reviewCount: u.rating?.count ?? 0,
              completedTasks: u.stats?.tasksCompleted ?? 0,
              city: u.city || '',
            };
          }
        } catch (err) {
          console.warn('[Tasks] applicant enrichment failed for', buddyId, err);
        }
        return {
          id: d.id,
          taskId: id,
          buddyId,
          message: app.message || '',
          proposedAmount: app.proposedAmount,
          status: app.status || 'pending',
          createdAt: app.createdAt || '',
          updatedAt: app.updatedAt || '',
          buddy,
        };
      })
    );
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
  requireKYC,
  // Both roles can post tasks (see POST /), so both can decide applications.
  requireRole('customer', 'buddy'),
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
        assignedAt: timestamp(),
        updatedAt: timestamp(),
      });

      // Start/complete verification OTPs (poster-only readable doc).
      t.set(taskRef.collection('secrets').doc('otp'), buildTaskOtpSecrets());

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
  // Both roles can post tasks, so both can assign their own task.
  requireRole('customer', 'buddy'),
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
        assignedAt: timestamp(),
        updatedAt: timestamp(),
      });

      // Start/complete verification OTPs (poster-only readable doc).
      transaction.set(taskRef.collection('secrets').doc('otp'), buildTaskOtpSecrets());

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
 * POST /api/v1/tasks/:id/start
 * Buddy starts the task by entering the 4-digit START code shown on the
 * poster's app (tasks/:id/secrets/otp, poster-read-only in Firestore).
 */
router.post(
  '/:id/start',
  requireAuth,
  requireKYC,
  requireRole('buddy', 'customer'),
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(taskOtpSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;
    const uid = req.user!.uid;

    const started = await runTransaction(async (t) => {
      const taskRef = collections.tasks.doc(id);
      const secretsRef = taskRef.collection('secrets').doc('otp');
      const [taskSnap, secretsSnap] = await Promise.all([t.get(taskRef), t.get(secretsRef)]);

      if (!taskSnap.exists) throw new NotFoundError('Task not found');
      const task = taskSnap.data() as TaskDocument;
      if (task.buddyId !== uid) throw new ForbiddenError('Only the assigned buddy can start this task');
      if (task.status !== 'assigned') throw new BadRequestError('Task is not assigned to you');
      if (task.startedAt) throw new ConflictError('Task has already been started');

      const secrets = secretsSnap.data() as TaskOtpSecrets | undefined;
      if (!secrets?.startCode) throw new BadRequestError('Start verification is not set up for this task');
      if (secrets.startVerifiedAt) throw new ConflictError('Start code already used');
      if (secrets.startCode !== otp) {
        throw new BadRequestError('Incorrect code. Ask the poster for the 4-digit start code shown in their app.');
      }

      const now = timestamp();
      t.update(taskRef, { startedAt: now, updatedAt: now });
      t.update(secretsRef, { startVerifiedAt: now, updatedAt: now });
      return { task, startedAt: now };
    });

    getPushNotificationService()
      .sendTaskNotification(started.task.posterId, 'started', {
        taskId: id,
        title: started.task.title,
        buddyName: req.user!.userDoc?.name || 'Your buddy',
      })
      .catch((err) => console.error('[FCM] task-started notification failed:', err));

    res.json({ success: true, message: 'Task started', startedAt: started.startedAt });
  }
);

/**
 * POST /api/v1/tasks/:id/request-payment
 * Buddy asks the poster to release payment (online tasks only). Payment must
 * happen BEFORE the completion code is verified.
 */
router.post(
  '/:id/request-payment',
  requireAuth,
  requireRole('buddy', 'customer'),
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const uid = req.user!.uid;

    const taskDoc = await collections.tasks.doc(id).get();
    if (!taskDoc.exists) throw new NotFoundError('Task not found');
    const task = taskDoc.data() as TaskDocument;

    if (task.buddyId !== uid) throw new ForbiddenError('Only the assigned buddy can request payment');
    if (task.status !== 'assigned' || !task.startedAt) {
      throw new BadRequestError('Task must be started before requesting payment');
    }
    if (task.paymentMode !== 'online') {
      throw new BadRequestError('This is a cash task — collect payment directly from the poster');
    }
    if (task.paidAt) throw new ConflictError('Payment already released for this task');

    await collections.tasks.doc(id).update({
      paymentRequestedAt: timestamp(),
      updatedAt: timestamp(),
    });

    getPushNotificationService()
      .sendTaskNotification(task.posterId, 'payment_requested', {
        taskId: id,
        title: task.title,
        amount: task.budget + (task.tip || 0),
        buddyName: req.user!.userDoc?.name || 'Your buddy',
      })
      .catch((err) => console.error('[FCM] payment-requested notification failed:', err));

    res.json({ success: true, message: 'Payment request sent to the poster' });
  }
);

/**
 * POST /api/v1/tasks/:id/complete
 * Buddy completes the task by entering the 4-digit COMPLETE code shown on
 * the poster's app. For online tasks the payment must already be released
 * (per flow: buddy asks → poster releases → buddy verifies completion code).
 * For cash tasks the buddy owes the platform fee (10%) as commissionDue —
 * they already received 100% in cash.
 */
router.post(
  '/:id/complete',
  requireAuth,
  requireKYC,
  requireRole('buddy', 'customer'),
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(taskOtpSchema),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;
    const uid = req.user!.uid;

    // Pre-read the task to learn the posterId — Firestore transactions
    // require ALL reads before ANY write, so the poster's user doc must be
    // fetched in the same read batch as the task + secrets (doing it after
    // the updates caused HTTP 500: "all reads before all writes").
    const preTaskSnap = await collections.tasks.doc(id).get();
    if (!preTaskSnap.exists) throw new NotFoundError('Task not found');
    const preTask = preTaskSnap.data() as TaskDocument;

    const result = await runTransaction(async (t) => {
      const taskRef = collections.tasks.doc(id);
      const secretsRef = taskRef.collection('secrets').doc('otp');
      const [taskSnap, secretsSnap, posterSnap] = await Promise.all([
        t.get(taskRef),
        t.get(secretsRef),
        t.get(collections.users.doc(preTask.posterId)),
      ]);

      if (!taskSnap.exists) throw new NotFoundError('Task not found');
      const task = taskSnap.data() as TaskDocument;
      if (task.buddyId !== uid) throw new ForbiddenError('Only the assigned buddy can complete this task');
      if (task.status !== 'assigned') throw new BadRequestError('Task is not in progress');
      if (!task.startedAt) throw new BadRequestError('Start the task with the start code first');

      // Payment verification rides along with completion for online tasks.
      if (task.paymentMode === 'online' && !task.paidAt) {
        throw new BadRequestError('Ask the poster to release the payment first, then verify the completion code.');
      }

      const secrets = secretsSnap.data() as TaskOtpSecrets | undefined;
      if (!secrets?.completeCode) throw new BadRequestError('Completion verification is not set up for this task');
      if (secrets.completeVerifiedAt) throw new ConflictError('Task already completed');
      if (secrets.completeCode !== otp) {
        throw new BadRequestError('Incorrect code. Ask the poster for the 4-digit completion code shown in their app.');
      }

      const now = timestamp();
      const totalAmount = task.budget + (task.tip || 0);
      const platformFee = Math.round(totalAmount * PLATFORM_FEE_RATE);

      t.update(taskRef, { status: 'completed', completedAt: now, updatedAt: now });
      t.update(secretsRef, { completeVerifiedAt: now, updatedAt: now });

      // Buddy stats + cash-task platform dues (10% owed after receiving 100% cash).
      const buddyUpdate: Record<string, any> = {
        'stats.tasksCompleted': FieldValue.increment(1),
        updatedAt: now,
      };
      if (task.paymentMode === 'cash') {
        buddyUpdate.commissionDue = FieldValue.increment(platformFee);
      }
      t.update(collections.users.doc(uid), buddyUpdate);

      // Cash tasks: ledger entry for the buddy's negative balance.
      if (task.paymentMode === 'cash') {
        const feeTxnRef = collections.transactions.doc();
        t.set(feeTxnRef, {
          id: feeTxnRef.id,
          userId: uid,
          taskId: id,
          type: 'commission_payment',
          amount: -platformFee,
          gateway: 'cash',
          status: 'success',
          txnid: `CASH_FEE_${id}`,
          description: `Platform fee (10%) for cash task: ${task.title}`,
          metadata: { paymentMode: 'cash', totalAmount },
          createdAt: now,
          updatedAt: now,
        });
      }

      return {
        task,
        posterName: (posterSnap.data() as any)?.name || 'Poster',
      };
    });

    getPushNotificationService()
      .sendTaskNotification(result.task.posterId, 'completed', {
        taskId: id,
        title: result.task.title,
        amount: result.task.budget + (result.task.tip || 0),
        buddyName: req.user!.userDoc?.name || 'Your buddy',
      })
      .catch((err) => console.error('[FCM] task-completed notification failed:', err));

    res.json({
      success: true,
      message: 'Task completed',
      // Context for the buddy's rate-the-poster screen.
      reviewContext: {
        taskId: id,
        taskTitle: result.task.title,
        revieweeId: result.task.posterId,
        revieweeName: result.posterName,
      },
    });
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

    // Validate status transitions (4-state lifecycle; payment is tracked by
    // `paidAt` via POST /wallet/release/:taskId, never by a status value):
    //   open      → assigned | deleted
    //   assigned  → completed | open        (buddy unassign re-opens)
    //   completed → terminal
    //   deleted   → terminal
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      open: ['assigned', 'deleted'],
      assigned: ['completed', 'open'],
      completed: [],
      deleted: [],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      throw new BadRequestError(`Invalid status transition from ${task.status} to ${status}`);
    }

    // Authorization checks
    if (status === 'assigned') {
      // Assignment only happens via /applications/:buddyId/decide or /assign.
      throw new ForbiddenError('Assign a buddy via the applications endpoints');
    }
    if (status === 'completed' && req.user!.role !== 'admin') {
      // Completion is OTP-verified: buddy enters the code shown on the
      // poster's app. Admins keep a force-complete escape hatch for support.
      throw new ForbiddenError('Completion needs the poster\'s 4-digit code — use POST /tasks/:id/complete');
    }
    // Re-opening an assigned task (unassign) is restricted to its participants.
    if (status === 'open' && task.status === 'assigned' &&
        task.posterId !== req.user!.uid && task.buddyId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only the poster or assigned buddy can re-open this task');
    }
    if (status === 'deleted' && task.posterId !== req.user!.uid && req.user!.role !== 'admin') {
      throw new ForbiddenError('Only poster can delete task');
    }

    await runTransaction(async (transaction) => {
      // assigned → open = cancel assignment (buddy cancels / poster rejects
      // the buddy): fully reset the task so it is back in the marketplace —
      // clear the buddy/chat/timing fields, delete the OTP secrets, and
      // mark the old application rejected so it can't auto-reapply.
      if (status === 'open' && task.status === 'assigned') {
        const now = timestamp();
        const previousBuddyId = task.buddyId;
        transaction.update(taskRef, {
          status: 'open',
          buddyId: FieldValue.delete(),
          chatId: FieldValue.delete(),
          assignedAt: FieldValue.delete(),
          startedAt: FieldValue.delete(),
          paymentRequestedAt: FieldValue.delete(),
          ...(previousBuddyId ? { applicants: FieldValue.arrayRemove(previousBuddyId) } : {}),
          updatedAt: now,
        });
        transaction.delete(taskRef.collection('secrets').doc('otp'));
        if (previousBuddyId) {
          transaction.update(taskRef.collection('applications').doc(previousBuddyId), {
            status: 'rejected',
            updatedAt: now,
          });
        }
        return;
      }

      transaction.update(taskRef, {
        status,
        updatedAt: timestamp(),
        ...(status === 'completed' && { completedAt: timestamp() }),
      });

      // Update stats on completion
      if (status === 'completed' && task.buddyId) {
        transaction.update(collections.users.doc(task.buddyId), {
          'stats.tasksCompleted': FieldValue.increment(1),
          updatedAt: timestamp(),
        });
      }
    });

    // Notify the other party when an assignment is cancelled.
    if (status === 'open' && task.status === 'assigned' && task.buddyId) {
      const actorIsPoster = task.posterId === req.user!.uid;
      const notifyUserId = actorIsPoster ? task.buddyId : task.posterId;
      getPushNotificationService()
        .sendTaskNotification(notifyUserId, 'cancelled', { taskId: id, title: task.title })
        .catch((err) => console.error('[FCM] cancel notification failed:', err));
    }

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
    status: z.enum(TASK_STATUSES).optional(),
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
    // Buddy sees their assigned work; completed tasks are poster-private by
    // design, so only in-flight states are filterable here.
    status: z.enum(['assigned']).optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
    offset: z.coerce.number().min(0).default(0),
  })),
  async (req: Request, res: Response) => {
    const { status, limit, offset } = req.query as any;

    let query = collections.tasks.where('buddyId', '==', req.user!.uid).where('status', '==', status || 'assigned');
    query = query.orderBy('createdAt', 'desc').limit(limit);
    if (offset) query = query.offset(offset);

    const snapshot = await query.get();
    const tasks = snapshot.docs.map(d => d.data() as TaskDocument);

    res.json({ success: true, tasks });
  }
);

export default router;