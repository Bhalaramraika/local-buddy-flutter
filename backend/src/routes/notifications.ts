/**
 * Notification Routes
 * Push notifications, in-app notifications, preferences
 */

import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { notificationValidation } from '../validations/notificationValidation';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications with pagination
router.get('/',
  validate(notificationValidation.getNotifications),
  notificationController.getNotifications
);

// Get unread notification count
router.get('/unread-count',
  notificationController.getUnreadCount
);

// Mark notification as read
router.patch('/:id/read',
  validate(notificationValidation.markAsRead),
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/read-all',
  notificationController.markAllAsRead
);

// Delete notification
router.delete('/:id',
  validate(notificationValidation.deleteNotification),
  notificationController.deleteNotification
);

// Get notification preferences
router.get('/preferences',
  notificationController.getPreferences
);

// Update notification preferences
router.put('/preferences',
  validate(notificationValidation.updatePreferences),
  notificationController.updatePreferences
);

// Register device token for push notifications
router.post('/device-token',
  validate(notificationValidation.registerDeviceToken),
  notificationController.registerDeviceToken
);

// Remove device token
router.delete('/device-token/:token',
  validate(notificationValidation.removeDeviceToken),
  notificationController.removeDeviceToken
);

// Send test notification (admin only)
router.post('/test',
  validate(notificationValidation.sendTestNotification),
  notificationController.sendTestNotification
);

export default router;