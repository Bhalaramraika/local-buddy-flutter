/**
 * Cron Jobs Configuration
 * Scheduled tasks for cleanup, notifications, and payment reconciliation
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';
import { supabaseAdmin } from '../config/supabase';
import { getMessagingInstance } from '../config/firebase';

/**
 * Initialize all cron jobs
 */
export function initializeCronJobs(): void {
  // Run cleanup every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running daily cleanup job');
    await cleanupOldData();
  });

  // Run payment reconciliation every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running hourly payment reconciliation');
    await reconcilePayments();
  });

  // Send daily notifications at 9 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Sending daily notifications');
    await sendDailyNotifications();
  });

  // Clean up expired tasks every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Cleaning up expired tasks');
    await cleanupExpiredTasks();
  });

  // Clean up old chat messages daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Cleaning up old chat messages');
    await cleanupOldChatMessages();
  });

  logger.info('Cron jobs initialized');
}

/**
 * Clean up old data (old notifications, expired tokens, etc.)
 */
async function cleanupOldData(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up old read notifications
    await prisma.notification.deleteMany({
      where: {
        read: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    // Clean up expired password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // Clean up expired email verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    logger.info('Old data cleanup completed');
  } catch (error) {
    logger.error('Error cleaning up old data', { error });
  }
}

/**
 * Reconcile pending payments with PayU
 */
async function reconcilePayments(): Promise<void> {
  try {
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        status: 'PENDING',
        paymentMethod: 'PAYU',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    for (const transaction of pendingTransactions) {
      // Here you would call PayU API to check payment status
      // For now, we'll just log
      logger.info('Checking payment status', { transactionId: transaction.id });
    }

    logger.info('Payment reconciliation completed', { checked: pendingTransactions.length });
  } catch (error) {
    logger.error('Error reconciling payments', { error });
  }
}

/**
 * Send daily notifications to users
 */
async function sendDailyNotifications(): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: {
        notificationPreferences: {
          dailyReminders: true,
        },
        fcmToken: {
          not: null,
        },
      },
      select: {
        id: true,
        fcmToken: true,
        name: true,
      },
    });

    const messaging = getMessagingInstance();
    if (!messaging) {
      logger.warn('Firebase messaging not initialized');
      return;
    }

    for (const user of users) {
      if (user.fcmToken) {
        try {
          await messaging.send({
            token: user.fcmToken,
            notification: {
              title: 'Daily Task Reminder',
              body: `Hi ${user.name}, check your tasks for today!`,
            },
            data: {
              type: 'daily_reminder',
              userId: user.id,
            },
          });
        } catch (error) {
          logger.error('Failed to send notification', { userId: user.id, error });
        }
      }
    }

    logger.info('Daily notifications sent', { count: users.length });
  } catch (error) {
    logger.error('Error sending daily notifications', { error });
  }
}

/**
 * Clean up expired tasks
 */
async function cleanupExpiredTasks(): Promise<void> {
  try {
    const now = new Date();

    // Mark expired tasks as cancelled
    const expiredTasks = await prisma.task.updateMany({
      where: {
        status: 'OPEN',
        expiresAt: {
          lt: now,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    // Clean up expired task assignments
    await prisma.taskAssignment.deleteMany({
      where: {
        task: {
          status: 'EXPIRED',
        },
        status: 'PENDING',
      },
    });

    logger.info('Expired tasks cleaned up', { count: expiredTasks.count });
  } catch (error) {
    logger.error('Error cleaning up expired tasks', { error });
  }
}

/**
 * Clean up old chat messages (older than 90 days)
 */
async function cleanupOldChatMessages(): Promise<void> {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old messages from Supabase
    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString());

    if (error) {
      logger.error('Error cleaning up old chat messages', { error });
    } else {
      logger.info('Old chat messages cleaned up');
    }
  } catch (error) {
    logger.error('Error cleaning up old chat messages', { error });
  }
}

export default {
  initializeCronJobs,
};