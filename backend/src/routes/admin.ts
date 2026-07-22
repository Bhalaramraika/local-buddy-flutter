/**
 * Admin Routes
 * Dashboard, user management, task moderation, analytics, system settings
 */

import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import { validate } from '../middleware/validate';
import { adminValidation } from '../validations/adminValidation';

const router = Router();
const adminController = new AdminController();

// All routes require authentication + admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================================
// Dashboard & Analytics
// ============================================================

// Get admin dashboard stats
router.get('/dashboard/stats',
  adminController.getDashboardStats
);

// Get revenue analytics
router.get('/analytics/revenue',
  validate(adminValidation.getRevenueAnalytics),
  adminController.getRevenueAnalytics
);

// Get user growth analytics
router.get('/analytics/users',
  validate(adminValidation.getUserAnalytics),
  adminController.getUserAnalytics
);

// Get task analytics
router.get('/analytics/tasks',
  validate(adminValidation.getTaskAnalytics),
  adminController.getTaskAnalytics
);

// Get platform health metrics
router.get('/analytics/health',
  adminController.getPlatformHealth
);

// ============================================================
// User Management
// ============================================================

// Get all users with pagination and filters
router.get('/users',
  validate(adminValidation.getUsers),
  adminController.getUsers
);

// Get user by ID
router.get('/users/:id',
  validate(adminValidation.getUserById),
  adminController.getUserById
);

// Update user status (ban/unban/verify)
router.patch('/users/:id/status',
  validate(adminValidation.updateUserStatus),
  adminController.updateUserStatus
);

// Delete user (soft delete)
router.delete('/users/:id',
  validate(adminValidation.deleteUser),
  adminController.deleteUser
);

// Get user activity log
router.get('/users/:id/activity',
  validate(adminValidation.getUserActivity),
  adminController.getUserActivity
);

// ============================================================
// Task Moderation
// ============================================================

// Get all tasks with filters
router.get('/tasks',
  validate(adminValidation.getTasks),
  adminController.getTasks
);

// Get task by ID
router.get('/tasks/:id',
  validate(adminValidation.getTaskById),
  adminController.getTaskById
);

// Moderate task (approve/reject/flag)
router.patch('/tasks/:id/moderate',
  validate(adminValidation.moderateTask),
  adminController.moderateTask
);

// Bulk moderate tasks
router.post('/tasks/bulk-moderate',
  validate(adminValidation.bulkModerateTasks),
  adminController.bulkModerateTasks
);

// ============================================================
// Wallet & Transaction Management
// ============================================================

// Get all transactions
router.get('/transactions',
  validate(adminValidation.getTransactions),
  adminController.getTransactions
);

// Get transaction by ID
router.get('/transactions/:id',
  validate(adminValidation.getTransactionById),
  adminController.getTransactionById
);

// Process refund (admin)
router.post('/transactions/:id/refund',
  validate(adminValidation.processRefund),
  adminController.processRefund
);

// Get wallet balances overview
router.get('/wallets/overview',
  adminController.getWalletOverview
);

// ============================================================
// Review Moderation
// ============================================================

// Get flagged reviews
router.get('/reviews/flagged',
  validate(adminValidation.getFlaggedReviews),
  adminController.getFlaggedReviews
);

// Moderate review
router.patch('/reviews/:id/moderate',
  validate(adminValidation.moderateReview),
  adminController.moderateReview
);

// ============================================================
// System Settings
// ============================================================

// Get system settings
router.get('/settings',
  adminController.getSystemSettings
);

// Update system settings
router.put('/settings',
  validate(adminValidation.updateSystemSettings),
  adminController.updateSystemSettings
);

// Get feature flags
router.get('/feature-flags',
  adminController.getFeatureFlags
);

// Update feature flag
router.patch('/feature-flags/:key',
  validate(adminValidation.updateFeatureFlag),
  adminController.updateFeatureFlag
);

// ============================================================
// Reports & Exports
// ============================================================

// Generate platform report
router.post('/reports/generate',
  validate(adminValidation.generateReport),
  adminController.generateReport
);

// Download report
router.get('/reports/:id/download',
  validate(adminValidation.downloadReport),
  adminController.downloadReport
);

// Export users CSV
router.get('/export/users',
  validate(adminValidation.exportUsers),
  adminController.exportUsers
);

// Export tasks CSV
router.get('/export/tasks',
  validate(adminValidation.exportTasks),
  adminController.exportTasks
);

// Export transactions CSV
router.get('/export/transactions',
  validate(adminValidation.exportTransactions),
  adminController.exportTransactions
);

export default router;