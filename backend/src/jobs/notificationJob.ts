/**
 * Notification Job
 * Scheduled push notifications, reminders, and scheduled messages
 */

import { CronJob } from 'cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';
import { pushNotificationService } from '../services/pushNotificationService';
import { emailService } from '../services/emailService';

export class NotificationJob {
  private jobs: CronJob[] = [];

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Every minute - check for scheduled notifications
    this.jobs.push(new CronJob('* * * * *', () => this.processScheduledNotifications(), null, true, 'Asia/Kolkata'));

    // Every 5 minutes - task reminders
    this.jobs.push(new CronJob('*/5 * * * *', () => this.sendTaskReminders(), null, true, 'Asia/Kolkata'));

    // Daily at 9 AM - daily digest notifications
    this.jobs.push(new CronJob('0 9 * * *', () => this.sendDailyDigests(), null, true, 'Asia/Kolkata'));

    // Daily at 6 PM - evening reminders
    this.jobs.push(new CronJob('0 18 * * *', () => this.sendEveningReminders(), null, true, 'Asia/Kolkata'));

    // Every hour - check for overdue tasks
    this.jobs.push(new CronJob('0 * * * *', () => this.sendOverdueTaskNotifications(), null, true, 'Asia/Kolkata'));

    // Every 30 minutes - chat message reminders for unread messages
    this.jobs.push(new CronJob('*/30 * * * *', () => this.sendUnreadChatReminders(), null, true, 'Asia/Kolkata'));

    // Weekly on Monday 9 AM - weekly summary
    this.jobs.push(new CronJob('0 9 * * 1', () => this.sendWeeklySummaries(), null, true, 'Asia/Kolkata'));

