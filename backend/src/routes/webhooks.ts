/**
 * Webhook Routes
 * PayU payment callbacks, Firebase Auth triggers, Supabase Realtime events
 */

import { Router, Request, Response } from 'express';
import { WebhookController } from '../controllers/webhookController';
import { validate } from '../middleware/validate';
import { webhookValidation } from '../validations/webhookValidation';

const router = Router();
const webhookController = new WebhookController();

// ============================================================
// PayU Payment Webhooks (No auth required - called by PayU)
// ============================================================

// PayU success callback
router.post('/payu/success',
  validate(webhookValidation.payuCallback),
  webhookController.handlePayUSuccess
);

// PayU failure callback
router.post('/payu/failure',
  validate(webhookValidation.payuCallback),
  webhookController.handlePayUFailure
);

// PayU cancel callback
router.post('/payu/cancel',
  validate(webhookValidation.payuCallback),
  webhookController.handlePayUCancel
);

// PayU webhook (server-to-server)
router.post('/payu/webhook',
  validate(webhookValidation.payuWebhook),
  webhookController.handlePayUWebhook
);

// ============================================================
// Firebase Auth Webhooks (No auth required - called by Firebase)
// ============================================================

// User created
router.post('/firebase/auth/user-created',
  validate(webhookValidation.firebaseAuthWebhook),
  webhookController.handleUserCreated
);

// User deleted
router.post('/firebase/auth/user-deleted',
  validate(webhookValidation.firebaseAuthWebhook),
  webhookController.handleUserDeleted
);

// User signed in
router.post('/firebase/auth/user-signed-in',
  validate(webhookValidation.firebaseAuthWebhook),
  webhookController.handleUserSignedIn
);

// ============================================================
// Supabase Realtime Webhooks (No auth required - called by Supabase)
// ============================================================

// Chat message created
router.post('/supabase/chat/message',
  validate(webhookValidation.supabaseChatWebhook),
  webhookController.handleChatMessage
);

// Task updated
router.post('/supabase/task/updated',
  validate(webhookValidation.supabaseTaskWebhook),
  webhookController.handleTaskUpdated
);

// Location updated
router.post('/supabase/location/updated',
  validate(webhookValidation.supabaseLocationWebhook),
  webhookController.handleLocationUpdated
);

// ============================================================
// Internal Webhooks (Require service-to-service auth)
// ============================================================

// Internal webhook for job completion callbacks
router.post('/internal/job-complete',
  validate(webhookValidation.internalJobWebhook),
  webhookController.handleJobComplete
);

// Internal webhook for notification triggers
router.post('/internal/notification-trigger',
  validate(webhookValidation.internalNotificationWebhook),
  webhookController.handleNotificationTrigger
);

// ============================================================
// Health Check for Webhook Endpoints
// ============================================================

router.get('/health',
  webhookController.healthCheck
);

export default router;