    // Monthly 1st at 10 AM - monthly report
    this.jobs.push(new CronJob('0 10 1 * *', () => this.sendMonthlyReports(), null, true, 'Asia/Kolkata'));
  }

  /**
   * Process scheduled notifications (one-time, recurring)
   */
  private async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      const scheduledNotifications = await prisma.scheduledNotification.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: now },
        },
        include: {
          user: { select: { id: true, fcmToken: true, email: true, preferences: true } },
        },
        take: 100,
      });

      for (const notification of scheduledNotifications) {
        await this.sendScheduledNotification(notification);
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to process scheduled notifications:', error);
    }
  }

  /**
   * Send a single scheduled notification
   */
  private async sendScheduledNotification(notification: any): Promise<void> {
    try {
      const { user, title, body, data, type, channel } = notification;

      // Check user preferences
      const prefs = user.preferences as any || {};
      if (prefs.notifications?.[type] === false) {
        await this.markNotificationSent(notification.id, 'SKIPPED_PREFERENCES');
        return;
      }

      let sent = false;

      // Send push notification
      if (channel === 'PUSH' || channel === 'BOTH') {
        if (user.fcmToken) {
          await pushNotificationService.sendToToken(user.fcmToken, {
            title,
            body,
            data: { ...data, notificationId: notification.id },
          });
          sent = true;
        }
      }

      // Send email
      if (channel === 'EMAIL' || channel === 'BOTH') {
        if (user.email) {
          await emailService.sendNotificationEmail(user.email, title, body, data);
          sent = true;
        }
      }

      // Send in-app notification (create in DB)
      await prisma.notification.create({
        data: {
          userId: user.id,
          title,
          body,
          data,
          type,
          read: false,
        },
      });

      await this.markNotificationSent(notification.id, sent ? 'SENT' : 'PARTIAL');
    } catch (error) {
      logger.error(`[NotificationJob] Failed to send notification ${notification.id}:`, error);
      await this.markNotificationSent(notification.id, 'FAILED');
    }
  }

  /**
   * Send task reminders (upcoming tasks)
   */
  private async sendTaskReminders(): Promise<void> {
    try {
      const now = new Date();
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Tasks starting in 30 minutes
      await this.sendRemindersForTasksStartingAt(in30Minutes, '30_MINUTES');

      // Tasks starting in 1 hour
      await this.sendRemindersForTasksStartingAt(in1Hour, '1_HOUR');

      // Tasks starting tomorrow
      await this.sendRemindersForTasksStartingAt(in24Hours, '24_HOURS');
    } catch (error) {
      logger.error('[NotificationJob] Failed to send task reminders:', error);
    }
  }

  private async sendRemindersForTasksStartingAt(time: Date, reminderType: string): Promise<void> {
    const tasks = await prisma.task.findMany({
      where: {
        status: 'ASSIGNED',
        scheduledAt: {
          gte: new Date(time.getTime() - 5 * 60 * 1000), // 5 min window
          lte: new Date(time.getTime() + 5 * 60 * 1000),
        },
      },
      include: {
        assignee: { select: { id: true, fcmToken: true, email: true, preferences: true, name: true } },
        poster: { select: { id: true, name: true } },
      },
    });

    for (const task of tasks) {
      if (!task.assignee) continue;

      const prefs = task.assignee.preferences as any || {};
      if (prefs.notifications?.taskReminders === false) continue;

      const title = `Task Reminder: ${task.title}`;
      const body = `Your task "${task.title}" starts in ${this.formatReminderTime(reminderType)}`;

      await this.createAndSendNotification({
        userId: task.assignee.id,
        title,
        body,
        data: { taskId: task.id, type: 'TASK_REMINDER', reminderType },
        type: 'TASK_REMINDER',
        channel: 'BOTH',
      });
    }
  }

  /**
   * Send daily digest notifications
   */
  private async sendDailyDigests(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          emailVerified: true,
          preferences: {
            path: ['$.notifications.dailyDigest'],
            equals: true,
          },
        },
        select: { id: true, fcmToken: true, email: true, preferences: true, name: true },
      });

      for (const user of users) {
        // Get user's stats for today
        const stats = await this.getDailyStats(user.id);
        
        if (stats.totalTasks === 0 && stats.newMessages === 0 && stats.earnings === 0) {
          continue; // Skip if nothing to report
        }

        const title = `Your Daily Summary, ${user.name}!`;
        const body = `${stats.totalTasks} tasks, ${stats.newMessages} messages, ₹${stats.earnings} earned`;

        await this.createAndSendNotification({
          userId: user.id,
          title,
          body,
          data: { type: 'DAILY_DIGEST', ...stats },
          type: 'DAILY_DIGEST',
          channel: 'BOTH',
        });
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to send daily digests:', error);
    }
  }

  /**
   * Send evening reminders
   */
  private async sendEveningReminders(): Promise<void> {
    try {
      // Remind users with pending tasks due today
      const tasks = await prisma.task.findMany({
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
        include: {
          assignee: { select: { id: true, fcmToken: true, email: true, preferences: true, name: true } },
        },
      });

      const userTasks = new Map<string, any[]>();
      for (const task of tasks) {
        if (task.assignee) {
          const existing = userTasks.get(task.assignee.id) || [];
          existing.push(task);
          userTasks.set(task.assignee.id, existing);
        }
      }

      for (const [userId, userTaskList] of userTasks) {
        const user = userTaskList[0].assignee;
        const prefs = user.preferences as any || {};
        if (prefs.notifications?.eveningReminders === false) continue;

        const title = `Evening Reminder: ${userTaskList.length} task(s) due today`;
        const body = userTaskList.map(t => `• ${t.title}`).join('\n');

        await this.createAndSendNotification({
          userId,
          title,
          body,
          data: { type: 'EVENING_REMINDER', taskIds: userTaskList.map(t => t.id) },
          type: 'EVENING_REMINDER',
          channel: 'PUSH',
        });
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to send evening reminders:', error);
    }
  }

  /**
   * Send overdue task notifications
   */
  private async sendOverdueTaskNotifications(): Promise<void> {
    try {
      const now = new Date();
      
      const overdueTasks = await prisma.task.findMany({
        where: {
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
        include: {
          assignee: { select: { id: true, fcmToken: true, email: true, preferences: true, name: true } },
          poster: { select: { id: true, name: true } },
        },
      });

      for (const task of overdueTasks) {
        if (!task.assignee) continue;

        const prefs = task.assignee.preferences as any || {};
        if (prefs.notifications?.overdueTasks === false) continue;

        const hoursOverdue = Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60));
        
        // Only notify at specific intervals: 1hr, 6hr, 24hr, 48hr overdue
        if (![1, 6, 24, 48].includes(hoursOverdue)) continue;

        const title = `Task Overdue: ${task.title}`;
        const body = `This task was due ${hoursOverdue} hour${hoursOverdue > 1 ? 's' : ''} ago`;

        await this.createAndSendNotification({
          userId: task.assignee.id,
          title,
          body,
          data: { taskId: task.id, type: 'OVERDUE_TASK', hoursOverdue },
          type: 'OVERDUE_TASK',
          channel: 'BOTH',
        });

        // Also notify poster
        if (task.poster) {
          await this.createAndSendNotification({
            userId: task.poster.id,
            title: `Task Overdue: ${task.title}`,
            body: `Assigned to ${task.assignee.name} - ${hoursOverdue} hour${hoursOverdue > 1 ? 's' : ''} overdue`,
            data: { taskId: task.id, type: 'TASK_OVERDUE_POSTER', hoursOverdue },
            type: 'TASK_OVERDUE_POSTER',
            channel: 'PUSH',
          });
        }
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to send overdue notifications:', error);
    }
  }

  /**
   * Send unread chat reminders
   */
  private async sendUnreadChatReminders(): Promise<void> {
    try {
      // Find chats with unread messages older than 30 minutes
      const unreadChats = await prisma.chat.findMany({
        where: {
          lastMessageAt: { lt: new Date(Date.now() - 30 * 60 * 1000) },
          participants: {
            some: {
              unreadCount: { gt: 0 },
              user: {
                preferences: {
                  path: ['$.notifications.chatReminders'],
                  equals: true,
                },
              },
            },
          },
        },
        include: {
          participants: {
            where: { unreadCount: { gt: 0 } },
            include: { user: { select: { id: true, fcmToken: true, email: true, preferences: true, name: true } } },
          },
          lastMessage: { select: { content: true, senderId: true, createdAt: true } },
        },
      });

      for (const chat of unreadChats) {
        for (const participant of chat.participants) {
          const user = participant.user;
          const prefs = user.preferences as any || {};
          if (prefs.notifications?.chatReminders === false) continue;

          // Don't remind if user sent the last message
          if (chat.lastMessage?.senderId === user.id) continue;

          const title = `New message in ${chat.isGroup ? chat.name : 'chat'}`;
          const body = chat.lastMessage?.content || 'You have unread messages';

          await this.createAndSendNotification({
            userId: user.id,
            title,
            body,
            data: { chatId: chat.id, type: 'CHAT_REMINDER', unreadCount: participant.unreadCount },
            type: 'CHAT_REMINDER',
            channel: 'PUSH',
          });
        }
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to send chat reminders:', error);
    }
  }

  /**
   * Send weekly summaries
   */
  private async sendWeeklySummaries(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          emailVerified: true,
          preferences: {
            path: ['$.notifications.weeklySummary'],
            equals: true,
          },
        },
        select: { id: true, fcmToken: true, email: true, preferences: true, name: true },
      });

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      for (const user of users) {
        const stats = await this.getWeeklyStats(user.id, weekAgo);
        
        if (stats.tasksCompleted === 0 && stats.earnings === 0 && stats.messagesSent === 0) {
          continue;
        }

        const title = `Your Weekly Summary, ${user.name}!`;
        const body = `Completed ${stats.tasksCompleted} tasks, earned ₹${stats.earnings}, sent ${stats.messagesSent} messages`;

        await this.createAndSendNotification({
          userId: user.id,
          title,
          body,
          data: { type: 'WEEKLY_SUMMARY', ...stats },
          type: 'WEEKLY_SUMMARY',
          channel: 'BOTH',
        });
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to send weekly summaries:', error);
    }
  }

  /**
   * Send monthly reports
   */
  private async sendMonthlyReports(): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          emailVerified: true,
          preferences: {
            path: ['$.notifications.monthlyReport'],
            equals: true,
          },
        },
        select: { id: true, fcmToken: true, email: true, preferences: true, name: true },
      });

      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const user of users) {
        const stats = await this.getMonthlyStats(user.id, monthAgo);
        
        const title = `Your Monthly Report, ${user.name}!`;
        const body = `Completed ${stats.tasksCompleted} tasks, earned ₹${stats.totalEarnings}, ${stats.rating}⭐ rating`;

        await this.createAndSendNotification({
          userId: user.id,
          title,
          body,
          data: { type: 'MONTHLY_REPORT', ...stats },
          type: 'MONTHLY_REPORT',
          channel: 'EMAIL', // Monthly reports via email
        });
      }
    } catch (error) {
      logger.error('[NotificationJob] Failed to send monthly reports:', error);
    }
  }

  // ============================================================
  // Helper Methods
  // ============================================================

  private async createAndSendNotification(params: {
    userId: string;
    title: string;
    body: string;
    data: any;
    type: string;
    channel: 'PUSH' | 'EMAIL' | 'BOTH';
  }): Promise<void> {
    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        data: params.data,
        type: params.type,
        read: false,
      },
    });

    // Get user for push/email
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { fcmToken: true, email: true, preferences: true },
    });

    if (!user) return;

    const prefs = user.preferences as any || {};

    // Push notification
    if ((params.channel === 'PUSH' || params.channel === 'BOTH') && user.fcmToken) {
      if (prefs.notifications?.[params.type] !== false) {
        await pushNotificationService.sendToToken(user.fcmToken, {
          title: params.title,
          body: params.body,
          data: params.data,
        });
      }
    }

    // Email
    if ((params.channel === 'EMAIL' || params.channel === 'BOTH') && user.email) {
      if (prefs.notifications?.email !== false) {
        await emailService.sendNotificationEmail(user.email, params.title, params.body, params.data);
      }
    }
  }

  private async markNotificationSent(id: string, status: string): Promise<void> {
    await prisma.scheduledNotification.update({
      where: { id },
      data: { status, sentAt: new Date() },
    });
  }

  private formatReminderTime(type: string): string {
    switch (type) {
      case '30_MINUTES': return '30 minutes';
      case '1_HOUR': return '1 hour';
      case '24_HOURS': return '24 hours';
      default: return 'soon';
    }
  }

  private async getDailyStats(userId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [tasksCompleted, earnings, newMessages] = await Promise.all([
      prisma.task.count({
        where: { assigneeId: userId, status: 'COMPLETED', completedAt: { gte: today, lt: tomorrow } },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EARNING', createdAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      prisma.message.count({
        where: { chat: { participants: { some: { userId } } }, createdAt: { gte: today, lt: tomorrow }, senderId: { not: userId } },
      }),
    ]);

    return {
      totalTasks: tasksCompleted,
      earnings: earnings._sum.amount || 0,
      newMessages,
    };
  }

  private async getWeeklyStats(userId: string, since: Date): Promise<any> {
    const [tasksCompleted, earnings, messagesSent, rating] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId, status: 'COMPLETED', completedAt: { gte: since } } }),
      prisma.transaction.aggregate({ where: { userId, type: 'EARNING', createdAt: { gte: since } }, _sum: { amount: true } }),
      prisma.message.count({ where: { senderId: userId, createdAt: { gte: since } } }),
      prisma.review.aggregate({ where: { revieweeId: userId, createdAt: { gte: since } }, _avg: { rating: true } }),
    ]);

    return {
      tasksCompleted,
      earnings: earnings._sum.amount || 0,
      messagesSent,
      rating: rating._avg.rating || 0,
    };
  }

  private async getMonthlyStats(userId: string, since: Date): Promise<any> {
    const [tasksCompleted, totalEarnings, totalSpent, rating, reviewsCount] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId, status: 'COMPLETED', completedAt: { gte: since } } }),
      prisma.transaction.aggregate({ where: { userId, type: 'EARNING', createdAt: { gte: since } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, type: 'SPENDING', createdAt: { gte: since } }, _sum: { amount: true } }),
      prisma.review.aggregate({ where: { revieweeId: userId, createdAt: { gte: since } }, _avg: { rating: true } }),
      prisma.review.count({ where: { revieweeId: userId, createdAt: { gte: since } } }),
    ]);

    return {
      tasksCompleted,
      totalEarnings: totalEarnings._sum.amount || 0,
      totalSpent: totalSpent._sum.amount || 0,
      rating: rating._avg.rating || 0,
      reviewsCount,
    };
  }

  /**
   * Start all jobs
   */
  public start(): void {
    this.jobs.forEach(job => job.start());
    logger.info('[NotificationJob] All notification jobs started');
  }

  /**
   * Stop all jobs
   */
  public stop(): void {
    this.jobs.forEach(job => job.stop());
    logger.info('[NotificationJob] All notification jobs stopped');
  }

  /**
   * Trigger a specific job manually (for testing)
   */
  public async triggerJob(jobName: string): Promise<void> {
    switch (jobName) {
      case 'scheduled':
        await this.processScheduledNotifications();
        break;
      case 'taskReminders':
        await this.sendTaskReminders();
        break;
      case 'dailyDigest':
        await this.sendDailyDigests();
        break;
      case 'eveningReminders':
        await this.sendEveningReminders();
        break;
      case 'overdueTasks':
        await this.sendOverdueTaskNotifications();
        break;
      case 'chatReminders':
        await this.sendUnreadChatReminders();
        break;
      case 'weeklySummary':
        await this.sendWeeklySummaries();
        break;
      case 'monthlyReport':
        await this.sendMonthlyReports();
        break;
    }
  }
}

export const notificationJob = new NotificationJob();